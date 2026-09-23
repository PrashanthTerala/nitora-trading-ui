/**
 * The canvas half of SeriesFigure: lightweight-charts, which is large, so this module is only
 * ever loaded lazily (see SeriesFigure.tsx) and costs nothing on lessons that do not use it.
 */
import { useEffect, useRef } from 'react';
import { AreaSeries, HistogramSeries, LineSeries, LineStyle, createChart, type Time, type UTCTimestamp } from 'lightweight-charts';
import { cssColor } from '@/lib/cssColor';
import { useTheme } from '@/lib/theme';
import type { SeriesSpec, ValueFormat } from './SeriesFigure';

const TONES = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6'] as const;

function toPoints(values: SeriesSpec['values']): { time: Time; value: number }[] {
  // Plain numbers are an index axis counted from 1 (trade 1, session 1): point i at "time" i + 1.
  return values.map((v, i) => (typeof v === 'number' ? { time: (i + 1) as UTCTimestamp, value: v } : { time: v.time as Time, value: v.value }));
}

export function formatValue(v: number, format: ValueFormat, decimals: number) {
  if (format === 'percent') return `${v.toFixed(decimals)}%`;
  if (format === 'currency') return `$${v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  return v.toFixed(decimals);
}

export default function SeriesChart({
  series,
  height,
  format,
  decimals,
  baseline,
  label,
}: {
  series: SeriesSpec[];
  height: number;
  format: ValueFormat;
  decimals: number;
  baseline?: number;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Canvas colours are read once per draw, so the chart is rebuilt when the theme flips.
  const dark = useTheme((s) => s.dark);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const indexAxis = series.every((s) => s.values.every((v) => typeof v === 'number'));
    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { color: 'transparent' },
        textColor: cssColor('--color-ink-soft'),
        fontFamily: getComputedStyle(document.documentElement).getPropertyValue('--font-mono'),
        fontSize: 11,
        attributionLogo: false,
      },
      grid: { vertLines: { color: cssColor('--color-grid') }, horzLines: { color: cssColor('--color-grid') } },
      rightPriceScale: { borderColor: cssColor('--color-line') },
      timeScale: {
        borderColor: cssColor('--color-line'),
        fixLeftEdge: true,
        fixRightEdge: true,
        ...(indexAxis ? { tickMarkFormatter: (t: Time) => String(t) } : {}),
      },
      localization: {
        priceFormatter: (p: number) => formatValue(p, format, decimals),
        ...(indexAxis ? { timeFormatter: (t: Time) => String(t) } : {}),
      },
      handleScroll: false,
      handleScale: false,
    });

    series.forEach((s, i) => {
      const tone = s.tone ?? TONES[i % TONES.length];
      const color = cssColor(`--color-${tone}`);
      const data = toPoints(s.values);
      const common = { title: s.name, priceLineVisible: false, lastValueVisible: true };
      let added;
      if (s.kind === 'histogram') {
        const up = cssColor('--color-up');
        const down = cssColor('--color-down');
        added = chart.addSeries(HistogramSeries, { ...common, color });
        // A signed histogram (returns, P&L) reads by direction, so it takes the market colours.
        added.setData(data.map((d) => ({ ...d, color: s.signed ? (d.value >= 0 ? up : down) : color })));
      } else if (s.kind === 'area') {
        added = chart.addSeries(AreaSeries, { ...common, lineColor: color, topColor: `${color}55`, bottomColor: `${color}05`, lineWidth: 2 });
        added.setData(data);
      } else {
        added = chart.addSeries(LineSeries, { ...common, color, lineWidth: 2 });
        added.setData(data);
      }
      if (baseline !== undefined && i === 0) {
        added.createPriceLine({ price: baseline, color: cssColor('--color-line-strong'), lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: false, title: '' });
      }
    });
    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [series, format, decimals, baseline, dark]);

  return <div ref={ref} role="img" aria-label={label} style={{ height }} className="w-full" />;
}
