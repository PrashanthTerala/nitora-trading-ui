/**
 * A pure, deterministic paper-trading broker.
 *
 * All functions take an AccountState and return a new AccountState (no mutation) so the
 * store can persist snapshots and the UI can diff cheaply. Matching runs on every price
 * tick of the active symbol and on every completed base bar of the other symbols.
 */
import type { AccountSettings, AccountState, BrokerEvent, Fill, Order, Position, Side, Trade } from './types';
import { DEFAULT_SETTINGS } from './types';

let idCounter = 0;
export const newId = (prefix = 'o') => `${prefix}${Date.now().toString(36)}${(idCounter++).toString(36)}`;

export function createAccount(settings: Partial<AccountSettings> = {}): AccountState {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  return { cash: s.startingCash, positions: {}, orders: [], fills: [], trades: [], equityCurve: [], peakEquity: s.startingCash, settings: s, events: [] };
}

export interface PriceMap {
  [symbol: string]: number;
}

export function positionValue(pos: Position, price: number) {
  return pos.qty * price;
}

export function unrealized(pos: Position, price: number) {
  return (price - pos.avgPrice) * pos.qty;
}

export function equity(acc: AccountState, prices: PriceMap) {
  let eq = acc.cash;
  for (const p of Object.values(acc.positions)) eq += positionValue(p, prices[p.symbol] ?? p.avgPrice);
  return eq;
}

export function grossExposure(acc: AccountState, prices: PriceMap) {
  let g = 0;
  for (const p of Object.values(acc.positions)) g += Math.abs(positionValue(p, prices[p.symbol] ?? p.avgPrice));
  return g;
}

export function buyingPower(acc: AccountState, prices: PriceMap) {
  return Math.max(0, equity(acc, prices) * acc.settings.leverage - grossExposure(acc, prices));
}

function event(kind: BrokerEvent['kind'], time: number, text: string): BrokerEvent {
  return { id: newId('e'), time, kind, text };
}

function pushEvent(acc: AccountState, ev: BrokerEvent): AccountState {
  const events = [...acc.events, ev].slice(-200);
  return { ...acc, events };
}

export interface NewOrderInput {
  symbol: string;
  side: Side;
  qty: number;
  type: Order['type'];
  limitPrice?: number;
  stopPrice?: number;
  tif?: Order['tif'];
  bracket?: Order['bracket'];
  note?: string;
  reduceOnly?: boolean;
  role?: Order['role'];
  ocoId?: string;
}

/** Validate and enqueue an order. Market orders are filled on the next tick. */
export function placeOrder(acc: AccountState, input: NewOrderInput, time: number, prices: PriceMap): { acc: AccountState; order: Order } {
  const order: Order = {
    id: newId('o'),
    symbol: input.symbol,
    side: input.side,
    qty: Math.max(0, Math.floor(input.qty * 1e6) / 1e6),
    type: input.type,
    limitPrice: input.limitPrice,
    stopPrice: input.stopPrice,
    status: 'working',
    tif: input.tif ?? 'GTC',
    createdAt: time,
    bracket: input.bracket,
    note: input.note,
    reduceOnly: input.reduceOnly,
    role: input.role ?? 'entry',
    ocoId: input.ocoId,
  };
  const reject = (why: string) => {
    order.status = 'rejected';
    order.rejectReason = why;
    return { acc: pushEvent({ ...acc, orders: [...acc.orders, order] }, event('reject', time, `${order.side.toUpperCase()} ${order.qty} ${order.symbol} rejected: ${why}`)), order };
  };
  if (!(order.qty > 0)) return reject('quantity must be positive');
  if ((order.type === 'limit' || order.type === 'stop_limit') && !(order.limitPrice && order.limitPrice > 0)) return reject('limit price required');
  if ((order.type === 'stop' || order.type === 'stop_limit') && !(order.stopPrice && order.stopPrice > 0)) return reject('stop price required');

  const price = prices[order.symbol];
  const pos = acc.positions[order.symbol];
  const posQty = pos?.qty ?? 0;
  const opensOrIncreases = !order.reduceOnly && Math.sign(posQty) !== (order.side === 'buy' ? -1 : 1);
  const closingQty = order.reduceOnly ? Math.min(order.qty, Math.abs(posQty)) : Math.sign(posQty) === (order.side === 'buy' ? -1 : 1) ? Math.min(order.qty, Math.abs(posQty)) : 0;
  const openingQty = order.qty - closingQty;

  if (order.reduceOnly && closingQty <= 0) return reject('nothing to reduce');
  if (openingQty > 0 && order.side === 'sell' && !acc.settings.allowShort) return reject('short selling is disabled in settings');
  if (openingQty > 0 && price) {
    const ref = order.type === 'limit' || order.type === 'stop_limit' ? order.limitPrice! : order.type === 'stop' ? order.stopPrice! : price;
    const notional = openingQty * ref;
    const bp = buyingPower(acc, prices);
    if (notional > bp + 1e-6) return reject(`insufficient buying power (need ${notional.toFixed(2)}, have ${bp.toFixed(2)})`);
  }
  // sanity on stop/limit placement relative to price
  if (price && order.type === 'stop') {
    if (order.side === 'buy' && order.stopPrice! <= price) return reject('a buy stop must be above the current price');
    if (order.side === 'sell' && order.stopPrice! >= price) return reject('a sell stop must be below the current price');
  }
  if (price && order.bracket && opensOrIncreases) {
    const entryRef = order.type === 'market' ? price : order.type === 'stop' ? order.stopPrice! : order.limitPrice!;
    const { takeProfit, stopLoss } = order.bracket;
    if (order.side === 'buy') {
      if (takeProfit !== undefined && takeProfit <= entryRef) return reject('take profit must be above entry for a long');
      if (stopLoss !== undefined && stopLoss >= entryRef) return reject('stop loss must be below entry for a long');
    } else {
      if (takeProfit !== undefined && takeProfit >= entryRef) return reject('take profit must be below entry for a short');
      if (stopLoss !== undefined && stopLoss <= entryRef) return reject('stop loss must be above entry for a short');
    }
  }
  return { acc: { ...acc, orders: [...acc.orders, order] }, order };
}

export function cancelOrder(acc: AccountState, orderId: string, time: number): AccountState {
  const o = acc.orders.find((x) => x.id === orderId);
  if (!o || o.status !== 'working') return acc;
  let next = { ...acc, orders: acc.orders.map((x) => (x.id === orderId ? { ...x, status: 'cancelled' as const } : x)) };
  next = pushEvent(next, event('cancel', time, `Cancelled ${o.side} ${o.qty} ${o.symbol} ${o.type}`));
  // unlink from position
  const pos = next.positions[o.symbol];
  if (pos && (pos.tpOrderId === orderId || pos.slOrderId === orderId)) {
    next = { ...next, positions: { ...next.positions, [o.symbol]: { ...pos, tpOrderId: pos.tpOrderId === orderId ? undefined : pos.tpOrderId, slOrderId: pos.slOrderId === orderId ? undefined : pos.slOrderId } } };
  }
  return next;
}

export function cancelAll(acc: AccountState, time: number, symbol?: string): AccountState {
  let next = acc;
  for (const o of acc.orders) if (o.status === 'working' && (!symbol || o.symbol === symbol)) next = cancelOrder(next, o.id, time);
  return next;
}

/** Update the stop-loss or take-profit attached to a position (creates one if missing). */
export function setPositionExit(acc: AccountState, symbol: string, kind: 'stop_loss' | 'take_profit', price: number | null, time: number, prices: PriceMap): AccountState {
  const pos = acc.positions[symbol];
  if (!pos) return acc;
  const existing = kind === 'stop_loss' ? pos.slOrderId : pos.tpOrderId;
  let next = existing ? cancelOrder(acc, existing, time) : acc;
  if (price === null) return next;
  const side: Side = pos.qty > 0 ? 'sell' : 'buy';
  const res = placeOrder(
    next,
    { symbol, side, qty: Math.abs(pos.qty), type: kind === 'stop_loss' ? 'stop' : 'limit', stopPrice: kind === 'stop_loss' ? price : undefined, limitPrice: kind === 'take_profit' ? price : undefined, reduceOnly: true, role: kind },
    time,
    prices,
  );
  next = res.acc;
  if (res.order.status !== 'working') return next;
  const p = next.positions[symbol];
  const otherId = kind === 'stop_loss' ? p.tpOrderId : p.slOrderId;
  const updated: Position = { ...p, [kind === 'stop_loss' ? 'slOrderId' : 'tpOrderId']: res.order.id, ...(kind === 'stop_loss' && p.initialStop === undefined ? { initialStop: price, initialRiskPerUnit: Math.abs(p.avgPrice - price) } : {}) };
  next = { ...next, positions: { ...next.positions, [symbol]: updated } };
  // link OCO both ways
  next = { ...next, orders: next.orders.map((o) => (o.id === res.order.id ? { ...o, ocoId: otherId } : otherId && o.id === otherId ? { ...o, ocoId: res.order.id } : o)) };
  return next;
}

interface TickContext {
  symbol: string;
  /** current traded price */
  price: number;
  /** price range seen since the last evaluation (for bar-based matching of inactive symbols) */
  high: number;
  low: number;
  time: number;
  isNewDay?: boolean;
  /**
   * True when price jumped here without trading in between (a session gap). Stops fill
   * at the gapped price rather than at their trigger.
   */
  gapped?: boolean;
}

/**
 * Evaluate all working orders for a symbol against a price event, fill what triggers,
 * update positions, and record trades.
 */
export function processTick(acc: AccountState, ctx: TickContext): AccountState {
  let next = acc;
  const s = next.settings;
  const slip = (side: Side, p: number) => p * (1 + (side === 'buy' ? 1 : -1) * (s.slippageBps / 10000));

  // DAY orders expire at the new day
  if (ctx.isNewDay) {
    for (const o of next.orders) if (o.status === 'working' && o.tif === 'DAY' && o.symbol === ctx.symbol && o.role === 'entry') next = cancelOrder(next, o.id, ctx.time);
  }

  // Fill in a stable order: stops before limits (a stop hit on the same bar as a limit is the pessimistic case)
  const working = next.orders.filter((o) => o.status === 'working' && o.symbol === ctx.symbol);
  const prio = (o: Order) => (o.type === 'market' ? 0 : o.type === 'stop' ? 1 : o.type === 'stop_limit' ? 2 : 3);
  working.sort((a, b) => prio(a) - prio(b));

  for (const o0 of working) {
    const o = next.orders.find((x) => x.id === o0.id);
    if (!o || o.status !== 'working') continue;
    let fillPrice: number | null = null;
    switch (o.type) {
      case 'market':
        fillPrice = slip(o.side, ctx.price);
        break;
      /**
       * A resting limit order fills AT its limit price, never better.
       * The price series here is a continuous path, so if the range reaches the limit
       * the market traded through it and the order would have been filled on the way.
       * Awarding the extreme of the range instead would silently flatter every result.
       * No slippage is applied: a limit order is precisely a refusal to accept slippage.
       */
      case 'limit':
        if (o.side === 'buy' && ctx.low <= o.limitPrice!) fillPrice = o.limitPrice!;
        if (o.side === 'sell' && ctx.high >= o.limitPrice!) fillPrice = o.limitPrice!;
        break;
      /**
       * A stop becomes a market order at the trigger, so it fills at the trigger plus
       * ordinary slippage. Price moves continuously through the trigger, so filling at
       * the extreme of the range instead would charge the learner for a gap that never
       * happened and would push every stopped-out trade well past -1R — corrupting the
       * single number the risk module is built on.
       *
       * A real gap is different: when the session opens beyond the stop, no trade was
       * possible in between, so the fill happens at the gapped price however bad it is.
       * That is the lesson stops are genuinely supposed to teach.
       */
      case 'stop': {
        const triggered = o.side === 'buy' ? ctx.high >= o.stopPrice! : ctx.low <= o.stopPrice!;
        if (!triggered) break;
        if (ctx.gapped) {
          // worse of the trigger and the price the market actually reopened at
          fillPrice = o.side === 'buy' ? Math.max(o.stopPrice!, ctx.price) : Math.min(o.stopPrice!, ctx.price);
        } else {
          fillPrice = slip(o.side, o.stopPrice!);
        }
        break;
      }
      case 'stop_limit': {
        if (!o.triggered) {
          const hit = (o.side === 'buy' && ctx.high >= o.stopPrice!) || (o.side === 'sell' && ctx.low <= o.stopPrice!);
          if (hit) next = { ...next, orders: next.orders.map((x) => (x.id === o.id ? { ...x, triggered: true } : x)) };
          else break;
        }
        if (o.side === 'buy' && ctx.price <= o.limitPrice!) fillPrice = ctx.price;
        if (o.side === 'sell' && ctx.price >= o.limitPrice!) fillPrice = ctx.price;
        break;
      }
    }
    if (fillPrice === null) continue;
    next = applyFill(next, o, fillPrice, ctx.time);
  }

  // margin check
  return next;
}

function applyFill(acc: AccountState, order: Order, price: number, time: number, feeOverride?: number): AccountState {
  const s = acc.settings;
  let next = acc;
  const pos = next.positions[order.symbol];
  let qty = order.qty;
  if (order.reduceOnly) {
    qty = Math.min(qty, Math.abs(pos?.qty ?? 0));
    if (qty <= 0) return cancelOrder(next, order.id, time);
  }
  const posQty0 = pos?.qty ?? 0;
  const dir = order.side === 'buy' ? 1 : -1;
  if (posQty0 !== 0 && Math.sign(posQty0) !== dir && qty > Math.abs(posQty0) + 1e-9) {
    // A flip: close the existing position first, then open the remainder in the new direction.
    const closePart: Order = { ...order, qty: Math.abs(posQty0), reduceOnly: true };
    const openPart: Order = { ...order, qty: qty - Math.abs(posQty0), reduceOnly: false };
    next = applyFill(next, closePart, price, time, feeOverride);
    return applyFill(next, openPart, price, time, 0);
  }
  const fee = feeOverride ?? s.commissionPerOrder;
  const signed = order.side === 'buy' ? qty : -qty;
  const fill: Fill = { id: newId('f'), orderId: order.id, symbol: order.symbol, side: order.side, qty, price, time, fee, role: order.role };

  next = {
    ...next,
    cash: next.cash - signed * price - fee,
    fills: [...next.fills, fill],
    orders: next.orders.map((o) => (o.id === order.id ? { ...o, status: 'filled' as const, filledAt: time, fillPrice: price } : o)),
  };
  next = pushEvent(next, event('fill', time, `${order.side === 'buy' ? 'Bought' : 'Sold'} ${qty} ${order.symbol} @ ${price.toFixed(4).replace(/\.?0+$/, '')}${order.role && order.role !== 'entry' ? ` (${order.role.replace('_', ' ')})` : ''}`));

  // --- position accounting ---
  const cur = next.positions[order.symbol];
  const curQty = cur?.qty ?? 0;
  const sameDir = curQty === 0 || Math.sign(curQty) === Math.sign(signed);

  if (sameDir) {
    // open or add
    const newQty = curQty + signed;
    const avg = curQty === 0 ? price : (cur!.avgPrice * Math.abs(curQty) + price * qty) / Math.abs(newQty);
    const p: Position = cur
      ? { ...cur, qty: newQty, avgPrice: avg, fees: cur.fees + fee, maxQty: Math.max(cur.maxQty, Math.abs(newQty)), entryValue: cur.entryValue + price * qty, entryQtyTotal: cur.entryQtyTotal + qty }
      : { symbol: order.symbol, qty: newQty, avgPrice: avg, openedAt: time, exitQty: 0, exitValue: 0, fees: fee, maxQty: Math.abs(newQty), entryValue: price * qty, entryQtyTotal: qty, note: order.note };
    if (order.bracket?.stopLoss !== undefined && p.initialStop === undefined) {
      p.initialStop = order.bracket.stopLoss;
      p.initialRiskPerUnit = Math.abs(avg - order.bracket.stopLoss);
    }
    next = { ...next, positions: { ...next.positions, [order.symbol]: p } };
    // place bracket legs
    if (order.bracket) {
      const prices = { [order.symbol]: price };
      if (order.bracket.stopLoss !== undefined) next = setPositionExit(next, order.symbol, 'stop_loss', order.bracket.stopLoss, time, prices);
      if (order.bracket.takeProfit !== undefined) next = setPositionExit(next, order.symbol, 'take_profit', order.bracket.takeProfit, time, prices);
    } else if (cur && (cur.tpOrderId || cur.slOrderId)) {
      // resize existing exits to the new quantity
      next = resizeExits(next, order.symbol);
    }
  } else {
    // reduce or close (flips were split above)
    const closeQty = Math.min(qty, Math.abs(curQty));
    const p: Position = { ...cur!, qty: curQty + Math.sign(signed) * closeQty, exitQty: cur!.exitQty + closeQty, exitValue: cur!.exitValue + price * closeQty, fees: cur!.fees + fee };
    if (Math.abs(p.qty) < 1e-9) {
      // round trip complete
      const entryAvg = p.entryValue / p.entryQtyTotal;
      const exitAvg = p.exitValue / p.exitQty;
      const direction = curQty > 0 ? 'long' : 'short';
      const totalPnl = (exitAvg - entryAvg) * p.exitQty * (direction === 'long' ? 1 : -1);
      const initialRisk = p.initialRiskPerUnit ? p.initialRiskPerUnit * p.maxQty : undefined;
      const exitReason: Trade['exitReason'] = order.role === 'stop_loss' ? 'stop_loss' : order.role === 'take_profit' ? 'take_profit' : order.role === 'liquidation' ? 'liquidation' : 'manual';
      const trade: Trade = {
        id: newId('t'),
        symbol: order.symbol,
        direction,
        qty: p.maxQty,
        entryPrice: entryAvg,
        exitPrice: exitAvg,
        entryTime: p.openedAt,
        exitTime: time,
        pnl: totalPnl - p.fees,
        fees: p.fees,
        initialRisk,
        rMultiple: initialRisk && initialRisk > 0 ? (totalPnl - p.fees) / initialRisk : undefined,
        exitReason,
        tags: [],
        notes: '',
        plan: p.note,
      };
      const positions = { ...next.positions };
      delete positions[order.symbol];
      next = { ...next, positions, trades: [...next.trades, trade] };
      // cancel the sibling exit order(s)
      for (const id of [p.tpOrderId, p.slOrderId]) if (id && id !== order.id) next = cancelOrder(next, id, time);
    } else {
      next = { ...next, positions: { ...next.positions, [order.symbol]: p } };
      next = resizeExits(next, order.symbol);
    }
  }
  return next;
}

/** Keep exit orders sized to the live position. */
function resizeExits(acc: AccountState, symbol: string): AccountState {
  const pos = acc.positions[symbol];
  if (!pos) return acc;
  const q = Math.abs(pos.qty);
  return { ...acc, orders: acc.orders.map((o) => (o.status === 'working' && o.reduceOnly && o.symbol === symbol ? { ...o, qty: q } : o)) };
}

/** Liquidate everything at market when equity falls below maintenance. */
export function checkMargin(acc: AccountState, prices: PriceMap, time: number): AccountState {
  const eq = equity(acc, prices);
  const gross = grossExposure(acc, prices);
  if (gross === 0 || eq >= gross * acc.settings.maintenanceMargin) return acc;
  let next = cancelAll(acc, time);
  next = pushEvent(next, event('margin_call', time, `MARGIN CALL: equity ${eq.toFixed(0)} below maintenance on ${gross.toFixed(0)} exposure. All positions liquidated.`));
  for (const p of Object.values(next.positions)) {
    const side: Side = p.qty > 0 ? 'sell' : 'buy';
    const o: Order = { id: newId('o'), symbol: p.symbol, side, qty: Math.abs(p.qty), type: 'market', status: 'working', tif: 'GTC', createdAt: time, reduceOnly: true, role: 'liquidation' };
    next = { ...next, orders: [...next.orders, o] };
    next = applyFill(next, o, prices[p.symbol] ?? p.avgPrice, time);
  }
  return next;
}

/** Append an equity point (downsampled to stay small). */
export function recordEquity(acc: AccountState, prices: PriceMap, time: number): AccountState {
  const eq = equity(acc, prices);
  const last = acc.equityCurve[acc.equityCurve.length - 1];
  if (last && last.time === time) return acc;
  if (last && Math.abs(last.equity - eq) < 1e-9 && Object.keys(acc.positions).length === 0) return acc;
  let curve = [...acc.equityCurve, { time, equity: eq }];
  if (curve.length > 4000) curve = curve.filter((_, i) => i % 2 === 0 || i === curve.length - 1);
  return { ...acc, equityCurve: curve, peakEquity: Math.max(acc.peakEquity, eq) };
}

export function closePosition(acc: AccountState, symbol: string, time: number, prices: PriceMap, qty?: number): AccountState {
  const pos = acc.positions[symbol];
  if (!pos) return acc;
  const q = qty ?? Math.abs(pos.qty);
  const res = placeOrder(acc, { symbol, side: pos.qty > 0 ? 'sell' : 'buy', qty: q, type: 'market', reduceOnly: true, role: 'exit' }, time, prices);
  return res.acc;
}

export function updateTrade(acc: AccountState, tradeId: string, patch: Partial<Pick<Trade, 'tags' | 'notes' | 'mistakes'>>): AccountState {
  return { ...acc, trades: acc.trades.map((t) => (t.id === tradeId ? { ...t, ...patch } : t)) };
}
