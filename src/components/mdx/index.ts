import type { MDXComponents } from 'mdx/types';
import { createElement, type ComponentPropsWithoutRef } from 'react';
import { Callout } from './Callout';
import { KeyTakeaways } from './KeyTakeaways';
import { Quiz } from './Quiz';
import { PatternFigure, CandleFigure, IndicatorFigure, ChartTypesFigure } from './Figures';
import { Term, TryIt, Compare, Stat, StatRow, PositionSizer, ExpectancyCalc, RecoveryTable, StreakSimulator } from './Widgets';

/**
 * Tables get their own scroll container.
 *
 * 74 of the 128 lessons contain a table and the widest has eight columns, which at phone
 * width is far wider than the screen. Without a wrapper the table pushed the whole document
 * sideways, so every heading and paragraph in the lesson scrolled horizontally with it. This
 * keeps the scrolling inside the table, where it reads as deliberate rather than broken.
 */
function ScrollableTable(props: ComponentPropsWithoutRef<'table'>) {
  return createElement('div', { className: 'table-scroll' }, createElement('table', props));
}

export const mdxComponents: MDXComponents = {
  table: ScrollableTable,
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
