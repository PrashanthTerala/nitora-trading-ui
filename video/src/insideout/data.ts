/**
 * The three inside/outside lesson's video data: the site's own figures (src/content/figures), as
 * the site draws them, and every number the narration or the frame states, computed here so
 * scripts/check.mjs can hold the spoken numbers to them. Nothing here is market data.
 */
import type { OHLC } from '@/engine/market/types';
import { CANDLE_PATTERNS } from '@/content/figures/candlePatterns';
import { threeInsideOutside } from './detect';

export { threeInsideOutside };

const r2 = (n: number) => Math.round(n * 100) / 100;
const bar = (o: number, h: number, l: number, c: number): OHLC => ({ o, h, l, c }) as OHLC;

/** The four figures: six trend candles, then the pattern at bars 6-8. */
export const TIU = CANDLE_PATTERNS['three-inside-up'].bars;
export const TID = CANDLE_PATTERNS['three-inside-down'].bars;
export const TOU = CANDLE_PATTERNS['three-outside-up'].bars;
export const TOD = CANDLE_PATTERNS['three-outside-down'].bars;

/** Each third candle's test, as drawn. */
export const TIU_FIRST_OPEN = TIU[6].o;
export const TIU_THIRD_CLOSE = TIU[8].c;
export const TID_FIRST_OPEN = TID[6].o;
export const TID_THIRD_CLOSE = TID[8].c;
export const TOU_SECOND_CLOSE = TOU[7].c;
export const TOU_THIRD_CLOSE = TOU[8].c;
export const TOD_SECOND_CLOSE = TOD[7].c;
export const TOD_THIRD_CLOSE = TOD[8].c;

/** The trades: enter at the third close; stop below the pattern's low (inside) or the engulfing candle's low (outside). */
export const IN_ENTRY = TIU[8].c;
export const IN_STOP = TIU[6].l;
export const IN_RISK = r2(IN_ENTRY - IN_STOP);
export const OUT_ENTRY = TOU[8].c;
export const OUT_STOP = TOU[7].l;
export const OUT_RISK = r2(OUT_ENTRY - OUT_STOP);
/** What confirmation costs: the harami's small candle closed here; the confirmed entry is this much higher. */
export const EARLY = TIU[7].c;
export const COST = r2(IN_ENTRY - EARLY);
/** The inside test's extra distance: from candle two's close up to candle one's open (the outside test's bar is candle two's close itself). */
export const INSIDE_GAP = r2(TIU_FIRST_OPEN - EARLY);

/**
 * Bulkowski's published tests (thepatternsite.com, read 2026-10-17): ThreeInsideUp.html "Bullish
 * reversal 65% of the time"; ThreeInsideDown.html "Bearish reversal 60%"; ThreeOutsideUp.html
 * "Bullish reversal 75%"; ThreeOutsideDown.html "Bearish reversal 69%". The bases, as the harami
 * and engulfing lessons give them: bullish harami 53%, bearish harami 47%, bullish engulfing 63%,
 * bearish engulfing 79%.
 */
export const TIU_PCT = 65;
export const TID_PCT = 60;
export const TOU_PCT = 75;
export const TOD_PCT = 69;
export const HARAMI_BULL = 53;
export const HARAMI_BEAR = 47;
export const ENGULF_BULL = 63;
export const ENGULF_BEAR = 79;

/** The intro's halves: the harami alone, and the engulfing alone (the figures up to candle two). */
export const HARAMI_ONLY = TIU.slice(0, 8);
export const ENGULF_ONLY = TOU.slice(0, 8);

/** A third candle that passes Bulkowski's looser test but not the lesson's (illustration): above candle two's close, below candle one's open. */
export const LOOSE_THIRD = [...TIU.slice(0, 8), bar(100.5, 101.9, 100.2, 101.6)];
