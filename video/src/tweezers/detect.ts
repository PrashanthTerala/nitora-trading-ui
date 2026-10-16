/**
 * Tweezers and counterattack lines, by the lesson's rules (m02-candlestick-patterns/
 * 09-tweezers-and-counterattack, lines 7-12, 28-32 and 38-50). A tweezer bottom (top) is two
 * candles in a row whose lows (highs) match within a tiny fraction: the lesson's "a few
 * hundredths of a percent", taken here as 0.05% of price. A counterattack line is a big candle,
 * then a candle that gaps beyond its far extreme against it and closes back at its close (within
 * 0.2% of price). The trend before either is the caller's to check.
 */
import type { OHLC } from '@/engine/market/types';

export type Tweezer = { index: number; kind: 'bottom' | 'top' };
export type Counterattack = { index: number; kind: 'bullish' | 'bearish' };

export const TWEEZER_TOLERANCE = 0.0005;
export const COUNTER_TOLERANCE = 0.002;

export function tweezers(bars: OHLC[], tolerance = TWEEZER_TOLERANCE): Tweezer[] {
  const out: Tweezer[] = [];
  for (let i = 1; i < bars.length; i++) {
    const a = bars[i - 1];
    const b = bars[i];
    if (Math.abs(a.l - b.l) <= a.l * tolerance + 1e-9) out.push({ index: i, kind: 'bottom' });
    if (Math.abs(a.h - b.h) <= a.h * tolerance + 1e-9) out.push({ index: i, kind: 'top' });
  }
  return out;
}

export function counterattacks(bars: OHLC[], tolerance = COUNTER_TOLERANCE): Counterattack[] {
  const out: Counterattack[] = [];
  for (let i = 1; i < bars.length; i++) {
    const a = bars[i - 1];
    const b = bars[i];
    const meets = Math.abs(b.c - a.c) <= a.c * tolerance;
    if (a.c < a.o && b.c > b.o && b.o < a.l && meets) out.push({ index: i, kind: 'bullish' });
    if (a.c > a.o && b.c < b.o && b.o > a.h && meets) out.push({ index: i, kind: 'bearish' });
  }
  return out;
}
