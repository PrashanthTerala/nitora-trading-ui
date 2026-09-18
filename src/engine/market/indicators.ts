/**
 * Pure indicator maths. Every function takes plain arrays and returns arrays aligned
 * to the input (NaN where the indicator is not yet defined) so they can be drawn
 * on any chart without re-indexing.
 */
import type { Bar, OHLC } from './types';

type Candle = Bar | OHLC;

const closeOf = (b: Candle) => ('close' in b ? b.close : b.c);
const highOf = (b: Candle) => ('high' in b ? b.high : b.h);
const lowOf = (b: Candle) => ('low' in b ? b.low : b.l);
const volOf = (b: Candle) => ('volume' in b ? b.volume : (b.v ?? 0));

export const closes = (bars: Candle[]) => bars.map(closeOf);

export function sma(values: number[], period: number): number[] {
  const out = new Array(values.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values: number[], period: number): number[] {
  const out = new Array(values.length).fill(NaN);
  const k = 2 / (period + 1);
  let prev = NaN;
  let seedSum = 0;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      seedSum += values[i];
      continue;
    }
    if (i === period - 1) {
      seedSum += values[i];
      prev = seedSum / period;
    } else {
      prev = values[i] * k + prev * (1 - k);
    }
    out[i] = prev;
  }
  return out;
}

export function wma(values: number[], period: number): number[] {
  const out = new Array(values.length).fill(NaN);
  const denom = (period * (period + 1)) / 2;
  for (let i = period - 1; i < values.length; i++) {
    let s = 0;
    for (let j = 0; j < period; j++) s += values[i - j] * (period - j);
    out[i] = s / denom;
  }
  return out;
}

/** Wilder's smoothing (used by RSI, ATR, ADX). */
function wilder(values: number[], period: number): number[] {
  const out = new Array(values.length).fill(NaN);
  let sum = 0;
  let prev = NaN;
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (Number.isNaN(v)) continue;
    count++;
    if (count <= period) {
      sum += v;
      if (count === period) {
        prev = sum / period;
        out[i] = prev;
      }
    } else {
      prev = (prev * (period - 1) + v) / period;
      out[i] = prev;
    }
  }
  return out;
}

export function rsi(values: number[], period = 14): number[] {
  const gains: number[] = [NaN];
  const losses: number[] = [NaN];
  for (let i = 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    gains.push(Math.max(d, 0));
    losses.push(Math.max(-d, 0));
  }
  const ag = wilder(gains, period);
  const al = wilder(losses, period);
  return values.map((_, i) => {
    if (Number.isNaN(ag[i])) return NaN;
    if (al[i] === 0) return 100;
    const rs = ag[i] / al[i];
    return 100 - 100 / (1 + rs);
  });
}

export function macd(values: number[], fast = 12, slow = 26, signalPeriod = 9) {
  const f = ema(values, fast);
  const s = ema(values, slow);
  const line = values.map((_, i) => f[i] - s[i]);
  // signal is EMA of the defined part of the line
  const firstDefined = line.findIndex((v) => !Number.isNaN(v));
  const sig = new Array(values.length).fill(NaN);
  if (firstDefined >= 0) {
    const sub = ema(line.slice(firstDefined), signalPeriod);
    for (let i = 0; i < sub.length; i++) sig[firstDefined + i] = sub[i];
  }
  const hist = line.map((v, i) => v - sig[i]);
  return { line, signal: sig, histogram: hist };
}

export function bollinger(values: number[], period = 20, mult = 2) {
  const mid = sma(values, period);
  const upper = new Array(values.length).fill(NaN);
  const lower = new Array(values.length).fill(NaN);
  for (let i = period - 1; i < values.length; i++) {
    let s = 0;
    for (let j = 0; j < period; j++) s += (values[i - j] - mid[i]) ** 2;
    const sd = Math.sqrt(s / period);
    upper[i] = mid[i] + mult * sd;
    lower[i] = mid[i] - mult * sd;
  }
  return { upper, middle: mid, lower };
}

export function trueRange(bars: Candle[]): number[] {
  return bars.map((b, i) => {
    if (i === 0) return highOf(b) - lowOf(b);
    const pc = closeOf(bars[i - 1]);
    return Math.max(highOf(b) - lowOf(b), Math.abs(highOf(b) - pc), Math.abs(lowOf(b) - pc));
  });
}

export function atr(bars: Candle[], period = 14): number[] {
  return wilder(trueRange(bars), period);
}

export function stochastic(bars: Candle[], kPeriod = 14, dPeriod = 3, smooth = 3) {
  const rawK = new Array(bars.length).fill(NaN);
  for (let i = kPeriod - 1; i < bars.length; i++) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = 0; j < kPeriod; j++) {
      hh = Math.max(hh, highOf(bars[i - j]));
      ll = Math.min(ll, lowOf(bars[i - j]));
    }
    rawK[i] = hh === ll ? 50 : ((closeOf(bars[i]) - ll) / (hh - ll)) * 100;
  }
  const k = smaSkipNaN(rawK, smooth);
  const d = smaSkipNaN(k, dPeriod);
  return { k, d };
}

function smaSkipNaN(values: number[], period: number): number[] {
  const out = new Array(values.length).fill(NaN);
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) continue;
    let s = 0;
    let ok = true;
    for (let j = 0; j < period; j++) {
      const v = values[i - j];
      if (Number.isNaN(v)) {
        ok = false;
        break;
      }
      s += v;
    }
    if (ok) out[i] = s / period;
  }
  return out;
}

export function vwap(bars: Candle[]): number[] {
  const out: number[] = [];
  let pv = 0;
  let vv = 0;
  for (const b of bars) {
    const typical = (highOf(b) + lowOf(b) + closeOf(b)) / 3;
    const v = volOf(b) || 1;
    pv += typical * v;
    vv += v;
    out.push(pv / vv);
  }
  return out;
}

export function obv(bars: Candle[]): number[] {
  const out: number[] = [0];
  for (let i = 1; i < bars.length; i++) {
    const c = closeOf(bars[i]);
    const p = closeOf(bars[i - 1]);
    const v = volOf(bars[i]);
    out.push(out[i - 1] + (c > p ? v : c < p ? -v : 0));
  }
  return out;
}

export function adx(bars: Candle[], period = 14) {
  const n = bars.length;
  const plusDM = new Array(n).fill(NaN);
  const minusDM = new Array(n).fill(NaN);
  const tr = trueRange(bars);
  for (let i = 1; i < n; i++) {
    const up = highOf(bars[i]) - highOf(bars[i - 1]);
    const down = lowOf(bars[i - 1]) - lowOf(bars[i]);
    plusDM[i] = up > down && up > 0 ? up : 0;
    minusDM[i] = down > up && down > 0 ? down : 0;
  }
  tr[0] = NaN;
  const sTR = wilder(tr, period);
  const sPlus = wilder(plusDM, period);
  const sMinus = wilder(minusDM, period);
  const plusDI = sTR.map((t, i) => (Number.isNaN(t) || t === 0 ? NaN : (100 * sPlus[i]) / t));
  const minusDI = sTR.map((t, i) => (Number.isNaN(t) || t === 0 ? NaN : (100 * sMinus[i]) / t));
  const dx = plusDI.map((p, i) => {
    const m = minusDI[i];
    if (Number.isNaN(p) || Number.isNaN(m) || p + m === 0) return NaN;
    return (100 * Math.abs(p - m)) / (p + m);
  });
  const adxLine = wilder(dx, period);
  return { adx: adxLine, plusDI, minusDI };
}

/** Classic floor-trader pivots from the previous bar. */
export function pivotPoints(prev: Candle) {
  const h = highOf(prev);
  const l = lowOf(prev);
  const c = closeOf(prev);
  const p = (h + l + c) / 3;
  return { p, r1: 2 * p - l, s1: 2 * p - h, r2: p + (h - l), s2: p - (h - l), r3: h + 2 * (p - l), s3: l - 2 * (h - p) };
}

export function fibLevels(high: number, low: number, direction: 'up' | 'down' = 'up') {
  const ratios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.618];
  const diff = high - low;
  return ratios.map((r) => ({ ratio: r, price: direction === 'up' ? high - diff * r : low + diff * r }));
}

/** Simple pivot-based swing detection: returns indices of swing highs and lows. */
export function swings(bars: Candle[], lookback = 3) {
  const highs: number[] = [];
  const lows: number[] = [];
  for (let i = lookback; i < bars.length - lookback; i++) {
    let isH = true;
    let isL = true;
    for (let j = 1; j <= lookback; j++) {
      if (highOf(bars[i]) <= highOf(bars[i - j]) || highOf(bars[i]) <= highOf(bars[i + j])) isH = false;
      if (lowOf(bars[i]) >= lowOf(bars[i - j]) || lowOf(bars[i]) >= lowOf(bars[i + j])) isL = false;
    }
    if (isH) highs.push(i);
    if (isL) lows.push(i);
  }
  return { highs, lows };
}
