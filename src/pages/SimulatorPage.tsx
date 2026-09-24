import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Play, Pause, SkipForward, StepForward, RotateCcw, Settings2, Sparkles, Keyboard, PanelRightClose, PanelRightOpen, ArrowLeftRight } from 'lucide-react';
import { TradingChart } from '@/components/sim/TradingChart';
import { OrderTicket } from '@/components/sim/OrderTicket';
import { PositionsPanel, OrdersPanel, HistoryPanel, EventsPanel, AccountBar } from '@/components/sim/Panels';
import { useSim, chartBars, pricesAt, startClock, specOf, usesRealFeed, type Overlays } from '@/store/sim';
import { DataSourceBar, RealSymbolPicker } from '@/components/sim/DataSource';
import { SYMBOLS } from '@/engine/market/symbols';
import { TIMEFRAMES, type Timeframe } from '@/engine/market/types';
import { SUBTICKS } from '@/engine/market/feed';
import type { AccountState } from '@/engine/broker/types';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Segmented } from '@/components/ui/Segmented';
import { Button } from '@/components/ui/Button';
import { Kbd } from '@/components/ui/Kbd';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { cx } from '@/components/ui/cx';
import { PREF_KEYS } from '@/lib/storageKeys';
import { usePageMeta } from '@/lib/pageMeta';
import { t } from '@/i18n';

const OVERLAY_LABELS: { key: keyof Overlays; label: string; group: 'overlay' | 'pane' }[] = [
  { key: 'ema9', label: 'EMA 9', group: 'overlay' },
  { key: 'ema21', label: 'EMA 21', group: 'overlay' },
  { key: 'sma20', label: 'SMA 20', group: 'overlay' },
  { key: 'sma50', label: 'SMA 50', group: 'overlay' },
  { key: 'bb', label: 'Bollinger', group: 'overlay' },
  { key: 'vwap', label: 'VWAP', group: 'overlay' },
  { key: 'volume', label: 'Volume', group: 'pane' },
  { key: 'rsi', label: 'RSI', group: 'pane' },
  { key: 'macd', label: 'MACD', group: 'pane' },
];

/** Ticks per clock step at each speed, and their labels. */
const SPEEDS = [
  { value: '2', label: 'sim.speeds.slow' },
  { value: '8', label: 'sim.speeds.normal' },
  { value: '30', label: 'sim.speeds.fast' },
  { value: '120', label: 'sim.speeds.max' },
] as const;

const DOCK_MIN = 160;
const DOCK_DEFAULT = 224;
const TABS = ['positions', 'orders', 'history', 'events'] as const;
type DockTab = (typeof TABS)[number];

function readPref(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writePref(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // A blocked store only costs the preference.
  }
}

const selectClass = 'h-8 rounded-control border border-line-strong bg-surface-1 px-2 font-mono text-mono font-semibold text-ink focus:border-accent';

/**
 * The simulator, laid out as a trading terminal: a 44-pixel bar of instrument, timeframe and
 * transport; the account; the chart; a resizable dock of positions, orders, history and
 * events; and the order ticket in a collapsible rail (a bottom sheet on small screens).
 */
export function SimulatorPage() {
  usePageMeta({ title: t('nav.simulator'), description: t('meta.simulator') });
  const { symbol, timeframe, cursor, subtick, playing, speed, overlays, account, clock, source, realSymbol, realSymbols, realStatus } = useSim();
  const setSymbol = useSim((s) => s.setSymbol);
  const setTimeframe = useSim((s) => s.setTimeframe);
  const setPlaying = useSim((s) => s.setPlaying);
  const setSpeed = useSim((s) => s.setSpeed);
  const toggleOverlay = useSim((s) => s.toggleOverlay);
  const advance = useSim((s) => s.advance);
  const stepBar = useSim((s) => s.stepBar);
  const resetAccount = useSim((s) => s.resetAccount);
  const newMarket = useSim((s) => s.newMarket);
  const [tab, setTab] = useState<DockTab>('positions');
  const [showSettings, setShowSettings] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(() => readPref(PREF_KEYS.simRail) !== 'closed');
  const [dock, setDock] = useState(() => Math.max(DOCK_MIN, Number(readPref(PREF_KEYS.simDock)) || DOCK_DEFAULT));

  useEffect(() => startClock(), []);

  const isReal = usesRealFeed(source);
  const isLive = source === 'live';

  const toggleTicket = useCallback(() => {
    if (window.matchMedia('(min-width: 64rem)').matches) {
      setRailOpen((open) => {
        writePref(PREF_KEYS.simRail, open ? 'closed' : 'open');
        return !open;
      });
    } else setSheetOpen((o) => !o);
  }, []);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || el.isContentEditable || el.closest('[role="dialog"]'))) return;
      if (e.key === '?') {
        e.preventDefault();
        setShowKeys(true);
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        toggleTicket();
        return;
      }
      // The clock is the market's own in live mode.
      if (useSim.getState().source === 'live') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying(!useSim.getState().playing);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepBar();
      } else if (e.key === '.') {
        e.preventDefault();
        advance(1);
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        setSpeed(Number(SPEEDS[Number(e.key) - 1].value));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setPlaying, stepBar, advance, setSpeed, toggleTicket]);

  /** The instrument on screen, whichever market is live. */
  const active = isReal ? realSymbol : symbol;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const bars = useMemo(() => chartBars(symbol, timeframe, cursor, subtick), [symbol, timeframe, cursor, subtick, source, realSymbol, realStatus, clock]);
  const watchSymbols = useMemo(() => SYMBOLS.map((s) => s.symbol), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const prices = useMemo(() => pricesAt(cursor, subtick, watchSymbols), [cursor, subtick, watchSymbols, source, realSymbol, realStatus]);
  const realSpec = realSymbols.find((x) => x.symbol === realSymbol);
  const spec = isReal ? realSpec && { ...realSpec, tickSize: 1 / 10 ** realSpec.decimals } : specOf(symbol);
  const dp = spec?.decimals ?? 2;
  const price = prices[active] ?? 0;
  const last = bars[bars.length - 1];
  const prevClose = bars.length > 1 ? bars[bars.length - 2].close : last?.open ?? price;
  const chg = price - prevClose;
  const chgPct = prevClose ? (chg / prevClose) * 100 : 0;
  const barTime = last ? last.time : Math.floor(Date.now() / 1000);

  const counts: Partial<Record<DockTab, number>> = {
    positions: Object.keys(account.positions).length,
    orders: account.orders.filter((o) => o.status === 'working').length,
  };

  return (
    <div className="flex flex-col max-lg:pb-20 lg:h-[calc(100dvh-var(--spacing-header))] lg:overflow-hidden">
      {/* A terminal has no room for a visible title; the page still has one for screen readers. */}
      <h1 className="sr-only">{t('nav.simulator')}</h1>
      {/* top bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-surface-1 px-3 py-2 xl:h-11 xl:flex-nowrap xl:py-0">
        {isReal ? (
          <RealSymbolPicker />
        ) : (
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} aria-label={t('sim.instrument')} className={selectClass}>
            {SYMBOLS.map((s) => (
              <option key={s.symbol} value={s.symbol}>
                {s.symbol} · {s.name}
              </option>
            ))}
          </select>
        )}
        <div className="flex items-baseline gap-2">
          <AnimatedNumber value={price} format={(v) => v.toFixed(dp)} className="text-mono-lg font-semibold text-ink" />
          <span className={cx('font-mono text-mono-sm font-semibold tabular-nums', chg >= 0 ? 'text-up' : 'text-down')}>
            {chg >= 0 ? '+' : ''}
            {chg.toFixed(dp)} ({chgPct >= 0 ? '+' : ''}
            {chgPct.toFixed(2)}%)
          </span>
          {playing && <span className="live-dot h-2 w-2 self-center rounded-full bg-up" title={t('sim.running')} />}
        </div>
        <Segmented size="sm" label={t('sim.timeframe')} value={timeframe} onChange={(v) => setTimeframe(v as Timeframe)} options={TIMEFRAMES.map((tf) => ({ value: tf, label: tf }))} />

        {/* the transport: meaningless in live mode, where the market owns the clock */}
        {!isLive && (
          <div className="flex items-center gap-1">
            <Button variant={playing ? 'secondary' : 'primary'} size="sm" onClick={() => setPlaying(!playing)} aria-keyshortcuts="Space" className="w-20">
              {playing ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}
              {playing ? t('sim.pause') : t('sim.play')}
            </Button>
            <Button variant="ghost" size="sm" className="px-2" onClick={() => advance(1)} title={t('sim.stepTick', { n: SUBTICKS })} aria-label={t('sim.stepTick', { n: SUBTICKS })} aria-keyshortcuts=".">
              <StepForward size={15} aria-hidden />
            </Button>
            <Button variant="ghost" size="sm" className="px-2" onClick={stepBar} title={t('sim.stepBar')} aria-label={t('sim.stepBar')} aria-keyshortcuts="ArrowRight">
              <SkipForward size={15} aria-hidden />
            </Button>
            <Segmented size="sm" label={t('sim.speed')} value={String(speed)} onChange={(v) => setSpeed(Number(v))} options={SPEEDS.map((s) => ({ value: s.value, label: t(s.label) }))} />
          </div>
        )}
        <time dateTime={new Date(barTime * 1000).toISOString()} title={t('sim.barTime')} className="font-mono text-mono-sm text-ink-soft tabular-nums">
          {new Date(barTime * 1000).toISOString().slice(0, 16).replace('T', ' ')}
        </time>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" className="px-2 max-md:hidden" onClick={() => setShowKeys(true)} title={t('sim.shortcuts')} aria-label={t('sim.shortcuts')} aria-keyshortcuts="?">
            <Keyboard size={15} aria-hidden />
          </Button>
          <Button variant={showSettings ? 'secondary' : 'ghost'} size="sm" className="px-2" onClick={() => setShowSettings((s) => !s)} title={t('sim.settings')} aria-label={t('sim.settings')} aria-expanded={showSettings}>
            <Settings2 size={15} aria-hidden />
          </Button>
          <Button variant="ghost" size="sm" className="px-2 max-lg:hidden" onClick={toggleTicket} title={t(railOpen ? 'sim.hideTicket' : 'sim.showTicket')} aria-label={t(railOpen ? 'sim.hideTicket' : 'sim.showTicket')} aria-keyshortcuts="T">
            {railOpen ? <PanelRightClose size={15} aria-hidden /> : <PanelRightOpen size={15} aria-hidden />}
          </Button>
        </div>
      </div>

      {/* account */}
      <div className="shrink-0 border-b border-line bg-surface px-3 py-2">
        <AccountBar prices={prices} account={account} time={barTime} />
      </div>

      <DataSourceBar />

      {showSettings && <SettingsBar onReset={resetAccount} onNewMarket={newMarket} />}

      {/* workspace */}
      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row">
        <Workspace
          dock={dock}
          setDock={setDock}
          indicators={
            <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-line bg-surface px-3 py-1.5" role="group" aria-label={t('sim.indicators')}>
              {OVERLAY_LABELS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  aria-pressed={overlays[o.key]}
                  onClick={() => toggleOverlay(o.key)}
                  className={cx(
                    'h-6 rounded-full border px-2.5 text-caption font-semibold transition-colors duration-(--duration-fast)',
                    overlays[o.key] ? 'border-accent bg-accent-soft text-accent' : 'border-line text-ink-soft hover:text-ink',
                  )}
                >
                  {o.label}
                </button>
              ))}
              <span className="ml-auto hidden text-caption text-ink-soft xl:inline">{spec?.description}</span>
            </div>
          }
          chart={<TradingChart bars={bars} symbol={active} timeframe={timeframe} overlays={overlays} account={account} decimals={dp} clock={clock} />}
          dockContent={
            <>
              <div role="tablist" aria-label={t('sim.tabs.label')} className="flex shrink-0 items-center gap-1 border-b border-line bg-surface-1 px-2">
                {TABS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    id={`sim-tab-${k}`}
                    aria-selected={tab === k}
                    aria-controls="sim-dock-panel"
                    onClick={() => setTab(k)}
                    className={cx(
                      'relative flex h-9 items-center gap-1.5 px-3 text-body-sm font-semibold transition-colors duration-(--duration-fast)',
                      tab === k ? 'text-ink after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-accent' : 'text-ink-soft hover:text-ink',
                    )}
                  >
                    {t(`sim.tabs.${k}`)}
                    {(counts[k] ?? 0) > 0 && <span className="rounded-full bg-accent-soft px-1.5 font-mono text-mono-sm text-accent">{counts[k]}</span>}
                  </button>
                ))}
              </div>
              <div id="sim-dock-panel" role="tabpanel" aria-labelledby={`sim-tab-${tab}`} className="scroll-thin min-h-0 flex-1 overflow-auto">
                {tab === 'positions' && <PositionsPanel prices={prices} />}
                {tab === 'orders' && <OrdersPanel />}
                {tab === 'history' && <HistoryPanel />}
                {tab === 'events' && <EventsPanel />}
              </div>
            </>
          }
        />

        {/* the rail, from lg up */}
        <aside
          aria-label={t('sim.ticket')}
          className={cx('scroll-thin hidden shrink-0 border-l border-line bg-surface-1 transition-[width] duration-(--duration-base) ease-standard lg:block lg:overflow-y-auto', railOpen ? 'w-80' : 'w-11')}
        >
          {railOpen ? (
            <>
              <RailHeading>{t('sim.ticket')}</RailHeading>
              <OrderTicket symbol={active} price={price} prices={prices} />
              {!isReal && (
                <>
                  <RailHeading>{t('sim.watchlist')}</RailHeading>
                  <Watchlist prices={prices} account={account} current={symbol} onPick={setSymbol} />
                </>
              )}
              <HowTo />
            </>
          ) : (
            <button type="button" onClick={toggleTicket} className="flex h-full w-full flex-col items-center gap-3 pt-3 text-ink-soft hover:bg-surface-2 hover:text-ink" aria-label={t('sim.showTicket')}>
              <PanelRightOpen size={16} aria-hidden />
              <span className="text-caption font-semibold uppercase tracking-wide [writing-mode:vertical-rl]">{t('sim.ticket')}</span>
            </button>
          )}
        </aside>
      </div>

      {/* below lg: the ticket is a bottom sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="fixed right-4 z-30 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-5 font-semibold text-on-accent shadow-3 bottom-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom)+1rem)] md:bottom-4 lg:hidden"
        >
          <ArrowLeftRight size={16} aria-hidden />
          {t('sim.trade')}
        </button>
        <SheetContent title={t('sim.ticket')} closeLabel={t('common.close')}>
          <div className="scroll-thin -mx-4 max-h-[72dvh] overflow-y-auto">
            <OrderTicket symbol={active} price={price} prices={prices} />
            {!isReal && (
              <>
                <RailHeading>{t('sim.watchlist')}</RailHeading>
                <Watchlist
                  prices={prices}
                  account={account}
                  current={symbol}
                  onPick={(s) => {
                    setSymbol(s);
                    setSheetOpen(false);
                  }}
                />
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ShortcutsDialog open={showKeys} onOpenChange={setShowKeys} live={isLive} />
    </div>
  );
}

/**
 * The chart over the dock, with a handle between them. On large screens the handle drags (or
 * arrow-keys) the dock between 160 pixels and most of the workspace, and the height is kept
 * for next time; on small screens the page simply scrolls.
 */
function Workspace({ dock, setDock, indicators, chart, dockContent }: { dock: number; setDock: (h: number) => void; indicators: ReactNode; chart: ReactNode; dockContent: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; h: number } | null>(null);
  const max = () => Math.max(DOCK_MIN, (boxRef.current?.clientHeight ?? 800) - 220);
  const clamp = (h: number) => Math.round(Math.min(max(), Math.max(DOCK_MIN, h)));
  const commit = (h: number) => {
    setDock(h);
    writePref(PREF_KEYS.simDock, String(h));
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, h: dock };
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setDock(clamp(drag.current.h - (e.clientY - drag.current.y)));
  };
  const onUp = () => {
    if (!drag.current) return;
    drag.current = null;
    commit(clamp(dock));
  };

  return (
    <section ref={boxRef} className="flex min-w-0 flex-col lg:min-h-0 lg:flex-1">
      {indicators}
      <div className="h-[clamp(300px,52vh,460px)] lg:h-auto lg:min-h-0 lg:flex-1">{chart}</div>
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label={t('sim.resize')}
        aria-valuemin={DOCK_MIN}
        aria-valuemax={max()}
        aria-valuenow={dock}
        tabIndex={0}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={(e) => {
          const step = e.key === 'ArrowUp' ? 24 : e.key === 'ArrowDown' ? -24 : 0;
          if (!step) return;
          e.preventDefault();
          commit(clamp(dock + step));
        }}
        className="group hidden h-2 shrink-0 cursor-row-resize touch-none items-center justify-center border-t border-line bg-surface-1 hover:bg-surface-2 lg:flex"
      >
        <span aria-hidden className="h-1 w-10 rounded-full bg-line-strong transition-colors duration-(--duration-fast) group-hover:bg-accent group-focus-visible:bg-accent" />
      </div>
      <div className="flex h-72 shrink-0 flex-col border-t border-line bg-surface max-lg:border-t lg:h-(--dock) lg:border-t-0" style={{ '--dock': `${dock}px` } as CSSProperties}>
        {dockContent}
      </div>
    </section>
  );
}

function RailHeading({ children }: { children: ReactNode }) {
  return <h2 className="border-y border-line bg-surface-2 px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-ink-soft first:border-t-0">{children}</h2>;
}

function Watchlist({ prices, account, current, onPick }: { prices: Record<string, number>; account: AccountState; current: string; onPick: (s: string) => void }) {
  return (
    <ul className="py-1">
      {SYMBOLS.map((s) => {
        const p = prices[s.symbol];
        const pos = account.positions[s.symbol];
        return (
          <li key={s.symbol}>
            <button
              type="button"
              onClick={() => onPick(s.symbol)}
              aria-current={current === s.symbol || undefined}
              className={cx('flex w-full items-center gap-2 px-3 py-1.5 text-left text-body-sm hover:bg-surface-2', current === s.symbol && 'bg-accent-soft')}
            >
              <span className="w-14 font-mono text-mono-sm font-semibold">{s.symbol}</span>
              <span className="flex-1 truncate text-caption text-ink-soft">{s.name}</span>
              <span className="font-mono text-mono-sm tabular-nums">{p?.toFixed(s.decimals)}</span>
              {pos && <span className={cx('h-1.5 w-1.5 rounded-full', pos.qty > 0 ? 'bg-up' : 'bg-down')} title={t('sim.openPosition')} />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function HowTo() {
  return (
    <div className="border-t border-line p-3 text-caption leading-relaxed text-ink-soft">
      <p className="mb-1 font-semibold text-ink">{t('sim.how.title')}</p>
      <p>{t('sim.how.body')}</p>
      <p className="mt-2 flex items-center gap-1.5">
        <Kbd>?</Kbd> {t('sim.keys.title')}
      </p>
    </div>
  );
}

function ShortcutsDialog({ open, onOpenChange, live }: { open: boolean; onOpenChange: (o: boolean) => void; live: boolean }) {
  const rows: [ReactNode, string][] = [
    [<Kbd key="k">Space</Kbd>, t('sim.keys.play')],
    [<Kbd key="k">→</Kbd>, t('sim.keys.stepBar')],
    [<Kbd key="k">.</Kbd>, t('sim.keys.stepTick')],
    [
      <span key="k" className="inline-flex gap-1">
        <Kbd>1</Kbd>–<Kbd>4</Kbd>
      </span>,
      t('sim.keys.speed'),
    ],
    [<Kbd key="k">T</Kbd>, t('sim.keys.ticket')],
    [<Kbd key="k">?</Kbd>, t('sim.keys.help')],
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t('sim.keys.title')} className="w-[min(26rem,calc(100vw-2rem))]">
        <dl className="space-y-2 px-5 pb-5 pt-3">
          {rows.map(([k, text]) => (
            <div key={text} className="flex items-center justify-between gap-4 text-body-sm">
              <dt className="text-ink-soft">{text}</dt>
              <dd>{k}</dd>
            </div>
          ))}
          {live && <p className="pt-2 text-caption text-warn">{t('sim.keys.liveNote')}</p>}
        </dl>
      </DialogContent>
    </Dialog>
  );
}

function SettingsBar({ onReset, onNewMarket }: { onReset: (s?: Partial<{ startingCash: number; leverage: number; commissionPerOrder: number; slippageBps: number; allowShort: boolean }>) => void; onNewMarket: () => void }) {
  const account = useSim((s) => s.account);
  const [cash, setCash] = useState(account.settings.startingCash);
  const [lev, setLev] = useState(account.settings.leverage);
  const [comm, setComm] = useState(account.settings.commissionPerOrder);
  const [slip, setSlip] = useState(account.settings.slippageBps);
  return (
    <div className="flex shrink-0 flex-wrap items-end gap-3 border-b border-line bg-surface-2 px-3 py-2.5">
      <Field label={t('sim.settingsBar.cash')} value={cash} onChange={setCash} step={1000} />
      <Field label={t('sim.settingsBar.leverage')} value={lev} onChange={setLev} step={1} />
      <Field label={t('sim.settingsBar.commission')} value={comm} onChange={setComm} step={0.5} />
      <Field label={t('sim.settingsBar.slippage')} value={slip} onChange={setSlip} step={1} />
      <Button variant="secondary" size="sm" onClick={() => onReset({ startingCash: cash, leverage: lev, commissionPerOrder: comm, slippageBps: slip })}>
        <RotateCcw size={13} aria-hidden /> {t('sim.settingsBar.reset')}
      </Button>
      <Button variant="secondary" size="sm" onClick={() => onNewMarket()}>
        <Sparkles size={13} aria-hidden /> {t('sim.settingsBar.newMarket')}
      </Button>
      <p className="max-w-md text-caption text-ink-soft">{t('sim.settingsBar.note')}</p>
    </div>
  );
}

function Field({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step: number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-caption font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      <input type="number" step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className={cx(selectClass, 'w-28 font-medium')} />
    </label>
  );
}
