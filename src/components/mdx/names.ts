/**
 * Every component name a lesson may use, by group. Plain data with no imports, so the content
 * linter can read it without bundling React: a lesson that uses a name not listed here fails
 * `npm run check` instead of failing on the page.
 *
 * `registry.ts` is type-checked against these lists, so the two cannot drift apart.
 */
export const MDX_GROUPS = {
  /** Text structure and teaching devices. */
  core: ['Callout', 'KeyTakeaways', 'Quiz', 'Term', 'TryIt', 'Compare', 'Stat', 'StatRow'],
  /** Charts drawn from data. */
  figures: ['PatternFigure', 'CandleFigure', 'IndicatorFigure', 'ChartTypesFigure', 'SeriesFigure'],
  /** Interactive calculators. */
  calculators: ['PositionSizer', 'ExpectancyCalc', 'RecoveryTable', 'StreakSimulator'],
  /** A hand-made presentation deck (otherwise the build makes one from the lesson). */
  deck: ['Deck', 'Slide', 'SlideFigure', 'SlideNotes'],
  /** The quantitative track. Nothing is built yet; see PLANNED. */
  quant: [],
} as const;

/**
 * Reserved for the quantitative track, documented in CONTENT-GUIDE.md as planned. Using one
 * before it exists is a lint error that says so, rather than an unknown-component error.
 */
export const PLANNED_COMPONENTS = ['CodeBlock', 'Notebook', 'BacktestFigure', 'EquityCurveFigure'] as const;

export type MdxGroup = keyof typeof MDX_GROUPS;
export type MdxComponentName = (typeof MDX_GROUPS)[MdxGroup][number];
