/**
 * The stars lesson's video data: the site's own figures (src/content/figures), as the site draws
 * them, and every number the narration or the frame states, computed here so scripts/check.mjs can
 * hold the spoken numbers to them. Nothing here is market data.
 */
import type { OHLC } from '@/engine/market/types';
import { CANDLE_PATTERNS } from '@/content/figures/candlePatterns';
import { bodyMid, reach, stars } from './detect';

export { bodyMid, reach, stars };

const r2 = (n: number) => Math.round(n * 100) / 100;

/** The two figures: six trend candles, the star at bars 6-8, a follow-through at 9. */
export const MS = CANDLE_PATTERNS['morning-star'].bars;
export const ES = CANDLE_PATTERNS['evening-star'].bars;

/** The morning star's numbers, as drawn. */
export const FIRST_OPEN = MS[6].o;
export const FIRST_CLOSE = MS[6].c;
export const MID = r2(bodyMid(MS[6]));
export const STAR_TOP = Math.max(MS[7].o, MS[7].c);
export const STAR_BOTTOM = Math.min(MS[7].o, MS[7].c);
export const STAR_LOW = MS[7].l;
export const THIRD_CLOSE = MS[8].c;
export const REACH = reach(MS[6], MS[8]);

/** The evening star's, as drawn. */
export const ES_MID = r2(bodyMid(ES[6]));
export const ES_THIRD_CLOSE = ES[8].c;
export const ES_REACH = Math.round(((ES[6].c - ES[8].c) / (ES[6].c - ES[6].o)) * 100);

/** The trade: enter at the third close; stop at the star's low. */
export const ENTRY = MS[8].c;
export const STOP = STAR_LOW;
export const RISK = r2(ENTRY - STOP);

/**
 * Bulkowski's published tests (thepatternsite.com, read 2026-10-16): MorningStar.html "Bullish
 * reversal 78%", overall rank 12; EveningStar.html "Bearish reversal 72%", overall rank 4; out of
 * 103 candle patterns.
 */
export const BULKOWSKI_MORNING = 78;
export const BULKOWSKI_EVENING = 72;
export const RANK_MORNING = 12;
export const RANK_EVENING = 4;
export const PATTERNS = 103;

/**
 * Illustrations: the figure's own first and third candles with three different middles (a doji, the
 * figure's small star, and a medium body overlapping the first body: the "lazy star"), and the
 * intraday version with no gaps.
 */
const swap = (star: OHLC) => [...MS.slice(0, 7), star, ...MS.slice(8)];
export const DOJI_STAR = swap({ o: 96.4, h: 97.3, l: 95.5, c: 96.42 });
export const LAZY_STAR = swap({ o: 96.2, h: 98.9, l: 95.7, c: 98.4 });
export const NO_GAP = [...MS.slice(0, 7), { o: MS[6].c, h: r2(MS[6].c + 0.6), l: MS[7].l, c: r2(MS[6].c - 0.15) }, { ...MS[8], o: r2(MS[6].c - 0.15) }, ...MS.slice(9)];
/** The quiz: an evening star whose middle is a medium body overlapping the first body (illustration). */
export const ES_LAZY = [...ES.slice(0, 7), { o: 99.8, h: 102.8, l: 99.5, c: 102.4 }, ...ES.slice(8)];
