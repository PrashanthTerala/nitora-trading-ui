/**
 * /__mdx: every component a lesson can use, rendered once, for design review. Development
 * only, like /__tokens -- the route and this file are dropped from production builds.
 *
 * The data is real: figures come from the pattern library and the engine at the simulator's
 * default seed, the quiz question is the engulfing lesson's own.
 */
import { useMemo, type ReactNode } from 'react';
import { MDXProvider } from '@mdx-js/react';
import excerpt from 'virtual:lesson-excerpt';
import { mdxComponents, registry } from '@/components/mdx';
import { PLANNED_COMPONENTS } from '@/components/mdx/names';
import { Market } from '@/engine/market/feed';
import { SYMBOLS } from '@/engine/market/symbols';
import { DEFAULT_SEED, START_CURSOR } from '@/lib/simDefaults';
import type { CalloutKind } from '@/components/mdx/Callout';

const { Callout, KeyTakeaways, Quiz, Term, TryIt, Compare, Stat, StatRow } = registry.core;
const { PatternFigure, CandleFigure, IndicatorFigure, ChartTypesFigure, SeriesFigure } = registry.figures;
const { PositionSizer, ExpectancyCalc, RecoveryTable, StreakSimulator } = registry.calculators;

const CALLOUTS: [CalloutKind, string][] = [
  ['eli5', 'The child-level restatement every lesson carries at least once.'],
  ['tip', 'A practical habit that makes the idea easier to use.'],
  ['warning', 'A common mistake, and how to spot it before it costs anything.'],
  ['danger', 'A trap that empties accounts. Used sparingly, where a real one exists.'],
  ['info', 'Context that is useful but not essential.'],
  ['story', 'A short example with people in it.'],
  ['math', 'The arithmetic behind a rule, worked through.'],
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-8">
      <h2 className="mb-2 font-mono text-mono-sm uppercase tracking-[0.08em] text-ink-muted">{title}</h2>
      {children}
    </section>
  );
}

export function MdxGalleryPage() {
  // NOVA's last 60 daily closes at the default seed, as percentage returns and as equity.
  const series = useMemo(() => {
    const bars = new Market(DEFAULT_SEED, SYMBOLS).feed('NOVA').completed('1D', START_CURSOR).slice(-61);
    const returns = bars.slice(1).map((b, i) => ((b.close - bars[i].close) / bars[i].close) * 100);
    let eq = 10000;
    const equity = returns.map((r) => (eq *= 1 + r / 100));
    return { returns, equity };
  }, []);

  return (
    <div className="prose-lesson mx-auto max-w-(--container-lesson) space-y-10">
      <header>
        <h1 className="font-display text-h1 font-bold">MDX components</h1>
        <p className="text-ink-soft">
          Everything a lesson can use, grouped as the registry groups them. Planned, not built: {PLANNED_COMPONENTS.join(', ')}.
        </p>
      </header>

      <MDXProvider components={mdxComponents}>
        <Section title="core · Callout">
          {CALLOUTS.map(([type, text]) => (
            <Callout key={type} type={type}>
              <p>{text}</p>
            </Callout>
          ))}
          <Callout type="danger" title="A callout with its own title">
            <p>
              An author&apos;s title sits under the type label. Markdown works inside: <strong>bold</strong>, <a href="#core">links</a> and <code>GTC</code>.
            </p>
          </Callout>
        </Section>

        <Section title="core · Term, Stat, StatRow, Compare, TryIt">
          <p>
            A glossary term such as <Term id="spread">the spread</Term> or <Term id="atr" /> shows its definition on hover or focus.
          </p>
          <StatRow>
            <Stat value="1%" label="risk per trade" />
            <Stat value="2R" label="target" />
            <Stat value="45%" label="win rate" />
            <Stat value="+0.35R" label="expectancy" />
          </StatRow>
          <Compare left="Trader" right="Investor">
            <ul>
              <li>Holds for minutes to weeks</li>
              <li>Profits from price moves</li>
            </ul>
            <ul>
              <li>Holds for years</li>
              <li>Profits from the business growing</li>
            </ul>
          </Compare>
          <TryIt to="/trainer">Run ten rounds of Name the pattern.</TryIt>
        </Section>

        <Section title="core · KeyTakeaways">
          <KeyTakeaways>
            <ul>
              <li>An engulfing pattern is two candles: the second body fully covers the first.</li>
              <li>It needs a prior trend; engulfing candles inside ranges are meaningless.</li>
              <li>Confirm with a third candle closing beyond the engulfing candle.</li>
            </ul>
          </KeyTakeaways>
        </Section>

        <Section title="core · Quiz">
          <Quiz questions={[excerpt.question]} />
        </Section>

        <Section title="figures">
          <PatternFigure name="hammer" />
          <CandleFigure
            title="A gap that got filled"
            bars={[
              { o: 100, h: 102, l: 99, c: 101.5 },
              { o: 104, h: 105, l: 103, c: 104.5 },
              { o: 104.4, h: 104.8, l: 101, c: 101.2 },
            ]}
            annotations={[{ type: 'arrow', index: 2, direction: 'down', text: 'filled' }]}
          />
          <IndicatorFigure indicator="rsi" />
          <ChartTypesFigure />
          <SeriesFigure
            title="NOVA daily returns, last 60 sessions"
            series={[{ name: 'Return', kind: 'histogram', values: series.returns, signed: true }]}
            format="percent"
            baseline={0}
            caption="Synthetic data from the simulator's default market."
          />
          <SeriesFigure title="$10,000 held through those 60 sessions" series={[{ name: 'Equity', kind: 'area', values: series.equity }]} format="currency" decimals={0} />
        </Section>

        <Section title="calculators">
          <PositionSizer />
          <ExpectancyCalc />
          <RecoveryTable />
          <StreakSimulator />
        </Section>
      </MDXProvider>
    </div>
  );
}
