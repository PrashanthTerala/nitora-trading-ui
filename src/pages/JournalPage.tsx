import { Fragment, lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { Download, Info, ChevronRight, ArrowRight } from 'lucide-react';
import { useSim, specOf, getMarket } from '@/store/sim';
import { computeStats, maxDrawdown, sharpeLike } from '@/engine/broker/stats';
import { SYMBOL_MAP } from '@/engine/market/symbols';
import { aggregate } from '@/engine/market/generator';
import type { OHLC, Timeframe } from '@/engine/market/types';
import { fmtUsd } from '@/components/sim/OrderTicket';
import { CandleSvg, type Annotation } from '@/components/figures/CandleSvg';
import type { Trade } from '@/engine/broker/types';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Sparkline } from '@/components/ui/Sparkline';
import { Segmented } from '@/components/ui/Segmented';
import { Button, buttonClass } from '@/components/ui/Button';
import { Chip, chipClass } from '@/components/ui/Chip';
import { Skeleton } from '@/components/ui/Skeleton';
import { Illustration } from '@/components/ui/Illustration';
import { cx } from '@/components/ui/cx';
import { toCsv } from '@/lib/csv';
import { usePageMeta } from '@/lib/pageMeta';
import { t } from '@/i18n';

const EquityChart = lazy(() => import('@/components/journal/JournalCharts').then((mod) => ({ default: mod.EquityChart })));
const RChart = lazy(() => import('@/components/journal/JournalCharts').then((mod) => ({ default: mod.RChart })));

const SETUP_TAGS = ['trend pullback', 'breakout', 'range fade', 'reversal', 'momentum', 'news', 'other'];
const MISTAKE_TAGS = ['no plan', 'moved my stop', 'chased entry', 'oversized', 'exited early', 'revenge trade', 'ignored trend', 'no stop'];
const FILTERS = ['all', 'wins', 'losses', 'tagged', 'untagged'] as const;
type Filter = (typeof FILTERS)[number];

/**
 * One-R buckets for the histogram; the ends are open, so no trade falls off the chart. Labels use
 * the true minus sign: the mono font draws "<-" as an arrow ligature.
 */
const R_BUCKETS = [
  { label: '<−2', lo: -Infinity, hi: -2 },
  { label: '−2', lo: -2, hi: -1 },
  { label: '−1', lo: -1, hi: 0 },
  { label: '0', lo: 0, hi: 1 },
  { label: '+1', lo: 1, hi: 2 },
  { label: '+2', lo: 2, hi: 3 },
  { label: '+3', lo: 3, hi: 4 },
  { label: '4+', lo: 4, hi: Infinity },
];

const signedMoney = (v: number) => `${v >= 0 ? '+' : ''}${fmtUsd(v)}`;

export function JournalPage() {
  usePageMeta({ title: t('nav.journal'), description: t('meta.journal') });
  const account = useSim((s) => s.account);
  const updateTrade = useSim((s) => s.updateTrade);
  const trades = account.trades;
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const stats = useMemo(() => computeStats(trades), [trades]);
  const dd = useMemo(() => maxDrawdown(account.equityCurve), [account.equityCurve]);
  const sharpe = useMemo(() => sharpeLike(trades), [trades]);
  const trend = useMemo(() => runningStats(trades, account.equityCurve), [trades, account.equityCurve]);
  const buckets = useMemo(() => {
    const rs = trades.map((x) => x.rMultiple).filter((r): r is number => r !== undefined);
    return rs.length ? R_BUCKETS.map((b) => ({ label: b.label, count: rs.filter((r) => r >= b.lo && r < b.hi).length, loss: b.hi <= 0 })) : null;
  }, [trades]);

  const filtered = useMemo(() => {
    const list = [...trades].reverse();
    switch (filter) {
      case 'wins':
        return list.filter((x) => x.pnl > 0);
      case 'losses':
        return list.filter((x) => x.pnl < 0);
      case 'tagged':
        return list.filter((x) => x.tags.length > 0 || (x.mistakes?.length ?? 0) > 0);
      case 'untagged':
        return list.filter((x) => x.tags.length === 0 && (x.mistakes?.length ?? 0) === 0);
      default:
        return list;
    }
  }, [trades, filter]);

  const mistakeCost = useMemo(() => {
    const out: Record<string, { count: number; pnl: number }> = {};
    for (const x of trades)
      for (const k of x.mistakes ?? []) {
        out[k] = { count: (out[k]?.count ?? 0) + 1, pnl: (out[k]?.pnl ?? 0) + x.pnl };
      }
    return Object.entries(out).sort((a, b) => a[1].pnl - b[1].pnl);
  }, [trades]);

  const setupPerf = useMemo(() => {
    const out: Record<string, { count: number; pnl: number; wins: number; r: number; rCount: number }> = {};
    for (const x of trades)
      for (const k of x.tags) {
        const e = out[k] ?? { count: 0, pnl: 0, wins: 0, r: 0, rCount: 0 };
        e.count++;
        e.pnl += x.pnl;
        if (x.pnl > 0) e.wins++;
        if (x.rMultiple !== undefined) {
          e.r += x.rMultiple;
          e.rCount++;
        }
        out[k] = e;
      }
    return Object.entries(out).sort((a, b) => b[1].pnl - a[1].pnl);
  }, [trades]);

  const exportCsv = () => {
    // prettier-ignore
    const head = ['id', 'symbol', 'direction', 'qty', 'entryPrice', 'exitPrice', 'entryTime', 'exitTime', 'pnl', 'fees', 'rMultiple', 'exitReason', 'tags', 'mistakes', 'notes'];
    const rows = trades.map((x) => [
      x.id,
      x.symbol,
      x.direction,
      x.qty,
      x.entryPrice,
      x.exitPrice,
      new Date(x.entryTime * 1000).toISOString(),
      new Date(x.exitTime * 1000).toISOString(),
      x.pnl.toFixed(2),
      x.fees.toFixed(2),
      x.rMultiple?.toFixed(3) ?? '',
      x.exitReason ?? '',
      x.tags.join('; '),
      (x.mistakes ?? []).join('; '),
      x.notes,
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
      <div className="mx-auto flex max-w-xl flex-col items-center py-8 text-center">
        <Illustration id="empty-journal" eager className="max-w-md" />
        <h1 className="-mt-4 font-display text-h1 font-semibold tracking-tight">{t('journal.empty.title')}</h1>
        <p className="mt-3 text-body-lg text-ink-soft">{t('journal.empty.body')}</p>
        <Link to="/simulator" className={buttonClass({ size: 'lg' }, 'mt-8')}>
          {t('journal.empty.cta')} <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    );
  }

  const pf = stats.profitFactor;
  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-h1 font-semibold tracking-tight">{t('journal.title')}</h1>
          <p className="mt-1 text-body text-ink-soft">{t('journal.lead', { count: trades.length })}</p>
        </div>
        <div className="flex items-end gap-6">
          <div className="text-right">
            <p className="text-caption font-semibold uppercase tracking-wide text-ink-soft">{t('journal.net')}</p>
            <AnimatedNumber value={stats.netPnl} format={signedMoney} className={cx('text-mono-lg font-semibold sm:text-h2', stats.netPnl >= 0 ? 'text-up' : 'text-down')} />
          </div>
          <Button variant="secondary" onClick={exportCsv}>
            <Download size={15} aria-hidden /> {t('journal.export')}
          </Button>
        </div>
      </header>

      {/* KPI tiles: each a readout over its own trend */}
      <section aria-label={t('journal.kpi.trend')} className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label={t('journal.kpi.expectancy')} hint={t('journal.kpi.expectancyHint')} values={trend.expectancy} tone={stats.expectancy >= 0 ? 'up' : 'down'}>
          <AnimatedNumber value={stats.expectancy} format={signedMoney} />
        </Kpi>
        <Kpi label={t('journal.kpi.profitFactor')} hint={t('journal.kpi.profitFactorHint')} values={trend.profitFactor} tone={pf >= 1.5 ? 'up' : pf >= 1 ? 'warn' : 'down'}>
          {pf === Infinity ? '∞' : <AnimatedNumber value={pf} format={(v) => v.toFixed(2)} />}
        </Kpi>
        <Kpi label={t('journal.kpi.winRate')} hint={t('journal.kpi.winRateHint')} values={trend.winRate}>
          <AnimatedNumber value={stats.winRate * 100} format={(v) => `${v.toFixed(1)}%`} />
        </Kpi>
        <Kpi label={t('journal.kpi.drawdown')} hint={t('journal.kpi.drawdownHint')} values={trend.drawdown} tone={dd.maxDdPct > 0.2 ? 'down' : dd.maxDdPct > 0.1 ? 'warn' : undefined} sparkTone="down">
          <AnimatedNumber value={dd.maxDdPct * 100} format={(v) => `${v.toFixed(1)}%`} />
        </Kpi>
        <Kpi label={t('journal.kpi.trades')} hint={t('journal.kpi.tradesHint')} values={trend.cumPnl} sparkTone={stats.netPnl >= 0 ? 'up' : 'down'}>
          <AnimatedNumber value={trades.length} format={(v) => String(Math.round(v))} />
        </Kpi>
        <Kpi label={t('journal.kpi.avgR')} hint={t('journal.kpi.avgRHint')} values={trend.avgR} tone={stats.avgR === null ? undefined : stats.avgR >= 0 ? 'up' : 'down'}>
          {stats.avgR === null ? '—' : <AnimatedNumber value={stats.avgR} format={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}R`} />}
        </Kpi>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title={t('journal.charts.equity')} className="lg:col-span-3">
          {account.equityCurve.length < 2 ? (
            <p className="py-16 text-center text-body-sm text-ink-soft">{t('journal.charts.notEnough')}</p>
          ) : (
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <EquityChart points={account.equityCurve} start={account.settings.startingCash} />
            </Suspense>
          )}
        </Panel>
        <Panel title={t('journal.charts.r')} className="lg:col-span-2" note={buckets ? t('journal.charts.rNote') : undefined}>
          {buckets ? (
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <RChart buckets={buckets} />
            </Suspense>
          ) : (
            <p className="py-16 text-center text-body-sm text-ink-soft">{t('journal.charts.rEmpty')}</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title={t('journal.more')}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-body-sm">
            <Row label="Average win" value={fmtUsd(stats.avgWin)} />
            <Row label="Average loss" value={fmtUsd(stats.avgLoss)} />
            <Row label="Largest win" value={fmtUsd(stats.bestTrade)} />
            <Row label="Largest loss" value={fmtUsd(stats.worstTrade)} />
            <Row label="Longest win streak" value={String(stats.longestWinStreak)} />
            <Row label="Longest loss streak" value={String(stats.longestLossStreak)} />
            <Row label="Avg hold" value={fmtDuration(stats.avgHoldMinutes)} />
            <Row label="Consistency (R Sharpe)" value={sharpe !== null ? sharpe.toFixed(2) : '—'} />
            <Row label="Long trades" value={`${stats.byDirection.long.count} · ${fmtUsd(stats.byDirection.long.pnl)}`} />
            <Row label="Short trades" value={`${stats.byDirection.short.count} · ${fmtUsd(stats.byDirection.short.pnl)}`} />
            <Row label="Stopped out" value={String(stats.byExitReason.stop_loss ?? 0)} />
            <Row label="Hit target" value={String(stats.byExitReason.take_profit ?? 0)} />
            <Row label="Liquidated" value={String(stats.byExitReason.liquidation ?? 0)} />
          </dl>
        </Panel>

        <div className="space-y-6">
          {setupPerf.length > 0 && (
            <Panel title={t('journal.setups')}>
              <table className="w-full text-body-sm">
                <tbody>
                  {setupPerf.map(([k, v]) => (
                    <tr key={k} className="border-b border-line-subtle last:border-0">
                      <td className="py-1.5 capitalize">{k}</td>
                      <td className="py-1.5 text-right text-ink-soft">{v.count} trades</td>
                      <td className="py-1.5 text-right text-ink-soft">{((v.wins / v.count) * 100).toFixed(0)}% win</td>
                      <td className={cx('py-1.5 text-right font-mono font-semibold tabular-nums', v.pnl >= 0 ? 'text-up' : 'text-down')}>{signedMoney(v.pnl)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}
          {mistakeCost.length > 0 && (
            <Panel title={t('journal.mistakesCost')} tone="down" note={t('journal.mistakesNote')}>
              <table className="w-full text-body-sm">
                <tbody>
                  {mistakeCost.map(([k, v]) => (
                    <tr key={k} className="border-b border-line-subtle last:border-0">
                      <td className="py-1.5 capitalize">{k}</td>
                      <td className="py-1.5 text-right text-ink-soft">{v.count}x</td>
                      <td className={cx('py-1.5 text-right font-mono font-semibold tabular-nums', v.pnl >= 0 ? 'text-up' : 'text-down')}>{signedMoney(v.pnl)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}
        </div>
      </div>

      {/* trade list */}
      <section aria-labelledby="journal-trades">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="journal-trades" className="font-display text-h3 font-semibold">
            {t('journal.table.title')}
          </h2>
          <Segmented size="sm" label={t('journal.table.filter')} value={filter} onChange={setFilter} options={FILTERS.map((f) => ({ value: f, label: t(`journal.table.filters.${f}`) }))} />
        </div>
        <div className="rounded-card border border-line bg-surface-1 max-md:overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead className="text-left text-caption font-semibold uppercase tracking-wide text-ink-soft">
              <tr className="[&>th]:sticky [&>th]:top-header [&>th]:z-10 [&>th]:border-b [&>th]:border-line [&>th]:bg-surface-2 [&>th]:py-2.5 max-md:[&>th]:static">
                <th className="w-8 rounded-tl-card pl-3" aria-hidden />
                <th className="px-2">{t('journal.table.closed')}</th>
                <th className="px-2">{t('journal.table.symbol')}</th>
                <th className="px-2">{t('journal.table.side')}</th>
                <th className="px-2 text-right">{t('journal.table.qty')}</th>
                <th className="px-2 text-right">{t('journal.table.entry')}</th>
                <th className="px-2 text-right">{t('journal.table.exit')}</th>
                <th className="px-2 text-right">{t('journal.table.pnl')}</th>
                <th className="px-2 text-right">{t('journal.table.r')}</th>
                <th className="px-2">{t('journal.table.reason')}</th>
                <th className="rounded-tr-card px-3">{t('journal.table.tags')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-ink-soft">
                    {t('journal.table.none')}
                  </td>
                </tr>
              )}
              {filtered.map((x, i) => {
                const dp = specOf(x.symbol)?.decimals ?? 2;
                const open = expanded === x.id;
                const toggle = () => setExpanded(open ? null : x.id);
                return (
                  <Fragment key={x.id}>
                    <tr onClick={toggle} className={cx('cursor-pointer border-t border-line-subtle transition-colors duration-(--duration-fast) hover:bg-accent-soft', i % 2 === 1 && 'bg-ink/3', open && 'bg-accent-soft')}>
                      <td className="pl-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle();
                          }}
                          aria-expanded={open}
                          aria-label={t('journal.table.expand')}
                          className="flex h-7 w-7 items-center justify-center rounded-control text-ink-soft hover:bg-surface-2 hover:text-ink"
                        >
                          <ChevronRight size={15} aria-hidden className={cx('transition-transform duration-(--duration-fast)', open && 'rotate-90')} />
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-mono-sm text-ink-soft">{new Date(x.exitTime * 1000).toISOString().slice(0, 16).replace('T', ' ')}</td>
                      <td className="px-2 py-2 font-mono font-semibold">{x.symbol}</td>
                      <td className="px-2 py-2">
                        <Chip tone={x.direction === 'long' ? 'up' : 'down'}>{t(x.direction === 'long' ? 'journal.table.long' : 'journal.table.short')}</Chip>
                      </td>
                      <td className="px-2 py-2 text-right font-mono tabular-nums">{x.qty}</td>
                      <td className="px-2 py-2 text-right font-mono tabular-nums">{x.entryPrice.toFixed(dp)}</td>
                      <td className="px-2 py-2 text-right font-mono tabular-nums">{x.exitPrice.toFixed(dp)}</td>
                      <td className={cx('px-2 py-2 text-right font-mono font-semibold tabular-nums', x.pnl >= 0 ? 'text-up' : 'text-down')}>{signedMoney(x.pnl)}</td>
                      <td className="px-2 py-2 text-right">
                        {x.rMultiple !== undefined ? (
                          <span className={cx('inline-block rounded-[6px] px-1.5 font-mono tabular-nums', x.rMultiple >= 0 ? 'bg-up-soft text-up' : 'bg-down-soft text-down')}>
                            {`${x.rMultiple >= 0 ? '+' : ''}${x.rMultiple.toFixed(2)}`}
                          </span>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-caption text-ink-soft">{(x.exitReason ?? 'manual').replace('_', ' ')}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {x.tags.map((tag) => (
                            <Chip key={tag} tone="accent">
                              {tag}
                            </Chip>
                          ))}
                          {(x.mistakes ?? []).map((tag) => (
                            <Chip key={tag} tone="down">
                              {tag}
                            </Chip>
                          ))}
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-t border-line-subtle bg-surface-2">
                        <td colSpan={11} className="p-0">
                          <m.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 p-4 md:grid-cols-2 md:p-5">
                            <TradeChart trade={x} />
                            <TradeEditor trade={x} onChange={(patch) => updateTrade(x.id, patch)} />
                          </m.div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <p className="flex items-start gap-2 rounded-card border border-line bg-surface-1 p-4 text-body-sm text-ink-soft">
        <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          {t('journal.readMore')}{' '}
          <Link to="/learn/m12-becoming-consistent/02-performance-metrics" className="font-semibold text-accent hover:underline">
            {t('journal.readLink')}
          </Link>
        </span>
      </p>
    </div>
  );
}

/**
 * How each headline number moved as trades were added: the statistic over the first n trades,
 * for up to forty n, so a sparkline shows whether it is settling, improving or decaying.
 */
function runningStats(trades: Trade[], curve: { equity: number }[]) {
  const n = trades.length;
  const steps = Math.min(n, 40);
  const ends = Array.from({ length: steps }, (_, i) => Math.max(1, Math.round(((i + 1) / steps) * n)));
  const expectancy: number[] = [];
  const profitFactor: number[] = [];
  const winRate: number[] = [];
  const avgR: number[] = [];
  const cumPnl: number[] = [];
  for (const end of ends) {
    const s = computeStats(trades.slice(0, end));
    expectancy.push(s.expectancy);
    // An unbeaten run has an infinite factor; cap it so the line stays drawable.
    profitFactor.push(Math.min(s.profitFactor, 5));
    winRate.push(s.winRate);
    avgR.push(s.avgR ?? 0);
    cumPnl.push(s.netPnl);
  }
  // Drawdown from the running peak along the equity curve, sampled to forty points.
  const drawdown: number[] = [];
  let peak = -Infinity;
  const every = Math.max(1, Math.floor(curve.length / 40));
  curve.forEach((p, i) => {
    peak = Math.max(peak, p.equity);
    if (i % every === 0 || i === curve.length - 1) drawdown.push(peak > 0 ? -((peak - p.equity) / peak) : 0);
  });
  return { expectancy, profitFactor, winRate, avgR, cumPnl, drawdown };
}

function Kpi({ label, hint, values, tone, sparkTone, children }: { label: string; hint: string; values: number[]; tone?: 'up' | 'down' | 'warn'; sparkTone?: 'up' | 'down' | 'accent'; children: ReactNode }) {
  const cls = tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : tone === 'warn' ? 'text-warn' : 'text-ink';
  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-surface-1 p-4 shadow-1" title={hint}>
      <p className="text-caption font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className={cx('mt-1 font-mono text-mono-lg font-semibold tabular-nums', cls)}>{children}</p>
      <Sparkline values={values} tone={sparkTone ?? (tone === 'down' ? 'down' : tone === 'up' ? 'up' : 'accent')} className="mt-3 h-8 w-full" />
      <p className="sr-only">{hint}</p>
    </div>
  );
}

function Panel({ title, note, tone, className, children }: { title: string; note?: string; tone?: 'down'; className?: string; children: ReactNode }) {
  return (
    <section className={cx('min-w-0 rounded-card border p-4 shadow-1', tone === 'down' ? 'border-down bg-down-soft' : 'border-line bg-surface-1', className)}>
      <h2 className={cx('mb-3 text-caption font-semibold uppercase tracking-wide', tone === 'down' ? 'text-down' : 'text-ink-soft')}>{title}</h2>
      {children}
      {note && <p className="mt-3 text-caption text-ink-soft">{note}</p>}
    </section>
  );
}

const TFS: [Timeframe, number][] = [
  ['1m', 1],
  ['5m', 5],
  ['15m', 15],
  ['1h', 60],
  ['1D', 390],
];

/**
 * The market around a closed trade: a timeframe chosen so the trade spans a couple of dozen
 * candles at most, some context before the entry, and a few candles after the exit -- never
 * past the simulator's present, which would reveal bars not yet traded.
 */
function tradeWindow(trade: Trade) {
  if (!SYMBOL_MAP[trade.symbol]) return null;
  const feed = getMarket().feed(trade.symbol);
  const cursor = useSim.getState().cursor;
  // A fresh page load generates the synthetic series lazily; make sure it reaches the present.
  feed.ensure(cursor);
  const series = feed.series;
  const now = Math.min(series.length, cursor + 1);
  const find = (time: number) => {
    let lo = 0;
    let hi = now - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (series.time.get(mid) < time) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const i0 = find(trade.entryTime);
  const i1 = find(trade.exitTime);
  const [tf, mins] = TFS.find(([, n]) => (i1 - i0) / n <= 24) ?? TFS[TFS.length - 1];
  const from = Math.max(0, i0 - 14 * mins);
  const to = Math.min(now, i1 + 8 * mins + 1);
  const raw = aggregate(series, from, to, tf);
  if (raw.length < 2) return null;
  const at = (time: number) => {
    let idx = 0;
    raw.forEach((b, i) => {
      if (b.time <= time) idx = i;
    });
    return idx;
  };
  const bars: OHLC[] = raw.map((b) => ({ o: b.open, h: b.high, l: b.low, c: b.close, v: b.volume }));
  return { bars, entry: at(trade.entryTime), exit: at(trade.exitTime), tf };
}

function TradeChart({ trade }: { trade: Trade }) {
  const win = useMemo(() => tradeWindow(trade), [trade]);
  if (!win) return <p className="self-center text-body-sm text-ink-soft">{t('journal.detail.noChart')}</p>;
  const long = trade.direction === 'long';
  const exitColor = trade.pnl >= 0 ? 'var(--color-up)' : 'var(--color-down)';
  const annotations: Annotation[] = [
    { type: 'highlight', from: win.entry, to: win.exit },
    { type: 'hline', price: trade.entryPrice, text: t('journal.detail.entry'), dashed: true, from: win.entry },
    { type: 'hline', price: trade.exitPrice, text: t('journal.detail.exit'), color: exitColor, dashed: true, from: win.exit },
    { type: 'arrow', index: win.entry, direction: long ? 'up' : 'down' },
  ];
  return (
    <figure>
      <figcaption className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-caption font-semibold uppercase tracking-wide text-ink-soft">{t('journal.detail.chart')}</span>
        <span className="text-caption text-ink-muted">{t('journal.detail.chartNote', { tf: win.tf })}</span>
      </figcaption>
      <div className="rounded-control border border-line-subtle bg-surface-1 p-2">
        <CandleSvg bars={win.bars} annotations={annotations} height={220} width={560} />
      </div>
    </figure>
  );
}

function TradeEditor({ trade, onChange }: { trade: Trade; onChange: (p: Partial<Pick<Trade, 'tags' | 'notes' | 'mistakes'>>) => void }) {
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const tagButton = (on: boolean, tone: 'accent' | 'down') => cx(chipClass({ tone: on ? tone : 'neutral', size: 'md' }), 'cursor-pointer transition-colors duration-(--duration-fast)', !on && 'hover:text-ink');
  return (
    <div className="space-y-4">
      {trade.plan && (
        <p className="text-body-sm">
          <span className="font-semibold text-ink-soft">{t('journal.detail.plan')} </span>
          {trade.plan}
        </p>
      )}
      <div>
        <p className="mb-1.5 text-caption font-semibold uppercase tracking-wide text-ink-soft">{t('journal.detail.setup')}</p>
        <div className="flex flex-wrap gap-1.5">
          {SETUP_TAGS.map((s) => (
            <button key={s} type="button" aria-pressed={trade.tags.includes(s)} onClick={() => onChange({ tags: toggle(trade.tags, s) })} className={tagButton(trade.tags.includes(s), 'accent')}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-caption font-semibold uppercase tracking-wide text-ink-soft">{t('journal.detail.mistakes')}</p>
        <div className="flex flex-wrap gap-1.5">
          {MISTAKE_TAGS.map((s) => {
            const on = (trade.mistakes ?? []).includes(s);
            return (
              <button key={s} type="button" aria-pressed={on} onClick={() => onChange({ mistakes: toggle(trade.mistakes ?? [], s) })} className={tagButton(on, 'down')}>
                {s}
              </button>
            );
          })}
        </div>
      </div>
      <textarea
        value={trade.notes}
        onChange={(e) => onChange({ notes: e.target.value })}
        placeholder={t('journal.detail.notes')}
        aria-label={t('journal.detail.notes')}
        rows={3}
        className="w-full resize-y rounded-control border border-line-strong bg-surface-1 px-3 py-2 text-body-sm text-ink outline-none focus:border-accent"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-mono font-semibold tabular-nums">{value}</dd>
    </>
  );
}

function fmtDuration(minutes: number) {
  if (minutes < 60) return `${minutes.toFixed(0)}m`;
  if (minutes < 60 * 24) return `${(minutes / 60).toFixed(1)}h`;
  return `${(minutes / 60 / 6.5).toFixed(1)}d`;
}
