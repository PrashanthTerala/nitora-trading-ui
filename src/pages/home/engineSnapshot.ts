/**
 * What the home page shows of the simulator: every instrument's opening price and day change,
 * and the default instrument's recent five-minute bars -- computed by the real engine at the
 * simulator's own default seed and clock, so it is exactly the market a first visit opens on.
 *
 * Loaded with a dynamic import when the browser is idle; generating eighty days of one-minute
 * bars per instrument is too much work to put in front of first paint.
 */
import { Market, SUBTICKS } from '@/engine/market/feed';
import { SYMBOLS } from '@/engine/market/symbols';
import type { OHLC } from '@/engine/market/types';
import { DEFAULT_SEED, DEFAULT_SYMBOL, START_CURSOR } from '@/lib/simDefaults';

export interface TickerRow {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  decimals: number;
}

export interface EngineSnapshot {
  ticker: TickerRow[];
  spark: { symbol: string; bars: OHLC[] };
}

export function computeSnapshot(sparkBars = 120): EngineSnapshot {
  const market = new Market(DEFAULT_SEED, SYMBOLS);
  const ticker = SYMBOLS.map((spec) => {
    const feed = market.feed(spec.symbol);
    const price = feed.price(START_CURSOR, SUBTICKS - 1);
    // Change against the previous session's last bar: the "day change" the simulator opens on.
    const prevClose = feed.baseBar(START_CURSOR - 1).close;
    return { symbol: spec.symbol, name: spec.name, price, changePct: ((price - prevClose) / prevClose) * 100, decimals: spec.decimals };
  });
  const bars = market
    .feed(DEFAULT_SYMBOL)
    .chartBars('5m', START_CURSOR, SUBTICKS - 1)
    .slice(-sparkBars)
    .map((b) => ({ o: b.open, h: b.high, l: b.low, c: b.close, v: b.volume }));
  return { ticker, spark: { symbol: DEFAULT_SYMBOL, bars } };
}
