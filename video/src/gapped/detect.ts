/**
 * The gapped stars, by the lesson's rules (m02-candlestick-patterns/13-abandoned-baby-and-stars,
 * lines 9-12, 18, 28-33): a large first candle, a doji whose body sits beyond the first body, and a
 * third candle closing past the first body's middle. When the doji's whole range is gapped away
 * from both neighbours, wicks included, it is an abandoned baby.
 */
import type { OHLC } from '@/engine/market/types';

export type Kind = 'morning-doji' | 'evening-doji' | 'baby-bull' | 'baby-bear';

/** A doji: a body at most this share of the candle's range (the lesson's "roughly 5% to 10%"). */
export const DOJI = 0.1;
/** A "large" first candle: a body at least this share of its range. */
export const LARGE = 0.6;

const body = (b: OHLC) => Math.abs(b.c - b.o);
const top = (b: OHLC) => Math.max(b.o, b.c);
const bottom = (b: OHLC) => Math.min(b.o, b.c);
export const bodyMid = (b: OHLC) => (b.o + b.c) / 2;
const doji = (b: OHLC) => b.h > b.l && body(b) <= DOJI * (b.h - b.l);
const large = (b: OHLC) => b.h > b.l && body(b) >= LARGE * (b.h - b.l);

/** Every gapped star in a series; `index` is its third candle. An abandoned baby is reported as one, not also as a doji star. */
export function gappedStars(bars: OHLC[]): { index: number; kind: Kind }[] {
  const out: { index: number; kind: Kind }[] = [];
  for (let i = 2; i < bars.length; i++) {
    const [a, d, c] = [bars[i - 2], bars[i - 1], bars[i]];
    if (!large(a) || !doji(d)) continue;
    if (a.c < a.o && top(d) < bottom(a) && c.c > c.o && c.c > bodyMid(a)) out.push({ index: i, kind: d.h < a.l && d.h < c.l ? 'baby-bull' : 'morning-doji' });
    if (a.c > a.o && bottom(d) > top(a) && c.c < c.o && c.c < bodyMid(a)) out.push({ index: i, kind: d.l > a.h && d.l > c.h ? 'baby-bear' : 'evening-doji' });
  }
  return out;
}
