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
    throw new DataApiError('Cannot reach the data service. Start it with "mvnw spring-boot:run" in the server folder.', 'offline');
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
