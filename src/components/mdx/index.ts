import type { MDXComponents } from 'mdx/types';
import { Callout } from './Callout';
import { KeyTakeaways } from './KeyTakeaways';
import { Quiz } from './Quiz';
import { PatternFigure, CandleFigure, IndicatorFigure, ChartTypesFigure } from './Figures';
import { Term, TryIt, Compare, Stat, StatRow, PositionSizer, ExpectancyCalc, RecoveryTable, StreakSimulator } from './Widgets';

export const mdxComponents: MDXComponents = {
  Callout,
  KeyTakeaways,
  Quiz,
  PatternFigure,
  CandleFigure,
  IndicatorFigure,
  ChartTypesFigure,
  Term,
  TryIt,
  Compare,
  Stat,
  StatRow,
  PositionSizer,
  ExpectancyCalc,
  RecoveryTable,
  StreakSimulator,
};
