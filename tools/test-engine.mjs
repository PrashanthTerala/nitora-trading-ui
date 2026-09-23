/**
 * Engine smoke tests. Run: node tools/test-engine.mjs
 * Uses tsx-free compilation by importing the TS through vite's esbuild via `npx vite-node`,
 * but to stay dependency-free we instead re-implement the harness against the built modules
 * using esbuild-register style dynamic import of the source through `--experimental-strip-types`
 * when available. Simplest portable route: import the transpiled files from a temp build.
 */
import { execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = mkdtempSync(join(tmpdir(), 'tl-test-'));

// Bundle the engine entry with esbuild (ships with vite) so we can import plain JS.
const entry = join(out, 'entry.ts');
writeFileSync(
  entry,
  `
export * from '${pathToFileURL(join(root, 'src/engine/broker/broker.ts')).href.replace('file:///', '/')}';
`,
);

// Simpler: use esbuild directly on a small entry that re-exports everything we need.
const shim = join(out, 'shim.ts');
writeFileSync(
  shim,
  `
import * as broker from '@/engine/broker/broker';
import * as stats from '@/engine/broker/stats';
import { Rng, shuffled } from '@/lib/rng';
import { csvCell, toCsv } from '@/lib/csv';
import { defaultQty } from '@/lib/sizing';
import { migrateStorage, LEGACY_KEYS, STORAGE_KEYS } from '@/lib/storageKeys';
import * as color from '@/lib/color';
import { parseTokens, resolve as resolveToken } from '@/lib/tokens';
import { Market } from '@/engine/market/feed';
import { RealFeed, resolveDataApi } from '@/engine/market/realFeed';
import { SYMBOLS, SYMBOL_MAP } from '@/engine/market/symbols';
import { aggregate, bucketStart, nextSessionMinute, minuteOfSession } from '@/engine/market/generator';
import * as ind from '@/engine/market/indicators';
import { parseFlags, FLAG_DEFAULTS } from '@/lib/flags';
import { translate } from '@/i18n';
import { en } from '@/i18n/en';
import * as curriculum from '@/content/curriculum';
import { computeSnapshot } from '@/pages/home/engineSnapshot';
import { DEFAULT_SEED, START_CURSOR } from '@/lib/simDefaults';
export { parseFlags, FLAG_DEFAULTS, translate, en, curriculum, computeSnapshot, DEFAULT_SEED, START_CURSOR, color, parseTokens, resolveToken, broker, stats, Rng, shuffled, csvCell, toCsv, defaultQty, migrateStorage, LEGACY_KEYS, STORAGE_KEYS, resolveDataApi, Market, RealFeed, SYMBOLS, SYMBOL_MAP, aggregate, bucketStart, nextSessionMinute, minuteOfSession, ind };
`,
);

const bundle = join(out, 'bundle.mjs');
execSync(
  `npx esbuild "${shim}" --bundle --format=esm --platform=node --outfile="${bundle}" --alias:@=./src --log-level=error`,
  { cwd: root, stdio: 'inherit' },
);

const M = await import(pathToFileURL(bundle).href);
const { parseFlags, FLAG_DEFAULTS, translate, en, curriculum, computeSnapshot, DEFAULT_SEED, START_CURSOR, color, parseTokens, resolveToken, broker, stats, Rng, shuffled, csvCell, toCsv, defaultQty, migrateStorage, LEGACY_KEYS, STORAGE_KEYS, resolveDataApi, Market, RealFeed, SYMBOLS, ind } = M;

let pass = 0;
let fail = 0;
const results = [];
function check(name, cond, detail = '') {
  if (cond) {
    pass++;
    results.push(`  ok   ${name}`);
  } else {
    fail++;
    results.push(`  FAIL ${name}${detail ? ' — ' + detail : ''}`);
  }
}
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

// ---------------------------------------------------------------- indicators
{
  const v = [10, 11, 12, 13, 14];
  const s = ind.sma(v, 3);
  check('SMA(3) of 10,11,12 = 11', near(s[2], 11));
  check('SMA leading values are NaN', Number.isNaN(s[0]) && Number.isNaN(s[1]));
  const e = ind.ema([1, 2, 3, 4, 5, 6], 3);
  check('EMA seeds with SMA at index period-1', near(e[2], 2));
  // RSI of a monotonically rising series is 100
  const up = Array.from({ length: 40 }, (_, i) => 100 + i);
  const r = ind.rsi(up, 14);
  check('RSI of a pure uptrend is 100', near(r[39], 100, 1e-6));
  const flat = Array.from({ length: 40 }, () => 100);
  const rf = ind.rsi(flat, 14);
  check('RSI of a flat series is not NaN', !Number.isNaN(rf[39]));
  // ATR on known bars
  const bars = [
    { o: 10, h: 12, l: 9, c: 11 },
    { o: 11, h: 13, l: 10, c: 12 },
    { o: 12, h: 14, l: 11, c: 13 },
  ];
  const tr = ind.trueRange(bars);
  check('True range bar 0 is high-low', near(tr[0], 3));
  check('True range bar 1 accounts for prior close', near(tr[1], 3));
  const bb = ind.bollinger([2, 4, 4, 4, 5, 5, 7, 9], 8, 2);
  check('Bollinger middle equals the mean (5)', near(bb.middle[7], 5));
  check('Bollinger band width uses sd=2', near(bb.upper[7], 9) && near(bb.lower[7], 1));
}

// ---------------------------------------------------------------- market
{
  const m = new Market('test-seed', SYMBOLS);
  const f = m.feed('NOVA');
  f.ensure(2000);
  const s = f.series;
  let ascending = true;
  let ohlcValid = true;
  for (let i = 0; i < 2000; i++) {
    if (i > 0 && s.time.get(i) <= s.time.get(i - 1)) ascending = false;
    const b = s.bar(i);
    if (b.high < Math.max(b.open, b.close) - 1e-9 || b.low > Math.min(b.open, b.close) + 1e-9) ohlcValid = false;
    if (!(b.close > 0)) ohlcValid = false;
  }
  check('base bar times strictly ascending', ascending);
  check('every base bar satisfies low <= o,c <= high and price > 0', ohlcValid);

  // determinism
  const m2 = new Market('test-seed', SYMBOLS);
  const f2 = m2.feed('NOVA');
  f2.ensure(500);
  let same = true;
  for (let i = 0; i < 500; i++) if (!near(f.series.close.get(i), f2.series.close.get(i))) same = false;
  check('same seed reproduces the same series', same);

  const m3 = new Market('other-seed', SYMBOLS);
  const f3 = m3.feed('NOVA');
  f3.ensure(500);
  let diff = false;
  for (let i = 0; i < 500; i++) if (!near(f.series.close.get(i), f3.series.close.get(i))) diff = true;
  check('a different seed produces a different series', diff);

  // session clock: no bars outside 09:30-16:00 and none on weekends
  let inSession = true;
  for (let i = 0; i < 2000; i++) {
    const t = s.time.get(i);
    const d = new Date(t * 1000);
    const mins = d.getUTCHours() * 60 + d.getUTCMinutes();
    if (mins < 570 || mins >= 960) inSession = false;
    const day = d.getUTCDay();
    if (day === 0 || day === 6) inSession = false;
  }
  check('all bars fall inside Mon-Fri 09:30-16:00 UTC', inSession);

  // aggregation invariants
  for (const tf of ['5m', '1h', '1D']) {
    const agg = M.aggregate(s, 0, 1950, tf);
    let ok = agg.length > 0;
    let volSum = 0;
    for (const b of agg) {
      if (b.high < Math.max(b.open, b.close) - 1e-9 || b.low > Math.min(b.open, b.close) + 1e-9) ok = false;
      volSum += b.volume;
    }
    let baseVol = 0;
    for (let i = 0; i < 1950; i++) baseVol += s.volume.get(i);
    check(`aggregate ${tf} produces valid OHLC`, ok);
    check(`aggregate ${tf} conserves volume`, near(volSum, baseVol, 1));
  }

  // the forming bar is consistent with the finished bar
  const cursor = 1000;
  let partialOk = true;
  for (let k = 0; k < 4; k++) {
    const p = f.partialBar(cursor, k);
    const full = f.baseBar(cursor);
    if (p.high > full.high + 1e-9 || p.low < full.low - 1e-9) partialOk = false;
    if (k === 3 && (!near(p.close, full.close) || !near(p.high, full.high) || !near(p.low, full.low))) partialOk = false;
  }
  check('partial bars stay inside the final bar and converge to it', partialOk);

  // Calibration: an instrument must realize roughly the volatility its spec claims,
  // otherwise "a calm blue chip" is a lie and no lesson example can quote a price.
  for (const spec of SYMBOLS) {
    const ratios = [];
    const ranges = [];
    for (let k = 0; k < 4; k++) {
      const ff = new Market('calib-' + k, SYMBOLS).feed(spec.symbol);
      const NN = 40 * 390;
      ff.ensure(NN + 5);
      const c = ff.series.close;
      let sum = 0;
      let sum2 = 0;
      let lo = Infinity;
      let hi = -Infinity;
      for (let i = 1; i < NN; i++) {
        const r = Math.log(c.get(i) / c.get(i - 1));
        sum += r;
        sum2 += r * r;
        lo = Math.min(lo, c.get(i));
        hi = Math.max(hi, c.get(i));
      }
      const nn = NN - 1;
      const mean = sum / nn;
      ratios.push((Math.sqrt(sum2 / nn - mean * mean) * Math.sqrt(252 * 390)) / spec.annualVol);
      ranges.push(hi / lo);
    }
    const med = [...ratios].sort((a, b) => a - b)[1];
    check(`${spec.symbol} realizes close to its specified volatility`, med > 0.7 && med < 1.35, `ratio=${med.toFixed(2)}`);
    const maxRange = Math.max(...ranges);
    check(`${spec.symbol} stays within a believable price band`, maxRange < 6, `range=${maxRange.toFixed(1)}x`);
  }
}

// ---------------------------------------------------------------- broker
{
  const P = (sym, p) => ({ [sym]: p });

  // 1. market buy fills and creates a position
  let a = broker.createAccount({ startingCash: 100000, commissionPerOrder: 0, slippageBps: 0, leverage: 2 });
  let r = broker.placeOrder(a, { symbol: 'X', side: 'buy', qty: 100, type: 'market' }, 1000, P('X', 50));
  a = r.acc;
  a = broker.processTick(a, { symbol: 'X', price: 50, high: 50, low: 50, time: 1000 });
  check('market buy creates a long position', a.positions.X?.qty === 100 && near(a.positions.X.avgPrice, 50));
  check('cash reduced by the notional', near(a.cash, 100000 - 5000));
  check('equity unchanged right after entry', near(broker.equity(a, P('X', 50)), 100000));

  // 2. selling all closes and books a trade
  r = broker.placeOrder(a, { symbol: 'X', side: 'sell', qty: 100, type: 'market', reduceOnly: true }, 2000, P('X', 55));
  a = r.acc;
  a = broker.processTick(a, { symbol: 'X', price: 55, high: 55, low: 55, time: 2000 });
  check('closing removes the position', !a.positions.X);
  check('one trade recorded', a.trades.length === 1);
  check('trade P&L is 500', near(a.trades[0].pnl, 500));
  check('cash is 100500', near(a.cash, 100500));

  // 3. short sells, profits when price falls
  a = broker.createAccount({ startingCash: 100000, commissionPerOrder: 0, slippageBps: 0, leverage: 2 });
  r = broker.placeOrder(a, { symbol: 'X', side: 'sell', qty: 100, type: 'market' }, 1000, P('X', 50));
  a = broker.processTick(r.acc, { symbol: 'X', price: 50, high: 50, low: 50, time: 1000 });
  check('short creates a negative position', a.positions.X?.qty === -100);
  check('short equity is flat at entry', near(broker.equity(a, P('X', 50)), 100000));
  check('short gains when price falls', near(broker.equity(a, P('X', 45)), 100500));
  check('short loses when price rises', near(broker.equity(a, P('X', 55)), 99500));
  r = broker.placeOrder(a, { symbol: 'X', side: 'buy', qty: 100, type: 'market', reduceOnly: true }, 2000, P('X', 45));
  a = broker.processTick(r.acc, { symbol: 'X', price: 45, high: 45, low: 45, time: 2000 });
  check('short round trip books +500', a.trades.length === 1 && near(a.trades[0].pnl, 500));
  check('short trade is marked short', a.trades[0].direction === 'short');

  // 4. bracket: stop loss triggers, take profit is cancelled
  a = broker.createAccount({ startingCash: 100000, commissionPerOrder: 0, slippageBps: 0 });
  r = broker.placeOrder(a, { symbol: 'X', side: 'buy', qty: 100, type: 'market', bracket: { stopLoss: 48, takeProfit: 56 } }, 1000, P('X', 50));
  a = broker.processTick(r.acc, { symbol: 'X', price: 50, high: 50, low: 50, time: 1000 });
  check('bracket creates two working exit orders', a.orders.filter((o) => o.status === 'working').length === 2);
  check('initial risk per unit recorded', near(a.positions.X.initialRiskPerUnit, 2));
  a = broker.processTick(a, { symbol: 'X', price: 47.5, high: 50, low: 47.5, time: 2000 });
  check('stop loss closes the position', !a.positions.X);
  check('take profit was cancelled', a.orders.filter((o) => o.status === 'working').length === 0);
  check('stop-loss trade is about -1R', a.trades[0].rMultiple !== undefined && Math.abs(a.trades[0].rMultiple + 1) < 0.02, `R=${a.trades[0].rMultiple}`);
  check('exit reason is stop_loss', a.trades[0].exitReason === 'stop_loss');
  check('stop fills at the trigger, not the low of the move', near(a.trades[0].exitPrice, 48), `exit=${a.trades[0].exitPrice}`);

  // 4b. a stop across a session gap fills at the gapped price, not the trigger
  a = broker.createAccount({ startingCash: 100000, commissionPerOrder: 0, slippageBps: 0 });
  r = broker.placeOrder(a, { symbol: 'X', side: 'buy', qty: 100, type: 'market', bracket: { stopLoss: 48 } }, 1000, P('X', 50));
  a = broker.processTick(r.acc, { symbol: 'X', price: 50, high: 50, low: 50, time: 1000 });
  a = broker.processTick(a, { symbol: 'X', price: 41, high: 50, low: 41, time: 2000, isNewDay: true, gapped: true });
  check('a gap fills the stop at the gapped price', near(a.trades[0].exitPrice, 41), `exit=${a.trades[0].exitPrice}`);
  check('a gap produces a loss worse than 1R', a.trades[0].rMultiple < -4, `R=${a.trades[0].rMultiple}`);

  // 5. bracket: take profit triggers
  a = broker.createAccount({ startingCash: 100000, commissionPerOrder: 0, slippageBps: 0 });
  r = broker.placeOrder(a, { symbol: 'X', side: 'buy', qty: 100, type: 'market', bracket: { stopLoss: 48, takeProfit: 56 } }, 1000, P('X', 50));
  a = broker.processTick(r.acc, { symbol: 'X', price: 50, high: 50, low: 50, time: 1000 });
  a = broker.processTick(a, { symbol: 'X', price: 57, high: 57, low: 50, time: 2000 });
  check('take profit closes the position', !a.positions.X);
  check('take profit fills at the limit, not better', near(a.trades[0].exitPrice, 56), `exit=${a.trades[0].exitPrice}`);
  check('take-profit trade is +3R', near(a.trades[0].rMultiple, 3, 0.01), `R=${a.trades[0].rMultiple}`);

  // 6. limit order only fills when price reaches it
  a = broker.createAccount({ startingCash: 100000, commissionPerOrder: 0, slippageBps: 0 });
  r = broker.placeOrder(a, { symbol: 'X', side: 'buy', qty: 100, type: 'limit', limitPrice: 45 }, 1000, P('X', 50));
  a = r.acc;
  a = broker.processTick(a, { symbol: 'X', price: 48, high: 50, low: 47, time: 2000 });
  check('buy limit below the market does not fill early', !a.positions.X);
  a = broker.processTick(a, { symbol: 'X', price: 44, high: 48, low: 44, time: 3000 });
  check('buy limit fills once price trades through it', a.positions.X?.qty === 100);
  check('buy limit fills at the limit price or better', a.positions.X.avgPrice <= 45 + 1e-9);

  // 7. stop entry order
  a = broker.createAccount({ startingCash: 100000, commissionPerOrder: 0, slippageBps: 0 });
  r = broker.placeOrder(a, { symbol: 'X', side: 'buy', qty: 100, type: 'stop', stopPrice: 55 }, 1000, P('X', 50));
  check('buy stop above the market is accepted', r.order.status === 'working');
  a = broker.processTick(r.acc, { symbol: 'X', price: 52, high: 53, low: 50, time: 2000 });
  check('buy stop does not fill below the trigger', !a.positions.X);
  a = broker.processTick(a, { symbol: 'X', price: 56, high: 56, low: 52, time: 3000 });
  check('buy stop fills once the trigger is touched', a.positions.X?.qty === 100);

  // 8. invalid orders are rejected
  a = broker.createAccount({ startingCash: 10000, commissionPerOrder: 0, slippageBps: 0, leverage: 1 });
  check('buy stop below the market is rejected', broker.placeOrder(a, { symbol: 'X', side: 'buy', qty: 1, type: 'stop', stopPrice: 40 }, 1, P('X', 50)).order.status === 'rejected');
  check('over-sized order is rejected for buying power', broker.placeOrder(a, { symbol: 'X', side: 'buy', qty: 1000, type: 'market' }, 1, P('X', 50)).order.status === 'rejected');
  check('zero quantity is rejected', broker.placeOrder(a, { symbol: 'X', side: 'buy', qty: 0, type: 'market' }, 1, P('X', 50)).order.status === 'rejected');
  check(
    'long take profit below entry is rejected',
    broker.placeOrder(a, { symbol: 'X', side: 'buy', qty: 10, type: 'market', bracket: { takeProfit: 45 } }, 1, P('X', 50)).order.status === 'rejected',
  );
  check(
    'long stop loss above entry is rejected',
    broker.placeOrder(a, { symbol: 'X', side: 'buy', qty: 10, type: 'market', bracket: { stopLoss: 55 } }, 1, P('X', 50)).order.status === 'rejected',
  );
  const noShort = broker.createAccount({ startingCash: 10000, allowShort: false });
  check('short is rejected when disabled', broker.placeOrder(noShort, { symbol: 'X', side: 'sell', qty: 10, type: 'market' }, 1, P('X', 50)).order.status === 'rejected');

  // 9. flipping a position closes it and opens the other way
  a = broker.createAccount({ startingCash: 100000, commissionPerOrder: 0, slippageBps: 0, leverage: 4 });
  r = broker.placeOrder(a, { symbol: 'X', side: 'buy', qty: 100, type: 'market' }, 1000, P('X', 50));
  a = broker.processTick(r.acc, { symbol: 'X', price: 50, high: 50, low: 50, time: 1000 });
  r = broker.placeOrder(a, { symbol: 'X', side: 'sell', qty: 250, type: 'market' }, 2000, P('X', 52));
  a = broker.processTick(r.acc, { symbol: 'X', price: 52, high: 52, low: 52, time: 2000 });
  check('flip leaves a short of the remainder', a.positions.X?.qty === -150, `qty=${a.positions.X?.qty}`);
  check('flip books the closing trade', a.trades.length === 1 && near(a.trades[0].pnl, 200), `pnl=${a.trades[0]?.pnl}`);
  check('flip cash is consistent', near(broker.equity(a, P('X', 52)), 100200), `eq=${broker.equity(a, P('X', 52))}`);

  // 10. partial close keeps the position and books nothing yet
  a = broker.createAccount({ startingCash: 100000, commissionPerOrder: 0, slippageBps: 0 });
  r = broker.placeOrder(a, { symbol: 'X', side: 'buy', qty: 100, type: 'market' }, 1000, P('X', 50));
  a = broker.processTick(r.acc, { symbol: 'X', price: 50, high: 50, low: 50, time: 1000 });
  r = broker.placeOrder(a, { symbol: 'X', side: 'sell', qty: 40, type: 'market', reduceOnly: true }, 2000, P('X', 55));
  a = broker.processTick(r.acc, { symbol: 'X', price: 55, high: 55, low: 55, time: 2000 });
  check('partial close leaves 60 shares', a.positions.X?.qty === 60);
  check('partial close books no trade yet', a.trades.length === 0);
  r = broker.placeOrder(a, { symbol: 'X', side: 'sell', qty: 60, type: 'market', reduceOnly: true }, 3000, P('X', 60));
  a = broker.processTick(r.acc, { symbol: 'X', price: 60, high: 60, low: 60, time: 3000 });
  check('final close books one trade for the whole round trip', a.trades.length === 1 && a.trades[0].qty === 100);
  check('round-trip P&L uses average exit', near(a.trades[0].pnl, 40 * 5 + 60 * 10), `pnl=${a.trades[0].pnl}`);

  // 11. commission and slippage are applied
  a = broker.createAccount({ startingCash: 100000, commissionPerOrder: 5, slippageBps: 10 });
  r = broker.placeOrder(a, { symbol: 'X', side: 'buy', qty: 100, type: 'market' }, 1000, P('X', 50));
  a = broker.processTick(r.acc, { symbol: 'X', price: 50, high: 50, low: 50, time: 1000 });
  check('buy slips upward by 10bps', near(a.positions.X.avgPrice, 50.05), `avg=${a.positions.X.avgPrice}`);
  check('commission is charged', near(a.cash, 100000 - 100 * 50.05 - 5), `cash=${a.cash}`);

  // 12. margin call liquidates
  a = broker.createAccount({ startingCash: 10000, commissionPerOrder: 0, slippageBps: 0, leverage: 5, maintenanceMargin: 0.25 });
  r = broker.placeOrder(a, { symbol: 'X', side: 'buy', qty: 900, type: 'market' }, 1000, P('X', 50));
  a = broker.processTick(r.acc, { symbol: 'X', price: 50, high: 50, low: 50, time: 1000 });
  check('leveraged position opened', a.positions.X?.qty === 900);
  a = broker.checkMargin(a, P('X', 42), 2000);
  check('margin call liquidates everything', Object.keys(a.positions).length === 0);
  check('margin call is logged', a.events.some((e) => e.kind === 'margin_call'));
  check('liquidation trade is marked', a.trades[0]?.exitReason === 'liquidation');

  // 13. DAY orders expire at the new session
  a = broker.createAccount({ startingCash: 100000 });
  r = broker.placeOrder(a, { symbol: 'X', side: 'buy', qty: 10, type: 'limit', limitPrice: 40, tif: 'DAY' }, 1000, P('X', 50));
  a = broker.processTick(r.acc, { symbol: 'X', price: 50, high: 50, low: 49, time: 2000, isNewDay: true });
  check('DAY order is cancelled at the new session', a.orders.find((o) => o.id === r.order.id).status === 'cancelled');

  // 14. buying power respects leverage
  a = broker.createAccount({ startingCash: 10000, leverage: 3 });
  check('buying power is equity times leverage', near(broker.buyingPower(a, P('X', 50)), 30000));
}

// ---------------------------------------------------------------- shuffle and csv
{
  /**
   * The trainer shuffles four answer options. A biased shuffle is invisible in use and
   * silently teaches position-guessing, so the distribution is asserted rather than eyeballed.
   * The old `sort(() => rng.float() - 0.5)` put the answer first 36% of the time.
   */
  const slots = [0, 0, 0, 0];
  const N = 40000;
  const rng = new Rng('shuffle-fairness');
  for (let i = 0; i < N; i++) {
    const out = shuffled(['answer', 'b', 'c', 'd'], rng);
    slots[out.indexOf('answer')]++;
  }
  const pct = slots.map((c) => (c / N) * 100);
  const worst = Math.max(...pct.map((p) => Math.abs(p - 25)));
  check('shuffle puts the answer in each slot about equally often', worst < 1.5, `worst deviation ${worst.toFixed(2)} points from 25%`);

  const sameSeed = (seed) => shuffled([1, 2, 3, 4, 5, 6, 7, 8], new Rng(seed)).join(',');
  check('shuffle is deterministic for a given seed', sameSeed('s1') === sameSeed('s1'));
  check('shuffle differs across seeds', sameSeed('s1') !== sameSeed('s2'));
  check('shuffle keeps every element exactly once', shuffled([1, 2, 3, 4, 5], new Rng('k')).sort((a, b) => a - b).join() === '1,2,3,4,5');

  // CSV: the journal previously turned a trader's quotes into apostrophes, producing a
  // file that parsed cleanly and no longer said what they wrote.
  check('csv leaves a plain field unquoted', csvCell('breakout') === 'breakout');
  check('csv quotes a field containing a comma', csvCell('a,b') === '"a,b"');
  check('csv doubles an embedded quote', csvCell('he said "hi"') === '"he said ""hi"""');
  const NL = String.fromCharCode(10);
  check('csv quotes a field containing a newline', csvCell('one' + NL + 'two') === '"one' + NL + 'two"');
  check('csv renders null and undefined as empty', csvCell(null) === '' && csvCell(undefined) === '');

  const noteText = 'He said "buy", then' + NL + 'left';
  const doc = toCsv(['a', 'notes'], [[1, noteText]]);
  check('csv document starts with a UTF-8 BOM for Excel', doc.charCodeAt(0) === 0xfeff);
  check('csv document uses CRLF between records', doc.includes(String.fromCharCode(13, 10)));

  /** Parse it back the way a spreadsheet would, and insist the note survived intact. */
  const parse = (text) => {
    const rows = [];
    let row = [];
    let f = '';
    let q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            f += '"';
            i++;
          } else q = false;
        } else f += c;
      } else if (c === '"') q = true;
      else if (c === ',') {
        row.push(f);
        f = '';
      } else if (c === String.fromCharCode(13)) {
        /* part of CRLF */
      } else if (c === NL) {
        row.push(f);
        rows.push(row);
        row = [];
        f = '';
      } else f += c;
    }
    if (f || row.length) {
      row.push(f);
      rows.push(row);
    }
    return rows;
  };
  const back = parse(doc.slice(1));
  check('csv round-trips a note containing quotes and a newline', back.length === 2 && back[1][1] === noteText, JSON.stringify(back[1]));
  check('csv round-trip keeps every row the same width', back.every((r) => r.length === back[0].length));
}

// ---------------------------------------------------------------- order sizing
{
  const EQ = 100000;
  // Roughly a tenth of equity, whatever the instrument costs. The ticket used a flat 100
  // units, which on an $81,000 crypto pair opened an eight-figure position.
  for (const [label, price] of [['cheap biotech', 18.4], ['stock', 147], ['metal', 2350]]) {
    const q = defaultQty(price, EQ);
    const notional = q * price;
    check('default size on a ' + label + ' is about a tenth of equity', notional > EQ * 0.05 && notional < EQ * 0.16, 'qty ' + q + ' = ' + Math.round(notional));
  }
  check('never returns less than one whole unit', defaultQty(81238, EQ) >= 1 && defaultQty(1e9, EQ) === 1);
  check('rounds to a number a human would type', defaultQty(1.0842, EQ) % 100 === 0, String(defaultQty(1.0842, EQ)));
  check('survives a nonsense price', defaultQty(0, EQ) === 1 && defaultQty(-5, EQ) === 1 && defaultQty(NaN, EQ) === 1);
  check('survives a nonsense account', defaultQty(100, 0) === 1 && defaultQty(100, NaN) === 1);
  check('scales with the account, not just the price', defaultQty(147, 1000000) > defaultQty(147, 100000));
}

// ---------------------------------------------------------------- real feed
{
  // A short, deliberately awkward set of real-looking bars: a gap up, a gap down,
  // an inside bar and a doji, so the partial-bar logic is exercised on real shapes.
  const bars = [
    { time: 1700000000, open: 100, high: 104, low: 99, close: 103, volume: 1000 },
    { time: 1700003600, open: 106, high: 108, low: 105, close: 105.5, volume: 1200 },
    { time: 1700007200, open: 101, high: 102, low: 96, close: 97, volume: 2000 },
    { time: 1700010800, open: 97.5, high: 98, low: 97.2, close: 97.6, volume: 800 },
    { time: 1700014400, open: 97.6, high: 99, low: 96.4, close: 97.6, volume: 900 },
  ];
  const f = new RealFeed('TEST', '1h', bars, 2);
  check('real feed reports its length', f.length === 5);
  check('real feed clamps a cursor past the end', f.baseBar(99).time === bars[4].time);
  check('real feed clamps a negative cursor', f.baseBar(-5).time === bars[0].time);

  let partialsOk = true;
  let convergesOk = true;
  for (let i = 0; i < bars.length; i++) {
    for (let k = 0; k < 4; k++) {
      const p = f.partialBar(i, k);
      const full = bars[i];
      // A forming bar can never exceed the finished bar's extremes...
      if (p.high > full.high + 1e-9 || p.low < full.low - 1e-9) partialsOk = false;
      // ...and must itself be a valid candle at every step.
      if (p.high < Math.max(p.open, p.close) - 1e-9 || p.low > Math.min(p.open, p.close) + 1e-9) partialsOk = false;
      if (p.open !== full.open) partialsOk = false;
    }
    const last = f.partialBar(i, 3);
    if (!near(last.close, bars[i].close) || !near(last.high, bars[i].high) || !near(last.low, bars[i].low) || !near(last.volume, bars[i].volume)) convergesOk = false;
  }
  check('real partial bars stay inside the finished bar and stay valid candles', partialsOk);
  check('real partial bars converge exactly to the finished bar', convergesOk);

  // The forming bar must visit both extremes before it settles, otherwise a stop
  // sitting inside the bar would never trigger during replay.
  let visitsExtremes = true;
  for (let i = 0; i < bars.length; i++) {
    const seen = [0, 1, 2, 3].map((k) => f.subPrice(i, k));
    if (Math.max(...seen) < bars[i].high - 1e-9) visitsExtremes = false;
    if (Math.min(...seen) > bars[i].low + 1e-9) visitsExtremes = false;
  }
  check('real sub-ticks visit both extremes of every bar', visitsExtremes);

  const f2 = new RealFeed('TEST', '1h', bars, 2);
  let deterministic = true;
  for (let i = 0; i < bars.length; i++) for (let k = 0; k < 4; k++) if (!near(f.subPrice(i, k), f2.subPrice(i, k))) deterministic = false;
  check('real sub-tick path is deterministic for the same bars', deterministic);

  const mid = f.chartBars(2, 1);
  check('real chart data ends at the forming bar', mid.length === 3 && mid[2].time === bars[2].time);
  check('real chart data keeps completed bars intact', near(mid[0].close, 103) && near(mid[1].close, 105.5));
  let ascending = true;
  for (let i = 1; i < mid.length; i++) if (mid[i].time <= mid[i - 1].time) ascending = false;
  check('real chart data is strictly ascending in time', ascending);

  check('real feed reports exhaustion at the last bar', f.exhausted(4) && !f.exhausted(3));
}

// ---------------------------------------------------------------- stats
{
  const mk = (pnl, r) => ({ id: String(Math.random()), symbol: 'X', direction: 'long', qty: 1, entryPrice: 1, exitPrice: 1, entryTime: 0, exitTime: 600, pnl, rMultiple: r, fees: 0, tags: [], notes: '' });
  const trades = [mk(200, 2), mk(-100, -1), mk(300, 3), mk(-100, -1), mk(-100, -1)];
  const s = stats.computeStats(trades);
  check('win rate is 40%', near(s.winRate, 0.4));
  check('gross profit is 500', near(s.grossProfit, 500));
  check('gross loss is 300', near(s.grossLoss, 300));
  check('profit factor is 500/300', near(s.profitFactor, 500 / 300));
  check('net P&L is 200', near(s.netPnl, 200));
  check('expectancy is 40 per trade', near(s.expectancy, 40));
  check('average R is 0.4', near(s.avgR, 0.4));
  check('longest losing streak is 2', s.longestLossStreak === 2);
  const dd = stats.maxDrawdown([{ equity: 100 }, { equity: 120 }, { equity: 90 }, { equity: 110 }]);
  check('max drawdown is 30 (25%)', near(dd.maxDd, 30) && near(dd.maxDdPct, 0.25));
}

// ---------------------------------------------------------------- storage migration
// These keys hold a reader's progress, journal and open session. A rename that loses them is
// silent: the site simply looks new. So the rule -- nothing destroyed that was not first
// copied -- is pinned case by case.
{
  const memStore = (init = {}, opts = {}) => {
    const m = new Map(Object.entries(init));
    return {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => {
        if (opts.throwOn === k) throw new Error('QuotaExceededError');
        if (opts.dropWritesTo === k) return;
        m.set(k, v);
      },
      removeItem: (k) => m.delete(k),
    };
  };
  const [oldTheme, newTheme] = LEGACY_KEYS[0];
  const [oldProgress, newProgress] = LEGACY_KEYS[1];
  const [oldSim, newSim] = LEGACY_KEYS[2];

  check('legacy table covers every current key',
    LEGACY_KEYS.length === Object.keys(STORAGE_KEYS).length &&
    Object.values(STORAGE_KEYS).every((k) => LEGACY_KEYS.some(([, to]) => to === k)));

  const journal = JSON.stringify({ state: { seed: 'tradelab-1', trades: [{ id: 't1', pnl: 42 }] }, version: 0 });
  const progress = JSON.stringify({ state: { done: ['m00/01'] }, version: 0 });
  const a = memStore({ [oldTheme]: 'light', [oldProgress]: progress, [oldSim]: journal });
  const movedA = migrateStorage(a);
  check('moves all three keys when only the old names exist', movedA.length === 3);
  check('the moved values are byte-for-byte intact',
    a.getItem(newTheme) === 'light' && a.getItem(newProgress) === progress && a.getItem(newSim) === journal);
  check('the old names are removed once copied',
    a.getItem(oldTheme) === null && a.getItem(oldProgress) === null && a.getItem(oldSim) === null);
  check('a saved session keeps its own seed, so open positions keep their market',
    JSON.parse(a.getItem(newSim)).state.seed === 'tradelab-1');
  check('running it again moves nothing', migrateStorage(a).length === 0 && a.getItem(newSim) === journal);

  const b = memStore({ [oldProgress]: 'old', [newProgress]: 'new' });
  migrateStorage(b);
  check('never overwrites a value already under the new name', b.getItem(newProgress) === 'new');
  check('and leaves the old copy alone rather than deleting it', b.getItem(oldProgress) === 'old');

  const c = memStore({ [oldSim]: journal, [oldTheme]: 'dark' }, { throwOn: newSim });
  const movedC = migrateStorage(c);
  check('a write that throws keeps the original', c.getItem(oldSim) === journal && c.getItem(newSim) === null);
  check('and does not stop the other keys moving', movedC.includes(oldTheme) && c.getItem(newTheme) === 'dark');

  const d = memStore({ [oldSim]: journal }, { dropWritesTo: newSim });
  migrateStorage(d);
  check('a write that silently fails to land keeps the original', d.getItem(oldSim) === journal);

  check('empty storage is a no-op', migrateStorage(memStore()).length === 0);
}


// ---------------------------------------------------------------- data service address
// A public build must not reach for a data service it was never given: the old default sent
// every visitor's browser to their own localhost:5300.
{
  const LOCAL = 'http://localhost:5300';
  check('dev build with nothing configured uses the local service', resolveDataApi(undefined, LOCAL) === LOCAL);
  check('production build with nothing configured has no service', resolveDataApi(undefined, undefined) === null);
  check('an explicit address wins in production', resolveDataApi('https://data.example.com', undefined) === 'https://data.example.com');
  check('an explicit address wins over the dev default', resolveDataApi('http://10.0.0.5:5300', LOCAL) === 'http://10.0.0.5:5300');
  check('an empty address switches the service off, even in dev', resolveDataApi('', LOCAL) === null);
  check('a whitespace-only address is treated as empty', resolveDataApi('   ', LOCAL) === null);
  check('trailing slashes are trimmed so paths do not double up', resolveDataApi('https://data.example.com//', undefined) === 'https://data.example.com');
}


// ---------------------------------------------------------------- colour maths
// tools/lint-tokens.mjs reports contrast and gamut through these functions, so they are held
// to published reference values rather than to themselves.
{
  const near = (a, b, tol) => Math.abs(a - b) <= tol;
  const ok = (hex) => color.rgbToOklch(color.parseHex(hex));
  const red = ok('#ff0000');
  // CSS Color 4 gives sRGB red as oklch(62.8% 0.2577 29.23).
  check('sRGB red converts to the published OKLCH value', near(red.l, 0.628, 0.001) && near(red.c, 0.2577, 0.001) && near(red.h, 29.23, 0.1));
  check('white is L 1, chroma 0', near(ok('#ffffff').l, 1, 1e-4) && ok('#ffffff').c < 1e-4);
  check('black is L 0', near(ok('#000000').l, 0, 1e-4));
  const roundTrip = ['#2563eb', '#0b0f17', '#f59e0b', '#16a34a', '#94a0b8', '#ec4899'].every(
    (hex) => color.rgbToHex(color.oklchToRgb(ok(hex))) === hex,
  );
  check('hex -> OKLCH -> hex round-trips exactly', roundTrip);
  check('white on black is 21:1', near(color.contrast(color.parseHex('#ffffff'), color.parseHex('#000000')), 21, 1e-9));
  // #2563eb on white is the widely published 5.17:1.
  check('blue-600 on white is 5.17:1', near(color.contrast(color.parseHex('#2563eb'), color.parseHex('#ffffff')), 5.17, 0.01));
  const p = color.parseOklch('oklch(50% 0.1 200 / 0.4)');
  check('oklch() parses percentage lightness and alpha', p && near(p.l, 0.5, 1e-9) && near(p.alpha, 0.4, 1e-9));
  check('an out-of-gamut colour is reported as such', !color.inSrgbGamut(color.parseOklch('oklch(0.52 0.3 255)')));
  check('an in-gamut colour is not', color.inSrgbGamut(color.parseOklch('oklch(0.52 0.16 255)')));
  const grey = color.over({ r: 0, g: 0, b: 0, alpha: 0.5 }, color.parseHex('#ffffff'));
  check('half-transparent black over white composites to mid grey', near(grey.r, 0.5, 1e-9) && grey.alpha === 1);

  const css = [
    '@theme {',
    '  /* ---- surfaces ---- */',
    '  --color-bg: oklch(0.9 0 0); /* page */',
    '  --color-card: var(--color-bg); /* alias */',
    '  --text-h1: 2rem; /* title */',
    '  --text-h1--line-height: 1.2;',
    '}',
    '.dark {',
    '  /* a comment that',
    '     spans lines */',
    '  --color-bg: oklch(0.2 0 0);',
    '}',
    ':root {',
    '  --duration-fast: 120ms; /* hover */',
    '}',
  ].join('\n');
  const t = parseTokens(css);
  const bg = t.find((x) => x.name === '--color-bg');
  check('token parser reads both themes, group and doc', bg && bg.light === 'oklch(0.9 0 0)' && bg.dark === 'oklch(0.2 0 0)' && bg.group === 'surfaces' && bg.doc === 'page');
  check('token parser folds sub-properties into their token', t.find((x) => x.name === '--text-h1')?.extras['line-height'] === '1.2' && !t.some((x) => x.name === '--text-h1--line-height'));
  check('token aliases resolve per theme', resolveToken(t, '--color-card', 'dark') === 'oklch(0.2 0 0)' && resolveToken(t, '--color-card', 'light') === 'oklch(0.9 0 0)');
  check('a multi-line comment in .dark does not hide the declarations after it', bg && bg.dark === 'oklch(0.2 0 0)');
  check(':root tokens are read too', t.some((x) => x.name === '--duration-fast' && x.light === '120ms'));
}

// ---------------------------------------------------------------- feature flags
{
  const d = parseFlags(undefined);
  check('flags: nothing set gives the defaults', JSON.stringify(d.flags) === JSON.stringify(FLAG_DEFAULTS) && d.unknown.length === 0);
  const p = parseFlags(' deck, -commandPalette ,3d,,');
  check('flags: a name turns on, a leading minus turns off, spaces and empties ignored', p.flags.deck && !p.flags.commandPalette && p.flags['3d'] && !p.flags.quantTrack);
  const u = parseFlags('dekc,-nope,deck');
  check('flags: unknown names are reported, not applied', u.unknown.join() === 'dekc,nope' && u.flags.deck && !('dekc' in u.flags));
}

// ---------------------------------------------------------------- i18n
{
  const msgs = { a: { b: 'Hi {name}, {name}', n: { one: '{count} lesson', other: '{count} lessons' } } };
  check('i18n: placeholders are filled, every occurrence', translate(msgs, 'a.b', { name: 'Ada' }) === 'Hi Ada, Ada');
  check('i18n: a missing variable leaves its placeholder visible', translate(msgs, 'a.b') === 'Hi {name}, {name}');
  check('i18n: plural picks one for 1 and other for 0 and 2', translate(msgs, 'a.n', { count: 1 }) === '1 lesson' && translate(msgs, 'a.n', { count: 0 }) === '0 lessons' && translate(msgs, 'a.n', { count: 2 }) === '2 lessons');
  check('i18n: an unknown key comes back as the key', translate(msgs, 'a.zzz') === 'a.zzz' && translate(msgs, 'a.b.c') === 'a.b.c');
  check('i18n: a section (not a message) is not rendered', translate(msgs, 'a') === 'a');
  check('i18n: the disclaimer is word for word', translate(en, 'footer.disclaimer') === 'Nitora Trading Academy is an educational tool. Nothing here is financial advice. All market data in the simulator is synthetic.');
}

// ---------------------------------------------------------------- curriculum tracks
{
  const { TRACKS, CURRICULUM, ALL_LESSONS, findTrack, modulesInTrack, modulesByLevel, moduleMinutes } = curriculum;
  check('tracks: every module belongs to a known track', CURRICULUM.every((m) => findTrack(m.track)));
  check('tracks: the tracks partition the modules', TRACKS.reduce((n, t) => n + modulesInTrack(t.id).length, 0) === CURRICULUM.length);
  const groups = modulesByLevel(TRACKS[0].id);
  check("tracks: levels come in the track's order, with no empty groups", groups.map((g) => g.level).join() === TRACKS[0].levels.filter((l) => CURRICULUM.some((m) => m.level === l)).join() && groups.every((g) => g.modules.length > 0));
  check('tracks: an unknown track has no modules and no levels', modulesInTrack('nope').length === 0 && modulesByLevel('nope').length === 0 && findTrack('nope') === null);
  check('tracks: module minutes add up to the curriculum total', CURRICULUM.reduce((n, m) => n + moduleMinutes(m), 0) === ALL_LESSONS.reduce((n, l) => n + l.minutes, 0));
  check("tracks: every flat lesson carries its module's track", ALL_LESSONS.every((l) => l.trackId === CURRICULUM.find((m) => m.id === l.moduleId).track));
}

// ---------------------------------------------------------------- home page engine snapshot
{
  const snap = computeSnapshot();
  const market = new Market(DEFAULT_SEED, SYMBOLS);
  check('home ticker: one row per simulator instrument', snap.ticker.length === SYMBOLS.length);
  check("home ticker: prices are the simulator's opening prices", snap.ticker.every((r) => near(r.price, market.feed(r.symbol).price(START_CURSOR, 3))));
  check('home ticker: day change is against the previous bar close', snap.ticker.every((r) => { const prev = market.feed(r.symbol).baseBar(START_CURSOR - 1).close; return near(r.changePct, ((r.price - prev) / prev) * 100); }));
  check('home sparkline: 120 five-minute bars with sane OHLC', snap.spark.bars.length === 120 && snap.spark.bars.every((b) => b.l <= Math.min(b.o, b.c) && b.h >= Math.max(b.o, b.c)));
}


console.log(results.join('\n'));
console.log(`\n${pass} passed, ${fail} failed\n`);
rmSync(out, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
