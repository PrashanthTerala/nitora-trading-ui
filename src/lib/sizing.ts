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

/**
 * The quantity that loses `riskPct` of equity if the stop is hit: equity x risk / stop distance,
 * rounded down to whole units because rounding up would break the rule it implements. Zero
 * when there is no stop to measure against, or when even one unit is too much.
 */
export function riskQty(equity: number, riskPct: number, riskPerUnit: number): number {
  if (!(equity > 0) || !(riskPerUnit > 0) || !(riskPct > 0)) return 0;
  return Math.floor((equity * riskPct) / 100 / riskPerUnit);
}

/** The quantity whose value is `pct` of equity, in whole units, for an order with no stop. */
export function valueQty(equity: number, pct: number, price: number): number {
  if (!(equity > 0) || !(price > 0) || !(pct > 0)) return 0;
  return Math.floor((equity * pct) / 100 / price);
}

export type TicketIssue =
  | { level: 'error'; code: 'qty' | 'price' | 'buyingPower'; need?: number; have?: number }
  | { level: 'warn'; code: 'risk' | 'noStop' | 'stopSide' | 'limitCross'; pct?: number };

/**
 * What is wrong with an order before it is sent. Errors block the button (the broker would
 * reject the order anyway, and a reason next to the field beats one after the click); warnings
 * are the teaching: the order is legal, it is just probably not what was meant.
 */
export function ticketIssues(t: {
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  qty: number;
  price: number;
  limitPrice: number;
  stopPrice: number;
  entry: number;
  buyingPower: number;
  /** Signed quantity already held in this instrument. */
  held: number;
  bracket: boolean;
  riskPct: number;
}): TicketIssue[] {
  const out: TicketIssue[] = [];
  if (!(t.qty > 0)) out.push({ level: 'error', code: 'qty' });
  const needsLimit = t.type === 'limit' || t.type === 'stop_limit';
  const needsStop = t.type === 'stop' || t.type === 'stop_limit';
  if ((needsLimit && !(t.limitPrice > 0)) || (needsStop && !(t.stopPrice > 0))) out.push({ level: 'error', code: 'price' });
  // An order against the position only reduces it, and needs no buying power up to its size.
  const dir = t.side === 'buy' ? 1 : -1;
  const reducing = Math.sign(t.held) === -dir ? Math.min(Math.abs(t.held), t.qty) : 0;
  const need = (t.qty - reducing) * t.entry;
  if (t.qty > 0 && need > t.buyingPower + 1e-6) out.push({ level: 'error', code: 'buyingPower', need, have: t.buyingPower });
  if (needsStop && t.stopPrice > 0 && t.price > 0 && (t.side === 'buy' ? t.stopPrice <= t.price : t.stopPrice >= t.price)) out.push({ level: 'warn', code: 'stopSide' });
  if (t.type === 'limit' && t.limitPrice > 0 && t.price > 0 && (t.side === 'buy' ? t.limitPrice > t.price : t.limitPrice < t.price)) out.push({ level: 'warn', code: 'limitCross' });
  if (!t.bracket) out.push({ level: 'warn', code: 'noStop' });
  else if (t.riskPct > 2) out.push({ level: 'warn', code: 'risk', pct: t.riskPct });
  return out;
}
