/**
 * The simulator's starting market, in a module of its own so the home page can show the same
 * market without importing the simulator store (which rehydrates a saved session on import).
 */
export const START_CURSOR = 80 * 390; // 80 trading days of history before "today"

/**
 * The market a first-time visitor gets. The string is the generator's input, not a label: change it
 * and every price in the default market changes.
 *
 * Chosen, not arbitrary. Lessons describe typical price levels, and tools/check-prices.mjs holds
 * their figures to bands sampled across many seeds -- but it never looks at this one, so a default
 * that happens to open an instrument far from typical passes the check while making the lessons
 * read wrong. The first candidate, 'nitora-1', opened BIOX at 33.83 against a base of 18.40.
 * This seed was picked from 'nitora-1' to 'nitora-300' as the one whose opening market is most
 * typical across all eight instruments: each opens between 27% and 89% of the way through its
 * 5th-to-95th percentile range. The old default, 'tradelab-1', had two instruments outside it.
 *
 * A returning reader keeps whatever seed their saved session holds, so their open positions are
 * still priced against the market that created them.
 */
export const DEFAULT_SEED = 'nitora-209';

/** The instrument a first-time visitor sees. */
export const DEFAULT_SYMBOL = 'NOVA';
