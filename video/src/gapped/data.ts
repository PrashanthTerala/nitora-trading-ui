/**
 * The gapped-stars lesson's video data: the site's own figures (src/content/figures), as the site
 * draws them, and every number the narration or the frame states, computed here so
 * scripts/check.mjs can hold the spoken numbers to them. Nothing here is market data.
 */
import type { OHLC } from '@/engine/market/types';
import { CANDLE_PATTERNS } from '@/content/figures/candlePatterns';
import { bodyMid, gappedStars } from './detect';

export { bodyMid, gappedStars };

const r2 = (n: number) => Math.round(n * 100) / 100;
const bar = (o: number, h: number, l: number, c: number): OHLC => ({ o, h, l, c }) as OHLC;

/** The three figures: six trend candles, then the pattern at bars 6-8. */
export const MDS = CANDLE_PATTERNS['morning-doji-star'].bars;
export const ABB = CANDLE_PATTERNS['abandoned-baby-bullish'].bars;
export const ABS = CANDLE_PATTERNS['abandoned-baby-bearish'].bars;

/** The morning doji star, as drawn: candle one's middle and the third close. */
export const MDS_MID = r2(bodyMid(MDS[6]));
export const MDS_THIRD_CLOSE = MDS[8].c;

/** The bullish abandoned baby, as drawn: the doji's high and low, and its neighbours' lows. */
export const BABY_HIGH = ABB[7].h;
export const BABY_LOW = ABB[7].l;
export const FIRST_LOW = ABB[6].l;
export const THIRD_LOW = ABB[8].l;
/** The bearish one: the doji's low, and its neighbours' highs. */
export const BEAR_BABY_LOW = ABS[7].l;
export const BEAR_FIRST_HIGH = ABS[6].h;
export const BEAR_THIRD_HIGH = ABS[8].h;

/** The trade on the bullish abandoned baby: enter at the third close; stop just under the doji's low. */
export const ENTRY = ABB[8].c;
export const STOP = BABY_LOW;
export const RISK = r2(ENTRY - STOP);

/**
 * Bulkowski's published tests (thepatternsite.com, read 2026-10-17), out of 103 candle patterns:
 * MorningDojiStar.html "Bullish reversal 76%", rank 25, 932 examples; EveningDojiStar.html
 * "Bearish reversal 71%", rank 30; AbandonBabyBull.html "Bullish reversal 70%", rank 9, "just 293
 * examples out of 4.7 million candle lines"; AbandonBaby.html "Bearish reversal 69%", rank 64. The
 * plain stars, as the stars lesson gives them: morning 78%, evening 72%.
 */
export const MORNING_DOJI = 76;
export const EVENING_DOJI = 71;
export const BABY_BULL = 70;
export const BABY_BEAR = 69;
export const MORNING_STAR = 78;
export const EVENING_STAR = 72;
export const MORNING_DOJI_SAMPLES = 932;
export const BABY_SAMPLES = 293;
export const CANDLES_MILLIONS = 4.7;
export const RANK_BABY_BEAR = 64;
export const PATTERNS = 103;

/** The evening doji star (illustration): the site's evening star with a doji, gapped above, in the middle. */
const ES = CANDLE_PATTERNS['evening-star'].bars;
const esTop = Math.max(ES[6].o, ES[6].c);
export const EDS = [...ES.slice(0, 7), bar(r2(esTop + 0.9), r2(esTop + 1.7), r2(esTop + 0.4), r2(esTop + 0.95)), ...ES.slice(8)];

/** A gap that filled (illustration): a fourth candle falls back through the doji's range and the stop. */
export const FILLED = [...ABB, bar(103.2, 103.5, 96.6, 97.1)];

/** The same three sessions on a 24-hour chart (illustration): no overnight break, so no gaps; the middle candle opens at the first close. */
export const NO_GAP = [...ABB.slice(0, 7), bar(ABB[6].c, r2(ABB[6].c + 0.35), BABY_LOW, r2(ABB[6].c + 0.05)), { ...ABB[8], o: r2(ABB[6].c + 0.05) }];
