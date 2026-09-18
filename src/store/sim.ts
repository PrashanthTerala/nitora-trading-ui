/**
 * The simulator store: a global market clock, the paper-trading account and the
 * chart/view preferences. Persisted to localStorage so a session survives reloads;
 * the market itself is regenerated deterministically from the seed.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Market, SUBTICKS } from '@/engine/market/feed';
import { SYMBOLS, SYMBOL_MAP } from '@/engine/market/symbols';
import { bucketStart, minuteOfSession } from '@/engine/market/generator';
import type { Bar, Timeframe } from '@/engine/market/types';
import {
  createAccount,
  placeOrder as brokerPlace,
  cancelOrder as brokerCancel,
  cancelAll as brokerCancelAll,
  closePosition as brokerClose,
  setPositionExit as brokerSetExit,
  processTick,
  checkMargin,
  recordEquity,
  updateTrade as brokerUpdateTrade,
  type NewOrderInput,
  type PriceMap,
} from '@/engine/broker/broker';
import type { AccountSettings, AccountState, Order, Trade } from '@/engine/broker/types';

export const START_CURSOR = 80 * 390; // 80 trading days of history before "today"

let market = new Market('tradelab-1', SYMBOLS);
let lastPrices: PriceMap = {};

export function getMarket() {
  return market;
}

export interface Overlays {
  sma20: boolean;
  sma50: boolean;
  ema9: boolean;
  ema21: boolean;
  bb: boolean;
  vwap: boolean;
  volume: boolean;
  rsi: boolean;
  macd: boolean;
}

interface SimState {
  seed: string;
  symbol: string;
  timeframe: Timeframe;
  cursor: number;
  subtick: number;
  playing: boolean;
  speed: number; // sub-ticks per second
  account: AccountState;
  overlays: Overlays;
  clock: number; // increments on every tick; components subscribe to it
  hydrated: boolean;

  setSymbol: (s: string) => void;
  setTimeframe: (tf: Timeframe) => void;
  setPlaying: (p: boolean) => void;
  setSpeed: (s: number) => void;
  toggleOverlay: (k: keyof Overlays) => void;
  advance: (n: number) => void;
  stepBar: () => void;
  placeOrder: (input: NewOrderInput) => Order;
  cancelOrder: (id: string) => void;
  cancelAll: (symbol?: string) => void;
  closePosition: (symbol: string, qty?: number) => void;
  setExit: (symbol: string, kind: 'stop_loss' | 'take_profit', price: number | null) => void;
  updateTrade: (id: string, patch: Partial<Pick<Trade, 'tags' | 'notes' | 'mistakes'>>) => void;
  resetAccount: (settings?: Partial<AccountSettings>) => void;
  newMarket: (seed?: string) => void;
  setHydrated: () => void;
}

export function currentTime(cursor: number, subtick: number) {
  const f = market.feed(SYMBOLS[0].symbol);
  return f.baseBar(cursor).time + subtick * Math.floor(60 / SUBTICKS);
}

export function pricesAt(cursor: number, subtick: number, symbols: string[]): PriceMap {
  const out: PriceMap = {};
  for (const s of symbols) out[s] = market.feed(s).price(cursor, subtick);
  return out;
}

function relevantSymbols(acc: AccountState, active: string) {
  const set = new Set<string>([active]);
  for (const p of Object.keys(acc.positions)) set.add(p);
  for (const o of acc.orders) if (o.status === 'working') set.add(o.symbol);
  return [...set];
}

export const useSim = create<SimState>()(
  persist(
    (set, get) => ({
      seed: 'tradelab-1',
      symbol: 'NOVA',
      timeframe: '5m',
      cursor: START_CURSOR,
      subtick: SUBTICKS - 1,
      playing: false,
      speed: 8,
      account: createAccount(),
      overlays: { sma20: false, sma50: false, ema9: false, ema21: true, bb: false, vwap: false, volume: true, rsi: false, macd: false },
      clock: 0,
      hydrated: false,

      setSymbol: (symbol) => set({ symbol }),
      setTimeframe: (timeframe) => set({ timeframe }),
      setPlaying: (playing) => set({ playing }),
      setSpeed: (speed) => set({ speed: Math.max(1, Math.min(400, speed)) }),
      toggleOverlay: (k) => set((s) => ({ overlays: { ...s.overlays, [k]: !s.overlays[k] } })),

      advance: (n) => {
        let { cursor, subtick, account } = get();
        const { symbol } = get();
        const feed = market.feed(symbol);
        let prevPrice = feed.price(cursor, subtick);
        for (let i = 0; i < n; i++) {
          if (subtick < SUBTICKS - 1) subtick++;
          else {
            cursor++;
            subtick = 0;
          }
          const time = currentTime(cursor, subtick);
          const price = feed.price(cursor, subtick);
          const isNewDay = subtick === 0 && minuteOfSession(feed.baseBar(cursor).time) === 0;
          // Only a session open is a real gap; inside a session the price path is continuous.
          const open = feed.baseBar(cursor).open;
          const gapped = isNewDay && Math.abs(open - prevPrice) / (prevPrice || 1) > 0.0005;
          account = processTick(account, { symbol, price, high: Math.max(prevPrice, price), low: Math.min(prevPrice, price), time, isNewDay, gapped });
          prevPrice = price;

          if (subtick === SUBTICKS - 1) {
            // base bar complete: evaluate other symbols on their finished bar
            const others = relevantSymbols(account, symbol).filter((s) => s !== symbol);
            for (const s of others) {
              const b = market.feed(s).baseBar(cursor);
              // The intrabar path of a symbol we are not watching is unknown, so stops are
              // assumed to fill at their trigger, the standard backtesting convention.
              account = processTick(account, { symbol: s, price: b.close, high: b.high, low: b.low, time, isNewDay });
            }
            const syms = relevantSymbols(account, symbol);
            lastPrices = pricesAt(cursor, subtick, syms);
            account = checkMargin(account, lastPrices, time);
            account = recordEquity(account, lastPrices, time);
          }
        }
        set((s) => ({ cursor, subtick, account, clock: s.clock + n }));
      },

      stepBar: () => {
        const { cursor, timeframe, symbol } = get();
        const feed = market.feed(symbol);
        const startBucket = bucketStart(feed.baseBar(cursor).time, timeframe);
        // find the last base index of the *next* bucket
        let j = cursor + 1;
        while (bucketStart(feed.baseBar(j).time, timeframe) === startBucket) j++;
        const nextBucket = bucketStart(feed.baseBar(j).time, timeframe);
        let k = j;
        while (bucketStart(feed.baseBar(k + 1).time, timeframe) === nextBucket) k++;
        const { subtick } = get();
        const ticks = (k - cursor) * SUBTICKS + (SUBTICKS - 1 - subtick);
        get().advance(ticks);
      },

      placeOrder: (input) => {
        const { account, cursor, subtick, symbol } = get();
        const syms = relevantSymbols(account, symbol);
        if (!syms.includes(input.symbol)) syms.push(input.symbol);
        const prices = pricesAt(cursor, subtick, syms);
        const res = brokerPlace(account, input, currentTime(cursor, subtick), prices);
        // market orders fill immediately at the current price
        let acc = res.acc;
        if (res.order.status === 'working' && res.order.type === 'market') {
          const p = prices[input.symbol];
          acc = processTick(acc, { symbol: input.symbol, price: p, high: p, low: p, time: currentTime(cursor, subtick) });
          acc = recordEquity(acc, prices, currentTime(cursor, subtick));
        }
        set({ account: acc });
        return acc.orders.find((o) => o.id === res.order.id) ?? res.order;
      },
      cancelOrder: (id) => set((s) => ({ account: brokerCancel(s.account, id, currentTime(s.cursor, s.subtick)) })),
      cancelAll: (symbol) => set((s) => ({ account: brokerCancelAll(s.account, currentTime(s.cursor, s.subtick), symbol) })),
      closePosition: (symbol, qty) => {
        const { account, cursor, subtick } = get();
        const prices = pricesAt(cursor, subtick, [symbol]);
        const time = currentTime(cursor, subtick);
        let acc = brokerClose(account, symbol, time, prices, qty);
        acc = processTick(acc, { symbol, price: prices[symbol], high: prices[symbol], low: prices[symbol], time });
        acc = recordEquity(acc, prices, time);
        set({ account: acc });
      },
      setExit: (symbol, kind, price) => {
        const { account, cursor, subtick } = get();
        const prices = pricesAt(cursor, subtick, [symbol]);
        set({ account: brokerSetExit(account, symbol, kind, price, currentTime(cursor, subtick), prices) });
      },
      updateTrade: (id, patch) => set((s) => ({ account: brokerUpdateTrade(s.account, id, patch) })),
      resetAccount: (settings) => set((s) => ({ account: createAccount({ ...s.account.settings, ...settings }) })),
      newMarket: (seed) => {
        const s = seed ?? `tradelab-${Math.random().toString(36).slice(2, 8)}`;
        market = new Market(s, SYMBOLS);
        lastPrices = {};
        set({ seed: s, cursor: START_CURSOR, subtick: SUBTICKS - 1, playing: false, clock: 0 });
      },
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'tradelab-sim-v1',
      partialize: (s) => ({ seed: s.seed, symbol: s.symbol, timeframe: s.timeframe, cursor: s.cursor, subtick: s.subtick, speed: s.speed, account: s.account, overlays: s.overlays }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          market = new Market(state.seed, SYMBOLS);
          state.setHydrated();
        }
      },
    },
  ),
);

/** Chart data for the active symbol at the current clock. */
export function chartBars(symbol: string, tf: Timeframe, cursor: number, subtick: number): Bar[] {
  return market.feed(symbol).chartBars(tf, cursor, subtick);
}

export function currentPrice(symbol: string) {
  const { cursor, subtick } = useSim.getState();
  return market.feed(symbol).price(cursor, subtick);
}

export function allPrices(): PriceMap {
  const { cursor, subtick } = useSim.getState();
  return pricesAt(cursor, subtick, SYMBOLS.map((s) => s.symbol));
}

export function specOf(symbol: string) {
  return SYMBOL_MAP[symbol];
}

/** Drive the clock from a component via requestAnimationFrame-ish interval. */
export function startClock() {
  let last = performance.now();
  let carry = 0;
  const id = window.setInterval(() => {
    const st = useSim.getState();
    if (!st.playing) {
      last = performance.now();
      carry = 0;
      return;
    }
    const now = performance.now();
    carry += ((now - last) / 1000) * st.speed;
    last = now;
    const n = Math.floor(carry);
    if (n > 0) {
      carry -= n;
      st.advance(Math.min(n, 400));
    }
  }, 40);
  return () => window.clearInterval(id);
}
