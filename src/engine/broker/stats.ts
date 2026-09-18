import type { Trade } from './types';

export interface TradeStats {
  count: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  netPnl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  expectancy: number; // $ per trade
  avgR: number | null;
  expectancyR: number | null;
  bestTrade: number;
  worstTrade: number;
  longestWinStreak: number;
  longestLossStreak: number;
  avgHoldMinutes: number;
  byExitReason: Record<string, number>;
  bySymbol: Record<string, { count: number; pnl: number }>;
  byDirection: Record<'long' | 'short', { count: number; pnl: number; wins: number }>;
}

export function computeStats(trades: Trade[]): TradeStats {
  const count = trades.length;
  const winsArr = trades.filter((t) => t.pnl > 0);
  const lossArr = trades.filter((t) => t.pnl < 0);
  const grossProfit = winsArr.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(lossArr.reduce((s, t) => s + t.pnl, 0));
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const rTrades = trades.filter((t) => t.rMultiple !== undefined);
  let lw = 0;
  let ll = 0;
  let cw = 0;
  let cl = 0;
  for (const t of trades) {
    if (t.pnl > 0) {
      cw++;
      cl = 0;
    } else if (t.pnl < 0) {
      cl++;
      cw = 0;
    }
    lw = Math.max(lw, cw);
    ll = Math.max(ll, cl);
  }
  const byExitReason: Record<string, number> = {};
  const bySymbol: Record<string, { count: number; pnl: number }> = {};
  const byDirection = { long: { count: 0, pnl: 0, wins: 0 }, short: { count: 0, pnl: 0, wins: 0 } };
  for (const t of trades) {
    byExitReason[t.exitReason ?? 'manual'] = (byExitReason[t.exitReason ?? 'manual'] ?? 0) + 1;
    bySymbol[t.symbol] = { count: (bySymbol[t.symbol]?.count ?? 0) + 1, pnl: (bySymbol[t.symbol]?.pnl ?? 0) + t.pnl };
    byDirection[t.direction].count++;
    byDirection[t.direction].pnl += t.pnl;
    if (t.pnl > 0) byDirection[t.direction].wins++;
  }
  return {
    count,
    wins: winsArr.length,
    losses: lossArr.length,
    breakeven: count - winsArr.length - lossArr.length,
    winRate: count ? winsArr.length / count : 0,
    grossProfit,
    grossLoss,
    netPnl,
    avgWin: winsArr.length ? grossProfit / winsArr.length : 0,
    avgLoss: lossArr.length ? grossLoss / lossArr.length : 0,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    expectancy: count ? netPnl / count : 0,
    avgR: rTrades.length ? rTrades.reduce((s, t) => s + (t.rMultiple ?? 0), 0) / rTrades.length : null,
    expectancyR: rTrades.length ? rTrades.reduce((s, t) => s + (t.rMultiple ?? 0), 0) / rTrades.length : null,
    bestTrade: count ? Math.max(...trades.map((t) => t.pnl)) : 0,
    worstTrade: count ? Math.min(...trades.map((t) => t.pnl)) : 0,
    longestWinStreak: lw,
    longestLossStreak: ll,
    avgHoldMinutes: count ? trades.reduce((s, t) => s + (t.exitTime - t.entryTime) / 60, 0) / count : 0,
    byExitReason,
    bySymbol,
    byDirection,
  };
}

export function maxDrawdown(curve: { equity: number }[]) {
  let peak = -Infinity;
  let maxDd = 0;
  let maxDdPct = 0;
  for (const p of curve) {
    peak = Math.max(peak, p.equity);
    const dd = peak - p.equity;
    if (dd > maxDd) {
      maxDd = dd;
      maxDdPct = peak > 0 ? dd / peak : 0;
    }
  }
  return { maxDd, maxDdPct };
}

/** Simple Sharpe-like ratio on per-trade returns in R (no risk-free rate). */
export function sharpeLike(trades: Trade[]) {
  const rs = trades.map((t) => t.rMultiple).filter((r): r is number => r !== undefined);
  if (rs.length < 2) return null;
  const mean = rs.reduce((s, r) => s + r, 0) / rs.length;
  const variance = rs.reduce((s, r) => s + (r - mean) ** 2, 0) / (rs.length - 1);
  const sd = Math.sqrt(variance);
  return sd > 0 ? mean / sd : null;
}
