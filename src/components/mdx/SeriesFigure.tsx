import { lazy, Suspense, useMemo, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { t } from '@/i18n';
import { FigureFrame } from './FigureFrame';

/**
 * A generic data figure -- line, area or histogram -- for series that are not candles:
 * returns, drawdowns, equity, factor exposures. Built for the planned quantitative track, and
 * usable by any lesson today.
 *
 *   <SeriesFigure
 *     title="Equity after 100 trades"
 *     series={[{ name: "Equity", kind: "area", values: [100, 101.5, 99.8] }]}
 *     format="currency"
 *   />
 *
 * `values` is either plain numbers (drawn against their index: trade 1, 2, 3...) or
 * `{ time, value }` points, where time is a "YYYY-MM-DD" date or unix seconds.
 */
export type ValueFormat = 'number' | 'percent' | 'currency';

export interface SeriesSpec {
  name: string;
  kind?: 'line' | 'area' | 'histogram';
  values: number[] | { time: string | number; value: number }[];
  /** A chart palette colour; defaults to chart-1, chart-2, ... in order. */
  tone?: 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'chart-6' | 'accent';
  /** Histogram only: colour each bar up or down by its sign. */
  signed?: boolean;
}

const SeriesChart = lazy(() => import('./SeriesChart'));

export function SeriesFigure({
  series,
  title,
  caption,
  height = 240,
  format = 'number',
  decimals = 2,
  baseline,
}: {
  series: SeriesSpec[];
  title?: string;
  caption?: ReactNode;
  height?: number;
  format?: ValueFormat;
  decimals?: number;
  /** A dashed reference line, e.g. 0 for returns. */
  baseline?: number;
}) {
  // A stable identity, so the chart is not rebuilt on every parent render.
  const key = JSON.stringify(series);
  const stable = useMemo(() => JSON.parse(key) as SeriesSpec[], [key]);
  const label = t('mdx.figure.seriesLabel', { title: title ?? '', names: stable.map((s) => s.name).join(', ') });
  return (
    <FigureFrame title={title} caption={caption}>
      {({ large }) => (
        <Suspense
          fallback={
            <div style={{ height: large ? 420 : height }}>
              <Skeleton className="h-full w-full" />
            </div>
          }
        >
          <SeriesChart series={stable} height={large ? 420 : height} format={format} decimals={decimals} baseline={baseline} label={label} />
        </Suspense>
      )}
    </FigureFrame>
  );
}
