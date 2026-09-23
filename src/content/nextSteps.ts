/**
 * "What's next" after a lesson: one practical thing to do in the trainer or simulator, per
 * module. Every step names a drill, instrument or control that exists, so a reader who follows
 * it finds exactly what it describes.
 *
 * Keyed by module id. A module without an entry shows no strip, which is fine.
 */
export interface NextStep {
  to: '/simulator' | '/trainer' | '/journal';
  title: string;
  text: string;
}

export const NEXT_STEPS: Record<string, NextStep> = {
  'm00-what-is-a-market': {
    to: '/simulator',
    title: 'Watch a market move',
    text: 'Open BLUE, the calmest instrument, press Play at 1x, and watch each candle form from the trades inside it before it closes.',
  },
  'm01-reading-price': {
    to: '/simulator',
    title: 'Read a chart bar by bar',
    text: 'On BLUE, switch between the 5m, 1h and 1D timeframes, then use Candle to step one bar at a time and name each candle before it closes.',
  },
  'm02-candlestick-patterns': {
    to: '/trainer',
    title: 'Drill the patterns',
    text: 'Run ten rounds of Name the pattern. Before answering, check two things: what came before the pattern, and whether the body rule is really met.',
  },
  'm03-market-structure': {
    to: '/simulator',
    title: 'Mark the structure',
    text: 'Open IDX on the 1h chart and find the last two swing highs and lows. Is it making higher highs, lower lows, or neither?',
  },
  'm04-chart-patterns': {
    to: '/trainer',
    title: 'Spot chart patterns',
    text: 'Name the pattern includes chart patterns as well as candles. Aim for a streak of five before moving on.',
  },
  'm05-indicators': {
    to: '/simulator',
    title: 'Put one indicator to work',
    text: 'Open AURM, turn on Bollinger and RSI, and step through a range. Note how often a touch of the band actually reversed.',
  },
  'm06-orders-and-execution': {
    to: '/simulator',
    title: 'Place every order type',
    text: 'On NOVA, place one Market, one Limit, one Stop and one Stop limit order, each with a stop loss and take profit attached, and watch which fill.',
  },
  'm07-risk-management': {
    to: '/simulator',
    title: 'Size a trade by its stop',
    text: 'Use the order ticket’s 1% risk size on CRYP. Its gaps show why the stop decides the size, and why a stop is not a guarantee.',
  },
  'm08-trading-psychology': {
    to: '/trainer',
    title: 'Practise being wrong',
    text: 'Play Next candles for twenty rounds. A good read still loses often; notice how you feel after three misses in a row.',
  },
  'm09-strategies': {
    to: '/simulator',
    title: 'Trade one strategy, and only one',
    text: 'Pick a strategy from this module, write it in the order note, and take ten trades on PETR with it. Then review them in the journal.',
  },
  'm10-fundamentals-and-macro': {
    to: '/simulator',
    title: 'Meet event risk',
    text: 'Hold a small position in BIOX with a stop and play forward. Its trial-result gaps show what news does to a plan.',
  },
  'm11-derivatives-and-other-markets': {
    to: '/simulator',
    title: 'Feel a different market',
    text: 'Compare FXEU and CRYP on the same timeframe: tiny pip moves against violent wicks. Size each so a stop costs the same.',
  },
  'm12-becoming-consistent': {
    to: '/journal',
    title: 'Review your own numbers',
    text: 'Open the journal, tag your last trades with setups and mistakes, and read your expectancy before your win rate.',
  },
};
