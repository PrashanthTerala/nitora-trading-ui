import type { OHLC } from '@/engine/market/types';
import { CANDLE_PATTERNS, type FigurePreset } from './candlePatterns';
import { CHART_PATTERNS } from './chartPatterns';
import { fromPath } from './helpers';

export type { FigurePreset };

/** Every named figure usable as <PatternFigure name="..." />. */
export const FIGURES: Record<string, FigurePreset> = { ...CANDLE_PATTERNS, ...CHART_PATTERNS };

export const FIGURE_NAMES = Object.keys(FIGURES).sort();

/**
 * Longer synthetic price series used by indicator figures. Each regime is a
 * deterministic 90-bar sequence with realistic swings.
 */
export type Regime = 'trend-up' | 'trend-down' | 'range' | 'reversal' | 'volatile' | 'crash' | 'intraday';

export function regimeSeries(regime: Regime, n = 90): OHLC[] {
  switch (regime) {
    case 'trend-up':
      return fromPath(
        [[0, 80], [0.1, 88], [0.17, 85], [0.3, 97], [0.38, 93], [0.52, 108], [0.6, 103], [0.72, 116], [0.8, 111], [0.92, 124], [1, 121]],
        n,
        'reg-up',
        { noise: 0.9 },
      );
    case 'trend-down':
      return fromPath(
        [[0, 125], [0.1, 116], [0.17, 120], [0.3, 108], [0.38, 112], [0.52, 98], [0.6, 103], [0.72, 91], [0.8, 95], [0.92, 84], [1, 87]],
        n,
        'reg-down',
        { noise: 0.9 },
      );
    case 'range':
      return fromPath(
        [[0, 100], [0.08, 106], [0.18, 95], [0.28, 105], [0.38, 94.5], [0.48, 106.5], [0.58, 95.5], [0.68, 105], [0.78, 94], [0.88, 106], [1, 99]],
        n,
        'reg-range',
        { noise: 0.8 },
      );
    case 'reversal':
      return fromPath(
        [[0, 85], [0.12, 95], [0.2, 92], [0.35, 106], [0.45, 103], [0.55, 112], [0.62, 109.5], [0.68, 113], [0.76, 104], [0.84, 107], [0.92, 96], [1, 92]],
        n,
        'reg-rev',
        { noise: 0.8 },
      );
    case 'volatile':
      return fromPath(
        [[0, 100], [0.06, 112], [0.12, 96], [0.2, 110], [0.28, 92], [0.36, 104], [0.44, 99], [0.5, 101], [0.56, 100], [0.62, 102], [0.7, 98], [0.78, 116], [0.86, 94], [0.94, 108], [1, 100]],
        n,
        'reg-vol',
        { noise: 1.6 },
      );
    case 'crash':
      return fromPath([[0, 100], [0.3, 110], [0.45, 108], [0.55, 96], [0.6, 82], [0.7, 78], [0.85, 90], [1, 88]], n, 'reg-crash', { noise: 1.1 });
    case 'intraday':
    default:
      return fromPath(
        [[0, 100], [0.05, 101.5], [0.12, 99.2], [0.2, 100.8], [0.3, 101.9], [0.45, 101.2], [0.6, 102.6], [0.75, 101.8], [0.9, 103.1], [1, 102.7]],
        n,
        'reg-intra',
        { noise: 0.35, volume: (_, f) => 1400 * Math.exp(-((f - 0.05) ** 2) / 0.02) + 900 * Math.exp(-((f - 0.95) ** 2) / 0.02) + 300 },
      );
  }
}
