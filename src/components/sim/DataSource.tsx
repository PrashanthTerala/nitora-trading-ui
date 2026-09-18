/**
 * Data-source controls for the simulator.
 *
 * Synthetic is the default and always works: it is deterministic, needs no network, and
 * can generate unlimited history, which is why every lesson example is written against
 * it. Real mode replays actual historical bars from the local data service, which needs
 * that service running and is bounded by how much history the provider will give.
 */
import { useEffect, useState } from 'react';
import { AlertTriangle, Database, FlaskConical, Loader2, Radio, RefreshCw } from 'lucide-react';
import { useSim } from '@/store/sim';

export function DataSourceBar() {
  const source = useSim((s) => s.source);
  const setSource = useSim((s) => s.setSource);
  const realStatus = useSim((s) => s.realStatus);
  const realError = useSim((s) => s.realError);
  const realMeta = useSim((s) => s.realMeta);
  const realSymbol = useSim((s) => s.realSymbol);
  const loadReal = useSim((s) => s.loadReal);
  const timeframe = useSim((s) => s.timeframe);
  const liveMeta = useSim((s) => s.liveMeta);

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line bg-panel/30 px-3 py-1.5 text-xs">
      <div className="flex gap-0.5 rounded-lg bg-panel p-0.5">
        <button
          type="button"
          onClick={() => setSource('synthetic')}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-semibold transition ${source === 'synthetic' ? 'bg-surface text-accent shadow-sm' : 'text-ink-soft hover:text-ink'}`}
          title="Deterministic invented markets. Works offline and matches the lesson examples."
        >
          <FlaskConical size={12} /> Synthetic
        </button>
        <button
          type="button"
          onClick={() => setSource('real')}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-semibold transition ${source === 'real' ? 'bg-surface text-accent shadow-sm' : 'text-ink-soft hover:text-ink'}`}
          title="Replay real historical bars. Needs the local data service running."
        >
          <Database size={12} /> Real replay
        </button>
        <button
          type="button"
          onClick={() => setSource('live')}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-semibold transition ${source === 'live' ? 'bg-surface text-accent shadow-sm' : 'text-ink-soft hover:text-ink'}`}
          title="Follow the market as it trades now. The clock is real time, so there is no play, step or speed."
        >
          <Radio size={12} /> Live
        </button>
      </div>

      {source === 'synthetic' ? (
        <span className="text-ink-soft">
          Invented instruments, generated from a seed. Unlimited history, no network, and the prices lessons refer to.
        </span>
      ) : realStatus === 'loading' ? (
        <span className="flex items-center gap-1.5 text-ink-soft">
          <Loader2 size={12} className="animate-spin" /> Loading {realSymbol} {timeframe}…
        </span>
      ) : realStatus === 'error' ? (
        <span className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 font-semibold text-down">
            <AlertTriangle size={12} /> {realError}
          </span>
          <button type="button" onClick={() => void loadReal()} className="btn-ghost px-2 py-0.5 text-[11px]">
            <RefreshCw size={11} /> Retry
          </button>
        </span>
      ) : realStatus === 'ready' && realMeta ? (
        <span className="flex flex-wrap items-center gap-2 text-ink-soft">
          <span>
            {realMeta.bars.toLocaleString()} real {timeframe} bars via {realMeta.source}
          </span>
          {realMeta.cached && <span className="chip text-[10px]">cached</span>}
          {realMeta.stale && <span className="chip border-warn/50 text-[10px] text-warn">stale, upstream unavailable</span>}
          <button type="button" onClick={() => void loadReal()} className="btn-ghost px-2 py-0.5 text-[11px]">
            <RefreshCw size={11} /> Refresh
          </button>
        </span>
      ) : null}

      {source === 'live' && liveMeta && <LiveFreshness meta={liveMeta} />}

      {source !== 'synthetic' && (
        <span className="ml-auto hidden text-[11px] text-ink-soft xl:inline">
          Switching source starts a fresh account: positions are priced against the market that created them.
        </span>
      )}
    </div>
  );
}

/** Instrument picker for real mode, populated from the data service. */
export function RealSymbolPicker() {
  const realSymbol = useSim((s) => s.realSymbol);
  const realSymbols = useSim((s) => s.realSymbols);
  const setRealSymbol = useSim((s) => s.setRealSymbol);
  const loadSymbols = useSim((s) => s.loadSymbols);

  // Populate the list on first mount. Deliberately not loadReal: the picker wants names, and
  // fetching a series here would race whichever mode is already loading one.
  useEffect(() => {
    void loadSymbols();
  }, [loadSymbols]);

  if (realSymbols.length === 0) {
    return (
      <span className="input flex items-center py-1 font-mono font-bold text-ink-soft" title="The data service has not returned an instrument list">
        {realSymbol}
      </span>
    );
  }
  return (
    <select value={realSymbol} onChange={(e) => setRealSymbol(e.target.value)} className="input py-1 font-mono font-bold">
      {realSymbols.map((s) => (
        <option key={s.symbol} value={s.symbol}>
          {s.symbol} · {s.name}
        </option>
      ))}
    </select>
  );
}

/**
 * States plainly how stale what you are watching is.
 *
 * A LIVE badge over a fifteen-minute-delayed feed is the kind of small lie this site exists to
 * argue against, so the delay is written out rather than implied, and an unknown delay says so
 * instead of defaulting to something reassuring.
 */
function LiveFreshness({ meta }: { meta: NonNullable<ReturnType<typeof useSim.getState>['liveMeta']> }) {
  const [, force] = useState(0);
  // The age is a clock reading, so it has to re-render on its own rather than only on a poll.
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const age = Math.max(0, Math.floor(Date.now() / 1000 - meta.asOf));
  const delay = meta.delayHint;

  return (
    <span className="flex flex-wrap items-center gap-2">
      {meta.marketOpen ? (
        <span className="flex items-center gap-1.5 font-semibold text-up">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-up" /> Market open
        </span>
      ) : (
        <span className="chip border-warn/50 text-[10px] text-warn">Market closed · nothing is moving</span>
      )}
      <span className="text-ink-soft">
        last price {age < 90 ? age + 's' : Math.round(age / 60) + 'm'} ago
      </span>
      {delay === 0 && <span className="chip text-[10px]">real time</span>}
      {delay !== null && delay > 0 && (
        <span className="chip border-warn/50 text-[10px] text-warn" title="Set from what this instrument class was measured at, not from a guarantee.">
          delayed ~{Math.round(delay / 60)} min
        </span>
      )}
      {delay === null && <span className="chip text-[10px]">delay unknown</span>}
      {!meta.forming && meta.marketOpen && <span className="chip text-[10px]">waiting for the next bar</span>}
    </span>
  );
}
