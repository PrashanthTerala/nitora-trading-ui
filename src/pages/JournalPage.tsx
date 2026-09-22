import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { NotebookPen, Download, TrendingUp, Info } from 'lucide-react';
import { useSim, specOf } from '@/store/sim';
import { computeStats, maxDrawdown, sharpeLike } from '@/engine/broker/stats';
import { fmtMoney } from '@/components/sim/OrderTicket';
import type { Trade } from '@/engine/broker/types';
import { toCsv } from '@/lib/csv';

const SETUP_TAGS = ['trend pullback', 'breakout', 'range fade', 'reversal', 'momentum', 'news', 'other'];
const MISTAKE_TAGS = ['no plan', 'moved my stop', 'chased entry', 'oversized', 'exited early', 'revenge trade', 'ignored trend', 'no stop'];

export function JournalPage() {
  const account = useSim((s) => s.account);
  const updateTrade = useSim((s) => s.updateTrade);
  const trades = account.trades;
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses' | 'tagged' | 'untagged'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const stats = useMemo(() => computeStats(trades), [trades]);
  const dd = useMemo(() => maxDrawdown(account.equityCurve), [account.equityCurve]);
  const sharpe = useMemo(() => sharpeLike(trades), [trades]);

  const filtered = useMemo(() => {
    const list = [...trades].reverse();
    switch (filter) {
      case 'wins':
        return list.filter((t) => t.pnl > 0);
      case 'losses':
        return list.filter((t) => t.pnl < 0);
      case 'tagged':
        return list.filter((t) => t.tags.length > 0 || (t.mistakes?.length ?? 0) > 0);
      case 'untagged':
        return list.filter((t) => t.tags.length === 0 && (t.mistakes?.length ?? 0) === 0);
      default:
        return list;
    }
  }, [trades, filter]);

  const mistakeCost = useMemo(() => {
    const m: Record<string, { count: number; pnl: number }> = {};
    for (const t of trades)
      for (const k of t.mistakes ?? []) {
        m[k] = { count: (m[k]?.count ?? 0) + 1, pnl: (m[k]?.pnl ?? 0) + t.pnl };
      }
    return Object.entries(m).sort((a, b) => a[1].pnl - b[1].pnl);
  }, [trades]);

  const setupPerf = useMemo(() => {
    const m: Record<string, { count: number; pnl: number; wins: number; r: number; rCount: number }> = {};
    for (const t of trades)
      for (const k of t.tags) {
        const e = m[k] ?? { count: 0, pnl: 0, wins: 0, r: 0, rCount: 0 };
        e.count++;
        e.pnl += t.pnl;
        if (t.pnl > 0) e.wins++;
        if (t.rMultiple !== undefined) {
          e.r += t.rMultiple;
          e.rCount++;
        }
        m[k] = e;
      }
    return Object.entries(m).sort((a, b) => b[1].pnl - a[1].pnl);
  }, [trades]);

  const exportCsv = () => {
    // prettier-ignore
    const head = ['id', 'symbol', 'direction', 'qty', 'entryPrice', 'exitPrice', 'entryTime', 'exitTime', 'pnl', 'fees', 'rMultiple', 'exitReason', 'tags', 'mistakes', 'notes'];
    const rows = trades.map((t) => [
        t.id,
        t.symbol,
        t.direction,
        t.qty,
        t.entryPrice,
        t.exitPrice,
        new Date(t.entryTime * 1000).toISOString(),
        new Date(t.exitTime * 1000).toISOString(),
        t.pnl.toFixed(2),
        t.fees.toFixed(2),
        t.rMultiple?.toFixed(3) ?? '',
        t.exitReason ?? '',
        t.tags.join('; '),
        (t.mistakes ?? []).join('; '),
        t.notes,
      ]);
    const blob = new Blob([toCsv(head, rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nitora-trading-journal.csv';
    // Some browsers ignore a click on an anchor that is not in the document, and revoking
    // the URL in the same tick can cancel the download before it starts.
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (trades.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <NotebookPen size={40} className="mx-auto text-ink-soft" />
        <h1 className="mt-4 text-2xl font-bold">Your journal is empty</h1>
        <p className="mt-2 text-ink-soft">
          Every trade you close in the simulator lands here automatically, with its R-multiple, exit reason and duration. Then you tag the setup and any mistake, and the statistics
          tell you which of your habits pay.
        </p>
        <Link to="/simulator" className="btn-primary mt-6">
          Open the simulator
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight">
            <NotebookPen className="text-accent" /> Trading Journal
          </h1>
          <p className="mt-1 text-ink-soft">{trades.length} closed trades from the simulator.</p>
        </div>
        <button type="button" onClick={exportCsv} className="btn-ghost">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* headline metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <Metric label="Net P&L" value={`${stats.netPnl >= 0 ? '+' : ''}$${fmtMoney(stats.netPnl)}`} tone={stats.netPnl >= 0 ? 'up' : 'down'} hint="Total money made or lost after fees." />
        <Metric label="Win rate" value={`${(stats.winRate * 100).toFixed(1)}%`} hint="Share of trades that made money. High is not the same as profitable." />
        <Metric
          label="Profit factor"
          value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
          tone={stats.profitFactor >= 1.5 ? 'up' : stats.profitFactor >= 1 ? 'warn' : 'down'}
          hint="Gross profit divided by gross loss. Above 1.5 is solid, below 1 loses money."
        />
        <Metric
          label="Expectancy"
          value={`${stats.expectancy >= 0 ? '+' : ''}$${fmtMoney(stats.expectancy)}`}
          tone={stats.expectancy >= 0 ? 'up' : 'down'}
          hint="Average result per trade. This is the number that decides everything."
        />
        <Metric
          label="Average R"
          value={stats.avgR !== null ? `${stats.avgR >= 0 ? '+' : ''}${stats.avgR.toFixed(2)}R` : '—'}
          tone={stats.avgR !== null ? (stats.avgR >= 0 ? 'up' : 'down') : undefined}
          hint="Average result measured in units of initial risk. Only counts trades that had a stop."
        />
        <Metric label="Max drawdown" value={`${(dd.maxDdPct * 100).toFixed(1)}%`} tone={dd.maxDdPct > 0.2 ? 'down' : dd.maxDdPct > 0.1 ? 'warn' : undefined} hint="The deepest fall from an equity peak." />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink-soft">
            <TrendingUp size={14} /> Equity curve
          </h2>
          <EquityCurve points={account.equityCurve} start={account.settings.startingCash} />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-soft">Distribution of R</h2>
          <RHistogram trades={trades} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-soft">More statistics</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <Row label="Average win" value={`$${fmtMoney(stats.avgWin)}`} />
            <Row label="Average loss" value={`$${fmtMoney(stats.avgLoss)}`} />
            <Row label="Largest win" value={`$${fmtMoney(stats.bestTrade)}`} />
            <Row label="Largest loss" value={`$${fmtMoney(stats.worstTrade)}`} />
            <Row label="Longest win streak" value={String(stats.longestWinStreak)} />
            <Row label="Longest loss streak" value={String(stats.longestLossStreak)} />
            <Row label="Avg hold" value={fmtDuration(stats.avgHoldMinutes)} />
            <Row label="Consistency (R Sharpe)" value={sharpe !== null ? sharpe.toFixed(2) : '—'} />
            <Row label="Long trades" value={`${stats.byDirection.long.count} · $${fmtMoney(stats.byDirection.long.pnl)}`} />
            <Row label="Short trades" value={`${stats.byDirection.short.count} · $${fmtMoney(stats.byDirection.short.pnl)}`} />
            <Row label="Stopped out" value={String(stats.byExitReason.stop_loss ?? 0)} />
            <Row label="Hit target" value={String(stats.byExitReason.take_profit ?? 0)} />
            <Row label="Liquidated" value={String(stats.byExitReason.liquidation ?? 0)} />
          </dl>
        </div>

        <div className="space-y-4">
          {setupPerf.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-4">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-soft">Which setups pay</h2>
              <table className="w-full text-sm">
                <tbody>
                  {setupPerf.map(([k, v]) => (
                    <tr key={k} className="border-b border-line last:border-0">
                      <td className="py-1.5 capitalize">{k}</td>
                      <td className="py-1.5 text-right text-ink-soft">{v.count} trades</td>
                      <td className="py-1.5 text-right text-ink-soft">{((v.wins / v.count) * 100).toFixed(0)}% win</td>
                      <td className={`py-1.5 text-right font-mono font-semibold ${v.pnl >= 0 ? 'text-up' : 'text-down'}`}>
                        {v.pnl >= 0 ? '+' : ''}
                        {fmtMoney(v.pnl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {mistakeCost.length > 0 && (
            <div className="rounded-2xl border border-down/30 bg-down/5 p-4">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-down">What your mistakes cost</h2>
              <table className="w-full text-sm">
                <tbody>
                  {mistakeCost.map(([k, v]) => (
                    <tr key={k} className="border-b border-line last:border-0">
                      <td className="py-1.5 capitalize">{k}</td>
                      <td className="py-1.5 text-right text-ink-soft">{v.count}x</td>
                      <td className={`py-1.5 text-right font-mono font-semibold ${v.pnl >= 0 ? 'text-up' : 'text-down'}`}>
                        {v.pnl >= 0 ? '+' : ''}
                        {fmtMoney(v.pnl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-ink-soft">Fix the most expensive line first. One habit at a time.</p>
            </div>
          )}
        </div>
      </div>

      {/* trade list */}
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">Trades</h2>
          <div className="flex gap-1">
            {(['all', 'wins', 'losses', 'tagged', 'untagged'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={`chip capitalize ${filter === f ? 'chip-on' : ''}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-panel text-left text-[10px] uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-3 py-2">Closed</th>
                <th className="px-2 py-2">Symbol</th>
                <th className="px-2 py-2">Side</th>
                <th className="px-2 py-2 text-right">Entry</th>
                <th className="px-2 py-2 text-right">Exit</th>
                <th className="px-2 py-2 text-right">P&L</th>
                <th className="px-2 py-2 text-right">R</th>
                <th className="px-2 py-2">Exit reason</th>
                <th className="px-2 py-2">Tags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const dp = specOf(t.symbol)?.decimals ?? 2;
                const open = expanded === t.id;
                return (
                  <Fragment key={t.id}>
                    <tr onClick={() => setExpanded(open ? null : t.id)} className="cursor-pointer border-t border-line hover:bg-panel/60">
                      <td className="px-3 py-2 text-xs text-ink-soft">{new Date(t.exitTime * 1000).toUTCString().slice(5, 17)}</td>
                      <td className="px-2 py-2 font-mono font-bold">{t.symbol}</td>
                      <td className={`px-2 py-2 font-semibold ${t.direction === 'long' ? 'text-up' : 'text-down'}`}>{t.direction}</td>
                      <td className="px-2 py-2 text-right font-mono">{t.entryPrice.toFixed(dp)}</td>
                      <td className="px-2 py-2 text-right font-mono">{t.exitPrice.toFixed(dp)}</td>
                      <td className={`px-2 py-2 text-right font-mono font-bold ${t.pnl >= 0 ? 'text-up' : 'text-down'}`}>
                        {t.pnl >= 0 ? '+' : ''}
                        {fmtMoney(t.pnl)}
                      </td>
                      <td className={`px-2 py-2 text-right font-mono ${(t.rMultiple ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>
                        {t.rMultiple !== undefined ? `${t.rMultiple >= 0 ? '+' : ''}${t.rMultiple.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-2 py-2 text-xs text-ink-soft">{(t.exitReason ?? 'manual').replace('_', ' ')}</td>
                      <td className="px-2 py-2">
                        <div className="flex flex-wrap gap-1">
                          {t.tags.map((x) => (
                            <span key={x} className="chip chip-on text-[10px]">
                              {x}
                            </span>
                          ))}
                          {(t.mistakes ?? []).map((x) => (
                            <span key={x} className="chip border-down/50 bg-down/10 text-[10px] text-down">
                              {x}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-t border-line bg-panel/40">
                        <td colSpan={9} className="px-4 py-3">
                          <TradeEditor trade={t} onChange={(patch) => updateTrade(t.id, patch)} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-xl border border-line bg-surface p-4 text-sm text-ink-soft">
        <Info size={16} className="mt-0.5 shrink-0" />
        <span>
          Module 12 explains how to read every number on this page and how to run a weekly review.{' '}
          <Link to="/learn/m12-becoming-consistent/02-performance-metrics" className="font-semibold text-accent">
            Read it here.
          </Link>
        </span>
      </p>
    </div>
  );
}

function TradeEditor({ trade, onChange }: { trade: Trade; onChange: (p: Partial<Pick<Trade, 'tags' | 'notes' | 'mistakes'>>) => void }) {
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  return (
    <div className="space-y-3">
      {trade.plan && (
        <p className="text-sm">
          <span className="font-semibold text-ink-soft">Your plan at entry: </span>
          {trade.plan}
        </p>
      )}
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-soft">Setup</p>
        <div className="flex flex-wrap gap-1">
          {SETUP_TAGS.map((s) => (
            <button key={s} type="button" onClick={() => onChange({ tags: toggle(trade.tags, s) })} className={`chip ${trade.tags.includes(s) ? 'chip-on' : ''}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-soft">Mistakes (be honest, this is the whole point)</p>
        <div className="flex flex-wrap gap-1">
          {MISTAKE_TAGS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ mistakes: toggle(trade.mistakes ?? [], s) })}
              className={`chip ${(trade.mistakes ?? []).includes(s) ? 'border-down/60 bg-down/10 text-down' : ''}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <textarea
        value={trade.notes}
        onChange={(e) => onChange({ notes: e.target.value })}
        placeholder="What did you see? What would you do differently?"
        rows={2}
        className="input w-full resize-y text-sm"
      />
    </div>
  );
}

function EquityCurve({ points, start }: { points: { time: number; equity: number }[]; start: number }) {
  if (points.length < 2) return <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">Not enough data yet.</div>;
  const w = 720;
  const h = 220;
  const pad = 30;
  const values = points.map((p) => p.equity);
  const min = Math.min(...values, start);
  const max = Math.max(...values, start);
  const span = max - min || 1;
  const x = (i: number) => pad + (i / (points.length - 1)) * (w - pad * 2);
  const y = (v: number) => pad / 2 + ((max - v) / span) * (h - pad);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.equity).toFixed(1)}`).join(' ');
  const area = `${d} L${x(points.length - 1).toFixed(1)},${y(min)} L${x(0).toFixed(1)},${y(min)} Z`;
  const last = values[values.length - 1];
  const up = last >= start;
  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
        <line x1={pad} x2={w - pad} y1={y(start)} y2={y(start)} stroke="var(--color-ink-soft)" strokeDasharray="4 4" opacity={0.5} />
        <text x={w - pad + 2} y={y(start) + 3} fill="var(--color-ink-soft)">
          start
        </text>
        <path d={area} fill={up ? 'var(--color-up)' : 'var(--color-down)'} opacity={0.12} />
        <path d={d} fill="none" stroke={up ? 'var(--color-up)' : 'var(--color-down)'} strokeWidth={2} strokeLinejoin="round" />
        <text x={pad} y={14} fill="var(--color-ink-soft)">
          {fmtMoney(max)}
        </text>
        <text x={pad} y={h - 4} fill="var(--color-ink-soft)">
          {fmtMoney(min)}
        </text>
      </svg>
    </div>
  );
}

function RHistogram({ trades }: { trades: Trade[] }) {
  const rs = trades.map((t) => t.rMultiple).filter((r): r is number => r !== undefined);
  if (rs.length === 0) return <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">Set a stop loss on your trades to see R-multiples here.</div>;
  const buckets = [-3, -2, -1, 0, 1, 2, 3, 4];
  const counts = buckets.map((b, i) => {
    const lo = b;
    const hi = buckets[i + 1] ?? Infinity;
    return rs.filter((r) => r >= lo && r < hi).length;
  });
  const maxC = Math.max(...counts, 1);
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex h-40 items-end gap-1">
        {counts.map((c, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] text-ink-soft">{c || ''}</span>
            <div className={`w-full rounded-t ${buckets[i] < 0 ? 'bg-down' : 'bg-up'}`} style={{ height: `${(c / maxC) * 100}%`, minHeight: c ? 3 : 0 }} />
            <span className="text-[9px] text-ink-soft">{buckets[i] >= 0 ? `+${buckets[i]}` : buckets[i]}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-soft">A healthy profile has losses clustered at -1R and a few winners far to the right.</p>
    </div>
  );
}

function Metric({ label, value, tone, hint }: { label: string; value: string; tone?: 'up' | 'down' | 'warn'; hint?: string }) {
  const cls = tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : tone === 'warn' ? 'text-warn' : 'text-ink';
  return (
    <div className="rounded-xl border border-line bg-surface p-3" title={hint}>
      <div className="text-[10px] uppercase tracking-wide text-ink-soft">{label}</div>
      <div className={`mt-0.5 font-mono text-xl font-bold ${cls}`}>{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-mono font-semibold">{value}</dd>
    </>
  );
}

function fmtDuration(minutes: number) {
  if (minutes < 60) return `${minutes.toFixed(0)}m`;
  if (minutes < 60 * 24) return `${(minutes / 60).toFixed(1)}h`;
  return `${(minutes / 60 / 6.5).toFixed(1)}d`;
}
