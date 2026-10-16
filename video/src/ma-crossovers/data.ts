/**
 * The pilot's chart data: one synthetic daily series, long enough for a 200-day average, and
 * every value the video shows or says, computed by the site's own indicator engine.
 *
 * Nothing here is market data. The series is the figures' deterministic path generator, so it
 * is the same on every render; `tools/` and the narration check read the same numbers.
 */
import * as ind from '@/engine/market/indicators';
import { fromPath } from '@/content/figures/helpers';
import { regimeSeries } from '@/content/figures';
import type { OHLC } from '@/engine/market/types';

export interface Cross {
  index: number;
  direction: 'up' | 'down';
}

/** Every bar where `fast - slow` changes sign, as the site's crossover figure marks them. */
export function crosses(fast: number[], slow: number[]): Cross[] {
  const out: Cross[] = [];
  for (let i = 1; i < fast.length; i++) {
    if ([fast[i - 1], slow[i - 1], fast[i], slow[i]].some(Number.isNaN)) continue;
    const was = fast[i - 1] - slow[i - 1];
    const now = fast[i] - slow[i];
    if (was <= 0 && now > 0) out.push({ index: i, direction: 'up' });
    if (was >= 0 && now < 0) out.push({ index: i, direction: 'down' });
  }
  return out;
}

/**
 * A long decline, a base, a long rally, a top and a second decline: one golden cross and one
 * death cross on the 50/200 pair.
 */
export const BARS: OHLC[] = fromPath(
  [
    [0, 120], [0.14, 96], [0.2, 101], [0.3, 84], [0.36, 88], [0.42, 82], [0.47, 86],
    [0.6, 104], [0.64, 100], [0.76, 126], [0.8, 121], [0.86, 128], [0.9, 118], [1, 96],
  ],
  640,
  'ma-crossovers-pilot',
  { noise: 2.2 },
);

const closes = ind.closes(BARS);
export const SMA50 = ind.sma(closes, 50);
export const SMA200 = ind.sma(closes, 200);
export const GOLDEN_DEATH = crosses(SMA50, SMA200);

/** The window shown on screen: from where the 200-day average first exists. */
export const VIEW_FROM = 199;

/** The lowest close before the golden cross, and how many bars the cross came after it. */
const golden = GOLDEN_DEATH.find((c) => c.direction === 'up');
const death = GOLDEN_DEATH.find((c) => c.direction === 'down');
export const GOLDEN = golden?.index ?? -1;
export const DEATH = death?.index ?? -1;
function argExtreme(from: number, to: number, pick: (a: number, b: number) => boolean) {
  let best = from;
  for (let i = from; i <= to; i++) if (pick(closes[i], closes[best])) best = i;
  return best;
}
export const LOW = golden ? argExtreme(VIEW_FROM, GOLDEN, (a, b) => a < b) : -1;
export const HIGH = golden && death ? argExtreme(GOLDEN, DEATH, (a, b) => a > b) : -1;

/** How the same chart looks to a fast pair and a slow pair: the count of crosses of each. */
export const EMA9 = ind.ema(closes, 9);
export const EMA21 = ind.ema(closes, 21);
const inView = (c: Cross) => c.index >= VIEW_FROM;
export const FAST_CROSSES = crosses(EMA9, EMA21).filter(inView).length;
export const SLOW_CROSSES = GOLDEN_DEATH.filter(inView).length;

/**
 * The refresher's worked example: the average of five closes, by the engine's own SMA (the last
 * value of a 5-period SMA over exactly five closes), so the spoken "forty" and "eight" are checked.
 */
export const AVERAGE_VALUES = [6, 8, 7, 9, 10];
export const AVERAGE_SUM = AVERAGE_VALUES.reduce((a, b) => a + b, 0);
export const AVERAGE_RESULT = ind.sma(AVERAGE_VALUES, AVERAGE_VALUES.length).at(-1) as number;

/** The whipsaw scene: the site's own sideways regime, with the lesson's 9/21 EMA pair. */
export const RANGE_BARS = regimeSeries('range');
const rangeCloses = ind.closes(RANGE_BARS);
export const RANGE_EMA9 = ind.ema(rangeCloses, 9);
export const RANGE_EMA21 = ind.ema(rangeCloses, 21);
export const RANGE_CROSSES = crosses(RANGE_EMA9, RANGE_EMA21);
