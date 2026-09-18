import type { OHLC } from '@/engine/market/types';
import { Rng } from '@/lib/rng';

export const bar = (o: number, h: number, l: number, c: number, v?: number): OHLC => ({ o, h, l, c, v });

/** Round to 2dp to keep figures tidy. */
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Build `n` context candles drifting from `from` to `to`, with realistic wicks.
 * `bias` 1 = mostly green, -1 = mostly red, 0 = mixed.
 */
export function drift(from: number, to: number, n: number, seed: string | number, opts: { noise?: number; bias?: number } = {}): OHLC[] {
  const rng = new Rng(seed);
  const noise = opts.noise ?? 0.6;
  const bias = opts.bias ?? Math.sign(to - from);
  const out: OHLC[] = [];
  let prevClose = from;
  for (let i = 0; i < n; i++) {
    const target = from + ((to - from) * (i + 1)) / n;
    const open = i === 0 ? from : prevClose + rng.normal() * noise * 0.2;
    let close = target + rng.normal() * noise * 0.6;
    // enforce bias on most candles
    if (bias > 0 && close < open && rng.chance(0.7)) close = open + Math.abs(close - open) * 0.6;
    if (bias < 0 && close > open && rng.chance(0.7)) close = open - Math.abs(close - open) * 0.6;
    const hi = Math.max(open, close) + Math.abs(rng.normal()) * noise * 0.5;
    const lo = Math.min(open, close) - Math.abs(rng.normal()) * noise * 0.5;
    out.push(bar(r2(open), r2(hi), r2(lo), r2(close), Math.round(800 + rng.float() * 600)));
    prevClose = close;
  }
  return out;
}

/**
 * Generate candles that follow a piecewise-linear path of [xFraction, price] points.
 * Used for chart patterns (head and shoulders, triangles, ...).
 */
export function fromPath(points: [number, number][], n: number, seed: string | number, opts: { noise?: number; volume?: (i: number, frac: number) => number } = {}): OHLC[] {
  const rng = new Rng(seed);
  const noise = opts.noise ?? 0.5;
  const out: OHLC[] = [];
  const at = (frac: number) => {
    for (let k = 0; k < points.length - 1; k++) {
      const [x1, p1] = points[k];
      const [x2, p2] = points[k + 1];
      if (frac >= x1 && frac <= x2) {
        const t = x2 === x1 ? 0 : (frac - x1) / (x2 - x1);
        return p1 + (p2 - p1) * t;
      }
    }
    return points[points.length - 1][1];
  };
  let prevClose = at(0);
  for (let i = 0; i < n; i++) {
    const frac = i / (n - 1);
    const open = i === 0 ? prevClose : prevClose;
    const close = at(frac) + rng.normal() * noise * 0.5;
    const hi = Math.max(open, close) + Math.abs(rng.normal()) * noise * 0.6;
    const lo = Math.min(open, close) - Math.abs(rng.normal()) * noise * 0.6;
    const v = opts.volume ? opts.volume(i, frac) : Math.round(700 + rng.float() * 700);
    out.push(bar(r2(open), r2(hi), r2(lo), r2(close), Math.round(v)));
    prevClose = close;
  }
  return out;
}

export function concat(...parts: OHLC[][]): OHLC[] {
  return parts.flat();
}

/** Shift a set of bars so the first open lands at `price`. */
export function rebase(bars: OHLC[], price: number): OHLC[] {
  if (!bars.length) return bars;
  const d = price - bars[0].o;
  return bars.map((b) => bar(r2(b.o + d), r2(b.h + d), r2(b.l + d), r2(b.c + d), b.v));
}

/** Continue a sequence: shift `next` so its first open equals last close of `prev` (plus optional gap). */
export function chain(prev: OHLC[], next: OHLC[], gap = 0): OHLC[] {
  if (!prev.length) return next;
  const last = prev[prev.length - 1].c;
  return concat(prev, rebase(next, last + gap));
}
