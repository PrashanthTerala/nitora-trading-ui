/**
 * The MDX component registry: what a lesson can use, grouped by domain.
 *
 * A new component joins a group here and its name joins the same group in names.ts; the
 * lesson page never changes. The `satisfies` checks below make the registry and the name
 * lists agree exactly, so the content linter's list is always the real one.
 */
import type { MDXComponents } from 'mdx/types';
import { createElement, type ComponentPropsWithoutRef, type ComponentType } from 'react';
import { Callout } from './Callout';
import { KeyTakeaways } from './KeyTakeaways';
import { Quiz } from './Quiz';
import { Term } from './Term';
import { TryIt, Compare, Stat, StatRow } from './Widgets';
import { PatternFigure, CandleFigure, IndicatorFigure, ChartTypesFigure } from './Figures';
import { SeriesFigure } from './SeriesFigure';
import { PositionSizer, ExpectancyCalc, RecoveryTable, StreakSimulator } from './Calculators';
import { H2, H3 } from './Heading';
import { MDX_GROUPS, type MdxGroup } from './names';

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

// Each group must hold exactly the components its list in names.ts names: none missing, none extra.
type Group<G extends MdxGroup> = { [K in (typeof MDX_GROUPS)[G][number]]: ComponentType<never> };

export const core = { Callout, KeyTakeaways, Quiz, Term, TryIt, Compare, Stat, StatRow } satisfies Group<'core'>;
export const figures = { PatternFigure, CandleFigure, IndicatorFigure, ChartTypesFigure, SeriesFigure } satisfies Group<'figures'>;
export const calculators = { PositionSizer, ExpectancyCalc, RecoveryTable, StreakSimulator } satisfies Group<'calculators'>;
/** Planned: CodeBlock, Notebook, BacktestFigure, EquityCurveFigure. See names.ts. */
export const quant = {} satisfies Group<'quant'>;

export const registry = { core, figures, calculators, quant };

/** Markdown elements the lesson page renders its own way. */
const elements = { table: ScrollableTable, h2: H2, h3: H3 };

export const mdxComponents: MDXComponents = { ...elements, ...core, ...figures, ...calculators, ...quant };
