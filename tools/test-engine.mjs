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
import { Market } from '@/engine/market/feed';
import { SYMBOLS, SYMBOL_MAP } from '@/engine/market/symbols';
import { aggregate, bucketStart, nextSessionMinute, minuteOfSession } from '@/engine/market/generator';
import * as ind from '@/engine/market/indicators';
export { broker, stats, Market, SYMBOLS, SYMBOL_MAP, aggregate, bucketStart, nextSessionMinute, minuteOfSession, ind };
`,
);

const bundle = join(out, 'bundle.mjs');
execSync(
  `npx esbuild "${shim}" --bundle --format=esm --platform=node --outfile="${bundle}" --alias:@=./src --log-level=error`,
  { cwd: root, stdio: 'inherit' },
);

const M = await import(pathToFileURL(bundle).href);
const { broker, stats, Market, SYMBOLS, ind } = M;

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

console.log(results.join('\n'));
console.log(`\n${pass} passed, ${fail} failed\n`);
rmSync(out, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
