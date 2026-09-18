# TradeLab Academy

A complete, plain-language school of trading with a realistic paper-trading simulator.

**128 lessons · 13 modules · ~179,000 words · 258 glossary terms · 8 synthetic markets**

Built with React 19, TypeScript, Vite 8, Tailwind 4, MDX and TradingView lightweight-charts v5.
Everything runs in the browser. No backend, no accounts, no real money, no data leaves the device.

```
src/
  content/
    curriculum.ts        The single source of truth: every module and lesson, in order
    glossary.ts          258 terms, each in one plain sentence first
    modules/<m>/<l>.mdx  One file per lesson (128 of them)
    figures/             Deterministic candle data for every teaching figure
  engine/
    market/              Synthetic market: generator, timeframe aggregation, indicators
    broker/              Paper-trading broker: orders, positions, fills, margin, statistics
  components/
    figures/CandleSvg    Dependency-free SVG candlestick renderer used by lessons
    mdx/                 Components lessons may use (callouts, quizzes, figures, calculators)
    sim/                 Chart, order ticket and panels for the simulator
  pages/                 Home, Learn, Module, Lesson, Simulator, Trainer, Journal, Glossary
tools/
  lint-content.mjs       Validates all 128 lessons against docs/CONTENT-GUIDE.md
  test-engine.mjs        82 tests over the market generator, indicators and broker
docs/
  CONTENT-GUIDE.md       The contract every lesson file follows
```

## Run it

```bash
npm install
npm run dev
```

Then open the printed URL. `npm run build` produces a static `dist/` that can be hosted anywhere.

## The four rooms

**Learn** — Thirteen modules named like school years, from "what is a market" to options Greeks.
Each lesson has figures, an explain-it-like-I-am-five callout, key takeaways and a quiz. Progress
and best quiz scores are saved in the browser.

| # | Module | Lessons |
|---|--------|---------|
| 0 | What Is a Market? | 9 |
| 1 | Reading a Price Chart | 8 |
| 2 | Candlestick Patterns | 16 |
| 3 | Market Structure | 10 |
| 4 | Chart Patterns | 10 |
| 5 | Technical Indicators | 15 |
| 6 | Orders and Execution | 9 |
| 7 | Risk Management | 10 |
| 8 | Trading Psychology | 8 |
| 9 | Strategies and Trading Styles | 10 |
| 10 | Fundamentals and the Big Picture | 8 |
| 11 | Options, Futures, Forex and Crypto | 7 |
| 12 | Becoming Consistent | 8 |

**Simulator** — Eight invented instruments with deliberately different personalities: NOVA
(volatile tech), BLUE (calm blue chip), AURM (mean-reverting metal), CRYP (gappy crypto), IDX
(index), PETR (energy), BIOX (event-driven biotech) and FXEU (low-volatility currency pair).
Market, limit, stop and stop-limit orders, brackets, long and short, leverage, commissions,
slippage and margin calls. A clock you can play at four speeds or step one candle at a time.

**Trainer** — Two drills: name the pattern from a chart, and guess where price goes next. The
second one is designed to be humbling.

**Journal** — Every closed trade with its R-multiple, exit reason and duration, plus expectancy,
profit factor, win rate, maximum drawdown, an equity curve, an R-distribution histogram and
tagging for setups and mistakes. Exports to CSV.

## How the market works

Each symbol is a regime-switching random walk in log space, seeded so the same seed always
produces the same market. Bars are generated at one-minute resolution and aggregated up to the
requested timeframe. The model includes intraday U-shaped volatility and volume, mean reversion
toward a slow anchor, rare news jumps, overnight gaps and a Mon–Fri 09:30–16:00 session clock.
A one-minute bar forms over four sub-ticks so a learner can watch a candle being built.

## How fills work

The fill model is deliberately conservative, because a simulator that flatters the user teaches
the wrong lesson.

- **Market orders** fill at the current price plus slippage.
- **Limit orders** fill *at* the limit price, never better. The price path is continuous, so
  reaching the limit means the market traded through it.
- **Stop orders** fill at the trigger plus ordinary slippage, because price moves continuously
  through the trigger. Charging the extreme of the move instead would push every stopped-out
  trade past -1R and corrupt the one number the risk module is built on.
- **Across a session gap** a stop fills at the gapped price however bad it is. That is the real
  lesson about stops, and it is modelled rather than glossed over.
- **Margin calls** liquidate every position when equity falls below maintenance.

## Checks

```bash
node tools/lint-content.mjs    # all 128 lessons present and structurally valid
node tools/test-engine.mjs     # 82 tests: generator, indicators, broker, statistics
npm run typecheck
```

The content linter enforces the contract in `docs/CONTENT-GUIDE.md`: correct file paths, no H1,
required components, valid figure and indicator names, resolvable internal links, quiz arrays
that parse as JavaScript with in-range answer indices, and word counts near target.

## Adding a lesson

1. Add the entry to `src/content/curriculum.ts`.
2. Write `src/content/modules/<module-id>/<lesson-id>.mdx` following `docs/CONTENT-GUIDE.md`.
3. Run `node tools/lint-content.mjs`.

Lessons are loaded with `import.meta.glob`, so no registration step is needed.

## Honesty notes

Most people who trade actively lose money. Nothing on this site is financial advice, and the
lessons are written to make people competent and cautious rather than excited. Synthetic data has
no real news, earnings or macro, so the simulator teaches mechanics, risk and discipline, not
fundamentals. Real slippage in thin markets and on news is worse than anything modelled here.
