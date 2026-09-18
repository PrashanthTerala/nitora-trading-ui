/**
 * Choosing an opening quantity the ticket can show before the trader has decided anything.
 *
 * Kept out of the component because it is pure arithmetic with a sharp edge: the ticket used a
 * fixed 100 units, which is reasonable for a hundred-dollar stock and absurd for one priced in
 * the tens of thousands. On a crypto pair it opened an eight-figure position against a
 * six-figure account, so the first thing a learner saw was negative buying power and a warning
 * about risk they had not taken.
 */

/**
 * A starting quantity worth roughly a tenth of the account, rounded to something a human would
 * actually type, and never below one unit.
 *
 * A tenth of equity is a deliberately unremarkable default: large enough that the numbers on
 * the ticket mean something, small enough that it is never the interesting decision. The real
 * sizing happens through the 1%-risk button, which is the habit the course is trying to build.
 */
export function defaultQty(price: number, equity: number): number {
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(equity) || equity <= 0) return 1;
  const raw = (equity * 0.1) / price;
  if (raw >= 100) return Math.round(raw / 100) * 100;
  if (raw >= 10) return Math.round(raw / 10) * 10;
  if (raw >= 1) return Math.round(raw);
  // Sub-unit sizing is real in crypto, but this broker deals in whole units. One unit of an
  // instrument priced above a tenth of the account is simply a large position, and the ticket's
  // own risk figures are the right place for the trader to notice that.
  return 1;
}
