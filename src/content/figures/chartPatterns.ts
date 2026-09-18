/**
 * Preset figures for chart patterns and market-structure concepts.
 * Generated from key-point paths so they look organic but are fully deterministic.
 */
import type { FigurePreset } from './candlePatterns';
import { fromPath } from './helpers';

const hs = fromPath(
  [
    [0, 92], [0.14, 104], [0.24, 99], [0.4, 112], [0.55, 99.5], [0.68, 105], [0.8, 99], [0.9, 92], [1, 88],
  ],
  46,
  'hs',
  { noise: 0.9, volume: (_, f) => (f < 0.4 ? 1200 - f * 800 : f > 0.8 ? 1500 : 700) },
);

const ihs = fromPath(
  [
    [0, 110], [0.14, 98], [0.24, 103], [0.4, 90], [0.55, 102.5], [0.68, 97], [0.8, 103], [0.9, 110], [1, 114],
  ],
  46,
  'ihs',
  { noise: 0.9, volume: (_, f) => (f > 0.8 ? 1600 : 800) },
);

const dt = fromPath([[0, 90], [0.3, 108], [0.5, 100], [0.7, 107.8], [0.85, 99], [1, 92]], 40, 'dt', { noise: 0.8 });
const db = fromPath([[0, 110], [0.3, 92], [0.5, 100], [0.7, 92.3], [0.85, 101], [1, 108]], 40, 'db', { noise: 0.8 });
const tt = fromPath([[0, 90], [0.2, 108], [0.33, 101], [0.47, 107.6], [0.6, 101], [0.73, 108.2], [0.87, 100], [1, 93]], 46, 'tt', { noise: 0.7 });
const tb = fromPath([[0, 110], [0.2, 92], [0.33, 99], [0.47, 92.4], [0.6, 99], [0.73, 91.8], [0.87, 100], [1, 107]], 46, 'tb', { noise: 0.7 });

const ascTri = fromPath([[0, 92], [0.18, 108], [0.3, 97], [0.45, 107.8], [0.56, 100], [0.68, 108], [0.76, 103.5], [0.84, 108.2], [0.9, 112], [1, 117]], 46, 'asc', { noise: 0.6, volume: (_, f) => (f > 0.86 ? 1700 : 900 - f * 400) });
const descTri = fromPath([[0, 108], [0.18, 92], [0.3, 103], [0.45, 92.2], [0.56, 100], [0.68, 92], [0.76, 96.5], [0.84, 91.8], [0.9, 88], [1, 83]], 46, 'desc', { noise: 0.6, volume: (_, f) => (f > 0.86 ? 1700 : 900 - f * 400) });
const symTri = fromPath([[0, 95], [0.15, 110], [0.3, 94], [0.45, 107], [0.58, 97], [0.7, 104.5], [0.78, 99.5], [0.85, 102.5], [0.92, 108], [1, 114]], 46, 'sym', { noise: 0.6, volume: (_, f) => (f > 0.88 ? 1600 : 1000 - f * 500) });

const bullFlag = fromPath([[0, 90], [0.35, 112], [0.5, 109], [0.6, 110], [0.7, 107], [0.78, 108.5], [0.84, 106.5], [0.9, 113], [1, 122]], 44, 'bflag', { noise: 0.55, volume: (_, f) => (f < 0.35 ? 1500 : f > 0.86 ? 1600 : 600) });
const bearFlag = fromPath([[0, 110], [0.35, 88], [0.5, 91], [0.6, 90], [0.7, 93], [0.78, 91.5], [0.84, 93.5], [0.9, 87], [1, 78]], 44, 'sflag', { noise: 0.55, volume: (_, f) => (f < 0.35 ? 1500 : f > 0.86 ? 1600 : 600) });
const pennant = fromPath([[0, 90], [0.35, 112], [0.45, 106], [0.55, 110.5], [0.63, 107.5], [0.7, 109.5], [0.76, 108.3], [0.82, 109], [0.9, 115], [1, 124]], 44, 'penn', { noise: 0.5, volume: (_, f) => (f < 0.35 ? 1500 : f > 0.86 ? 1600 : 500) });

const risingWedge = fromPath([[0, 90], [0.15, 100], [0.28, 96], [0.42, 104], [0.55, 100.5], [0.68, 106.5], [0.78, 104], [0.86, 107.5], [0.92, 102], [1, 94]], 46, 'rwedge', { noise: 0.5 });
const fallingWedge = fromPath([[0, 110], [0.15, 100], [0.28, 104], [0.42, 96], [0.55, 99.5], [0.68, 93.5], [0.78, 96], [0.86, 92.5], [0.92, 98], [1, 106]], 46, 'fwedge', { noise: 0.5 });

const rect = fromPath([[0, 90], [0.2, 104], [0.3, 97], [0.4, 104.2], [0.5, 96.8], [0.6, 104], [0.7, 97.2], [0.8, 103.8], [0.88, 108], [1, 114]], 46, 'rect', { noise: 0.55 });
const cup = fromPath([[0, 100], [0.1, 108], [0.2, 100], [0.32, 93], [0.45, 91], [0.58, 94], [0.7, 102], [0.78, 108], [0.86, 104.5], [0.92, 107], [1, 116]], 50, 'cup', { noise: 0.6, volume: (_, f) => (f > 0.9 ? 1600 : f > 0.4 && f < 0.6 ? 500 : 900) });
const roundBottom = fromPath([[0, 106], [0.15, 99], [0.3, 94], [0.45, 92], [0.55, 92.5], [0.7, 96], [0.85, 102], [1, 110]], 44, 'round', { noise: 0.5 });

const uptrend = fromPath([[0, 90], [0.15, 98], [0.25, 95], [0.42, 105], [0.52, 101], [0.7, 111], [0.8, 107], [1, 118]], 40, 'uptrend', { noise: 0.7 });
const downtrend = fromPath([[0, 118], [0.15, 110], [0.25, 113], [0.42, 103], [0.52, 107], [0.7, 97], [0.8, 101], [1, 90]], 40, 'downtrend', { noise: 0.7 });
const range = fromPath([[0, 100], [0.12, 106], [0.25, 95], [0.37, 105.5], [0.5, 94.5], [0.62, 106], [0.75, 95], [0.88, 105.5], [1, 99]], 44, 'range', { noise: 0.6 });

const breakoutRetest = fromPath([[0, 96], [0.15, 104], [0.28, 98], [0.4, 104.2], [0.5, 99], [0.6, 103.8], [0.7, 109], [0.8, 104.5], [0.86, 106], [1, 115]], 46, 'bre', { noise: 0.5, volume: (_, f) => (f > 0.62 && f < 0.72 ? 1800 : 800) });
const fakeout = fromPath([[0, 96], [0.15, 104], [0.28, 98], [0.4, 104.2], [0.5, 99], [0.6, 103.8], [0.68, 106.5], [0.74, 103], [0.84, 97], [1, 91]], 46, 'fake', { noise: 0.5, volume: (_, f) => (f > 0.62 && f < 0.7 ? 700 : 900) });
const roleReversal = fromPath([[0, 92], [0.2, 102], [0.32, 96], [0.45, 102.3], [0.55, 108], [0.65, 102.5], [0.75, 109], [0.85, 103], [1, 114]], 46, 'role', { noise: 0.55 });

const supplyDemand = fromPath([[0, 100], [0.12, 99], [0.2, 100.5], [0.26, 110], [0.4, 108], [0.52, 102], [0.62, 100.8], [0.72, 109], [0.85, 114], [1, 112]], 46, 'sd', { noise: 0.5 });
const wyckoff = fromPath([[0, 110], [0.12, 96], [0.2, 100], [0.28, 95.5], [0.36, 99.5], [0.42, 96], [0.5, 101], [0.62, 115], [0.7, 118], [0.78, 114], [0.84, 118.5], [0.9, 113], [1, 98]], 60, 'wyckoff', { noise: 0.6 });

const gapUp = fromPath([[0, 96], [0.4, 100], [0.42, 106], [1, 110]], 24, 'gapup', { noise: 0.4 });
const gapDown = fromPath([[0, 104], [0.4, 100], [0.42, 94], [1, 90]], 24, 'gapdown', { noise: 0.4 });

const dtLevel = 108;

export const CHART_PATTERNS: Record<string, FigurePreset> = {
  'head-and-shoulders': {
    title: 'Head and shoulders',
    bars: hs,
    showVolume: true,
    annotations: [
      { type: 'label', index: 6, text: 'Left shoulder' },
      { type: 'label', index: 18, text: 'Head' },
      { type: 'label', index: 31, text: 'Right shoulder' },
      { type: 'line', from: [11, 99], to: [37, 99], text: 'neckline', extend: true },
      { type: 'arrow', index: 40, direction: 'down', text: 'break' },
    ],
    caption: 'Three peaks with the middle one highest. When price closes below the neckline the pattern completes. Volume usually fades into the right shoulder and rises on the break.',
  },
  'inverse-head-and-shoulders': {
    title: 'Inverse head and shoulders',
    bars: ihs,
    showVolume: true,
    annotations: [
      { type: 'label', index: 6, text: 'Left shoulder', position: 'below' },
      { type: 'label', index: 18, text: 'Head', position: 'below' },
      { type: 'label', index: 31, text: 'Right shoulder', position: 'below' },
      { type: 'line', from: [11, 102.8], to: [37, 102.8], text: 'neckline', extend: true },
      { type: 'arrow', index: 40, direction: 'up', text: 'break' },
    ],
    caption: 'The bullish mirror: three troughs, the middle one deepest, completed by a close above the neckline.',
  },
  'double-top': {
    title: 'Double top',
    bars: dt,
    annotations: [
      { type: 'label', index: 12, text: 'Top 1' },
      { type: 'label', index: 28, text: 'Top 2' },
      { type: 'hline', price: dtLevel, text: 'resistance', from: 8, to: 32 },
      { type: 'hline', price: 100, text: 'neckline', from: 16, to: 39, color: 'var(--color-down)' },
    ],
    caption: 'Price fails at the same ceiling twice, forming an M. Completed when the trough between the tops breaks.',
  },
  'double-bottom': {
    title: 'Double bottom',
    bars: db,
    annotations: [
      { type: 'label', index: 12, text: 'Bottom 1', position: 'below' },
      { type: 'label', index: 28, text: 'Bottom 2', position: 'below' },
      { type: 'hline', price: 92, text: 'support', from: 8, to: 32 },
      { type: 'hline', price: 100, text: 'neckline', from: 16, to: 39, color: 'var(--color-up)' },
    ],
    caption: 'Price holds the same floor twice, forming a W. Completed when the peak between the bottoms breaks.',
  },
  'triple-top': {
    title: 'Triple top',
    bars: tt,
    annotations: [
      { type: 'hline', price: 108, text: 'resistance tested three times', from: 6, to: 36 },
      { type: 'hline', price: 101, text: 'neckline', from: 12, to: 44, color: 'var(--color-down)' },
    ],
    caption: 'Three failed attempts at the same level. Rarer than the double top and usually more significant.',
  },
  'triple-bottom': {
    title: 'Triple bottom',
    bars: tb,
    annotations: [
      { type: 'hline', price: 92, text: 'support tested three times', from: 6, to: 36 },
      { type: 'hline', price: 99, text: 'neckline', from: 12, to: 44, color: 'var(--color-up)' },
    ],
    caption: 'Three successful defences of the same floor before the breakout.',
  },
  'ascending-triangle': {
    title: 'Ascending triangle',
    bars: ascTri,
    showVolume: true,
    annotations: [
      { type: 'hline', price: 108, text: 'flat resistance', from: 6, to: 40 },
      { type: 'line', from: [14, 97], to: [35, 103.5], text: 'rising support', extend: false },
      { type: 'arrow', index: 41, direction: 'up', text: 'breakout' },
    ],
    caption: 'Flat top, rising bottoms. Buyers are getting more aggressive each pullback; usually resolves upward.',
  },
  'descending-triangle': {
    title: 'Descending triangle',
    bars: descTri,
    showVolume: true,
    annotations: [
      { type: 'hline', price: 92, text: 'flat support', from: 6, to: 40, color: 'var(--color-down)' },
      { type: 'line', from: [14, 103], to: [35, 96.5], text: 'falling resistance', color: 'var(--color-down)' },
      { type: 'arrow', index: 41, direction: 'down', text: 'breakdown' },
    ],
    caption: 'Flat bottom, falling tops. Sellers press lower each bounce; usually resolves downward.',
  },
  'symmetrical-triangle': {
    title: 'Symmetrical triangle',
    bars: symTri,
    showVolume: true,
    annotations: [
      { type: 'line', from: [7, 110], to: [39, 102.5], color: 'var(--color-down)' },
      { type: 'line', from: [14, 94], to: [36, 99.5], color: 'var(--color-up)' },
      { type: 'arrow', index: 42, direction: 'up', text: 'breakout' },
    ],
    caption: 'Both lines converge. Direction is unknown until the break; volume dries up inside and expands on the exit.',
  },
  'bull-flag': {
    title: 'Bull flag',
    bars: bullFlag,
    showVolume: true,
    annotations: [
      { type: 'bracket', from: 0, to: 15, text: 'flagpole' },
      { type: 'line', from: [17, 111.5], to: [37, 108.5], color: 'var(--color-down)' },
      { type: 'line', from: [22, 108], to: [37, 105.5], color: 'var(--color-down)' },
      { type: 'arrow', index: 39, direction: 'up', text: 'breakout' },
    ],
    caption: 'A sharp rise (the pole) followed by a gentle downward-sloping channel (the flag) on shrinking volume, then a breakout. Target: pole height added to the breakout.',
  },
  'bear-flag': {
    title: 'Bear flag',
    bars: bearFlag,
    showVolume: true,
    annotations: [
      { type: 'bracket', from: 0, to: 15, text: 'flagpole', position: 'above' },
      { type: 'line', from: [17, 89], to: [37, 92], color: 'var(--color-up)' },
      { type: 'line', from: [22, 92], to: [37, 95], color: 'var(--color-up)' },
      { type: 'arrow', index: 39, direction: 'down', text: 'breakdown' },
    ],
    caption: 'The bearish mirror: sharp drop, weak upward-drifting bounce, then continuation lower.',
  },
  'pennant': {
    title: 'Bull pennant',
    bars: pennant,
    showVolume: true,
    annotations: [
      { type: 'bracket', from: 0, to: 15, text: 'flagpole' },
      { type: 'line', from: [19, 112], to: [36, 109], color: 'var(--color-down)' },
      { type: 'line', from: [20, 106], to: [36, 108.3], color: 'var(--color-up)' },
      { type: 'arrow', index: 39, direction: 'up', text: 'breakout' },
    ],
    caption: 'Like a flag but the pause is a small symmetrical triangle. Same target logic.',
  },
  'rising-wedge': {
    title: 'Rising wedge',
    bars: risingWedge,
    annotations: [
      { type: 'line', from: [7, 100.5], to: [39, 108], color: 'var(--color-down)' },
      { type: 'line', from: [13, 95.5], to: [36, 104], color: 'var(--color-down)' },
      { type: 'arrow', index: 43, direction: 'down', text: 'breakdown' },
    ],
    caption: 'Both lines rise but converge: each push higher gains less. Usually breaks down.',
  },
  'falling-wedge': {
    title: 'Falling wedge',
    bars: fallingWedge,
    annotations: [
      { type: 'line', from: [7, 99.5], to: [39, 92], color: 'var(--color-up)' },
      { type: 'line', from: [13, 104.5], to: [36, 96], color: 'var(--color-up)' },
      { type: 'arrow', index: 43, direction: 'up', text: 'breakout' },
    ],
    caption: 'Both lines fall but converge: each push lower gains less. Usually breaks up.',
  },
  'rectangle': {
    title: 'Rectangle (trading range as continuation)',
    bars: rect,
    annotations: [
      { type: 'hline', price: 104, text: 'resistance', from: 8, to: 38 },
      { type: 'hline', price: 97, text: 'support', from: 8, to: 38 },
      { type: 'arrow', index: 41, direction: 'up', text: 'breakout' },
    ],
    caption: 'Price bounces between two horizontal levels, then breaks out in the direction of the prior trend.',
  },
  'cup-and-handle': {
    title: 'Cup and handle',
    bars: cup,
    showVolume: true,
    annotations: [
      { type: 'bracket', from: 5, to: 39, text: 'cup' },
      { type: 'bracket', from: 40, to: 46, text: 'handle' },
      { type: 'hline', price: 108, text: 'rim / buy point', from: 4, to: 49 },
    ],
    caption: 'A rounded U-shaped base, a small pullback (the handle), then a breakout above the rim on rising volume.',
  },
  'rounding-bottom': {
    title: 'Rounding bottom (saucer)',
    bars: roundBottom,
    annotations: [{ type: 'label', index: 20, text: 'slow, rounded turn', position: 'below' }],
    caption: 'A gradual shift from sellers to buyers with no sharp low. Slow patterns tend to produce slow but durable moves.',
  },

  // ---------- market structure ----------
  'uptrend': {
    title: 'Uptrend: higher highs and higher lows',
    bars: uptrend,
    annotations: [
      { type: 'label', index: 6, text: 'HH' },
      { type: 'label', index: 10, text: 'HL', position: 'below' },
      { type: 'label', index: 17, text: 'HH' },
      { type: 'label', index: 21, text: 'HL', position: 'below' },
      { type: 'label', index: 28, text: 'HH' },
      { type: 'label', index: 32, text: 'HL', position: 'below' },
      { type: 'line', from: [10, 94.5], to: [32, 106.5], extend: true, color: 'var(--color-up)' },
    ],
    caption: 'Every peak is above the last peak and every trough is above the last trough. That is the entire definition.',
  },
  'downtrend': {
    title: 'Downtrend: lower highs and lower lows',
    bars: downtrend,
    annotations: [
      { type: 'label', index: 6, text: 'LL', position: 'below' },
      { type: 'label', index: 10, text: 'LH' },
      { type: 'label', index: 17, text: 'LL', position: 'below' },
      { type: 'label', index: 21, text: 'LH' },
      { type: 'label', index: 28, text: 'LL', position: 'below' },
      { type: 'label', index: 32, text: 'LH' },
      { type: 'line', from: [10, 113.5], to: [32, 101.5], extend: true, color: 'var(--color-down)' },
    ],
    caption: 'Every peak is lower than the last and every trough is lower than the last.',
  },
  'range': {
    title: 'A trading range',
    bars: range,
    annotations: [
      { type: 'hline', price: 106, text: 'resistance', from: 2, to: 42 },
      { type: 'hline', price: 94.5, text: 'support', from: 2, to: 42 },
    ],
    caption: 'No higher highs, no lower lows. Price oscillates between a floor and a ceiling.',
  },
  'support-resistance': {
    title: 'Support and resistance',
    bars: range,
    annotations: [
      { type: 'zone', from: 2, to: 42, priceFrom: 105, priceTo: 107, text: 'resistance zone', color: 'var(--color-down)' },
      { type: 'zone', from: 2, to: 42, priceFrom: 94, priceTo: 96, text: 'support zone', color: 'var(--color-up)' },
    ],
    caption: 'Levels are better drawn as zones. Price reacts in an area, not at a single tick.',
  },
  'breakout-retest': {
    title: 'Breakout and retest',
    bars: breakoutRetest,
    showVolume: true,
    annotations: [
      { type: 'hline', price: 104, text: 'resistance', from: 4, to: 45 },
      { type: 'arrow', index: 31, direction: 'up', text: 'breakout' },
      { type: 'label', index: 37, text: 'retest holds', position: 'below' },
    ],
    caption: 'Price breaks the level on strong volume, comes back to touch it, holds, and continues. The retest is the lower-risk entry.',
  },
  'fakeout': {
    title: 'Fakeout (false breakout)',
    bars: fakeout,
    showVolume: true,
    annotations: [
      { type: 'hline', price: 104, text: 'resistance', from: 4, to: 45 },
      { type: 'label', index: 31, text: 'break on weak volume' },
      { type: 'arrow', index: 36, direction: 'down', text: 'back inside' },
    ],
    caption: 'Price pokes above the level on low volume and falls straight back. Trapped buyers now fuel the move down.',
  },
  'role-reversal': {
    title: 'Role reversal: resistance becomes support',
    bars: roleReversal,
    annotations: [
      { type: 'hline', price: 102.3, text: 'resistance, then support', from: 4, to: 45 },
      { type: 'label', index: 9, text: 'rejected' },
      { type: 'label', index: 20, text: 'rejected' },
      { type: 'label', index: 30, text: 'held', position: 'below' },
      { type: 'label', index: 39, text: 'held', position: 'below' },
    ],
    caption: 'A ceiling that gets broken often becomes a floor. Old sellers become buyers on the way back down.',
  },
  'supply-demand': {
    title: 'A demand zone',
    bars: supplyDemand,
    annotations: [
      { type: 'zone', from: 4, to: 45, priceFrom: 99, priceTo: 101.5, text: 'demand zone (base before the rally)', color: 'var(--color-up)' },
      { type: 'arrow', index: 12, direction: 'up', text: 'impulse' },
      { type: 'label', index: 29, text: 'return to zone', position: 'below' },
    ],
    caption: 'The quiet base before an explosive move marks where big buyers were. When price returns, they often buy again.',
  },
  'wyckoff-cycle': {
    title: 'The market cycle',
    bars: wyckoff,
    annotations: [
      { type: 'bracket', from: 5, to: 28, text: 'accumulation' },
      { type: 'bracket', from: 29, to: 40, text: 'markup' },
      { type: 'bracket', from: 41, to: 53, text: 'distribution', position: 'above' },
      { type: 'bracket', from: 54, to: 59, text: 'markdown', position: 'above' },
    ],
    caption: 'Smart money accumulates quietly, the public chases the markup, smart money distributes at the top, then markdown.',
  },
  'gap-up': {
    title: 'A gap up',
    bars: gapUp,
    annotations: [{ type: 'zone', from: 9, to: 11, priceFrom: 100.5, priceTo: 105.5, text: 'gap' }],
    caption: 'The next candle opens well above the previous close. Nobody traded in between.',
  },
  'gap-down': {
    title: 'A gap down',
    bars: gapDown,
    annotations: [{ type: 'zone', from: 9, to: 11, priceFrom: 99.5, priceTo: 94.5, text: 'gap', color: 'var(--color-down)' }],
    caption: 'The next candle opens well below the previous close.',
  },
};
