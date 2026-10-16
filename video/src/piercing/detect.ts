/**
 * Piercing line and dark cloud cover, by the lesson's rules (m02-candlestick-patterns/
 * 08-piercing-dark-cloud, lines 9-12 and 30-33). Piercing line: a red candle, then a green candle
 * that opens below the red candle's low (classic) or at/below its close (relaxed, for 24-hour
 * markets) and closes above the middle of the red body but below its open. Dark cloud cover is
 * the mirror. The trend before it is the caller's to check (the lesson's "where it is valid").
 */
import type { OHLC } from '@/engine/market/types';

export type TwoCandle = { index: number; kind: 'piercing' | 'dark-cloud' };

export const bodyMid = (b: OHLC) => (b.o + b.c) / 2;

export function piercings(bars: OHLC[], relaxed = false): TwoCandle[] {
  const out: TwoCandle[] = [];
  for (let i = 1; i < bars.length; i++) {
    const a = bars[i - 1];
    const b = bars[i];
    const mid = bodyMid(a);
    if (a.c < a.o && b.c > b.o && (relaxed ? b.o <= a.c : b.o < a.l) && b.c > mid && b.c < a.o) out.push({ index: i, kind: 'piercing' });
    if (a.c > a.o && b.c < b.o && (relaxed ? b.o >= a.c : b.o > a.h) && b.c < mid && b.c > a.o) out.push({ index: i, kind: 'dark-cloud' });
  }
  return out;
}

/** How far the second candle's close reaches back into the first candle's body, in percent. */
export const reach = (a: OHLC, b: OHLC) => Math.round(((b.c - a.c) / (a.o - a.c)) * 100);
