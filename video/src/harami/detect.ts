/**
 * Harami detection, by the lesson's definition (m02-candlestick-patterns/07-harami-and-harami-cross,
 * lines 9-11): a candle whose body sits entirely inside the previous candle's body (its open and
 * close both between the previous open and close; edges may touch), and is strictly smaller. Its
 * colour is not required to differ, and its wicks may poke out. The direction comes from the
 * first candle: a big red candle makes a bullish harami, a big green one a bearish harami.
 */
import type { OHLC } from '@/engine/market/types';

export type Harami = { index: number; direction: 'bullish' | 'bearish' };

const lo = (b: OHLC) => Math.min(b.o, b.c);
const hi = (b: OHLC) => Math.max(b.o, b.c);

export function haramis(bars: OHLC[]): Harami[] {
  const out: Harami[] = [];
  for (let i = 1; i < bars.length; i++) {
    const a = bars[i - 1];
    const b = bars[i];
    if (a.c === a.o) continue;
    const inside = lo(b) >= lo(a) && hi(b) <= hi(a);
    const smaller = hi(b) - lo(b) < hi(a) - lo(a);
    if (inside && smaller) out.push({ index: i, direction: a.c < a.o ? 'bullish' : 'bearish' });
  }
  return out;
}

/** A doji: open and close (almost) equal, within a twentieth of the candle's range. */
export const isDoji = (b: OHLC) => Math.abs(b.c - b.o) <= (b.h - b.l) / 20;
