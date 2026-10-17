/**
 * Three inside up/down and three outside up/down, by the lesson's rules
 * (m02-candlestick-patterns/12-three-inside-outside, lines 9-11, 25-27, 33-35, 43-45 and the table
 * at 53-58): a harami or an engulfing on candles one and two, then a third candle closing beyond
 * candle one's open (inside) or candle two's close (outside). With `loose`, the inside versions use
 * Bulkowski's tested rule instead: a third close beyond candle two's close.
 */
import type { OHLC } from '@/engine/market/types';

export type Kind = 'inside-up' | 'inside-down' | 'outside-up' | 'outside-down';

const top = (b: OHLC) => Math.max(b.o, b.c);
const bottom = (b: OHLC) => Math.min(b.o, b.c);
const green = (b: OHLC) => b.c > b.o;
const red = (b: OHLC) => b.c < b.o;
/** Candle two's body inside candle one's (edges included) and smaller: a harami. */
const harami = (a: OHLC, b: OHLC) => top(b) <= top(a) && bottom(b) >= bottom(a) && top(b) - bottom(b) < top(a) - bottom(a);
/** Candle two's body covering candle one's (edges included) and larger: an engulfing. */
const engulfs = (a: OHLC, b: OHLC) => top(b) >= top(a) && bottom(b) <= bottom(a) && top(b) - bottom(b) > top(a) - bottom(a);

/** Every three inside or three outside pattern in a series; `index` is its third candle. */
export function threeInsideOutside(bars: OHLC[], loose = false): { index: number; kind: Kind }[] {
  const out: { index: number; kind: Kind }[] = [];
  for (let i = 2; i < bars.length; i++) {
    const [a, b, c] = [bars[i - 2], bars[i - 1], bars[i]];
    if (red(a) && harami(a, b) && green(c) && c.c > (loose ? b.c : a.o)) out.push({ index: i, kind: 'inside-up' });
    if (green(a) && harami(a, b) && red(c) && c.c < (loose ? b.c : a.o)) out.push({ index: i, kind: 'inside-down' });
    if (red(a) && green(b) && engulfs(a, b) && green(c) && c.c > b.c) out.push({ index: i, kind: 'outside-up' });
    if (green(a) && red(b) && engulfs(a, b) && red(c) && c.c < b.c) out.push({ index: i, kind: 'outside-down' });
  }
  return out;
}
