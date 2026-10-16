/**
 * The tweezers lesson's video data: the site's own figures (src/content/figures), as the site
 * draws them, and every number the narration or the frame states, computed here so
 * scripts/check.mjs can hold the spoken numbers to them. Nothing here is market data.
 */
import { CANDLE_PATTERNS } from '@/content/figures/candlePatterns';
import { regimeSeries } from '@/content/figures';
import { counterattacks, tweezers } from './detect';
import { PIERCE, PIERCE_MID } from '../piercing/data';

export { counterattacks, tweezers, PIERCE, PIERCE_MID };

const r2 = (n: number) => Math.round(n * 100) / 100;

/** The four figures: six trend candles, the pair at bars 6-7, the confirmation at 8. */
export const TW_BOT = CANDLE_PATTERNS['tweezer-bottom'].bars;
export const TW_TOP = CANDLE_PATTERNS['tweezer-top'].bars;
export const CA_BULL = CANDLE_PATTERNS['bullish-counterattack'].bars;
export const CA_BEAR = CANDLE_PATTERNS['bearish-counterattack'].bars;

/** The tweezer bottom: the shared low, the pattern's high, and the confirmation. */
export const SHARED_LOW = TW_BOT[6].l;
export const SHARED_HIGH = TW_TOP[6].h;
export const PATTERN_HIGH = Math.max(TW_BOT[6].h, TW_BOT[7].h);
export const CONFIRM_CLOSE = TW_BOT[8].c;

/** The trade: enter on the confirmation close; stop a 0.10 buffer below the shared low. */
export const BUFFER = 0.1;
export const ENTRY = TW_BOT[8].c;
export const STOP = r2(SHARED_LOW - BUFFER);
export const RISK = r2(ENTRY - STOP);

/** The counterattack figures: the gap against the first candle, and how close the closes meet. */
export const CA_FIRST_CLOSE = CA_BULL[6].c;
export const CA_GAP = r2(CA_BULL[6].c - CA_BULL[7].o);
export const CA_CLOSE_DIFF = r2(Math.abs(CA_BULL[7].c - CA_BULL[6].c));
export const CA_BEAR_FIRST_CLOSE = CA_BEAR[6].c;
export const CA_BEAR_GAP = r2(CA_BEAR[7].o - CA_BEAR[6].c);

/** The sideways chart: every matching low or high within the lesson's tolerance. */
export const RANGE = regimeSeries('range');
export const RANGE_TWEEZERS = tweezers(RANGE);
export const RANGE_TWEEZER_COUNT = RANGE_TWEEZERS.length;

/**
 * Bulkowski's published tests (thepatternsite.com, read 2026-10-16): TweezersBottom.html "Bearish
 * continuation 52%"; TweezersTop.html "Bullish continuation 56%"; and counterattack lines under
 * their other name, MeetingLinesBull.html "Bullish reversal 56%" and MeetingLinesBear.html
 * "Bullish continuation 51%" (so it reversed 49%).
 */
export const BULKOWSKI_TW_BOTTOM_CONT = 52;
export const BULKOWSKI_TW_TOP_CONT = 56;
export const BULKOWSKI_MEETING_BULL = 56;
export const BULKOWSKI_MEETING_BEAR = 100 - 51;
