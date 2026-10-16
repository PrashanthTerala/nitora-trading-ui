/**
 * The harami lesson's video data: the site's own figures (src/content/figures) and every number
 * the narration or the frame states, computed here so scripts/check.mjs can hold the spoken
 * numbers to them. Nothing here is market data.
 */
import type { OHLC } from '@/engine/market/types';
import { CANDLE_PATTERNS } from '@/content/figures/candlePatterns';
import { regimeSeries } from '@/content/figures';
import { haramis, isDoji } from './detect';

export { haramis, isDoji };

const r2 = (n: number) => Math.round(n * 100) / 100;

/** The three figures: six trend candles, the pair at bars 6-7, the confirmation at 8. */
export const BULL = CANDLE_PATTERNS['bullish-harami'].bars;
export const BEAR = CANDLE_PATTERNS['bearish-harami'].bars;
export const CROSS = CANDLE_PATTERNS['harami-cross'].bars;

/** Confirmation on the bullish figure: the small candle's high, the big candle's midpoint and open, and the third close. */
export const BULL_SMALL_HIGH = BULL[7].h;
export const BULL_MID = r2((BULL[6].o + BULL[6].c) / 2);
export const BULL_BIG_OPEN = BULL[6].o;
export const BULL_THIRD_CLOSE = BULL[8].c;
/** Closing above the first candle's open makes it a three inside up (lesson 12). */
export const THREE_INSIDE_UP = BULL_THIRD_CLOSE > BULL_BIG_OPEN;

/** The trade idea: enter on the confirmation close above the harami's high, stop below the big red candle's low. */
export const BULL_ENTRY = BULL[8].c;
export const BULL_STOP = BULL[6].l;
export const BULL_RISK = r2(BULL_ENTRY - BULL_STOP);

/** The sideways chart: every harami by the lesson's rule, and how many there are. */
export const RANGE = regimeSeries('range');
export const RANGE_HARAMIS = haramis(RANGE);
export const RANGE_HARAMI_COUNT = RANGE_HARAMIS.length;

/**
 * Bulkowski's published tests (thepatternsite.com, read 2026-10-16): HaramiBull.html "Bullish
 * reversal 53% of the time"; HaramiBear.html "Bullish continuation 53%"; HaramiCrossBull.html
 * "Bearish continuation 55%"; HaramiCrossBear.html "Bullish continuation 57%". A continuation rate
 * c means the trend reversed 100 - c percent of the time.
 */
export const BULKOWSKI_BULLISH = 53;
export const BULKOWSKI_BEARISH = 100 - 53;
export const BULKOWSKI_CROSS_BULLISH = 100 - 55;
export const BULKOWSKI_CROSS_BEARISH = 100 - 57;

/** Illustrations (hand-drawn synthetic candles, tagged as illustrations on screen), each ending in a harami at bars 6-7. */
const bars = (rows: number[][]): OHLC[] => rows.map(([o, h, l, c]) => ({ o, h, l, c }));
/** A long decline that ends in an unusually big candle. */
export const LOC_SPRINT = bars([[110, 110.3, 108.9, 109.1], [109.1, 109.4, 107.8, 108], [108, 108.2, 106.7, 106.9], [106.9, 107.1, 105.6, 105.8], [105.8, 106, 104.5, 104.7], [104.7, 104.9, 103.5, 103.7], [103.7, 103.9, 97.6, 97.9], [98.6, 99.6, 98.1, 99.2]]);
/** A decline into support at 100, tested twice. */
export const LOC_LEVEL = bars([[108, 108.3, 106.2, 106.5], [106.5, 106.8, 104.3, 104.6], [104.6, 104.8, 102.3, 102.6], [102.6, 102.9, 100.2, 100.5], [100.5, 102.5, 100.3, 102.2], [102.2, 103.7, 101.9, 103.4], [103.4, 103.6, 100.1, 100.3], [100.7, 101.4, 100.2, 101.2]]);
export const LOC_SUPPORT = 100;
/** How big the sprint's first candle is against the five before it. */
export const SPRINT_RATIO = r2(Math.abs(LOC_SPRINT[6].c - LOC_SPRINT[6].o) / (LOC_SPRINT.slice(1, 6).reduce((n, b) => n + Math.abs(b.c - b.o), 0) / 5));

/** The trap: buy at the small candle's close, then the trend resumes through the stop. */
export const TRAP_BUY = BULL[7].c;
export const TRAP_RESUME = [...BULL.slice(0, 8), { o: BULL[7].c, h: r2(BULL[7].c + 0.25), l: r2(BULL_STOP - 0.55), c: r2(BULL_STOP - 0.25) }];

export const ILLUSTRATIONS_VALID = [LOC_SPRINT, LOC_LEVEL].every((s) => haramis(s).some((h) => h.index === 7 && h.direction === 'bullish'));
