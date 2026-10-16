/**
 * The piercing-line lesson's video data: the site's own figures (src/content/figures), as the site
 * draws them, and every number the narration or the frame states, computed here so
 * scripts/check.mjs can hold the spoken numbers to them. Nothing here is market data.
 */
import type { OHLC } from '@/engine/market/types';
import { CANDLE_PATTERNS } from '@/content/figures/candlePatterns';
import { bodyMid, piercings, reach } from './detect';

export { bodyMid, piercings, reach };

const r2 = (n: number) => Math.round(n * 100) / 100;

/** The two figures: six trend candles, the pair at bars 6-7, the confirmation at 8. */
export const PIERCE = CANDLE_PATTERNS['piercing-line'].bars;
export const DARK = CANDLE_PATTERNS['dark-cloud-cover'].bars;
export const THRUST = CANDLE_PATTERNS['thrusting-line'].bars;

/** The piercing line's numbers, as drawn. */
export const FIRST_OPEN = PIERCE[6].o;
export const FIRST_CLOSE = PIERCE[6].c;
export const FIRST_LOW = PIERCE[6].l;
export const SECOND_OPEN = PIERCE[7].o;
export const SECOND_CLOSE = PIERCE[7].c;
export const PIERCE_MID = r2(bodyMid(PIERCE[6]));
export const PIERCE_REACH = reach(PIERCE[6], PIERCE[7]);

/** The dark cloud's numbers, as drawn. */
export const DARK_FIRST_HIGH = DARK[6].h;
export const DARK_SECOND_OPEN = DARK[7].o;
export const DARK_SECOND_CLOSE = DARK[7].c;
export const DARK_MID = r2(bodyMid(DARK[6]));

/** Confirmation and the trade: a third candle closing above the first candle's open; stop below the second candle's low. */
export const CONFIRM_CLOSE = PIERCE[8].c;
export const PIERCE_ENTRY = PIERCE[8].c;
export const PIERCE_STOP = PIERCE[7].l;
export const PIERCE_RISK = r2(PIERCE_ENTRY - PIERCE_STOP);

/**
 * Bulkowski's published tests (thepatternsite.com, read 2026-10-16): Piercing.html "Bullish
 * reversal 64%"; DarkCloudCover.html "Bearish reversal 60%"; Thrusting.html "Bullish reversal
 * 57%" (theory: continuation); and, for comparison, the engulfing rates from the engulfing lesson.
 */
export const BULKOWSKI_PIERCING = 64;
export const BULKOWSKI_DARK_CLOUD = 60;
export const BULKOWSKI_BULL_ENGULF = 63;
export const BULKOWSKI_BEAR_ENGULF = 79;
export const BULKOWSKI_THRUSTING_REVERSAL = 57;

/**
 * The scale (illustration): the figure's first candle with five second candles, each opening
 * at the figure's gap-down open and closing at a different depth. On-neck: at the first low.
 * In-neck: just inside the body. Thrusting: into the body, short of the middle. Piercing: the
 * figure's own close. Engulfing: above the first open.
 */
const first = PIERCE[6];
const second = (c: number): OHLC => ({ o: SECOND_OPEN, h: r2(Math.max(SECOND_OPEN, c) + 0.3), l: PIERCE[7].l, c });
export const SCALE = [
  { name: 'on-neck', reading: 'continuation', pair: [first, second(first.l)] },
  { name: 'in-neck', reading: 'continuation', pair: [first, second(r2(first.c + 0.12))] },
  { name: 'thrusting', reading: 'continuation', pair: [first, second(r2(PIERCE_MID - 0.9))] },
  { name: 'piercing', reading: 'reversal', pair: [first, PIERCE[7]] },
  { name: 'engulfing', reading: 'reversal', pair: [first, second(r2(first.o + 0.5))] },
] as const;

/** The 24-hour version (illustration): the second candle opens where the first closed, the relaxed rule. */
export const NO_GAP = [...PIERCE.slice(0, 7), { ...PIERCE[7], o: FIRST_CLOSE, l: r2(FIRST_CLOSE - 0.3) }];
