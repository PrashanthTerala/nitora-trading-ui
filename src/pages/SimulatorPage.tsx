import { useEffect, useMemo, useState } from 'react';
import { Play, Pause, SkipForward, FastForward, RotateCcw, Settings2, Sparkles, HelpCircle } from 'lucide-react';
import { TradingChart } from '@/components/sim/TradingChart';
import { OrderTicket } from '@/components/sim/OrderTicket';
import { PositionsPanel, OrdersPanel, HistoryPanel, EventsPanel, AccountBar } from '@/components/sim/Panels';
import { useSim, chartBars, pricesAt, startClock, specOf, usesRealFeed, type Overlays } from '@/store/sim';
import { DataSourceBar, RealSymbolPicker } from '@/components/sim/DataSource';
import { SYMBOLS } from '@/engine/market/symbols';
import { TIMEFRAMES, type Timeframe } from '@/engine/market/types';
import { SUBTICKS } from '@/engine/market/feed';

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

const SPEEDS = [2, 8, 30, 120];

export function SimulatorPage() {
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
  const [tab, setTab] = useState<'positions' | 'orders' | 'history' | 'events'>('positions');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => startClock(), []);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying(!useSim.getState().playing);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepBar();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setPlaying, stepBar]);

  // Both real modes read the same feed and the same instrument list; only the clock differs.
  const isReal = usesRealFeed(source);
  const isLive = source === 'live';
  /** The instrument on screen, whichever market is live. */
  const active = isReal ? realSymbol : symbol;
  const bars = useMemo(() => chartBars(symbol, timeframe, cursor, subtick), [symbol, timeframe, cursor, subtick, source, realSymbol, realStatus, clock]);
  const watchSymbols = useMemo(() => SYMBOLS.map((s) => s.symbol), []);
  const prices = useMemo(() => pricesAt(cursor, subtick, watchSymbols), [cursor, subtick, watchSymbols, source, realSymbol, realStatus]);
  const realSpec = realSymbols.find((x) => x.symbol === realSymbol);
  const spec = isReal
    ? realSpec && { ...realSpec, tickSize: 1 / 10 ** realSpec.decimals }
    : specOf(symbol);
  const price = prices[active] ?? 0;
  const last = bars[bars.length - 1];
  const prevClose = bars.length > 1 ? bars[bars.length - 2].close : last?.open ?? price;
  const chg = price - prevClose;
  const chgPct = prevClose ? (chg / prevClose) * 100 : 0;
  const clockTime = last ? new Date(last.time * 1000) : new Date();

  return (
    <div className="flex flex-col lg:h-[calc(100vh-3.5rem)]">
      {/* top bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line bg-surface px-3 py-2">
        {isReal ? (
          <RealSymbolPicker />
        ) : (
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="input py-1 font-mono font-bold">
            {SYMBOLS.map((s) => (
              <option key={s.symbol} value={s.symbol}>
                {s.symbol} · {s.name}
              </option>
            ))}
          </select>
        )}
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xl font-bold">{price?.toFixed(spec?.decimals ?? 2)}</span>
          <span className={`font-mono text-sm font-semibold ${chg >= 0 ? 'text-up' : 'text-down'}`}>
            {chg >= 0 ? '+' : ''}
            {chg.toFixed(spec?.decimals ?? 2)} ({chgPct >= 0 ? '+' : ''}
            {chgPct.toFixed(2)}%)
          </span>
          {playing && <span className="live-dot h-2 w-2 rounded-full bg-up" title="Market running" />}
        </div>
        <div className="flex gap-0.5 rounded-lg bg-panel p-0.5">
          {TIMEFRAMES.map((tf: Timeframe) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`rounded px-2 py-1 text-xs font-semibold transition ${timeframe === tf ? 'bg-surface text-accent shadow-sm' : 'text-ink-soft hover:text-ink'}`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* clock controls: meaningless in live mode, where the market owns the clock */}
        <div className={`items-center gap-1 ${isLive ? 'hidden' : 'flex'}`}>
          <button type="button" onClick={() => setPlaying(!playing)} className="btn-ghost px-3 py-1.5" title="Play or pause (Space)">
            {playing ? <Pause size={15} /> : <Play size={15} />}
            {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={() => advance(1)} className="btn-ghost px-2 py-1.5" title={`Advance one tick (a minute candle forms in ${SUBTICKS} ticks)`}>
            <SkipForward size={14} />
          </button>
          <button type="button" onClick={stepBar} className="btn-ghost px-2 py-1.5" title="Advance one full candle (Right arrow)">
            <FastForward size={14} /> Candle
          </button>
          <div className="flex gap-0.5 rounded-lg bg-panel p-0.5">
            {SPEEDS.map((s) => (
              <button key={s} type="button" onClick={() => setSpeed(s)} className={`rounded px-1.5 py-1 text-[11px] font-semibold ${speed === s ? 'bg-surface text-accent' : 'text-ink-soft'}`}>
                {s === 2 ? 'slow' : s === 8 ? '1x' : s === 30 ? 'fast' : 'max'}
              </button>
            ))}
          </div>
        </div>

        <span className="hidden font-mono text-xs text-ink-soft lg:inline">
          {clockTime.toUTCString().slice(5, 22)}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={() => setShowSettings((s) => !s)} className="btn-ghost px-2 py-1.5" title="Account settings">
            <Settings2 size={14} />
          </button>
        </div>
      </div>

      {/* account metrics */}
      <div className="flex shrink-0 items-center gap-4 border-b border-line bg-panel/50 px-3 py-1.5">
        <AccountBar prices={prices} account={account} />
      </div>

      <DataSourceBar />

      {showSettings && <SettingsBar onReset={resetAccount} onNewMarket={newMarket} />}

      {/* main */}
      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row">
        <div className="flex flex-col lg:min-h-0 lg:flex-1">
          <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-line px-3 py-1.5">
            {OVERLAY_LABELS.map((o) => (
              <button key={o.key} type="button" onClick={() => toggleOverlay(o.key)} className={`chip transition ${overlays[o.key] ? 'chip-on' : 'hover:text-ink'}`}>
                {o.label}
              </button>
            ))}
            <span className="ml-auto hidden text-[11px] text-ink-soft xl:inline">{spec?.description}</span>
          </div>
          <div className="h-[clamp(300px,52vh,460px)] lg:h-auto lg:min-h-[320px] lg:flex-1">
            <TradingChart bars={bars} symbol={active} timeframe={timeframe} overlays={overlays} account={account} decimals={spec?.decimals ?? 2} clock={clock} />
          </div>
          {/* bottom panels */}
          <div className="h-64 shrink-0 border-t border-line lg:h-56">
            <div className="flex items-center gap-1 border-b border-line bg-panel/40 px-2">
              {(['positions', 'orders', 'history', 'events'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-xs font-semibold capitalize transition ${tab === t ? 'border-b-2 border-accent text-accent' : 'text-ink-soft hover:text-ink'}`}
                >
                  {t}
                  {t === 'positions' && Object.keys(account.positions).length > 0 && <span className="ml-1 rounded-full bg-accent/20 px-1.5 text-[10px]">{Object.keys(account.positions).length}</span>}
                  {t === 'orders' && account.orders.filter((o) => o.status === 'working').length > 0 && (
                    <span className="ml-1 rounded-full bg-accent/20 px-1.5 text-[10px]">{account.orders.filter((o) => o.status === 'working').length}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="scroll-thin h-[calc(100%-2rem)] overflow-auto">
              {tab === 'positions' && <PositionsPanel prices={prices} />}
              {tab === 'orders' && <OrdersPanel />}
              {tab === 'history' && <HistoryPanel />}
              {tab === 'events' && <EventsPanel />}
            </div>
          </div>
        </div>

        {/* right rail */}
        <aside className="scroll-thin w-full shrink-0 border-t border-line bg-surface lg:w-80 lg:overflow-y-auto lg:border-l lg:border-t-0">
          <div className="border-b border-line px-3 py-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Order ticket</div>
          <OrderTicket symbol={active} price={price} prices={prices} />
          <div className={`border-t border-line ${isReal ? 'hidden' : ''}`}>
            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Watchlist</div>
            <ul className="pb-3">
              {SYMBOLS.map((s) => {
                const p = prices[s.symbol];
                const pos = account.positions[s.symbol];
                return (
                  <li key={s.symbol}>
                    <button
                      type="button"
                      onClick={() => setSymbol(s.symbol)}
                      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-panel ${symbol === s.symbol ? 'bg-accent/10' : ''}`}
                    >
                      <span className="w-12 font-mono font-bold">{s.symbol}</span>
                      <span className="flex-1 truncate text-ink-soft">{s.name}</span>
                      <span className="font-mono">{p?.toFixed(s.decimals)}</span>
                      {pos && <span className={`h-1.5 w-1.5 rounded-full ${pos.qty > 0 ? 'bg-up' : 'bg-down'}`} title="Open position" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="border-t border-line p-3 text-[11px] leading-relaxed text-ink-soft">
            <p className="mb-1 flex items-center gap-1 font-semibold text-ink">
              <HelpCircle size={12} /> How to practise
            </p>
            <p>
              Press <kbd className="rounded bg-panel px-1">Space</kbd> to run the market, or <kbd className="rounded bg-panel px-1">→</kbd> to step one candle at a time. Stepping is the
              better drill: decide first, then reveal.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SettingsBar({ onReset, onNewMarket }: { onReset: (s?: Partial<{ startingCash: number; leverage: number; commissionPerOrder: number; slippageBps: number; allowShort: boolean }>) => void; onNewMarket: () => void }) {
  const account = useSim((s) => s.account);
  const [cash, setCash] = useState(account.settings.startingCash);
  const [lev, setLev] = useState(account.settings.leverage);
  const [comm, setComm] = useState(account.settings.commissionPerOrder);
  const [slip, setSlip] = useState(account.settings.slippageBps);
  return (
    <div className="flex shrink-0 flex-wrap items-end gap-3 border-b border-line bg-panel/60 px-3 py-2 text-xs">
      <Field label="Starting cash" value={cash} onChange={setCash} step={1000} />
      <Field label="Leverage (x)" value={lev} onChange={setLev} step={1} />
      <Field label="Commission / order" value={comm} onChange={setComm} step={0.5} />
      <Field label="Slippage (bps)" value={slip} onChange={setSlip} step={1} />
      <button type="button" className="btn-ghost py-1.5" onClick={() => onReset({ startingCash: cash, leverage: lev, commissionPerOrder: comm, slippageBps: slip })}>
        <RotateCcw size={13} /> Reset account
      </button>
      <button type="button" className="btn-ghost py-1.5" onClick={() => onNewMarket()}>
        <Sparkles size={13} /> New market
      </button>
      <p className="max-w-md text-ink-soft">Reset account clears positions, orders and trade history but keeps the market. New market re-rolls all eight price series from a fresh seed and starts a fresh account, because positions from the old series would be meaningless against new prices.</p>
    </div>
  );
}

function Field({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step: number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      <input type="number" step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="input w-28 py-1" />
    </label>
  );
}
