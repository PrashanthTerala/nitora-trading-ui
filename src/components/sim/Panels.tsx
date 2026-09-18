import { useMemo, useState } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { useSim, specOf } from '@/store/sim';
import { unrealized } from '@/engine/broker/broker';
import { fmtMoney } from './OrderTicket';
import type { AccountState } from '@/engine/broker/types';

export function PositionsPanel({ prices }: { prices: Record<string, number> }) {
  const account = useSim((s) => s.account);
  const closePosition = useSim((s) => s.closePosition);
  const setExit = useSim((s) => s.setExit);
  const setSymbol = useSim((s) => s.setSymbol);
  const positions = Object.values(account.positions);
  const [editing, setEditing] = useState<{ symbol: string; kind: 'stop_loss' | 'take_profit'; value: string } | null>(null);

  if (positions.length === 0) return <Empty text="No open positions. Place an order to begin." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-panel text-left text-[10px] uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-3 py-2">Symbol</th>
            <th className="px-2 py-2">Side</th>
            <th className="px-2 py-2 text-right">Qty</th>
            <th className="px-2 py-2 text-right">Avg</th>
            <th className="px-2 py-2 text-right">Last</th>
            <th className="px-2 py-2 text-right">Open P&L</th>
            <th className="px-2 py-2 text-right">Stop</th>
            <th className="px-2 py-2 text-right">Target</th>
            <th className="px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const dp = specOf(p.symbol)?.decimals ?? 2;
            const last = prices[p.symbol] ?? p.avgPrice;
            const pnl = unrealized(p, last);
            const pct = p.avgPrice !== 0 ? (pnl / (Math.abs(p.qty) * p.avgPrice)) * 100 : 0;
            const slOrder = account.orders.find((o) => o.id === p.slOrderId && o.status === 'working');
            const tpOrder = account.orders.find((o) => o.id === p.tpOrderId && o.status === 'working');
            const rNow = p.initialRiskPerUnit && p.initialRiskPerUnit > 0 ? pnl / (p.initialRiskPerUnit * Math.abs(p.qty)) : null;
            return (
              <tr key={p.symbol} className="border-t border-line hover:bg-panel/60">
                <td className="px-3 py-2">
                  <button type="button" className="font-mono font-bold hover:text-accent" onClick={() => setSymbol(p.symbol)}>
                    {p.symbol}
                  </button>
                </td>
                <td className="px-2 py-2">
                  <span className={`inline-flex items-center gap-1 font-semibold ${p.qty > 0 ? 'text-up' : 'text-down'}`}>
                    {p.qty > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {p.qty > 0 ? 'Long' : 'Short'}
                  </span>
                </td>
                <td className="px-2 py-2 text-right font-mono">{Math.abs(p.qty)}</td>
                <td className="px-2 py-2 text-right font-mono">{p.avgPrice.toFixed(dp)}</td>
                <td className="px-2 py-2 text-right font-mono">{last.toFixed(dp)}</td>
                <td className={`px-2 py-2 text-right font-mono font-bold ${pnl >= 0 ? 'text-up' : 'text-down'}`}>
                  {pnl >= 0 ? '+' : ''}
                  {fmtMoney(pnl)}
                  <span className="block text-[10px] font-normal opacity-70">
                    {pct >= 0 ? '+' : ''}
                    {pct.toFixed(2)}%{rNow !== null && ` · ${rNow >= 0 ? '+' : ''}${rNow.toFixed(2)}R`}
                  </span>
                </td>
                <PriceCell
                  order={slOrder?.stopPrice}
                  dp={dp}
                  tone="down"
                  editing={editing?.symbol === p.symbol && editing.kind === 'stop_loss' ? editing.value : null}
                  onStart={() => setEditing({ symbol: p.symbol, kind: 'stop_loss', value: String(slOrder?.stopPrice ?? last.toFixed(dp)) })}
                  onChange={(v) => setEditing((e) => (e ? { ...e, value: v } : e))}
                  onCommit={() => {
                    if (editing) setExit(p.symbol, 'stop_loss', editing.value === '' ? null : parseFloat(editing.value));
                    setEditing(null);
                  }}
                />
                <PriceCell
                  order={tpOrder?.limitPrice}
                  dp={dp}
                  tone="up"
                  editing={editing?.symbol === p.symbol && editing.kind === 'take_profit' ? editing.value : null}
                  onStart={() => setEditing({ symbol: p.symbol, kind: 'take_profit', value: String(tpOrder?.limitPrice ?? last.toFixed(dp)) })}
                  onChange={(v) => setEditing((e) => (e ? { ...e, value: v } : e))}
                  onCommit={() => {
                    if (editing) setExit(p.symbol, 'take_profit', editing.value === '' ? null : parseFloat(editing.value));
                    setEditing(null);
                  }}
                />
                <td className="px-2 py-2 text-right">
                  <button type="button" onClick={() => closePosition(p.symbol)} className="rounded border border-line px-2 py-0.5 text-[11px] font-semibold hover:border-down hover:text-down">
                    Close
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PriceCell({
  order,
  dp,
  tone,
  editing,
  onStart,
  onChange,
  onCommit,
}: {
  order?: number;
  dp: number;
  tone: 'up' | 'down';
  editing: string | null;
  onStart: () => void;
  onChange: (v: string) => void;
  onCommit: () => void;
}) {
  return (
    <td className="px-2 py-2 text-right">
      {editing !== null ? (
        <input
          autoFocus
          value={editing}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCommit();
            if (e.key === 'Escape') onChange('');
          }}
          className="w-20 rounded border border-accent bg-surface px-1 py-0.5 text-right font-mono text-xs"
        />
      ) : (
        <button type="button" onClick={onStart} className={`font-mono hover:underline ${order ? (tone === 'up' ? 'text-up' : 'text-down') : 'text-ink-soft'}`}>
          {order ? order.toFixed(dp) : 'set'}
        </button>
      )}
    </td>
  );
}

export function OrdersPanel() {
  const account = useSim((s) => s.account);
  const cancelOrder = useSim((s) => s.cancelOrder);
  const working = account.orders.filter((o) => o.status === 'working');
  if (working.length === 0) return <Empty text="No working orders. Limit and stop orders wait here until price reaches them." />;
  return (
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-panel text-left text-[10px] uppercase tracking-wide text-ink-soft">
        <tr>
          <th className="px-3 py-2">Symbol</th>
          <th className="px-2 py-2">Side</th>
          <th className="px-2 py-2">Type</th>
          <th className="px-2 py-2 text-right">Qty</th>
          <th className="px-2 py-2 text-right">Trigger</th>
          <th className="px-2 py-2 text-right">Limit</th>
          <th className="px-2 py-2">TIF</th>
          <th className="px-2 py-2" />
        </tr>
      </thead>
      <tbody>
        {working.map((o) => {
          const dp = specOf(o.symbol)?.decimals ?? 2;
          return (
            <tr key={o.id} className="border-t border-line">
              <td className="px-3 py-2 font-mono font-bold">{o.symbol}</td>
              <td className={`px-2 py-2 font-semibold ${o.side === 'buy' ? 'text-up' : 'text-down'}`}>{o.side}</td>
              <td className="px-2 py-2">
                {o.type.replace('_', '-')}
                {o.role && o.role !== 'entry' && <span className="ml-1 chip text-[9px]">{o.role.replace('_', ' ')}</span>}
              </td>
              <td className="px-2 py-2 text-right font-mono">{o.qty}</td>
              <td className="px-2 py-2 text-right font-mono">{o.stopPrice?.toFixed(dp) ?? '—'}</td>
              <td className="px-2 py-2 text-right font-mono">{o.limitPrice?.toFixed(dp) ?? '—'}</td>
              <td className="px-2 py-2 text-ink-soft">{o.tif}</td>
              <td className="px-2 py-2 text-right">
                <button type="button" onClick={() => cancelOrder(o.id)} className="rounded p-1 text-ink-soft hover:text-down" title="Cancel">
                  <X size={13} />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function HistoryPanel() {
  const account = useSim((s) => s.account);
  const trades = [...account.trades].reverse().slice(0, 100);
  if (trades.length === 0) return <Empty text="Closed trades appear here, and in the Journal with full statistics." />;
  return (
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-panel text-left text-[10px] uppercase tracking-wide text-ink-soft">
        <tr>
          <th className="px-3 py-2">Symbol</th>
          <th className="px-2 py-2">Side</th>
          <th className="px-2 py-2 text-right">Qty</th>
          <th className="px-2 py-2 text-right">Entry</th>
          <th className="px-2 py-2 text-right">Exit</th>
          <th className="px-2 py-2 text-right">P&L</th>
          <th className="px-2 py-2 text-right">R</th>
          <th className="px-2 py-2">Reason</th>
        </tr>
      </thead>
      <tbody>
        {trades.map((t) => {
          const dp = specOf(t.symbol)?.decimals ?? 2;
          return (
            <tr key={t.id} className="border-t border-line">
              <td className="px-3 py-2 font-mono font-bold">{t.symbol}</td>
              <td className={`px-2 py-2 font-semibold ${t.direction === 'long' ? 'text-up' : 'text-down'}`}>{t.direction}</td>
              <td className="px-2 py-2 text-right font-mono">{t.qty}</td>
              <td className="px-2 py-2 text-right font-mono">{t.entryPrice.toFixed(dp)}</td>
              <td className="px-2 py-2 text-right font-mono">{t.exitPrice.toFixed(dp)}</td>
              <td className={`px-2 py-2 text-right font-mono font-bold ${t.pnl >= 0 ? 'text-up' : 'text-down'}`}>
                {t.pnl >= 0 ? '+' : ''}
                {fmtMoney(t.pnl)}
              </td>
              <td className={`px-2 py-2 text-right font-mono ${(t.rMultiple ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>{t.rMultiple !== undefined ? `${t.rMultiple >= 0 ? '+' : ''}${t.rMultiple.toFixed(2)}` : '—'}</td>
              <td className="px-2 py-2 text-ink-soft">{(t.exitReason ?? 'manual').replace('_', ' ')}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function EventsPanel() {
  const account = useSim((s) => s.account);
  const events = [...account.events].reverse().slice(0, 80);
  if (events.length === 0) return <Empty text="Fills, rejections and margin calls are logged here." />;
  return (
    <ul className="divide-y divide-line text-xs">
      {events.map((e) => (
        <li key={e.id} className="flex items-start gap-2 px-3 py-1.5">
          <span
            className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${e.kind === 'fill' ? 'bg-accent' : e.kind === 'reject' ? 'bg-down' : e.kind === 'margin_call' ? 'bg-down' : 'bg-ink-soft'}`}
          />
          <span className={e.kind === 'margin_call' ? 'font-bold text-down' : e.kind === 'reject' ? 'text-down' : ''}>{e.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function AccountBar({ prices, account }: { prices: Record<string, number>; account: AccountState }) {
  const stats = useMemo(() => {
    let eq = account.cash;
    let open = 0;
    let gross = 0;
    for (const p of Object.values(account.positions)) {
      const last = prices[p.symbol] ?? p.avgPrice;
      eq += p.qty * last;
      open += unrealized(p, last);
      gross += Math.abs(p.qty * last);
    }
    const start = account.settings.startingCash;
    const dd = account.peakEquity > 0 ? ((account.peakEquity - eq) / account.peakEquity) * 100 : 0;
    return { eq, open, gross, pnl: eq - start, pnlPct: ((eq - start) / start) * 100, dd, used: gross / (eq * account.settings.leverage || 1) };
  }, [account, prices]);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
      <Metric label="Equity" value={`$${fmtMoney(stats.eq)}`} strong />
      <Metric label="Cash" value={`$${fmtMoney(account.cash)}`} />
      <Metric label="Open P&L" value={`${stats.open >= 0 ? '+' : ''}${fmtMoney(stats.open)}`} tone={stats.open >= 0 ? 'up' : 'down'} />
      <Metric label="Total P&L" value={`${stats.pnl >= 0 ? '+' : ''}${fmtMoney(stats.pnl)} (${stats.pnlPct >= 0 ? '+' : ''}${stats.pnlPct.toFixed(2)}%)`} tone={stats.pnl >= 0 ? 'up' : 'down'} />
      <Metric label="Exposure" value={`$${fmtMoney(stats.gross)}`} tone={stats.used > 0.9 ? 'down' : undefined} />
      <Metric label="Drawdown" value={`${stats.dd.toFixed(1)}%`} tone={stats.dd > 20 ? 'down' : stats.dd > 10 ? 'warn' : undefined} />
      <Metric label="Trades" value={String(account.trades.length)} />
    </div>
  );
}

function Metric({ label, value, tone, strong }: { label: string; value: string; tone?: 'up' | 'down' | 'warn'; strong?: boolean }) {
  const cls = tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : tone === 'warn' ? 'text-warn' : 'text-ink';
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-[10px] uppercase tracking-wide text-ink-soft">{label}</span>
      <span className={`font-mono ${strong ? 'text-sm font-bold' : 'font-semibold'} ${cls}`}>{value}</span>
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-4 py-8 text-center text-xs text-ink-soft">{text}</p>;
}
