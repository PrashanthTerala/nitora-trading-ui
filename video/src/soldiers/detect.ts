/**
 * Three white soldiers and three black crows, by the lesson's rules (m02-candlestick-patterns/
 * 11-three-soldiers-three-crows, lines 9-12 and 30-32): three candles of one colour, each opening
 * inside the previous body (its edges included, so the identical three crows count) and closing
 * beyond the previous close, each closing near its extreme, with bodies of roughly one size.
 */
import type { OHLC } from '@/engine/market/types';

/** "Closes near its high": the wick beyond the close is at most this share of the body. */
export const NEAR = 0.25;
/** "Roughly similar in size": the smallest body is at least this share of the largest. */
export const SIMILAR = 0.5;

const body = (b: OHLC) => Math.abs(b.c - b.o);
const inside = (v: number, b: OHLC) => v >= Math.min(b.o, b.c) && v <= Math.max(b.o, b.c);

/** Every soldiers or crows pattern in a series; `index` is its third candle. */
export function soldiers(bars: OHLC[]): { index: number; kind: 'soldiers' | 'crows' }[] {
  const out: { index: number; kind: 'soldiers' | 'crows' }[] = [];
  for (let i = 2; i < bars.length; i++) {
    const three = [bars[i - 2], bars[i - 1], bars[i]];
    for (const kind of ['soldiers', 'crows'] as const) {
      const up = kind === 'soldiers';
      const colour = three.every((b) => (up ? b.c > b.o : b.c < b.o));
      const steps = [1, 2].every((k) => inside(three[k].o, three[k - 1]) && (up ? three[k].c > three[k - 1].c : three[k].c < three[k - 1].c));
      const near = three.every((b) => (up ? b.h - b.c : b.c - b.l) <= NEAR * body(b));
      const bodies = three.map(body);
      const similar = Math.min(...bodies) >= SIMILAR * Math.max(...bodies);
      if (colour && steps && near && similar) out.push({ index: i, kind });
    }
  }
  return out;
}
