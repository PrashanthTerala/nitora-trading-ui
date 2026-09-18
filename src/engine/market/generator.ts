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

  constructor(spec: SymbolSpec, seed: string) {
    this.spec = spec;
    this.rng = new Rng(hashString(`${spec.symbol}|${seed}`));
    this.lastClose = spec.basePrice;
    this.anchor = spec.basePrice;
    this.lastTime = EPOCH_START - 60;
    this.minuteSigma = spec.annualVol / Math.sqrt(MINUTES_PER_YEAR);
    this.minuteDrift = spec.annualDrift / MINUTES_PER_YEAR;
    this.pickRegime();
  }

  get length() {
    return this.time.length;
  }

  bar(i: number): Bar {
    return { time: this.time.get(i), open: this.open.get(i), high: this.high.get(i), low: this.low.get(i), close: this.close.get(i), volume: this.volume.get(i) };
  }

  private pickRegime() {
    const r = this.rng.float();
    const s = this.minuteSigma;
    if (r < 0.3) {
      this.regimeDrift = s * 0.06; // uptrend
      this.regimeVol = 0.9;
    } else if (r < 0.55) {
      this.regimeDrift = -s * 0.06; // downtrend
      this.regimeVol = 1.1;
    } else if (r < 0.85) {
      this.regimeDrift = 0; // range
      this.regimeVol = 0.8;
    } else {
      this.regimeDrift = (this.rng.float() - 0.5) * s * 0.08; // volatile
      this.regimeVol = 1.8;
    }
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

      // intraday U-shape: busy first and last 45 minutes
      const frac = m / SESSION_MINUTES;
      const u = 1 + 1.2 * Math.exp(-((frac - 0.02) ** 2) / 0.01) + 0.7 * Math.exp(-((frac - 0.98) ** 2) / 0.008);

      let open = this.lastClose;
      if (newDay && this.length > 0) {
        // overnight gap: scaled by daily sigma and the symbol's gap factor
        const dailySigma = this.minuteSigma * Math.sqrt(SESSION_MINUTES);
        const gap = rng.normal() * dailySigma * 0.6 * spec.gapFactor + (rng.chance(0.06) ? rng.normal() * dailySigma * 2 * spec.gapFactor : 0);
        open = this.lastClose * Math.exp(gap);
      }

      const sigma = this.minuteSigma * this.regimeVol * u;
      // mean reversion pull toward a slow anchor
      this.anchor += (open - this.anchor) * 0.002;
      const pull = -spec.meanReversion * 0.02 * Math.log(open / this.anchor);
      let ret = this.minuteDrift + this.regimeDrift + pull + sigma * rng.normal();
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
      const vol = spec.baseVolume * u * (0.5 + 0.5 * Math.min(relMove, 4)) * Math.exp(rng.normal() * 0.35) * (jumped ? 3 : 1);

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
