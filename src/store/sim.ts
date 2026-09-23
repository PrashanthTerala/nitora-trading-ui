/**
 * The simulator store: a global market clock, the paper-trading account and the
 * chart/view preferences. Persisted to localStorage so a session survives reloads;
 * the market itself is regenerated deterministically from the seed.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Market, SUBTICKS } from '@/engine/market/feed';
import { RealFeed, fetchRealHistory, fetchRealSymbols, fetchLive, livePollMs, mergeLive, openLiveStream, type RealSymbolSpec, type LiveResponse } from '@/engine/market/realFeed';
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
import { STORAGE_KEYS } from '@/lib/storageKeys';

export const START_CURSOR = 80 * 390; // 80 trading days of history before "today"

/**
 * The market a first-time visitor gets. The string is the generator's input, not a label: change it
 * and every price in the default market changes.
 *
 * Chosen, not arbitrary. Lessons describe typical price levels, and tools/check-prices.mjs holds
 * their figures to bands sampled across many seeds -- but it never looks at this one, so a default
 * that happens to open an instrument far from typical passes the check while making the lessons
 * read wrong. The first candidate, 'nitora-1', opened BIOX at 33.83 against a base of 18.40.
 * This seed was picked from 'nitora-1' to 'nitora-300' as the one whose opening market is most
 * typical across all eight instruments: each opens between 27% and 89% of the way through its
 * 5th-to-95th percentile range. The old default, 'tradelab-1', had two instruments outside it.
 *
 * A returning reader keeps whatever seed their saved session holds, so their open positions are
 * still priced against the market that created them.
 */
export const DEFAULT_SEED = 'nitora-209';

let market = new Market(DEFAULT_SEED, SYMBOLS);
let lastPrices: PriceMap = {};

/**
 * Real-data replay state lives outside the store because a RealFeed holds thousands of
 * bars and must never be written to localStorage. It is refetched on demand instead.
 */
let realFeed: RealFeed | null = null;
let realLoadToken = 0;

export function getMarket() {
  return market;
}

export function getRealFeed() {
  return realFeed;
}

export type DataSource = 'synthetic' | 'real' | 'live';

/** Both real modes read from RealFeed; only the clock that drives them differs. */
export const usesRealFeed = (s: DataSource) => s !== 'synthetic';

/** Live polling handle, module-scoped for the same reason the feed is: never persisted. */
let livePoll: number | null = null;
let closeLiveStream: (() => void) | null = null;

/** How a streamed bar arrived: whether it is still forming, and when the browser received it. */
interface LiveTick {
  forming: boolean;
  receivedAt: number;
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

  /** Which market the simulator is replaying. Synthetic is the default and works offline. */
  source: DataSource;
  realSymbol: string;
  realSymbols: RealSymbolSpec[];
  realStatus: 'idle' | 'loading' | 'ready' | 'error';
  realError: string | null;
  realMeta: { source: string; cached?: boolean; stale?: boolean; bars: number } | null;
  /** Freshness facts for live mode, so the interface can be honest about what it is showing. */
  liveMeta: { marketOpen: boolean; kind?: string; delayHint: number | null; asOf: number; forming: boolean } | null;

  setSymbol: (s: string) => void;
  setTimeframe: (tf: Timeframe) => void;
  setPlaying: (p: boolean) => void;
  setSpeed: (s: number) => void;
  toggleOverlay: (k: keyof Overlays) => void;
  advance: (n: number) => void;
  advanceReal: (n: number) => void;
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
  setSource: (s: DataSource) => void;
  setRealSymbol: (s: string) => void;
  loadReal: () => Promise<void>;
  loadSymbols: () => Promise<void>;
  startLive: () => void;
  startLivePolling: () => void;
  stopLive: () => void;
  pollLive: () => Promise<void>;
  applyLive: (bars: Bar[], meta?: LiveResponse, tick?: LiveTick) => void;
}

export function currentTime(cursor: number, subtick: number) {
  if (usesRealFeed(useSim.getState().source) && realFeed) {
    // Real bars carry their own timestamps; spread sub-ticks across the bar's span.
    const i = realFeed.clamp(cursor);
    const b = realFeed.baseBar(i);
    const next = realFeed.baseBar(Math.min(i + 1, realFeed.length - 1));
    const span = Math.max(60, next.time - b.time);
    return b.time + Math.floor((subtick * span) / SUBTICKS);
  }
  const f = market.feed(SYMBOLS[0].symbol);
  return f.baseBar(cursor).time + subtick * Math.floor(60 / SUBTICKS);
}

export function pricesAt(cursor: number, subtick: number, symbols: string[]): PriceMap {
  const out: PriceMap = {};
  if (usesRealFeed(useSim.getState().source)) {
    // Only the replayed instrument exists in real mode; nothing else has prices.
    if (realFeed) out[realFeed.symbol] = realFeed.price(cursor, subtick);
    return out;
  }
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
      seed: DEFAULT_SEED,
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
      source: 'synthetic',
      /**
       * Crypto by default for both real modes, because it is the only instrument class that
       * is genuinely live: it trades continuously and measured with no detectable feed delay.
       * Starting on an equity meant a first click on Live landed on "Market closed" most
       * hours of most days, or on delayed prices during a session. An equity is two clicks
       * away and its replay history is just as good.
       */
      realSymbol: 'BTC-USD',
      realSymbols: [],
      realStatus: 'idle',
      realError: null,
      realMeta: null,
      liveMeta: null,

      setSymbol: (symbol) => set({ symbol }),
      setTimeframe: (timeframe) => {
        set({ timeframe });
        // Real data is fetched per timeframe rather than aggregated from one base series.
        const src = get().source;
        if (src === 'real') void get().loadReal();
        // The poll interval is derived from the timeframe, so live has to re-arm, not just refetch.
        if (src === 'live') get().startLive();
      },
      // Live mode follows the wall clock; there is nothing to play, pause or step.
      setPlaying: (playing) => set({ playing: get().source === 'live' ? false : playing }),
      setSpeed: (speed) => set({ speed: Math.max(1, Math.min(400, speed)) }),
      toggleOverlay: (k) => set((s) => ({ overlays: { ...s.overlays, [k]: !s.overlays[k] } })),

      advance: (n) => {
        if (usesRealFeed(get().source)) {
          get().advanceReal(n);
          return;
        }
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
        if (usesRealFeed(get().source)) {
          // One real bar is exactly one cursor step, so finish the forming bar.
          get().advance(SUBTICKS - get().subtick);
          return;
        }
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
      /**
       * Rolling a new market also starts a fresh account, deliberately.
       * Every position, order and equity point refers to the old price series, so
       * carrying them into an unrelated one would invent profit out of nothing: a
       * position opened at 62 would be marked against a series that now starts near
       * 142, and resting orders would sit at prices that no longer mean anything.
       * The configured settings (cash, leverage, costs) are kept, since those are a
       * deliberate choice rather than a result.
       */
      newMarket: (seed) => {
        // Guard against being wired straight to an onClick, which would pass the event.
        const s = typeof seed === 'string' && seed ? seed : `nitora-${Math.random().toString(36).slice(2, 8)}`;
        market = new Market(s, SYMBOLS);
        lastPrices = {};
        set((prev) => ({
          seed: s,
          cursor: START_CURSOR,
          subtick: SUBTICKS - 1,
          playing: false,
          clock: 0,
          account: createAccount(prev.account.settings),
        }));
      },
      setHydrated: () => set({ hydrated: true }),

      /**
       * Real-data replay. One bar of the chosen timeframe per cursor step, and only the
       * replayed instrument has a price, so there are no other symbols to evaluate.
       * The replay stops at the last bar the provider gave us rather than looping.
       */
      advanceReal: (n) => {
        const feed = realFeed;
        if (!feed) return;
        let { cursor, subtick, account } = get();
        const symbol = feed.symbol;
        let prevPrice = feed.price(cursor, subtick);
        let steps = 0;
        for (let i = 0; i < n; i++) {
          if (feed.exhausted(cursor) && subtick >= SUBTICKS - 1) break;
          if (subtick < SUBTICKS - 1) subtick++;
          else {
            cursor++;
            subtick = 0;
          }
          steps++;
          const time = currentTime(cursor, subtick);
          const price = feed.price(cursor, subtick);
          const bar = feed.baseBar(cursor);
          const newBar = subtick === 0;
          // Between two real bars nothing traded, so a jump at a bar open is a true gap.
          const gapped = newBar && Math.abs(bar.open - prevPrice) / (prevPrice || 1) > 0.0005;
          account = processTick(account, {
            symbol,
            price,
            high: Math.max(prevPrice, price),
            low: Math.min(prevPrice, price),
            time,
            isNewDay: newBar,
            gapped,
          });
          prevPrice = price;
          if (subtick === SUBTICKS - 1) {
            lastPrices = { [symbol]: price };
            account = checkMargin(account, lastPrices, time);
            account = recordEquity(account, lastPrices, time);
          }
        }
        if (steps === 0) {
          set({ playing: false });
          return;
        }
        set((st) => ({ cursor, subtick, account, clock: st.clock + steps, playing: feed.exhausted(cursor) ? false : st.playing }));
      },

      /**
       * Live mode runs on the wall clock, not the replay clock. There is no Play, Step or speed:
       * the market moves when it moves. Each poll replaces the tail of the series, so the final
       * candle grows in front of you the way it does on a real platform.
       */
      startLive: () => {
        get().stopLive();
        const { realSymbol, timeframe } = get();
        set({ realStatus: 'loading', realError: null });
        closeLiveStream = openLiveStream(realSymbol, timeframe, {
          onSnapshot: (res) => {
            if (useSim.getState().source !== 'live') return;
            get().applyLive(res.bars, res);
          },
          onBar: (event) => {
            const st = useSim.getState();
            if (st.source !== 'live' || !realFeed) return;
            // One bar at a time, merged the same way a polled tail is: the incoming bar
            // replaces any bar at or after its own timestamp, so the forming candle is
            // rewritten in place rather than appended over and over.
            get().applyLive(mergeLive(realFeed.bars, [event.bar]), undefined, {
              forming: event.forming,
              receivedAt: Math.floor(Date.now() / 1000),
            });
          },
          onFallback: (reason) => {
            if (useSim.getState().source !== 'live') return;
            closeLiveStream = null;
            console.info('[live]', reason);
            get().startLivePolling();
          },
        });
      },

      /** The slower path: ask repeatedly. Used when no stream is available for this symbol. */
      startLivePolling: () => {
        if (livePoll !== null) return;
        void get().pollLive();
        const tick = () => {
          const st = useSim.getState();
          if (st.source !== 'live') return;
          void st.pollLive();
        };
        livePoll = window.setInterval(tick, livePollMs(get().timeframe));
      },

      stopLive: () => {
        if (livePoll !== null) {
          window.clearInterval(livePoll);
          livePoll = null;
        }
        if (closeLiveStream !== null) {
          closeLiveStream();
          closeLiveStream = null;
        }
      },

      /**
       * Install a new set of live bars, however they arrived.
       *
       * Shared by the stream and the poll so the two cannot drift: the only difference
       * between them is how often this runs and how many bars changed.
       */
      applyLive: (bars, meta, tick) => {
        const { realSymbol, timeframe } = get();
        if (!bars.length) return;
        const spec = get().realSymbols.find((x) => x.symbol === realSymbol);
        realFeed = new RealFeed(realSymbol, timeframe, bars, spec?.decimals ?? 2);
        set((st) => ({
          realStatus: 'ready',
          realError: null,
          realMeta: { source: meta?.source ?? st.realMeta?.source ?? 'stream', bars: bars.length },
          liveMeta: meta
            ? { marketOpen: meta.marketOpen, kind: meta.kind, delayHint: meta.delayHint, asOf: meta.asOf, forming: meta.forming }
            : st.liveMeta && tick
              ? {
                  // A bar event carries no market metadata: the session and the delay belong to
                  // the instrument, not to one bar, so only the age and the forming flag move.
                  ...st.liveMeta,
                  // Not the bar's own time. That is when its bucket opened, so using it made a
                  // price arriving every second read as minutes old on a five-minute chart. A
                  // forming bar is only published because a trade just happened, so its arrival
                  // is the price's age to within the one-second coalescing window. A closed bar
                  // can be published by the clock with no trade at all, so it leaves the age be.
                  asOf: tick.forming ? tick.receivedAt : st.liveMeta.asOf,
                  forming: tick.forming,
                }
              : st.liveMeta,
          // Sit on the newest bar. Live mode has no cursor of its own: the edge is the point.
          cursor: bars.length - 1,
          subtick: SUBTICKS - 1,
          clock: st.clock + 1,
        }));
        lastPrices = { [realSymbol]: bars[bars.length - 1].close };
      },

      pollLive: async () => {
        const token = ++realLoadToken;
        const { realSymbol, timeframe } = get();
        try {
          const res: LiveResponse = await fetchLive(realSymbol, timeframe);
          if (token !== realLoadToken || useSim.getState().source !== 'live') return;
          const merged = realFeed && realFeed.symbol === realSymbol && realFeed.timeframe === timeframe
            ? mergeLive(realFeed.bars, res.bars)
            : res.bars;
          get().applyLive(merged, res);
        } catch (e) {
          if (token !== realLoadToken) return;
          set({ realStatus: 'error', realError: e instanceof Error ? e.message : String(e) });
        }
      },

      setSource: (next) => {
        if (next === get().source) return;
        // Positions and orders are priced against the market that created them, so
        // carrying them across would invent profit exactly as a new market would.
        set((st) => ({
          source: next,
          playing: false,
          clock: 0,
          account: createAccount(st.account.settings),
          cursor: next === 'synthetic' ? START_CURSOR : 0,
          subtick: SUBTICKS - 1,
          realError: null,
        }));
        get().stopLive();
        if (next === 'real') void get().loadReal();
        if (next === 'live') get().startLive();
      },

      setRealSymbol: (sym) => {
        if (sym === get().realSymbol) return;
        set((st) => ({ realSymbol: sym, playing: false, account: createAccount(st.account.settings), clock: 0 }));
        if (get().source === 'live') get().startLive();
        else void get().loadReal();
      },

      /**
       * Just the instrument catalogue, for the picker.
       *
       * Separate from loadReal because the picker needs a list of names, not a series. It used
       * to bootstrap itself by calling loadReal, which in live mode fired a full history fetch
       * that raced the live poll and overwrote its metadata, so the freshness bar never
       * appeared. Fetching a list should not move the chart.
       */
      loadSymbols: async () => {
        if (get().realSymbols.length > 0) return;
        try {
          set({ realSymbols: await fetchRealSymbols() });
        } catch {
          // The picker falls back to showing the current symbol as plain text, and whichever
          // mode the user is in will surface the real error itself.
        }
      },

      /**
       * Fetch the chosen instrument and timeframe from the local data server. Each call
       * takes a token so a slow response for an instrument the user has already moved
       * away from cannot overwrite the current one.
       */
      loadReal: async () => {
        const token = ++realLoadToken;
        const { realSymbol, timeframe } = get();
        set({ realStatus: 'loading', realError: null });
        try {
          if (get().realSymbols.length === 0) {
            const list = await fetchRealSymbols();
            if (token !== realLoadToken) return;
            set({ realSymbols: list });
          }
          const res = await fetchRealHistory(realSymbol, timeframe);
          if (token !== realLoadToken) return;
          const spec = get().realSymbols.find((x) => x.symbol === realSymbol);
          realFeed = new RealFeed(realSymbol, timeframe, res.bars, spec?.decimals ?? 2);
          // Start part-way in so there is history on screen to read before the first trade.
          const start = Math.min(Math.max(60, Math.floor(res.bars.length * 0.6)), res.bars.length - 2);
          set((st) => ({
            realStatus: 'ready',
            realMeta: { source: res.source, cached: res.cached, stale: res.stale, bars: res.bars.length },
            cursor: Math.max(0, start),
            subtick: SUBTICKS - 1,
            clock: st.clock + 1,
            account: createAccount(st.account.settings),
          }));
        } catch (e) {
          if (token !== realLoadToken) return;
          realFeed = null;
          set({ realStatus: 'error', realError: e instanceof Error ? e.message : String(e), playing: false });
        }
      },
    }),
    {
      name: STORAGE_KEYS.sim,
      partialize: (s) => ({ seed: s.seed, symbol: s.symbol, timeframe: s.timeframe, cursor: s.cursor, subtick: s.subtick, speed: s.speed, account: s.account, overlays: s.overlays, source: s.source, realSymbol: s.realSymbol }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          market = new Market(state.seed, SYMBOLS);
          state.setHydrated();
          // Bars are never persisted, so a session resumed in real mode has no feed yet.
          if (state.source === 'real') void state.loadReal();
          // Live holds no bars across a reload either, and its clock is the wall clock.
          if (state.source === 'live') state.startLive();
        }
      },
    },
  ),
);

/** Chart data for the active symbol at the current clock, from whichever market is live. */
export function chartBars(symbol: string, tf: Timeframe, cursor: number, subtick: number): Bar[] {
  if (usesRealFeed(useSim.getState().source)) return realFeed ? realFeed.chartBars(cursor, subtick) : [];
  return market.feed(symbol).chartBars(tf, cursor, subtick);
}

/** The instrument actually being replayed, whichever mode is active. */
export function activeSymbol(): string {
  const st = useSim.getState();
  return usesRealFeed(st.source) ? st.realSymbol : st.symbol;
}

/** Decimal places for the active instrument. */
export function activeDecimals(): number {
  const st = useSim.getState();
  if (usesRealFeed(st.source)) return realFeed?.decimals ?? st.realSymbols.find((x) => x.symbol === st.realSymbol)?.decimals ?? 2;
  return SYMBOL_MAP[st.symbol]?.decimals ?? 2;
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
