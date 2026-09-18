/**
 * A Feed owns the generated base series for one symbol and reveals it progressively.
 * The global "market clock" is a base-bar index (`cursor`) plus a sub-tick (0..SUBTICKS-1)
 * that lets a one-minute bar form in four steps so learners can watch candles being built.
 *
 * Aggregated timeframe views are cached and updated incrementally.
 */
import { BaseSeries, aggregate, mergeBar } from './generator';
import type { SymbolSpec } from './symbols';
import type { Bar, Timeframe } from './types';
import { TIMEFRAMES } from './types';
import { hashString } from '@/lib/rng';

export const SUBTICKS = 4;
const CHUNK = 390 * 5; // extend five days at a time

export class Feed {
  readonly spec: SymbolSpec;
  readonly series: BaseSeries;
  private views = new Map<Timeframe, { bars: Bar[]; upto: number }>();

  constructor(spec: SymbolSpec, seed: string) {
    this.spec = spec;
    this.series = new BaseSeries(spec, seed);
  }

  ensure(uptoIndex: number) {
    while (this.series.length <= uptoIndex + 2) this.series.extend(CHUNK);
  }

  baseBar(i: number): Bar {
    this.ensure(i);
    return this.series.bar(i);
  }

  /**
   * Price path inside base bar `i` at sub-tick `k` (0..SUBTICKS-1). The path starts at the
   * open, visits both extremes in a random order, and ends at the close so the partial bar
   * is always consistent with the finished bar.
   */
  subPrice(i: number, k: number): number {
    const b = this.baseBar(i);
    if (k >= SUBTICKS - 1) return b.close;
    // deterministic per bar: which extreme first?
    const highFirst = (hashString(`${this.spec.symbol}:${i}`) & 1) === 0;
    const first = highFirst ? b.high : b.low;
    const second = highFirst ? b.low : b.high;
    if (k === 0) return first;
    if (k === 1) return second;
    // k === 2: somewhere between the second extreme and the close (deterministic per bar)
    const t = 0.35 + 0.3 * (((hashString(`${this.spec.symbol}:${i}:mid`) >>> 8) % 1000) / 1000);
    return second + (b.close - second) * t;
  }

  /** The partially formed base bar after sub-tick `k` of bar `i`. */
  partialBar(i: number, k: number): Bar {
    const b = this.baseBar(i);
    if (k >= SUBTICKS - 1) return b;
    let hi = b.open;
    let lo = b.open;
    let close = b.open;
    for (let j = 0; j <= k; j++) {
      const p = this.subPrice(i, j);
      hi = Math.max(hi, p);
      lo = Math.min(lo, p);
      close = p;
    }
    return { time: b.time, open: b.open, high: hi, low: lo, close, volume: Math.round((b.volume * (k + 1)) / SUBTICKS) };
  }

  /**
   * Completed timeframe bars covering base bars [0, cursor). Cached and extended incrementally.
   */
  completed(tf: Timeframe, cursor: number): Bar[] {
    this.ensure(cursor);
    let v = this.views.get(tf);
    if (!v || v.upto > cursor) {
      v = { bars: aggregate(this.series, 0, cursor, tf), upto: cursor };
      this.views.set(tf, v);
      return v.bars;
    }
    while (v.upto < cursor) {
      mergeBar(v.bars, this.series.bar(v.upto), tf);
      v.upto++;
    }
    return v.bars;
  }

  /**
   * Full chart data for a timeframe at clock (cursor, subtick): all completed bars plus the
   * forming bar. Returns a *copy* of the last bar merged with the partial base bar so the
   * cache stays clean.
   */
  chartBars(tf: Timeframe, cursor: number, subtick: number): Bar[] {
    const done = this.completed(tf, cursor);
    const partial = this.partialBar(cursor, subtick);
    const merged = done.slice();
    const last = merged[merged.length - 1];
    const bucketOf = (b: Bar) => mergeBar([], b, tf).bars[0].time;
    const pb = bucketOf(partial);
    if (last && last.time === pb) {
      merged[merged.length - 1] = { ...last, high: Math.max(last.high, partial.high), low: Math.min(last.low, partial.low), close: partial.close, volume: last.volume + partial.volume };
    } else {
      merged.push({ time: pb, open: partial.open, high: partial.high, low: partial.low, close: partial.close, volume: partial.volume });
    }
    return merged;
  }

  /** Current traded price at the clock. */
  price(cursor: number, subtick: number): number {
    return this.subPrice(cursor, subtick);
  }

  /** Number of base bars in one bar of `tf` starting at base index i (for stepping). */
  static tfList() {
    return TIMEFRAMES;
  }
}

/** Registry of feeds keyed by symbol; created lazily so unused symbols cost nothing. */
export class Market {
  private feeds = new Map<string, Feed>();
  constructor(
    public readonly seed: string,
    private specs: SymbolSpec[],
  ) {}

  feed(symbol: string): Feed {
    let f = this.feeds.get(symbol);
    if (!f) {
      const spec = this.specs.find((s) => s.symbol === symbol);
      if (!spec) throw new Error(`Unknown symbol ${symbol}`);
      f = new Feed(spec, this.seed);
      this.feeds.set(symbol, f);
    }
    return f;
  }

  loaded(): string[] {
    return [...this.feeds.keys()];
  }
}
