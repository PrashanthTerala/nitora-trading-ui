/**
 * Synthetic 1-minute market generator.
 *
 * Each symbol gets a deterministic, infinitely extendable stream of one-minute bars built
 * from a regime-switching geometric random walk with:
 *   - intraday U-shaped volatility and volume (open and close are busy),
 *   - mean reversion toward a slow-moving anchor (strength per symbol),
 *   - rare jumps (news) and overnight gaps,
 *   - a session clock (Mon–Fri, 09:30–16:00, 390 minutes/day, in UTC for simplicity).
 *
 * Storage is struct-of-arrays in growable Float64Arrays to keep 100k+ bars cheap.
 */
import { Rng, hashString } from '@/lib/rng';
import type { SymbolSpec } from './symbols';
import type { Bar, Timeframe } from './types';
import { TIMEFRAME_SECONDS } from './types';

export const SESSION_OPEN_MIN = 9 * 60 + 30; // 09:30
export const SESSION_MINUTES = 390; // to 16:00
const MINUTES_PER_YEAR = 252 * SESSION_MINUTES;

/** Fraction of one daily sigma that a trending regime adds per day. */
const TREND_STRENGTH = 0.18;

/** Intraday volatility shape: busy at the open, busy again into the close. */
function intradayShape(frac: number) {
  return 1 + 1.2 * Math.exp(-((frac - 0.02) ** 2) / 0.01) + 0.7 * Math.exp(-((frac - 0.98) ** 2) / 0.008);
}

/**
 * The U-shape must REDISTRIBUTE variance across the session, not add it. Dividing by
 * the root-mean-square of the shape keeps the average of shape^2 at one, so the day's
 * total variance still matches the spec while the open and close stay the busy parts.
 */
const SHAPE_RMS = (() => {
  let sum = 0;
  for (let i = 0; i < SESSION_MINUTES; i++) sum += intradayShape(i / SESSION_MINUTES) ** 2;
  return Math.sqrt(sum / SESSION_MINUTES);
})();

/**
 * Strength of the pull back toward an instrument's base price, per minute.
 * At 4e-6 a 50% deviation decays with a half-life of roughly a year of sessions,
 * which bounds the long-run wander without being visible inside any single trend.
 */
const BASE_TETHER = 4e-6;

/** Same idea for the regime volatility multipliers, weighted by how often each is picked. */
const REGIME_VOL_RMS = Math.sqrt(0.3 * 0.9 ** 2 + 0.25 * 1.1 ** 2 + 0.3 * 0.8 ** 2 + 0.15 * 1.8 ** 2);

/** Session start: Tuesday 2 Jan 2024 09:30 UTC. */
export const EPOCH_START = Date.UTC(2024, 0, 2, 9, 30) / 1000;

function isWeekend(t: number) {
  const d = new Date(t * 1000).getUTCDay();
  return d === 0 || d === 6;
}

/** Returns the unix time of the minute bar that follows `t` inside the session clock. */
export function nextSessionMinute(t: number): number {
  const d = new Date(t * 1000);
  const minOfDay = d.getUTCHours() * 60 + d.getUTCMinutes();
  if (minOfDay + 1 < SESSION_OPEN_MIN + SESSION_MINUTES) return t + 60;
  // jump to next weekday 09:30
  let next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 9, 30) / 1000;
  while (isWeekend(next)) next += 86400;
  return next;
}

export function minuteOfSession(t: number): number {
  const d = new Date(t * 1000);
  return d.getUTCHours() * 60 + d.getUTCMinutes() - SESSION_OPEN_MIN;
}

export function sessionDayStart(t: number): number {
  const d = new Date(t * 1000);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 1000;
}

class GrowableF64 {
  buf: Float64Array;
  length = 0;
  constructor(cap = 8192) {
    this.buf = new Float64Array(cap);
  }
  push(v: number) {
    if (this.length === this.buf.length) {
      const n = new Float64Array(this.buf.length * 2);
      n.set(this.buf);
      this.buf = n;
    }
    this.buf[this.length++] = v;
  }
  get(i: number) {
    return this.buf[i];
  }
}

export class BaseSeries {
  readonly spec: SymbolSpec;
  readonly time = new GrowableF64();
  readonly open = new GrowableF64();
  readonly high = new GrowableF64();
  readonly low = new GrowableF64();
  readonly close = new GrowableF64();
  readonly volume = new GrowableF64();

  private rng: Rng;
  private lastClose: number;
  private anchor: number;
  private regimeDrift = 0;
  private regimeVol = 1;
  private lastTime: number;
  private minuteSigma: number;
  private minuteDrift: number;
  /** Scales diffusion down so that diffusion + jumps together still match annualVol. */
  private jumpDamp: number;
  /** Fraction of each day's variance that occurs in the overnight gap. */
  private gapShare: number;
  /** Scales session volatility down by whatever the gap takes. */
  private sessionScale: number;
  /** Standard deviation of the overnight gap in log terms. */
  private gapSigma: number;

  constructor(spec: SymbolSpec, seed: string) {
    this.spec = spec;
    this.rng = new Rng(hashString(`${spec.symbol}|${seed}`));
    this.lastClose = spec.basePrice;
    this.anchor = spec.basePrice;
    this.lastTime = EPOCH_START - 60;
    this.minuteSigma = spec.annualVol / Math.sqrt(MINUTES_PER_YEAR);
    this.minuteDrift = spec.annualDrift / MINUTES_PER_YEAR;
    // A jump of k sigmas fires with probability p and a magnitude factor uniform on
    // [0.6, 1.6), whose mean square is 1.293. Adding that variance on top of the
    // diffusion would overshoot the specified volatility, so scale the diffusion down.
    const jumpVar = spec.jumpProb * spec.jumpSize ** 2 * 1.293;
    this.jumpDamp = 1 / Math.sqrt(1 + jumpVar);
    /**
     * A day's variance is SHARED between the overnight gap and the session, rather
     * than the gap being piled on top. Previously a gapFactor of 2.5 added nearly
     * four days of variance to every single night, which is why the crypto-like
     * instrument realized almost three times its stated volatility. gapShare is the
     * fraction of daily variance that happens while the market is shut, which is the
     * honest way to model an instrument that keeps trading overnight.
     */
    this.gapShare = Math.min(0.6, spec.gapFactor * 0.15);
    this.sessionScale = Math.sqrt(1 - this.gapShare);
    // The gap is a normal plus, 6% of the time, a larger news gap 2.5x its size.
    // Total variance of that mixture is gapSigma^2 * (1 + 0.06 * 2.5^2).
    this.gapSigma = Math.sqrt((this.gapShare * this.minuteSigma ** 2 * SESSION_MINUTES) / (1 + 0.06 * 2.5 ** 2));
    this.pickRegime();
  }

  get length() {
    return this.time.length;
  }

  bar(i: number): Bar {
    return { time: this.time.get(i), open: this.open.get(i), high: this.high.get(i), low: this.low.get(i), close: this.close.get(i), volume: this.volume.get(i) };
  }

  /**
   * A regime's drift is expressed in daily sigmas per day, not in minute sigmas per
   * minute. The earlier version used a per-minute figure that worked out at more than
   * one daily standard deviation of drift every day, which compounded over a long
   * regime into moves of several hundred percent and made every instrument realize far
   * more volatility than its spec. TREND_STRENGTH is the fraction of a daily sigma a
   * trending regime adds per day, so a trend is visible but never dominates the noise.
   */
  private pickRegime() {
    const s = this.minuteSigma;
    const perDay = (k: number) => (k * s * Math.sqrt(SESSION_MINUTES)) / SESSION_MINUTES;
    const r = this.rng.float();
    if (r < 0.3) {
      this.regimeDrift = perDay(TREND_STRENGTH); // uptrend
      this.regimeVol = 0.9;
    } else if (r < 0.55) {
      this.regimeDrift = -perDay(TREND_STRENGTH); // downtrend
      this.regimeVol = 1.1;
    } else if (r < 0.85) {
      this.regimeDrift = 0; // range
      this.regimeVol = 0.8;
    } else {
      this.regimeDrift = perDay((this.rng.float() - 0.5) * TREND_STRENGTH); // volatile, direction unclear
      this.regimeVol = 1.8;
    }
    this.regimeVol /= REGIME_VOL_RMS;
  }

  private round(p: number) {
    const t = this.spec.tickSize;
    return Math.round(p / t) * t;
  }

  /** Generate `n` more one-minute bars. */
  extend(n: number) {
    const spec = this.spec;
    const rng = this.rng;
    for (let k = 0; k < n; k++) {
      const t = nextSessionMinute(this.lastTime);
      const m = minuteOfSession(t);
      const newDay = m === 0;

      // regime flips happen at day boundaries
      if (newDay && rng.chance(spec.regimeFlip)) this.pickRegime();

      // intraday U-shape: busy first and last 45 minutes, normalized to preserve daily variance
      const frac = m / SESSION_MINUTES;
      const shape = intradayShape(frac);
      const u = shape / SHAPE_RMS;

      let open = this.lastClose;
      if (newDay && this.length > 0) {
        // overnight gap, drawn from the share of daily variance reserved for it
        const gap = rng.normal() * this.gapSigma + (rng.chance(0.06) ? rng.normal() * this.gapSigma * 2.5 : 0);
        open = this.lastClose * Math.exp(gap);
      }

      const sigma = this.minuteSigma * this.regimeVol * u * this.jumpDamp * this.sessionScale;
      /**
       * Two pulls. The first is toward a slow-moving anchor, which is what makes a
       * mean-reverting instrument oscillate. The second is a much weaker tether to the
       * instrument's base price, so a long run of one-way regimes cannot leave a "calm
       * blue chip" at four times its starting value. It is deliberately gentle: strong
       * enough to bound the wander over years, too weak to flatten a real trend.
       */
      this.anchor += (open - this.anchor) * 0.002;
      const pull = -spec.meanReversion * 0.02 * Math.log(open / this.anchor);
      const tether = -BASE_TETHER * Math.log(open / spec.basePrice);
      let ret = this.minuteDrift + this.regimeDrift + pull + tether + sigma * rng.normal();
      let jumped = false;
      if (rng.chance(spec.jumpProb)) {
        ret += (rng.chance(0.5) ? 1 : -1) * sigma * spec.jumpSize * (0.6 + rng.float());
        jumped = true;
      }
      const close = open * Math.exp(ret);
      const wickUp = Math.abs(rng.normal()) * sigma * 0.7 * open;
      const wickDn = Math.abs(rng.normal()) * sigma * 0.7 * open;
      const high = Math.max(open, close) + wickUp;
      const low = Math.max(spec.tickSize, Math.min(open, close) - wickDn);

      const relMove = Math.abs(ret) / (this.minuteSigma || 1e-9);
      const vol = spec.baseVolume * shape * (0.5 + 0.5 * Math.min(relMove, 4)) * Math.exp(rng.normal() * 0.35) * (jumped ? 3 : 1);

      this.time.push(t);
      this.open.push(this.round(open));
      this.high.push(this.round(high));
      this.low.push(this.round(low));
      this.close.push(this.round(close));
      this.volume.push(Math.round(vol));
      this.lastClose = close;
      this.lastTime = t;
    }
  }
}

/** Bucket start time for a timeframe (daily buckets align to the session day). */
export function bucketStart(t: number, tf: Timeframe): number {
  if (tf === '1D') return sessionDayStart(t);
  const s = TIMEFRAME_SECONDS[tf];
  if (tf === '4h') {
    // 4h buckets inside a session: 09:30–13:30, 13:30–16:00
    const day = sessionDayStart(t);
    const m = minuteOfSession(t);
    return day + (SESSION_OPEN_MIN + (m < 240 ? 0 : 240)) * 60;
  }
  return Math.floor(t / s) * s;
}

/**
 * Aggregates base bars [from, to) into `tf` bars. Returns full bars plus, when `to` lands
 * mid-bucket, a trailing partial bar.
 */
export function aggregate(series: BaseSeries, from: number, to: number, tf: Timeframe): Bar[] {
  const out: Bar[] = [];
  let cur: Bar | null = null;
  let curBucket = -1;
  for (let i = from; i < to; i++) {
    const t = series.time.get(i);
    const b = bucketStart(t, tf);
    if (b !== curBucket) {
      if (cur) out.push(cur);
      cur = { time: b, open: series.open.get(i), high: series.high.get(i), low: series.low.get(i), close: series.close.get(i), volume: series.volume.get(i) };
      curBucket = b;
    } else if (cur) {
      cur.high = Math.max(cur.high, series.high.get(i));
      cur.low = Math.min(cur.low, series.low.get(i));
      cur.close = series.close.get(i);
      cur.volume += series.volume.get(i);
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** Merge a single base bar into the last aggregated bar (or start a new one). Mutates and returns the array. */
export function mergeBar(agg: Bar[], base: Bar, tf: Timeframe): { bars: Bar[]; newBucket: boolean } {
  const b = bucketStart(base.time, tf);
  const last = agg[agg.length - 1];
  if (!last || last.time !== b) {
    agg.push({ time: b, open: base.open, high: base.high, low: base.low, close: base.close, volume: base.volume });
    return { bars: agg, newBucket: true };
  }
  last.high = Math.max(last.high, base.high);
  last.low = Math.min(last.low, base.low);
  last.close = base.close;
  last.volume += base.volume;
  return { bars: agg, newBucket: false };
}
