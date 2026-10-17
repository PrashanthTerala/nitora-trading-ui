/**
 * The soldiers lesson's video data: the site's own figures (src/content/figures), as the site draws
 * them, and every number the narration or the frame states, computed here so scripts/check.mjs can
 * hold the spoken numbers to them. Nothing here is market data.
 */
import type { OHLC } from '@/engine/market/types';
import { CANDLE_PATTERNS } from '@/content/figures/candlePatterns';
import { soldiers } from './detect';

export { soldiers };

const r2 = (n: number) => Math.round(n * 100) / 100;
const bar = (o: number, h: number, l: number, c: number, v?: number): OHLC => ({ o, h, l, c, ...(v === undefined ? {} : { v }) }) as OHLC;

/** The two figures: five trend candles, then the pattern at bars 5-7. */
export const TWS = CANDLE_PATTERNS['three-white-soldiers'].bars;
export const TBC = CANDLE_PATTERNS['three-black-crows'].bars;

/** The soldiers, as drawn: the opens of candles two and three, and the three closes. */
export const OPEN_2 = TWS[6].o;
export const OPEN_3 = TWS[7].o;
export const CLOSE_1 = TWS[5].c;
export const CLOSE_2 = TWS[6].c;
export const CLOSE_3 = TWS[7].c;
/** Each soldier's upper wick (the same on all three). */
export const WICK = r2(TWS[5].h - TWS[5].c);

/** The crows, as drawn: the first open and the last close. */
export const CROW_OPEN = TBC[5].o;
export const CROW_CLOSE = TBC[7].c;

/** The trade at the third close: entry there, stop below the first soldier's low. */
export const ENTRY = TWS[7].c;
export const WIDE_STOP = TWS[5].l;
export const WIDE_RISK = r2(ENTRY - WIDE_STOP);
/** The pullback (an example, not a forecast): to the middle of the third body, stop below the third soldier's low. */
export const PULLBACK = r2((TWS[7].o + TWS[7].c) / 2);
export const TIGHT_STOP = TWS[7].l;
export const TIGHT_RISK = r2(PULLBACK - TIGHT_STOP);

/**
 * Bulkowski's published tests (thepatternsite.com, read 2026-10-16), out of 103 candle patterns:
 * ThreeWhiteSoldiers.html "acts as a bullish reversal 82% of the time", overall rank 32;
 * ThreeBlackCrows.html "Bearish reversal 78% of the time", overall rank 3; AdvanceBlock.html
 * "Bullish continuation 64% of the time"; Deliberation.html "Bullish continuation 77% of the time";
 * Identical3Crows.html "Bearish reversal 79% of the time".
 */
export const BULKOWSKI_SOLDIERS = 82;
export const BULKOWSKI_CROWS = 78;
export const RANK_SOLDIERS = 32;
export const RANK_CROWS = 3;
export const PATTERNS = 103;
export const ADVANCE_BLOCK_UP = 64;
export const DELIBERATION_UP = 77;
export const IDENTICAL_CROWS = 79;

/** Illustrations of the variations, on the figures' own trend candles. */
export const ADVANCE_BLOCK = [...TWS.slice(0, 5), bar(100.24, 103.9, 99.9, 103.64), bar(102.6, 106, 102.3, 104.9), bar(104.3, 107.2, 104, 105.6)];
export const DELIBERATION = [...TWS.slice(0, 5), bar(100.24, 103.9, 99.9, 103.64), bar(103, 106.9, 102.7, 106.6), bar(106.7, 107.5, 106.4, 107.15)];
export const IDENTICAL = [...TBC.slice(0, 5), bar(100.17, 100.57, 96.97, 97.27), bar(97.27, 97.45, 93.87, 94.17), bar(94.17, 94.35, 90.77, 91.07)];

/** The trade's pullback: a fourth candle that dips through the middle of the third body and holds above its low (illustration). */
export const PULLBACK_BARS = [...TWS, bar(108.6, 108.95, 106.8, 107.4)];

/** Confirmation: a fourth candle that keeps the gain, and volume rising or shrinking across the three (illustration). */
const ctxVolume = [1.15, 1.05, 1.1, 1.0, 1.05];
export const CONFIRM = [...TWS, bar(108.7, 109.6, 108.1, 109.2)].map((b, i) => ({ ...b, v: [...ctxVolume, 1.0, 1.15, 1.3, 1.2][i] }) as OHLC);
export const FADING = [...TWS, bar(108.7, 109.6, 108.1, 109.2)].map((b, i) => ({ ...b, v: [...ctxVolume, 1.3, 0.95, 0.6, 0.55][i] }) as OHLC);

/** A blow-off: twelve steady up candles, then three giant soldiers at the end of the rally (illustration). */
export const BLOWOFF = [
  ...Array.from({ length: 12 }, (_, i) => bar(70 + i * 2.5, 72.5 + i * 2.5, 69.6 + i * 2.5, 72.1 + i * 2.5)),
  bar(100, 107.5, 99.6, 107.2),
  bar(104.5, 113.1, 104.1, 112.8),
  bar(110.6, 119.9, 110.2, 119.5),
];
