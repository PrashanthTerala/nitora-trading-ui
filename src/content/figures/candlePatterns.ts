/**
 * Preset figures for every candlestick pattern taught on the site.
 * Each preset = context candles + the pattern + (optionally) confirmation candles,
 * with annotations so the reader's eye lands on the right thing.
 */
import type { OHLC } from '@/engine/market/types';
import type { Annotation } from '@/components/figures/CandleSvg';
import { bar, drift, chain, concat } from './helpers';

export interface FigurePreset {
  title: string;
  bars: OHLC[];
  annotations?: Annotation[];
  caption?: string;
  showVolume?: boolean;
  fadeBefore?: number;
}

const down = (seed: string, from = 110, to = 100, n = 6) => drift(from, to, n, seed, { bias: -1, noise: 0.9 });
const up = (seed: string, from = 90, to = 100, n = 6) => drift(from, to, n, seed, { bias: 1, noise: 0.9 });

function lab(index: number, text: string, position: 'above' | 'below' = 'above'): Annotation {
  return { type: 'label', index, text, position };
}
function brk(from: number, to: number, text: string, position: 'above' | 'below' = 'below'): Annotation {
  return { type: 'bracket', from, to, text, position };
}

/** Pattern starts at index p after `ctx` context bars. */
function build(ctx: OHLC[], pattern: OHLC[], after: OHLC[] = []): OHLC[] {
  return chain(chain(ctx, pattern), after);
}

export const CANDLE_PATTERNS: Record<string, FigurePreset> = {
  // ---------- anatomy / basics ----------
  'anatomy-bullish': {
    title: 'A bullish candle',
    bars: [bar(100, 106, 98.5, 104.5)],
    annotations: [lab(0, 'High 106', 'above'), lab(0, 'Low 98.5', 'below')],
    caption: 'Open 100, close 104.5. The body is the distance between open and close; the wicks reach the high and low.',
  },
  'anatomy-bearish': {
    title: 'A bearish candle',
    bars: [bar(104.5, 106, 98.5, 100)],
    annotations: [lab(0, 'High 106', 'above'), lab(0, 'Low 98.5', 'below')],
    caption: 'Open 104.5, close 100. Same high and low as the bullish example, but sellers won the session.',
  },
  'body-sizes': {
    title: 'Body size tells conviction',
    bars: [bar(100, 100.6, 99.4, 100.2), bar(100.2, 102.5, 99.8, 102.1), bar(102.1, 106.8, 101.9, 106.5), bar(106.5, 107, 102, 102.4), bar(102.4, 103, 98, 98.2)],
    annotations: [lab(0, 'tiny'), lab(1, 'small'), lab(2, 'strong'), lab(3, 'strong sell'), lab(4, 'strong sell')],
    caption: 'Left to right: indecision, mild buying, strong buying, then two strong selling candles.',
  },

  // ---------- single-candle ----------
  'doji': {
    title: 'Standard doji',
    bars: build(down('doji'), [bar(100, 101.6, 98.4, 100.05)], [bar(100.1, 103, 99.8, 102.7)]),
    annotations: [lab(6, 'Doji'), lab(7, 'confirmation', 'below')],
    caption: 'Open and close nearly equal after a decline. Buyers and sellers fought to a draw; the next candle decides.',
  },
  'long-legged-doji': {
    title: 'Long-legged doji',
    bars: build(up('lld'), [bar(100, 104.5, 95.5, 100.1)]),
    annotations: [lab(6, 'Long-legged doji')],
    caption: 'Huge wicks both ways, no body. Extreme indecision after a run-up.',
  },
  'dragonfly-doji': {
    title: 'Dragonfly doji',
    bars: build(down('dragon'), [bar(100, 100.2, 95.6, 100.05)], [bar(100.1, 103.2, 99.9, 102.9)]),
    annotations: [lab(6, 'Dragonfly'), lab(7, 'confirmation')],
    caption: 'Long lower wick, open and close at the top. Sellers pushed price down hard, buyers took it all back.',
  },
  'gravestone-doji': {
    title: 'Gravestone doji',
    bars: build(up('grave'), [bar(100, 104.6, 99.8, 100.05)], [bar(100, 100.3, 97, 97.3)]),
    annotations: [lab(6, 'Gravestone'), lab(7, 'confirmation', 'below')],
    caption: 'Long upper wick, open and close at the bottom. Buyers tried to push higher and were completely rejected.',
  },
  'hammer': {
    title: 'Hammer',
    bars: build(down('hammer', 112, 100), [bar(100, 100.6, 95.2, 100.4)], [bar(100.5, 103.8, 100.1, 103.5), bar(103.5, 106, 103, 105.6)]),
    annotations: [lab(6, 'Hammer'), lab(7, 'confirmation'), brk(0, 5, 'downtrend')],
    caption: 'Small body at the top, lower wick at least twice the body, after a decline. Sellers were overwhelmed intraday.',
  },
  'hanging-man': {
    title: 'Hanging man',
    bars: build(up('hang', 88, 100), [bar(100, 100.7, 95.4, 100.3)], [bar(100.2, 100.5, 97, 97.3), bar(97.3, 97.8, 94, 94.4)]),
    annotations: [lab(6, 'Hanging man'), lab(7, 'confirmation'), brk(0, 5, 'uptrend')],
    caption: 'Identical shape to the hammer, but after a rise. Sellers showed up for the first time; the bearish close next day confirms.',
  },
  'inverted-hammer': {
    title: 'Inverted hammer',
    bars: build(down('invh', 112, 100), [bar(100, 104.8, 99.6, 100.3)], [bar(100.4, 103.5, 100, 103.2)]),
    annotations: [lab(6, 'Inverted hammer'), lab(7, 'confirmation')],
    caption: 'Long upper wick after a decline. Buyers are testing the ceiling; a bullish next candle is needed.',
  },
  'shooting-star': {
    title: 'Shooting star',
    bars: build(up('star', 88, 100), [bar(100, 105.2, 99.7, 100.2)], [bar(100, 100.4, 96.5, 96.8)]),
    annotations: [lab(6, 'Shooting star'), lab(7, 'confirmation', 'below')],
    caption: 'Small body at the bottom, long upper wick, after a rise. Buyers were rejected hard at the highs.',
  },
  'marubozu-bullish': {
    title: 'Bullish marubozu',
    bars: build(drift(98, 100, 5, 'mzb', { bias: 0, noise: 0.5 }), [bar(100, 106.2, 99.95, 106.1)]),
    annotations: [lab(5, 'Marubozu')],
    caption: 'Open at the low, close at the high, almost no wicks. Buyers were in control from the first second to the last.',
  },
  'marubozu-bearish': {
    title: 'Bearish marubozu',
    bars: build(drift(102, 100, 5, 'mzs', { bias: 0, noise: 0.5 }), [bar(100, 100.05, 93.8, 93.9)]),
    annotations: [lab(5, 'Marubozu', 'below')],
    caption: 'Open at the high, close at the low. Total seller control.',
  },
  'spinning-top': {
    title: 'Spinning top',
    bars: build(up('spin', 92, 100), [bar(100, 102.4, 97.6, 100.5)]),
    annotations: [lab(6, 'Spinning top')],
    caption: 'Small body, wicks of similar length on both sides. Neither side won; the trend is pausing.',
  },
  'high-wave': {
    title: 'High wave candle',
    bars: build(up('hw', 92, 100), [bar(100, 105.8, 94.3, 100.6)]),
    annotations: [lab(6, 'High wave')],
    caption: 'A spinning top with enormous wicks: violent indecision, often near turning points.',
  },

  // ---------- two-candle ----------
  'bullish-engulfing': {
    title: 'Bullish engulfing',
    bars: build(down('beng', 112, 101), [bar(101, 101.4, 98.9, 99.2), bar(98.8, 103.4, 98.4, 103.1)], [bar(103.2, 105.5, 102.8, 105.2)]),
    annotations: [brk(6, 7, 'engulfing', 'above'), lab(8, 'follow-through')],
    caption: 'A small red candle is completely swallowed by a big green body. Buyers absorbed all selling and more.',
  },
  'bearish-engulfing': {
    title: 'Bearish engulfing',
    bars: build(up('seng', 88, 99), [bar(99, 101.2, 98.7, 100.9), bar(101.3, 101.6, 96.6, 96.9)], [bar(96.8, 97.2, 94.2, 94.6)]),
    annotations: [brk(6, 7, 'engulfing', 'above'), lab(8, 'follow-through', 'below')],
    caption: 'A small green candle is swallowed by a large red body at the top of a rise.',
  },
  'bullish-harami': {
    title: 'Bullish harami',
    bars: build(down('bhar', 112, 102), [bar(102, 102.3, 96.5, 96.8), bar(98.2, 100.1, 97.6, 99.6)], [bar(99.7, 102.8, 99.4, 102.5)]),
    annotations: [brk(6, 7, 'harami', 'above'), lab(8, 'confirmation')],
    caption: 'A big red candle followed by a small candle inside its body. Selling momentum has stalled.',
  },
  'bearish-harami': {
    title: 'Bearish harami',
    bars: build(up('shar', 88, 98), [bar(98, 103.6, 97.7, 103.3), bar(101.9, 102.4, 100.3, 100.6)], [bar(100.5, 100.8, 97.6, 97.9)]),
    annotations: [brk(6, 7, 'harami', 'above'), lab(8, 'confirmation', 'below')],
    caption: 'A big green candle followed by a small candle inside its body. Buying momentum has stalled.',
  },
  'harami-cross': {
    title: 'Bullish harami cross',
    bars: build(down('hcross', 112, 102), [bar(102, 102.3, 96.5, 96.8), bar(99.2, 100.3, 98.1, 99.25)], [bar(99.3, 102.5, 99, 102.2)]),
    annotations: [brk(6, 7, 'harami cross', 'above'), lab(7, 'doji')],
    caption: 'A harami where the inside candle is a doji. Stronger than a plain harami because the pause is total.',
  },
  'piercing-line': {
    title: 'Piercing line',
    bars: build(down('pierce', 112, 103), [bar(103, 103.2, 97.8, 98), bar(96.9, 101.6, 96.6, 101.3)], [bar(101.4, 104, 101, 103.7)]),
    annotations: [brk(6, 7, 'piercing', 'above'), { type: 'hline', price: 100.5, text: '50% of red body', from: 5, to: 8, color: 'var(--color-ink-soft)' }],
    caption: 'Opens below the prior low and closes above the midpoint of the red body. A partial but strong recovery.',
  },
  'dark-cloud-cover': {
    title: 'Dark cloud cover',
    bars: build(up('dcc', 88, 97), [bar(97, 102.3, 96.8, 102), bar(103.1, 103.4, 98.6, 98.9)], [bar(98.8, 99.2, 96, 96.3)]),
    annotations: [brk(6, 7, 'dark cloud', 'above'), { type: 'hline', price: 99.5, text: '50% of green body', from: 5, to: 8, color: 'var(--color-ink-soft)' }],
    caption: 'Opens above the prior high, closes below the midpoint of the green body. The mirror of the piercing line.',
  },
  'tweezer-bottom': {
    title: 'Tweezer bottom',
    bars: build(down('tweb', 112, 102), [bar(102, 102.4, 96.5, 97.2), bar(97.1, 101.8, 96.5, 101.5)], [bar(101.6, 104, 101.2, 103.6)]),
    annotations: [{ type: 'hline', price: 96.5, text: 'same low', from: 5, to: 8 }, brk(6, 7, 'tweezer', 'above')],
    caption: 'Two candles with matching lows. The level was tested twice and held.',
  },
  'tweezer-top': {
    title: 'Tweezer top',
    bars: build(up('twet', 88, 98), [bar(98, 103.5, 97.7, 102.9), bar(102.8, 103.5, 98.4, 98.7)], [bar(98.6, 99, 95.8, 96.1)]),
    annotations: [{ type: 'hline', price: 103.5, text: 'same high', from: 5, to: 8 }, brk(6, 7, 'tweezer', 'below')],
    caption: 'Two candles with matching highs. Buyers failed at the same ceiling twice.',
  },
  'bullish-counterattack': {
    title: 'Bullish counterattack line',
    bars: build(down('bca', 112, 103), [bar(103, 103.2, 97.5, 97.8), bar(94.5, 98.2, 94.2, 97.9)], [bar(98, 101.2, 97.8, 101)]),
    annotations: [brk(6, 7, 'counterattack', 'above'), { type: 'hline', price: 97.85, text: 'closes match', from: 5, to: 8, color: 'var(--color-ink-soft)' }],
    caption: 'Gaps down, then rallies to close right where the previous candle closed. Sellers gained nothing.',
  },
  'bearish-counterattack': {
    title: 'Bearish counterattack line',
    bars: build(up('sca', 88, 97), [bar(97, 102.5, 96.8, 102.2), bar(105.4, 105.8, 101.8, 102.1)], [bar(102, 102.3, 98.9, 99.2)]),
    annotations: [brk(6, 7, 'counterattack', 'above')],
    caption: 'Gaps up, then sells off to close where the previous candle closed. Buyers gained nothing.',
  },

  // ---------- three-candle ----------
  'morning-star': {
    title: 'Morning star',
    bars: build(down('mstar', 114, 103), [bar(103, 103.4, 97.6, 97.9), bar(97.2, 98.3, 96.1, 97), bar(98.1, 103.2, 97.8, 102.9)], [bar(103, 105.6, 102.6, 105.3)]),
    annotations: [brk(6, 8, 'morning star', 'above'), lab(7, 'star', 'below')],
    caption: 'Big red, small indecisive star (often gapped), then a big green closing well into the first candle. Dawn after the night.',
  },
  'evening-star': {
    title: 'Evening star',
    bars: build(up('estar', 86, 97), [bar(97, 102.5, 96.7, 102.2), bar(102.9, 104, 102.3, 103.2), bar(102.4, 102.7, 97.3, 97.6)], [bar(97.5, 97.9, 94.8, 95.1)]),
    annotations: [brk(6, 8, 'evening star', 'above'), lab(7, 'star')],
    caption: 'Big green, small star at the top, then a big red. Dusk after the day.',
  },
  'morning-doji-star': {
    title: 'Morning doji star',
    bars: build(down('mdstar', 114, 103), [bar(103, 103.4, 97.6, 97.9), bar(97, 98.1, 95.9, 97.05), bar(98, 103, 97.7, 102.7)]),
    annotations: [brk(6, 8, 'morning doji star', 'above'), lab(7, 'doji', 'below')],
    caption: 'A morning star whose middle candle is a doji. Rarer and considered stronger.',
  },
  'abandoned-baby-bullish': {
    title: 'Bullish abandoned baby',
    bars: build(down('abb', 114, 103), [bar(103, 103.4, 98.6, 98.9), bar(97.3, 97.9, 96.5, 97.35), bar(99.2, 103.4, 98.9, 103.1)]),
    annotations: [lab(7, 'gap both sides', 'below'), brk(6, 8, 'abandoned baby', 'above')],
    caption: 'A doji that gaps away from both neighbours. The market abandoned the old price entirely.',
  },
  'abandoned-baby-bearish': {
    title: 'Bearish abandoned baby',
    bars: build(up('abs', 86, 97), [bar(97, 102, 96.7, 101.7), bar(103.2, 104, 102.6, 103.25), bar(101.4, 101.7, 97.2, 97.5)]),
    annotations: [lab(7, 'gap both sides'), brk(6, 8, 'abandoned baby', 'below')],
    caption: 'The bearish mirror: an isolated doji at the top with gaps on both sides.',
  },
  'three-white-soldiers': {
    title: 'Three white soldiers',
    bars: build(down('tws', 112, 100, 5), [bar(100, 103.2, 99.6, 102.9), bar(102.2, 106, 101.9, 105.7), bar(105, 108.9, 104.7, 108.6)]),
    annotations: [brk(5, 7, 'three white soldiers', 'below')],
    caption: 'Three tall green candles, each opening inside the previous body and closing near its high.',
  },
  'three-black-crows': {
    title: 'Three black crows',
    bars: build(up('tbc', 88, 100, 5), [bar(100, 100.4, 96.8, 97.1), bar(97.8, 98.1, 94, 94.3), bar(95, 95.3, 91, 91.4)]),
    annotations: [brk(5, 7, 'three black crows', 'above')],
    caption: 'Three tall red candles, each opening inside the previous body and closing near its low.',
  },
  'three-inside-up': {
    title: 'Three inside up',
    bars: build(down('tiu', 112, 102), [bar(102, 102.3, 96.5, 96.8), bar(98.2, 100.4, 97.6, 100.1), bar(100.2, 103.6, 99.9, 103.3)]),
    annotations: [brk(6, 7, 'harami', 'above'), lab(8, 'close above 1st open')],
    caption: 'A bullish harami plus a third candle that closes above the first candle\'s open. The harami is confirmed.',
  },
  'three-inside-down': {
    title: 'Three inside down',
    bars: build(up('tid', 88, 98), [bar(98, 103.6, 97.7, 103.3), bar(101.9, 102.4, 100.3, 100.6), bar(100.5, 100.8, 96.9, 97.2)]),
    annotations: [brk(6, 7, 'harami', 'above'), lab(8, 'close below 1st open', 'below')],
    caption: 'A bearish harami confirmed by a third candle closing below the first candle\'s open.',
  },
  'three-outside-up': {
    title: 'Three outside up',
    bars: build(down('tou', 112, 101), [bar(101, 101.4, 98.9, 99.2), bar(98.8, 103.4, 98.4, 103.1), bar(103.2, 106, 102.9, 105.7)]),
    annotations: [brk(6, 7, 'engulfing', 'above'), lab(8, 'higher close')],
    caption: 'Bullish engulfing plus a third candle closing higher again.',
  },
  'three-outside-down': {
    title: 'Three outside down',
    bars: build(up('tod', 88, 99), [bar(99, 101.2, 98.7, 100.9), bar(101.3, 101.6, 96.6, 96.9), bar(96.8, 97.2, 93.8, 94.1)]),
    annotations: [brk(6, 7, 'engulfing', 'above'), lab(8, 'lower close', 'below')],
    caption: 'Bearish engulfing plus a third candle closing lower again.',
  },

  // ---------- continuation ----------
  'rising-three-methods': {
    title: 'Rising three methods',
    bars: build(up('r3m', 90, 100, 5), [bar(100, 106.2, 99.7, 105.9), bar(105.4, 105.8, 103.6, 104), bar(103.9, 104.3, 102.2, 102.6), bar(102.5, 103, 101.2, 101.6), bar(101.8, 108.6, 101.5, 108.3)]),
    annotations: [brk(6, 8, 'three small pullback candles', 'above'), lab(9, 'new high')],
    caption: 'A big green candle, three small red candles that stay inside its range, then a big green candle to new highs. The trend rested and resumed.',
  },
  'falling-three-methods': {
    title: 'Falling three methods',
    bars: build(down('f3m', 110, 100, 5), [bar(100, 100.3, 93.8, 94.1), bar(94.6, 96, 94.2, 95.8), bar(95.9, 97.5, 95.5, 97.2), bar(97.3, 98.7, 96.9, 98.5), bar(98.2, 98.5, 91.4, 91.7)]),
    annotations: [brk(6, 8, 'three small bounce candles', 'below'), lab(9, 'new low', 'below')],
    caption: 'The bearish mirror: a big red candle, a weak three-candle bounce inside its range, then a new low.',
  },
  'upside-tasuki-gap': {
    title: 'Upside tasuki gap',
    bars: build(up('utg', 90, 100, 5), [bar(100, 103, 99.7, 102.7), bar(104.2, 107, 103.9, 106.6), bar(106.2, 106.5, 103.6, 103.9)], [bar(104, 108, 103.8, 107.7)]),
    annotations: [lab(6, 'gap up'), lab(7, 'partially fills gap', 'below'), lab(8, 'resumes')],
    caption: 'Two green candles with a gap between them, then a red candle that closes inside the gap without filling it. The gap holds.',
  },
  'downside-tasuki-gap': {
    title: 'Downside tasuki gap',
    bars: build(down('dtg', 110, 100, 5), [bar(100, 100.3, 97, 97.3), bar(95.8, 96.1, 92.6, 92.9), bar(93.2, 95.6, 92.9, 95.3)], [bar(95.1, 95.4, 91.2, 91.5)]),
    annotations: [lab(6, 'gap down', 'below'), lab(7, 'partially fills gap'), lab(8, 'resumes', 'below')],
    caption: 'The bearish mirror of the upside tasuki gap.',
  },
  'rising-window': {
    title: 'Rising window (gap up)',
    bars: build(up('rw', 90, 100, 5), [bar(100, 102.6, 99.8, 102.3), bar(104.5, 107.2, 104.2, 106.9)], [bar(106.7, 108.4, 105.8, 108)]),
    annotations: [{ type: 'zone', from: 5, to: 7, priceFrom: 102.6, priceTo: 104.2, text: 'window (gap)' }],
    caption: 'A gap between two green candles. Japanese traders call it a window; it often acts as support later.',
  },
  'falling-window': {
    title: 'Falling window (gap down)',
    bars: build(down('fw', 110, 100, 5), [bar(100, 100.3, 97.4, 97.7), bar(95.6, 95.9, 92.8, 93.1)], [bar(93.3, 94.2, 91.5, 91.9)]),
    annotations: [{ type: 'zone', from: 5, to: 7, priceFrom: 97.4, priceTo: 95.9, text: 'window (gap)', color: 'var(--color-down)' }],
    caption: 'A gap between two red candles. The window often becomes resistance.',
  },
  'mat-hold-bullish': {
    title: 'Bullish mat hold',
    bars: build(up('mhb', 90, 100, 5), [bar(100, 106, 99.7, 105.7), bar(107, 107.6, 105.4, 105.8), bar(105.6, 106, 103.9, 104.2), bar(104.1, 104.5, 102.9, 103.2), bar(103.5, 109.5, 103.2, 109.2)]),
    annotations: [lab(6, 'gap up'), brk(6, 8, 'shallow pullback', 'below'), lab(9, 'breakout')],
    caption: 'Like rising three methods, but the pullback starts with a gap up and stays higher. Even stronger.',
  },
  'mat-hold-bearish': {
    title: 'Bearish mat hold',
    bars: build(down('mhs', 110, 100, 5), [bar(100, 100.3, 94, 94.3), bar(93.1, 94.5, 92.6, 94.2), bar(94.3, 96, 94, 95.8), bar(95.9, 97.1, 95.5, 96.8), bar(96.5, 96.8, 90.5, 90.8)]),
    annotations: [lab(6, 'gap down', 'below'), brk(6, 8, 'weak bounce', 'above'), lab(9, 'breakdown', 'below')],
    caption: 'The bearish mirror of the mat hold.',
  },
  'on-neck': {
    title: 'On-neck line (bearish continuation)',
    bars: build(down('onn', 112, 103), [bar(103, 103.3, 97.6, 97.9), bar(96.2, 97.7, 95.9, 97.6)], [bar(97.4, 97.7, 93.9, 94.2)]),
    annotations: [brk(6, 7, 'on-neck', 'above'), lab(7, 'closes at prior low', 'below'), lab(8, 'continues', 'below')],
    caption: 'A weak green candle closes only up to the previous candle\'s low. The bounce fails and the decline resumes.',
  },
  'in-neck': {
    title: 'In-neck line (bearish continuation)',
    bars: build(down('inn', 112, 103), [bar(103, 103.3, 97.6, 97.9), bar(96.2, 98.2, 95.9, 98.05)], [bar(97.9, 98.2, 94.2, 94.5)]),
    annotations: [brk(6, 7, 'in-neck', 'above'), lab(7, 'closes just into body', 'below')],
    caption: 'The green candle closes slightly inside the red body. Still a weak bounce; the trend usually continues.',
  },
  'thrusting-line': {
    title: 'Thrusting line',
    bars: build(down('thr', 112, 103), [bar(103, 103.3, 97.6, 97.9), bar(96.2, 99.8, 95.9, 99.6)], [bar(99.4, 99.7, 95.6, 95.9)]),
    annotations: [brk(6, 7, 'thrusting', 'above'), { type: 'hline', price: 100.45, text: '50% of red body', from: 5, to: 8, color: 'var(--color-ink-soft)' }],
    caption: 'Closes into the red body but below its midpoint. Not enough to be a piercing line, so it is a continuation more often than not.',
  },

  // ---------- context lessons ----------
  'hammer-no-context': {
    title: 'A hammer with no trend behind it',
    bars: concat(drift(100, 100.5, 8, 'noctx', { bias: 0, noise: 0.7 }), [bar(100.3, 100.9, 96.2, 100.6)]),
    annotations: [lab(8, 'hammer?'), brk(0, 7, 'sideways chop')],
    caption: 'Same shape, but nothing to reverse. A hammer inside a range is just a candle with a long wick.',
  },
  'pattern-at-support': {
    title: 'Hammer at support',
    bars: concat(drift(100, 108, 5, 'ps1', { bias: 1, noise: 0.8 }), drift(108, 100.6, 6, 'ps2', { bias: -1, noise: 0.8 }), [bar(100.6, 101.2, 97.9, 100.9)], drift(101, 106, 3, 'ps3', { bias: 1, noise: 0.6 })),
    annotations: [{ type: 'hline', price: 100.2, text: 'support', from: 0, to: 14 }, lab(11, 'hammer')],
    caption: 'The same hammer at a level that has held before. Two reasons stacked together make a real signal.',
  },
};

export type CandlePatternName = keyof typeof CANDLE_PATTERNS;
