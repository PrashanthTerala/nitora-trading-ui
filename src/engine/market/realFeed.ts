/**
 * Replay of real historical bars.
 *
 * The synthetic Feed generates one-minute bars and aggregates them upward, which works
 * because it can produce unlimited history at any resolution. Real data cannot: a
 * provider will give roughly seven days of one-minute bars but ten years of daily ones,
 * so there is no single base resolution to aggregate from. A RealFeed therefore holds
 * the bars for ONE timeframe exactly as fetched, and the cursor indexes those bars
 * directly rather than indexing minutes.
 *
 * Sub-ticks work the same way as the synthetic feed so a bar still forms in front of
 * the learner: the path starts at the open, visits both extremes in a deterministic
 * order, and ends at the close, so the partial bar is always consistent with the
 * finished one.
 */
import { hashString } from '@/lib/rng';
import type { Bar, Timeframe } from './types';

export const REAL_SUBTICKS = 4;

export interface RealSymbolSpec {
  symbol: string;
  name: string;
  kind: string;
  decimals: number;
  unitLabel: string;
  description: string;
}

export class RealFeed {
  readonly symbol: string;
  readonly timeframe: Timeframe;
  readonly bars: Bar[];
  readonly decimals: number;

  constructor(symbol: string, timeframe: Timeframe, bars: Bar[], decimals: number) {
    this.symbol = symbol;
    this.timeframe = timeframe;
    this.bars = bars;
    this.decimals = decimals;
  }

  get length() {
    return this.bars.length;
  }

  /** Clamp a cursor into the usable range, leaving one bar of headroom. */
  clamp(i: number) {
    return Math.max(0, Math.min(i, this.bars.length - 1));
  }

  baseBar(i: number): Bar {
    return this.bars[this.clamp(i)];
  }

  /** Price at sub-tick k inside bar i, tracing open to extremes to close. */
  subPrice(i: number, k: number): number {
    const b = this.baseBar(i);
    if (k >= REAL_SUBTICKS - 1) return b.close;
    const highFirst = (hashString(`${this.symbol}:${b.time}`) & 1) === 0;
    const first = highFirst ? b.high : b.low;
    const second = highFirst ? b.low : b.high;
    if (k === 0) return first;
    if (k === 1) return second;
    const t = 0.35 + 0.3 * (((hashString(`${this.symbol}:${b.time}:mid`) >>> 8) % 1000) / 1000);
    return second + (b.close - second) * t;
  }

  /** The partially formed bar after sub-tick k of bar i. */
  partialBar(i: number, k: number): Bar {
    const b = this.baseBar(i);
    if (k >= REAL_SUBTICKS - 1) return b;
    let hi = b.open;
    let lo = b.open;
    let close = b.open;
    for (let j = 0; j <= k; j++) {
      const p = this.subPrice(i, j);
      hi = Math.max(hi, p);
      lo = Math.min(lo, p);
      close = p;
    }
    return { time: b.time, open: b.open, high: hi, low: lo, close, volume: Math.round((b.volume * (k + 1)) / REAL_SUBTICKS) };
  }

  /** Completed bars before the cursor, plus the one currently forming. */
  chartBars(cursor: number, subtick: number): Bar[] {
    const end = this.clamp(cursor);
    const out = this.bars.slice(0, end);
    out.push(this.partialBar(end, subtick));
    return out;
  }

  price(cursor: number, subtick: number): number {
    return this.subPrice(this.clamp(cursor), subtick);
  }

  /** True once the replay has consumed every available bar. */
  exhausted(cursor: number) {
    return cursor >= this.bars.length - 1;
  }
}

// ---------------------------------------------------------------- API client

/**
 * The market-data service is a separate project (nitora-trading-service) with its own
 * toolchain and release cadence, so it is addressed over HTTP rather than imported.
 * Override with VITE_DATA_API when it runs somewhere other than the default port.
 */
const DEFAULT_BASE = (import.meta.env?.VITE_DATA_API as string | undefined) ?? 'http://localhost:5300';

export interface HistoryResponse {
  symbol: string;
  interval: string;
  currency?: string;
  exchange?: string;
  bars: Bar[];
  source: string;
  fetchedAt: number;
  cached?: boolean;
  stale?: boolean;
}

export class DataApiError extends Error {
  constructor(
    message: string,
    readonly kind: 'offline' | 'http' | 'empty',
  ) {
    super(message);
  }
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${DEFAULT_BASE}${path}`, { signal });
  } catch {
    throw new DataApiError('Cannot reach the data service. Start the nitora-trading-service project with "docker compose up -d".', 'offline');
  }
  if (!res.ok) {
    let msg = `Data server returned ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) msg = body.error;
    } catch {
      /* keep the status message */
    }
    throw new DataApiError(msg, 'http');
  }
  return (await res.json()) as T;
}

export function fetchRealSymbols(signal?: AbortSignal) {
  return getJson<{ symbols: RealSymbolSpec[] }>('/api/symbols', signal).then((r) => r.symbols);
}

/** The provider has no 4h interval of its own; the server aggregates 1h into it. */
function intervalFor(tf: Timeframe): string {
  return tf === '1D' ? '1d' : tf;
}

export async function fetchRealHistory(symbol: string, tf: Timeframe, signal?: AbortSignal): Promise<HistoryResponse> {
  const r = await getJson<HistoryResponse>(`/api/history?symbol=${encodeURIComponent(symbol)}&interval=${intervalFor(tf)}`, signal);
  if (!r.bars?.length) throw new DataApiError(`No ${tf} history available for ${symbol}.`, 'empty');
  return r;
}

export async function pingDataApi(signal?: AbortSignal): Promise<boolean> {
  try {
    await getJson<{ ok: boolean }>('/api/health', signal);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- live mode

export interface LiveResponse {
  symbol: string;
  interval: string;
  currency?: string;
  exchange?: string;
  bars: Bar[];
  /** whether the final bar is still open */
  forming: boolean;
  marketOpen: boolean;
  kind?: string;
  /** seconds behind real time, or null when the service has no basis for a claim */
  delayHint: number | null;
  asOf: number;
  source: string;
  fetchedAt: number;
}

export async function fetchLive(symbol: string, tf: Timeframe, tail = 300, signal?: AbortSignal): Promise<LiveResponse> {
  const r = await getJson<LiveResponse>(
    `/api/live?symbol=${encodeURIComponent(symbol)}&interval=${intervalFor(tf)}&tail=${tail}`,
    signal,
  );
  if (!r.bars?.length) throw new DataApiError(`No live ${tf} data available for ${symbol}.`, 'empty');
  return r;
}

/**
 * How often to ask for a fresh reading, in milliseconds.
 *
 * The upstream quote was measured advancing about every 15 seconds, so polling faster than
 * that returns the same numbers and spends someone else's bandwidth for nothing. Above a
 * minute the bar itself is the limit: there is no point asking four times inside one 4h
 * candle. Capped so a daily chart does not poll all afternoon.
 */
export function livePollMs(tf: Timeframe): number {
  switch (tf) {
    case '1m':
      return 15_000;
    case '5m':
      return 20_000;
    case '15m':
      return 30_000;
    default:
      return 60_000;
  }
}

/** What a bar event carries: one bar, and whether it is still open to more trades. */
export interface LiveBarEvent {
  bar: Bar;
  forming: boolean;
}

export interface LiveStreamHandlers {
  onSnapshot: (res: LiveResponse) => void;
  onBar: (event: LiveBarEvent) => void;
  /** Called when streaming is not available here, so the caller can go back to polling. */
  onFallback: (reason: string) => void;
}

/**
 * Follow an instrument over server-sent events instead of asking repeatedly.
 *
 * A trade reaches the chart in well under a second this way, against fifteen to sixty
 * for polling, and one connection replaces one request per tab per interval.
 *
 * Streaming is an optimisation, never a requirement: only crypto has a feed the service
 * may relay, the service can be configured with it switched off, and a browser may have
 * no EventSource at all. Every one of those calls onFallback and live mode carries on
 * polling, slower but correct.
 *
 * EventSource reconnects by itself, and the service replies to a reconnect with a fresh
 * snapshot, so a dropped connection repairs without anything here noticing. The one case
 * it cannot recover from is never having connected at all, which is what opened guards.
 */
export function openLiveStream(symbol: string, tf: Timeframe, handlers: LiveStreamHandlers): () => void {
  if (typeof EventSource === 'undefined') {
    handlers.onFallback('This browser cannot hold a stream open.');
    return () => {};
  }
  const url = `${DEFAULT_BASE}/api/live/stream?symbol=${encodeURIComponent(symbol)}&interval=${intervalFor(tf)}`;
  let source: EventSource;
  try {
    source = new EventSource(url);
  } catch {
    handlers.onFallback('The data service would not open a stream.');
    return () => {};
  }
  let opened = false;
  let closed = false;

  source.addEventListener('snapshot', (e) => {
    opened = true;
    try {
      handlers.onSnapshot(JSON.parse((e as MessageEvent).data) as LiveResponse);
    } catch {
      // A malformed frame is not worth tearing the stream down for; the next one will do.
    }
  });
  source.addEventListener('bar', (e) => {
    try {
      handlers.onBar(JSON.parse((e as MessageEvent).data) as LiveBarEvent);
    } catch {
      // As above.
    }
  });
  source.onerror = () => {
    if (opened || closed) {
      // Already streaming once, so this is a drop. EventSource retries on its own.
      return;
    }
    closed = true;
    source.close();
    handlers.onFallback('This instrument has no live stream; following it by polling instead.');
  };

  return () => {
    closed = true;
    source.close();
  };
}

/**
 * Merge a live reading into bars already on screen.
 *
 * The incoming tail overlaps what we hold, and the overlapping rows may have been revised, so
 * the newer copy wins. Returning a fresh array rather than mutating keeps React's identity
 * check meaningful.
 */
export function mergeLive(existing: Bar[], incoming: Bar[]): Bar[] {
  if (!incoming.length) return existing;
  const firstNew = incoming[0].time;
  const kept = existing.filter((b) => b.time < firstNew);
  return [...kept, ...incoming];
}
