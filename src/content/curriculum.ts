/**
 * The master curriculum. Every lesson on the site is declared here, in order.
 * MDX files live at src/content/modules/<module.id>/<lesson.id>.mdx
 *
 * Levels are named like school years on purpose: the site teaches trading the way
 * you would teach a child — one small idea at a time, each building on the last.
 */

export type Level = 'foundation' | 'reading' | 'analysis' | 'execution' | 'mastery';

/** What a lesson asks of the reader. Everything today is reading; the others are for later tracks. */
export type LessonKind = 'reading' | 'interactive' | 'lab';

/** How a lesson's presentation deck is made: generated from the MDX, hand-written, or none. */
export type DeckMode = 'auto' | 'manual' | 'none';

export interface LessonMeta {
  id: string;            // file name without .mdx, unique within module
  title: string;
  summary: string;       // one sentence, shown in lists
  minutes: number;       // estimated reading time
  /** Optional. Defaults to 'reading'. */
  kind?: LessonKind;
  /**
   * Optional. Lessons to read first, as "moduleId/lessonId". The content linter checks every
   * one resolves, that no lesson requires itself, and that there is no cycle.
   */
  prerequisites?: string[];
  /** Optional. Free-form topic tags, for search and cross-links. */
  tags?: string[];
  /** Optional. Defaults to 'auto'. */
  deck?: DeckMode;
}

/**
 * A module's cover art, rendered at build time (Phase 4). Until a module has it, pages draw a
 * placeholder cover from its level colour, so an absent `art` is normal, not an error.
 */
export interface ModuleArt {
  dark: string;          // e.g. /art/modules/<id>-dark.webp
  light: string;
  glyph?: string;        // 64 px SVG mark for lists and the sidebar
}

export interface ModuleMeta {
  id: string;            // folder name; globally unique, because routes are /learn/:moduleId
  number: number;        // position within its track
  title: string;
  subtitle: string;
  level: Level;
  /** The track this module belongs to. See TRACKS. */
  track: TrackId;
  /** Cover art, once rendered. Absent means "draw the placeholder". */
  art?: ModuleArt;
  /** @deprecated Replaced by `art`. Kept so existing data still type-checks; no longer rendered. */
  emoji?: string;
  description: string;
  lessons: LessonMeta[];
}

export const LEVELS: Record<Level, { label: string; blurb: string }> = {
  foundation: { label: 'Foundation', blurb: 'What a market is and how prices are born.' },
  reading:    { label: 'Reading Price', blurb: 'Candles, patterns and the story a chart tells.' },
  analysis:   { label: 'Analysis', blurb: 'Structure, indicators and the bigger picture.' },
  execution:  { label: 'Execution', blurb: 'Orders, risk and the mind behind the mouse.' },
  mastery:    { label: 'Mastery', blurb: 'Strategy, derivatives and lasting consistency.' },
};

/**
 * A track is a whole course: its own modules, its own levels. There is one today. A second --
 * a Quantitative Trading track, say -- is added here and in CURRICULUM, with no page changes:
 * every page that lists modules groups them by track, and the Learn page shows track tabs as
 * soon as there is more than one.
 */
export type TrackId = 'trading-foundations';

export interface Track {
  id: TrackId;
  title: string;
  tagline: string;
  /** Track cover art, once rendered. */
  art?: ModuleArt;
  /** This track's levels, in teaching order. */
  levels: Level[];
}

export const TRACKS: Track[] = [
  {
    id: 'trading-foundations',
    title: 'Trading Foundations',
    tagline: 'From what a market is to trading consistently, one small step at a time.',
    levels: ['foundation', 'reading', 'analysis', 'execution', 'mastery'],
  },
];

export const CURRICULUM: ModuleMeta[] = [
  {
    id: 'm00-what-is-a-market',
    number: 0,
    title: 'What Is a Market?',
    subtitle: 'Kindergarten',
    level: 'foundation',
    track: 'trading-foundations',
    emoji: '🍋',
    description: 'Start here even if you have never bought a share. Markets explained with lemonade stands, playground swaps and zero jargon.',
    lessons: [
      { id: '01-the-lemonade-stand', title: 'The Lemonade Stand: Why Prices Exist', summary: 'Prices come from people agreeing to swap. That is the whole secret.', minutes: 6 },
      { id: '02-what-is-a-stock', title: 'What Is a Stock, Really?', summary: 'A share is a tiny slice of a business, and why anyone would sell one.', minutes: 7 },
      { id: '03-why-prices-move', title: 'Why Prices Go Up and Down', summary: 'More buyers than sellers pushes price up. It is a tug of war, not magic.', minutes: 7 },
      { id: '04-trading-vs-investing', title: 'Trading vs Investing', summary: 'Two different games played on the same field, with different rules and clocks.', minutes: 6 },
      { id: '05-the-players', title: 'Who Is in the Market?', summary: 'Exchanges, brokers, market makers, funds and you: who does what.', minutes: 8 },
      { id: '06-what-can-you-trade', title: 'What Can You Trade?', summary: 'Stocks, ETFs, indices, forex, crypto, commodities, futures and options in plain words.', minutes: 9 },
      { id: '07-bid-ask-spread', title: 'Bid, Ask and the Spread', summary: 'There are always two prices. Knowing which one you get is your first edge.', minutes: 7 },
      { id: '08-market-hours-and-sessions', title: 'When Markets Are Open', summary: 'Sessions, pre-market, after-hours, and why the first hour feels different.', minutes: 6 },
      { id: '09-tickers-lots-and-units', title: 'Tickers, Shares, Lots and Units', summary: 'How instruments are named and counted across markets.', minutes: 5 },
    ],
  },
  {
    id: 'm01-reading-price',
    number: 1,
    title: 'Reading a Price Chart',
    subtitle: 'Grade 1',
    level: 'reading',
    track: 'trading-foundations',
    emoji: '📈',
    description: 'A chart is just price history drawn as a picture. Learn to read line, bar and candlestick charts and what each part means.',
    lessons: [
      { id: '01-what-is-a-chart', title: 'What a Chart Actually Shows', summary: 'Time on the bottom, price on the side, and a story in between.', minutes: 6 },
      { id: '02-line-bar-candle', title: 'Line, Bar and Candlestick Charts', summary: 'Three ways to draw the same data, and why candles won.', minutes: 7 },
      { id: '03-anatomy-of-a-candle', title: 'Anatomy of a Candlestick', summary: 'Open, high, low, close, body and wicks. Every candle is a little battle report.', minutes: 9 },
      { id: '04-bullish-vs-bearish', title: 'Bullish and Bearish Candles', summary: 'Green and red, and what the size of the body is telling you.', minutes: 6 },
      { id: '05-timeframes', title: 'Timeframes: The Same Market, Many Zoom Levels', summary: 'One daily candle contains 390 one-minute candles. Choosing your zoom matters.', minutes: 8 },
      { id: '06-volume', title: 'Volume: How Many People Showed Up', summary: 'Volume confirms conviction. Price without volume is a rumour.', minutes: 7 },
      { id: '07-gaps', title: 'Gaps: When Price Jumps', summary: 'Why the next candle can open far from the last close, and what gaps mean.', minutes: 6 },
      { id: '08-log-vs-linear', title: 'Linear vs Logarithmic Scales', summary: 'Why a 100-point move is not always the same size on a chart.', minutes: 5 },
    ],
  },
  {
    id: 'm02-candlestick-patterns',
    number: 2,
    title: 'Candlestick Patterns',
    subtitle: 'Grade 2',
    level: 'reading',
    track: 'trading-foundations',
    emoji: '🕯️',
    description: 'The complete candlestick vocabulary: single, double, triple and continuation patterns, with the honest truth about how reliable each one is.',
    lessons: [
      { id: '01-how-to-read-patterns', title: 'How to Think About Candlestick Patterns', summary: 'Patterns are psychology snapshots, not magic buttons. Context decides everything.', minutes: 8 },
      { id: '02-doji-family', title: 'The Doji Family', summary: 'Standard, long-legged, dragonfly and gravestone doji: indecision in four flavours.', minutes: 9 },
      { id: '03-hammer-hanging-man', title: 'Hammer and Hanging Man', summary: 'Same shape, opposite meaning depending on where it appears.', minutes: 8 },
      { id: '04-shooting-star-inverted-hammer', title: 'Shooting Star and Inverted Hammer', summary: 'A long upper wick shows buyers tried and failed, or sellers tested the ceiling.', minutes: 7 },
      { id: '05-marubozu-spinning-top', title: 'Marubozu, Spinning Top and High Wave', summary: 'Full conviction versus full confusion in a single candle.', minutes: 7 },
      { id: '06-engulfing', title: 'Bullish and Bearish Engulfing', summary: 'One candle swallows the previous one. The most popular two-candle reversal.', minutes: 9 },
      { id: '07-harami-and-harami-cross', title: 'Harami and Harami Cross', summary: 'A small candle inside a big one: momentum stalling.', minutes: 7 },
      { id: '08-piercing-dark-cloud', title: 'Piercing Line and Dark Cloud Cover', summary: 'Halfway-back reversals and the 50% rule.', minutes: 7 },
      { id: '09-tweezers-and-counterattack', title: 'Tweezer Tops, Tweezer Bottoms and Counterattack Lines', summary: 'Matching highs or lows show a level being defended.', minutes: 7 },
      { id: '10-morning-evening-star', title: 'Morning Star and Evening Star', summary: 'Three candles that mark the dawn or the dusk of a trend.', minutes: 9 },
      { id: '11-three-soldiers-three-crows', title: 'Three White Soldiers and Three Black Crows', summary: 'Three strong candles in a row: momentum you cannot ignore.', minutes: 7 },
      { id: '12-three-inside-outside', title: 'Three Inside and Three Outside Up/Down', summary: 'Confirmation patterns built from harami and engulfing.', minutes: 7 },
      { id: '13-abandoned-baby-and-stars', title: 'Abandoned Baby, Doji Star and Rare Reversals', summary: 'Gapped stars that are rare but powerful.', minutes: 6 },
      { id: '14-continuation-patterns', title: 'Continuation Patterns: Three Methods, Tasuki Gaps, Windows, Mat Hold', summary: 'Pauses inside a trend that suggest it will keep going.', minutes: 10 },
      { id: '15-neck-lines', title: 'On-Neck, In-Neck and Thrusting Lines', summary: 'Weak bounces that usually fail.', minutes: 6 },
      { id: '16-pattern-reliability', title: 'Pattern Reliability and the Confirmation Rule', summary: 'What the statistics actually say, and how to avoid pattern-hunting.', minutes: 9 },
    ],
  },
  {
    id: 'm03-market-structure',
    number: 3,
    title: 'Market Structure',
    subtitle: 'Grade 3',
    level: 'analysis',
    track: 'trading-foundations',
    emoji: '🏗️',
    description: 'Trends, ranges, support and resistance: the skeleton beneath every chart. Learn to see where price is likely to react.',
    lessons: [
      { id: '01-trends', title: 'Trends: Higher Highs and Higher Lows', summary: 'The definition of an uptrend and a downtrend in one picture.', minutes: 8 },
      { id: '02-swing-highs-and-lows', title: 'Swing Highs and Swing Lows', summary: 'How to mark turning points consistently.', minutes: 7 },
      { id: '03-support-and-resistance', title: 'Support and Resistance', summary: 'Floors and ceilings where price has remembered to react.', minutes: 10 },
      { id: '04-trendlines-and-channels', title: 'Trendlines and Channels', summary: 'Drawing lines that mean something, and lines that are wishful thinking.', minutes: 8 },
      { id: '05-ranges-and-consolidation', title: 'Ranges and Consolidation', summary: 'Markets rest more than they run. How to trade the pause.', minutes: 7 },
      { id: '06-breakouts-and-fakeouts', title: 'Breakouts, Retests and Fakeouts', summary: 'When a level breaks for real, and when it is a trap.', minutes: 9 },
      { id: '07-role-reversal', title: 'Role Reversal: Old Resistance Becomes Support', summary: 'The flip that powers most pullback entries.', minutes: 6 },
      { id: '08-supply-and-demand-zones', title: 'Supply and Demand Zones', summary: 'Levels as areas, not lines. Where big orders were left behind.', minutes: 8 },
      { id: '09-market-cycles-wyckoff', title: 'Market Cycles: Accumulation, Markup, Distribution, Markdown', summary: 'The four-season model of every trend, from Wyckoff.', minutes: 9 },
      { id: '10-multi-timeframe', title: 'Multi-Timeframe Analysis', summary: 'Zoom out to find the trend, zoom in to find the entry.', minutes: 8 },
    ],
  },
  {
    id: 'm04-chart-patterns',
    number: 4,
    title: 'Chart Patterns',
    subtitle: 'Grade 4',
    level: 'analysis',
    track: 'trading-foundations',
    emoji: '🔺',
    description: 'Bigger shapes built from many candles: head and shoulders, double tops, triangles, flags, wedges and cups, with measured targets.',
    lessons: [
      { id: '01-chart-patterns-intro', title: 'How Chart Patterns Form', summary: 'Patterns are crowd behaviour drawn over days and weeks.', minutes: 6 },
      { id: '02-head-and-shoulders', title: 'Head and Shoulders (and Inverse)', summary: 'The classic reversal, the neckline, and the measured move.', minutes: 10 },
      { id: '03-double-triple-tops-bottoms', title: 'Double and Triple Tops and Bottoms', summary: 'Price tests a level twice or three times and gives up.', minutes: 8 },
      { id: '04-triangles', title: 'Ascending, Descending and Symmetrical Triangles', summary: 'Coiling price and the breakout that follows.', minutes: 9 },
      { id: '05-flags-and-pennants', title: 'Flags and Pennants', summary: 'Short pauses after a sharp move, and the flagpole target.', minutes: 7 },
      { id: '06-wedges', title: 'Rising and Falling Wedges', summary: 'Converging lines that slope: reversals hiding as continuations.', minutes: 7 },
      { id: '07-rectangles-and-boxes', title: 'Rectangles and Darvas Boxes', summary: 'Sideways ranges as continuation patterns.', minutes: 6 },
      { id: '08-cup-and-handle', title: 'Cup and Handle, Rounding Bottoms and Tops', summary: 'Slow, rounded reversals and the handle entry.', minutes: 7 },
      { id: '09-measured-moves-and-targets', title: 'Measured Moves and Price Targets', summary: 'Turning a pattern into a number you can plan around.', minutes: 7 },
      { id: '10-pattern-failure', title: 'When Patterns Fail', summary: 'Failed patterns are signals too, often better ones.', minutes: 6 },
    ],
  },
  {
    id: 'm05-indicators',
    number: 5,
    title: 'Technical Indicators',
    subtitle: 'Grade 5',
    level: 'analysis',
    track: 'trading-foundations',
    emoji: '🧮',
    description: 'Moving averages, RSI, MACD, Bollinger Bands, ATR, VWAP, Fibonacci and more, explained by what they calculate, not just what they look like.',
    lessons: [
      { id: '01-what-indicators-are', title: 'What Indicators Are (and Are Not)', summary: 'Every indicator is maths applied to price. None of them know the future.', minutes: 7 },
      { id: '02-moving-averages', title: 'Moving Averages: SMA, EMA and WMA', summary: 'Smoothing price to see the trend, and how the formulas differ.', minutes: 10 },
      { id: '03-ma-crossovers', title: 'Moving Average Crossovers', summary: 'Golden cross, death cross and the lag you pay for clarity.', minutes: 7 },
      { id: '04-rsi', title: 'RSI: Relative Strength Index', summary: 'Measuring momentum on a 0 to 100 scale, overbought, oversold and divergence.', minutes: 10 },
      { id: '05-macd', title: 'MACD', summary: 'Two EMAs, a signal line and a histogram: momentum and trend in one panel.', minutes: 9 },
      { id: '06-stochastic', title: 'Stochastic Oscillator', summary: 'Where the close sits within the recent range.', minutes: 7 },
      { id: '07-bollinger-bands', title: 'Bollinger Bands', summary: 'Volatility envelopes, squeezes and walking the band.', minutes: 9 },
      { id: '08-atr', title: 'ATR: Average True Range', summary: 'The volatility ruler you will use for every stop loss.', minutes: 8 },
      { id: '09-vwap', title: 'VWAP', summary: 'The average price the market actually paid today.', minutes: 7 },
      { id: '10-volume-indicators', title: 'Volume Indicators: OBV and Volume Profile', summary: 'Following the money instead of the price.', minutes: 7 },
      { id: '11-adx-and-trend-strength', title: 'ADX and Trend Strength', summary: 'Is the market trending or chopping? ADX answers without caring about direction.', minutes: 7 },
      { id: '12-fibonacci', title: 'Fibonacci Retracements and Extensions', summary: 'The 38.2, 50, 61.8 levels: where pullbacks tend to end.', minutes: 9 },
      { id: '13-pivot-points-and-ichimoku', title: 'Pivot Points and Ichimoku (Overview)', summary: 'Two complete frameworks you should recognise.', minutes: 8 },
      { id: '14-divergence', title: 'Divergence: When Price and Indicator Disagree', summary: 'Regular and hidden divergence, and how to avoid false ones.', minutes: 8 },
      { id: '15-indicator-overload', title: 'Indicator Overload and Combining Tools', summary: 'Why five indicators are worse than two, and how to build a clean chart.', minutes: 7 },
    ],
  },
  {
    id: 'm06-orders-and-execution',
    number: 6,
    title: 'Orders and Execution',
    subtitle: 'Grade 6',
    level: 'execution',
    track: 'trading-foundations',
    emoji: '🎯',
    description: 'How a click becomes a trade: every order type, long and short, leverage, slippage, fees and the order book.',
    lessons: [
      { id: '01-market-and-limit-orders', title: 'Market Orders vs Limit Orders', summary: 'Speed versus price. The first decision on every trade.', minutes: 8 },
      { id: '02-stop-orders', title: 'Stop, Stop-Limit and Trailing Stops', summary: 'Orders that wait for price to reach a trigger.', minutes: 9 },
      { id: '03-bracket-and-oco', title: 'Bracket Orders, OCO and Take Profit', summary: 'Plan the whole trade before you enter it.', minutes: 7 },
      { id: '04-time-in-force', title: 'Time in Force: DAY, GTC, IOC, FOK', summary: 'How long your order stays alive.', minutes: 5 },
      { id: '05-going-long-and-short', title: 'Going Long and Going Short', summary: 'Making money when prices fall, and what borrowing shares really means.', minutes: 9 },
      { id: '06-margin-and-leverage', title: 'Margin and Leverage', summary: 'Trading with borrowed money: amplified gains, amplified pain, and margin calls.', minutes: 10 },
      { id: '07-slippage-and-liquidity', title: 'Slippage, Liquidity and Fills', summary: 'Why you rarely get the price on the screen.', minutes: 7 },
      { id: '08-order-book-and-level-2', title: 'The Order Book and Level 2', summary: 'Seeing the queue of buyers and sellers.', minutes: 8 },
      { id: '09-fees-commissions-settlement', title: 'Fees, Commissions, Spreads and Settlement', summary: 'The costs that quietly decide whether a strategy works.', minutes: 7 },
    ],
  },
  {
    id: 'm07-risk-management',
    number: 7,
    title: 'Risk Management',
    subtitle: 'Grade 7',
    level: 'execution',
    track: 'trading-foundations',
    emoji: '🛡️',
    description: 'The module that separates survivors from statistics. Position sizing, risk to reward, expectancy and drawdown, with the maths made simple.',
    lessons: [
      { id: '01-why-risk-first', title: 'Why Risk Comes Before Reward', summary: 'Lose 50% and you need 100% to get back. The asymmetry of losses.', minutes: 8 },
      { id: '02-the-one-percent-rule', title: 'The 1% Rule and Position Sizing', summary: 'How many shares to buy, calculated from your stop, not your gut.', minutes: 10 },
      { id: '03-stop-loss-placement', title: 'Where to Put Your Stop Loss', summary: 'Structure stops, ATR stops and the stops that get hunted.', minutes: 9 },
      { id: '04-risk-reward-ratio', title: 'Risk to Reward and R-Multiples', summary: 'Thinking in R makes every trade comparable.', minutes: 8 },
      { id: '05-expectancy', title: 'Expectancy: The Only Number That Matters', summary: 'Win rate times average win minus loss rate times average loss.', minutes: 9 },
      { id: '06-win-rate-vs-rr', title: 'Win Rate vs Risk Reward: You Cannot Have It All', summary: 'Why a 40% win rate can beat an 80% one.', minutes: 7 },
      { id: '07-drawdown-and-risk-of-ruin', title: 'Drawdown, Losing Streaks and Risk of Ruin', summary: 'Streaks are normal. Plan for them before they happen.', minutes: 8 },
      { id: '08-correlation-and-diversification', title: 'Correlation and Diversification', summary: 'Five tech longs are one trade wearing five hats.', minutes: 6 },
      { id: '09-daily-loss-limits', title: 'Daily Loss Limits and Circuit Breakers', summary: 'Rules that switch you off before you blow up.', minutes: 6 },
      { id: '10-never-average-down', title: 'Averaging Down, Martingale and Other Traps', summary: 'The maths of doubling into losers.', minutes: 6 },
    ],
  },
  {
    id: 'm08-trading-psychology',
    number: 8,
    title: 'Trading Psychology',
    subtitle: 'Grade 8',
    level: 'execution',
    track: 'trading-foundations',
    emoji: '🧠',
    description: 'Your brain evolved to survive tigers, not candles. Learn the biases that wreck traders and the routines that beat them.',
    lessons: [
      { id: '01-fear-and-greed', title: 'Fear and Greed: The Two Engines', summary: 'Every mistake in trading is one of these two wearing a costume.', minutes: 7 },
      { id: '02-fomo-and-chasing', title: 'FOMO and Chasing Price', summary: 'Why the best-looking entry is usually the worst one.', minutes: 6 },
      { id: '03-revenge-trading', title: 'Revenge Trading and Tilt', summary: 'The loss that leads to the bigger loss.', minutes: 6 },
      { id: '04-cognitive-biases', title: 'Cognitive Biases: Loss Aversion, Confirmation, Sunk Cost, Recency', summary: 'The built-in bugs in human judgement.', minutes: 10 },
      { id: '05-overtrading-and-boredom', title: 'Overtrading and Boredom Trades', summary: 'Doing nothing is a position.', minutes: 6 },
      { id: '06-process-over-outcome', title: 'Process Over Outcome', summary: 'Good trades can lose. Bad trades can win. Judge the decision, not the result.', minutes: 8 },
      { id: '07-routines-and-discipline', title: 'Routines, Checklists and Discipline', summary: 'Pilots use checklists. So do consistent traders.', minutes: 7 },
      { id: '08-handling-losing-streaks', title: 'Handling Losing Streaks and Big Wins', summary: 'Both ends of the emotional spectrum are dangerous.', minutes: 7 },
    ],
  },
  {
    id: 'm09-strategies',
    number: 9,
    title: 'Strategies and Trading Styles',
    subtitle: 'Grade 9',
    level: 'mastery',
    track: 'trading-foundations',
    emoji: '♟️',
    description: 'Scalping to position trading, trend following to mean reversion. Build a complete rule-based plan and test it properly.',
    lessons: [
      { id: '01-trading-styles', title: 'Scalping, Day Trading, Swing Trading, Position Trading', summary: 'Pick the style that fits your life, not the one that looks exciting.', minutes: 9 },
      { id: '02-what-is-an-edge', title: 'What Is an Edge?', summary: 'A repeatable reason the odds favour you. Without one, you are the casino\'s customer.', minutes: 7 },
      { id: '03-trend-following', title: 'Trend Following Strategies', summary: 'Buy strength, sell weakness, hold winners.', minutes: 9 },
      { id: '04-pullback-trading', title: 'Pullback Trading', summary: 'Enter with the trend after a rest.', minutes: 8 },
      { id: '05-breakout-trading', title: 'Breakout Trading', summary: 'Catching the move as it leaves the range.', minutes: 8 },
      { id: '06-mean-reversion', title: 'Mean Reversion and Range Trading', summary: 'Fading extremes when the market is going nowhere.', minutes: 8 },
      { id: '07-momentum-and-news', title: 'Momentum and Catalyst Trading', summary: 'Trading the reaction to news, earnings and events.', minutes: 7 },
      { id: '08-building-a-trading-plan', title: 'Building a Complete Trading Plan', summary: 'Setup, entry, stop, target, size, management, review: the seven parts.', minutes: 11 },
      { id: '09-backtesting-and-forward-testing', title: 'Backtesting, Forward Testing and Sample Size', summary: 'Prove your idea on the past, then on paper, then with small money.', minutes: 9 },
      { id: '10-example-strategies', title: 'Three Complete Example Strategies', summary: 'Fully specified plans you can practise in the simulator today.', minutes: 12 },
    ],
  },
  {
    id: 'm10-fundamentals-and-macro',
    number: 10,
    title: 'Fundamentals and the Big Picture',
    subtitle: 'Grade 10',
    level: 'mastery',
    track: 'trading-foundations',
    emoji: '🌍',
    description: 'Earnings, valuation, interest rates, economic data and sentiment: the forces behind the candles.',
    lessons: [
      { id: '01-technical-vs-fundamental', title: 'Technical vs Fundamental Analysis', summary: 'Two lenses, and why most traders end up using both.', minutes: 6 },
      { id: '02-earnings-and-financial-statements', title: 'Earnings, Revenue and Financial Statements', summary: 'Income statement, balance sheet, cash flow: the three reports.', minutes: 10 },
      { id: '03-valuation-basics', title: 'Valuation: P/E, EPS, Market Cap and Growth', summary: 'What "expensive" and "cheap" mean for a share.', minutes: 8 },
      { id: '04-interest-rates-and-central-banks', title: 'Interest Rates and Central Banks', summary: 'Why the Fed moves every market.', minutes: 8 },
      { id: '05-economic-calendar', title: 'The Economic Calendar: CPI, NFP, GDP, FOMC', summary: 'The scheduled events that cause the biggest candles.', minutes: 8 },
      { id: '06-sectors-and-rotation', title: 'Sectors, Industries and Rotation', summary: 'Money moves between groups. Follow it.', minutes: 6 },
      { id: '07-sentiment-vix-put-call', title: 'Market Sentiment: VIX, Put/Call, Fear and Greed', summary: 'Measuring the crowd\'s mood.', minutes: 7 },
      { id: '08-news-catalysts-and-events', title: 'News, Catalysts and Event Risk', summary: 'Earnings gaps, guidance, upgrades and the danger of holding through events.', minutes: 7 },
    ],
  },
  {
    id: 'm11-derivatives-and-other-markets',
    number: 11,
    title: 'Options, Futures, Forex and Crypto',
    subtitle: 'Grade 11',
    level: 'mastery',
    track: 'trading-foundations',
    emoji: '🧩',
    description: 'The instruments beyond plain shares. Enough to understand what you are looking at and to avoid the classic beginner blow-ups.',
    lessons: [
      { id: '01-options-basics', title: 'Options: Calls and Puts', summary: 'The right, not the obligation. Strike, expiry and premium.', minutes: 10 },
      { id: '02-options-pricing-and-greeks', title: 'Options Pricing and the Greeks', summary: 'Intrinsic vs extrinsic value, delta, theta, gamma, vega, and why time is the enemy.', minutes: 11 },
      { id: '03-basic-options-strategies', title: 'Basic Options Strategies', summary: 'Covered calls, protective puts, spreads and why selling premium is popular.', minutes: 9 },
      { id: '04-futures', title: 'Futures Contracts', summary: 'Standardised contracts, tick values, margin and expiry.', minutes: 9 },
      { id: '05-forex', title: 'Forex: Pairs, Pips and Lots', summary: 'Trading one currency against another, 24 hours a day.', minutes: 9 },
      { id: '06-crypto', title: 'Crypto Markets', summary: '24/7 trading, perpetual futures, funding rates and exchange risk.', minutes: 8 },
      { id: '07-etfs-and-leveraged-products', title: 'ETFs, Leveraged ETFs and CFDs', summary: 'Wrapped exposure, and why leveraged ETFs decay.', minutes: 7 },
    ],
  },
  {
    id: 'm12-becoming-consistent',
    number: 12,
    title: 'Becoming Consistent',
    subtitle: 'Graduation',
    level: 'mastery',
    track: 'trading-foundations',
    emoji: '🎓',
    description: 'Journaling, performance metrics, choosing a broker, avoiding scams, and the path from simulator to small real money.',
    lessons: [
      { id: '01-the-trading-journal', title: 'The Trading Journal', summary: 'The single highest-return habit in trading.', minutes: 8 },
      { id: '02-performance-metrics', title: 'Performance Metrics: Profit Factor, Expectancy, Sharpe, Max Drawdown', summary: 'How professionals measure themselves.', minutes: 9 },
      { id: '03-review-and-improve', title: 'The Weekly Review Loop', summary: 'Find your best setup and your worst habit, every week.', minutes: 6 },
      { id: '04-choosing-a-broker', title: 'Choosing a Broker and Platform', summary: 'Regulation, fees, execution, tools and red flags.', minutes: 8 },
      { id: '05-scams-and-red-flags', title: 'Scams, Gurus and Red Flags', summary: 'If it promises returns, it is selling you something.', minutes: 7 },
      { id: '06-taxes-and-records', title: 'Taxes and Record-Keeping (General Principles)', summary: 'Trading income is taxable nearly everywhere. Keep records from day one.', minutes: 5 },
      { id: '07-from-simulator-to-real', title: 'From Simulator to Real Money', summary: 'The graduation checklist and how to size your first real trades.', minutes: 8 },
      { id: '08-continuous-learning', title: 'Continuous Learning and Next Steps', summary: 'Books, habits and what to study next.', minutes: 6 },
    ],
  },
];

export interface FlatLesson extends LessonMeta {
  moduleId: string;
  moduleTitle: string;
  moduleNumber: number;
  /** @deprecated See ModuleMeta.emoji. */
  moduleEmoji?: string;
  trackId: TrackId;
  index: number;
  path: string;
}

export const ALL_LESSONS: FlatLesson[] = CURRICULUM.flatMap((m) =>
  m.lessons.map((l, i) => ({
    ...l,
    moduleId: m.id,
    moduleTitle: m.title,
    moduleNumber: m.number,
    moduleEmoji: m.emoji,
    trackId: m.track,
    index: i,
    path: `/learn/${m.id}/${l.id}`,
  })),
);

export function findLesson(moduleId: string, lessonId: string) {
  const idx = ALL_LESSONS.findIndex((l) => l.moduleId === moduleId && l.id === lessonId);
  if (idx === -1) return null;
  return {
    lesson: ALL_LESSONS[idx],
    prev: ALL_LESSONS[idx - 1] ?? null,
    next: ALL_LESSONS[idx + 1] ?? null,
    position: idx,
  };
}

export function findModule(moduleId: string) {
  return CURRICULUM.find((m) => m.id === moduleId) ?? null;
}

export const TOTAL_LESSONS = ALL_LESSONS.length;
export const TOTAL_MINUTES = ALL_LESSONS.reduce((s, l) => s + l.minutes, 0);

export function findTrack(trackId: string) {
  return TRACKS.find((t) => t.id === trackId) ?? null;
}

/** A track's modules, in order. */
export function modulesInTrack(trackId: string): ModuleMeta[] {
  return CURRICULUM.filter((m) => m.track === trackId);
}

/** A track's modules grouped by level, in the track's level order; empty levels are left out. */
export function modulesByLevel(trackId: string): { level: Level; modules: ModuleMeta[] }[] {
  const track = findTrack(trackId);
  if (!track) return [];
  return track.levels
    .map((level) => ({ level, modules: modulesInTrack(trackId).filter((m) => m.level === level) }))
    .filter((g) => g.modules.length > 0);
}

/** Total reading minutes in a module. */
export function moduleMinutes(m: ModuleMeta): number {
  return m.lessons.reduce((sum, l) => sum + l.minutes, 0);
}
