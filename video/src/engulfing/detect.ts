/**
 * Engulfing detection, by the lesson's definition (m02-candlestick-patterns/06-engulfing, line 3):
 * two candles of opposite colour where the second candle's body completely covers the first
 * candle's body. Edges may touch: the synthetic series have no gaps (each candle opens at the
 * previous close), so the stricter "opens beyond the close" form could never occur on them.
 * The second body must also be strictly larger, so two identical bodies do not count.
 */
import type { OHLC } from '@/engine/market/types';

export type Engulfing = { index: number; direction: 'bullish' | 'bearish' };

export function engulfings(bars: OHLC[]): Engulfing[] {
  const out: Engulfing[] = [];
  for (let i = 1; i < bars.length; i++) {
    const a = bars[i - 1];
    const b = bars[i];
    const aUp = a.c > a.o;
    const bUp = b.c > b.o;
    if (a.c === a.o || b.c === b.o || aUp === bUp) continue;
    const covers = Math.min(b.o, b.c) <= Math.min(a.o, a.c) && Math.max(b.o, b.c) >= Math.max(a.o, a.c);
    const bigger = Math.abs(b.c - b.o) > Math.abs(a.c - a.o);
    if (covers && bigger) out.push({ index: i, direction: bUp ? 'bullish' : 'bearish' });
  }
  return out;
}
