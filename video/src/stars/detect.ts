/**
 * Morning and evening stars, by the lesson's rules (m02-candlestick-patterns/10-morning-evening-star,
 * lines 7-13 and 29-34) and Bulkowski's (MorningStar.html): a big candle with the trend; a star
 * with a small body (under 40% of the first body here) whose body sits beyond the first body
 * (below it for a morning star, above for an evening star); then a big candle the other way that
 * closes past the middle of the first body. The trend before it is the caller's to check.
 */
import type { OHLC } from '@/engine/market/types';

export type Star = { index: number; kind: 'morning' | 'evening' };

const lo = (b: OHLC) => Math.min(b.o, b.c);
const hi = (b: OHLC) => Math.max(b.o, b.c);
const body = (b: OHLC) => hi(b) - lo(b);
export const bodyMid = (b: OHLC) => (b.o + b.c) / 2;
export const SMALL = 0.4;

/** `index` is the third candle's. */
export function stars(bars: OHLC[]): Star[] {
  const out: Star[] = [];
  for (let i = 2; i < bars.length; i++) {
    const [a, s, c] = [bars[i - 2], bars[i - 1], bars[i]];
    const small = body(s) < body(a) * SMALL;
    if (a.c < a.o && small && hi(s) <= lo(a) && c.c > c.o && c.c > bodyMid(a)) out.push({ index: i, kind: 'morning' });
    if (a.c > a.o && small && lo(s) >= hi(a) && c.c < c.o && c.c < bodyMid(a)) out.push({ index: i, kind: 'evening' });
  }
  return out;
}

/** How far the third candle's close reaches back into the first candle's body, in percent. */
export const reach = (a: OHLC, c: OHLC) => Math.round(((c.c - a.c) / (a.o - a.c)) * 100);
