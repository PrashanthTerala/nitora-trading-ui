/**
 * The engulfing lesson's video data: the site's own figures (src/content/figures) and every
 * number the narration or the frame states, computed here so scripts/check.mjs can hold the
 * spoken numbers to them. Nothing here is market data.
 */
import type { OHLC } from '@/engine/market/types';
import { CANDLE_PATTERNS } from '@/content/figures/candlePatterns';
import { regimeSeries } from '@/content/figures';
import { engulfings } from './detect';

export { engulfings };

const r2 = (n: number) => Math.round(n * 100) / 100;

/** The bullish and bearish figures: six trend candles, the pair at bars 6-7, follow-through at 8. */
export const BULL = CANDLE_PATTERNS['bullish-engulfing'].bars;
export const BEAR = CANDLE_PATTERNS['bearish-engulfing'].bars;
export const PAIR = [6, 7] as const;
export const FOLLOW = 8;

/** The trade idea on the bullish figure: enter on the confirmation close above the engulfing high, stop below the pattern low. */
export const BULL_ENGULF_HIGH = BULL[7].h;
export const BULL_ENTRY = BULL[FOLLOW].c;
export const BULL_STOP = Math.min(BULL[6].l, BULL[7].l);
export const BULL_RISK = r2(BULL_ENTRY - BULL_STOP);

/** The sideways chart: every engulfing pair by the lesson's rule, and how many there are. */
export const RANGE = regimeSeries('range');
export const RANGE_ENGULFINGS = engulfings(RANGE);
export const RANGE_ENGULFING_COUNT = RANGE_ENGULFINGS.length;

/** The trap: the average range of the bullish figure's six trend candles, and a candle three times it. */
export const AVG_RANGE = r2(BULL.slice(0, 6).reduce((n, b) => n + (b.h - b.l), 0) / 6);
export const GIANT_RANGE = r2(AVG_RANGE * 3);

/** Bulkowski's published reversal rates (thepatternsite.com, BearEngulfing.html and BullEngulfing.html, read 2026-10-16). */
export const BULKOWSKI = { bearish: 79, bullish: 63, bearishOverallRank: 91, patterns: 103 } as const;

/**
 * Illustrations (hand-drawn synthetic candles, labelled as illustrations on screen): the lesson's
 * best locations, the volume comparison and the trap. Each ends in an engulfing pair at bars 6-7,
 * which detect.ts confirms (see ILLUSTRATIONS_VALID).
 */
const bars = (rows: number[][]): OHLC[] => rows.map(([o, h, l, c, v]) => ({ o, h, l, c, v }));
export const LOC_LEVEL = bars([[108, 108.4, 106.3, 106.6], [106.6, 106.9, 104.4, 104.8], [104.8, 105.1, 102.5, 102.8], [102.8, 103, 100.3, 100.6], [100.6, 102.4, 100.2, 102], [102, 102.2, 100.9, 101.2], [101.2, 101.4, 100.4, 100.7], [100.5, 103.4, 100.1, 103.1]]);
export const LOC_SUPPORT = 100;
export const LOC_SLOWING = bars([[112, 112.3, 108.6, 108.9], [108.9, 109.2, 105.6, 105.9], [105.9, 106.1, 103.6, 103.8], [103.8, 104, 102.3, 102.5], [102.5, 102.8, 101.6, 101.8], [101.8, 102.1, 101.2, 101.4], [101.4, 101.6, 100.9, 101.1], [100.9, 103, 100.7, 102.8]]);
export const LOC_VOLUME = bars([[108, 108.3, 106.4, 106.7, 900], [106.7, 107, 104.9, 105.2, 950], [105.2, 105.5, 103.3, 103.6, 1000], [103.6, 103.9, 101.9, 102.2, 980], [102.2, 102.5, 100.8, 101.1, 1020], [101.1, 101.3, 100.3, 100.6, 940], [100.6, 100.8, 99.9, 100.2, 900], [100, 103.3, 99.7, 103, 2600]]);
/** The same candles with the engulfing candle on thin volume. */
export const THIN_VOLUME = LOC_VOLUME.map((b, i) => (i === 7 ? { ...b, v: 520 } : b));
export const LOC_COUNT = bars([[106, 106.3, 104.8, 105.1], [105.1, 105.4, 103.9, 104.2], [104.2, 104.4, 103.1, 103.4], [103.4, 103.6, 102.4, 102.7], [102.7, 102.9, 101.8, 102.1], [102.1, 102.3, 101.3, 101.6], [101.6, 101.8, 100.9, 101.2], [101, 104, 100.7, 103.7]]);
/** How many bodies in a row, just before it, the last candle's body covers. */
export function coveredBodies(series: OHLC[], index = series.length - 1): number {
  const lo = Math.min(series[index].o, series[index].c);
  const hi = Math.max(series[index].o, series[index].c);
  let n = 0;
  for (let i = index - 1; i >= 0 && Math.min(series[i].o, series[i].c) >= lo && Math.max(series[i].o, series[i].c) <= hi; i--) n++;
  return n;
}
export const COUNT_COVERED = coveredBodies(LOC_COUNT);
export const ILLUSTRATIONS_VALID = [LOC_LEVEL, LOC_SLOWING, LOC_VOLUME, LOC_COUNT].every((s) => engulfings(s).some((e) => e.index === 7 && e.direction === 'bullish'));

/** The trap: the figure's engulfing candle, and the same candle at three times the average range. */
export const TRAP_NORMAL = BULL.slice(0, 8);
const e = BULL[7];
export const TRAP_GIANT = [...BULL.slice(0, 7), { ...e, h: r2(e.l + GIANT_RANGE), c: r2(e.l + GIANT_RANGE - 0.3) }];
export const NORMAL_RISK = r2(e.c - e.l);
export const GIANT_RISK = r2(TRAP_GIANT[7].c - TRAP_GIANT[7].l);
