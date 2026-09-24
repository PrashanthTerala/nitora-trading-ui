/**
 * The journal's two charts, on lightweight-charts like the simulator: the equity curve and the
 * distribution of R. Loaded on demand, so the journal's first paint does not wait for the
 * chart library, and an empty journal never loads it at all.
 *
 * Colours are the tokens (read as hex, which the library needs), and are read again whenever
 * the theme changes.
 */
import { useEffect, useRef, useState, type RefObject } from 'react';
import { BaselineSeries, ColorType, createChart, HistogramSeries, LineStyle, type IChartApi, type Time, type UTCTimestamp } from 'lightweight-charts';
import { cssColor } from '@/lib/cssColor';
import { t } from '@/i18n';

function readColors() {
  return {
    text: cssColor('--color-ink-soft'),
    muted: cssColor('--color-ink-muted'),
    grid: cssColor('--color-grid'),
    line: cssColor('--color-line'),
    label: cssColor('--color-surface-3'),
    up: cssColor('--color-up'),
    down: cssColor('--color-down'),
  };
}
type Colors = ReturnType<typeof readColors>;

const mono = () => getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() || 'ui-monospace, monospace';

/** The token colours, re-read when the theme class on <html> changes. */
function useChartColors(): Colors {
  const [colors, setColors] = useState(readColors);
  useEffect(() => {
    let dark = document.documentElement.classList.contains('dark');
    const obs = new MutationObserver(() => {
      const now = document.documentElement.classList.contains('dark');
      if (now === dark) return;
      dark = now;
      setColors(readColors());
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return colors;
}

function baseOptions(c: Colors) {
  return {
    autoSize: true,
    layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: c.text, fontFamily: mono(), fontSize: 11, attributionLogo: false },
    grid: { vertLines: { visible: false }, horzLines: { color: c.grid } },
    rightPriceScale: { borderColor: c.line },
    timeScale: { borderColor: c.line },
    crosshair: { vertLine: { color: c.muted, labelBackgroundColor: c.label }, horzLine: { color: c.muted, labelBackgroundColor: c.label } },
    handleScroll: false,
    handleScale: false,
  };
}

/** Create a chart in a box, and remove it on unmount. */
function useChart(box: RefObject<HTMLDivElement | null>, colors: Colors, extra: Parameters<typeof createChart>[1] = {}) {
  const [chart, setChart] = useState<IChartApi | null>(null);
  useEffect(() => {
    if (!box.current) return;
    const c = createChart(box.current, { ...baseOptions(colors), ...extra });
    setChart(c);
    return () => {
      c.remove();
      setChart(null);
    };
    // Created once; colours are applied by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    chart?.applyOptions(baseOptions(colors));
  }, [chart, colors]);
  return chart;
}

/**
 * Equity over time, above the starting cash in the up colour and below it in the down colour,
 * with the starting line marked.
 */
export function EquityChart({ points, start }: { points: { time: number; equity: number }[]; start: number }) {
  const box = useRef<HTMLDivElement>(null);
  const colors = useChartColors();
  const chart = useChart(box, colors, { timeScale: { timeVisible: true, secondsVisible: false } });

  useEffect(() => {
    if (!chart) return;
    const series = chart.addSeries(BaselineSeries, {
      baseValue: { type: 'price', price: start },
      topLineColor: colors.up,
      topFillColor1: `${colors.up}47`,
      topFillColor2: `${colors.up}05`,
      bottomLineColor: colors.down,
      bottomFillColor1: `${colors.down}05`,
      bottomFillColor2: `${colors.down}47`,
      lineWidth: 2,
      priceLineVisible: false,
      priceFormat: { type: 'price', precision: 0, minMove: 1 },
    });
    series.createPriceLine({ price: start, color: colors.muted, lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: true, title: t('journal.charts.start') });
    // The library needs strictly increasing times; the curve can repeat one after a reset.
    const data: { time: Time; value: number }[] = [];
    for (const p of points) {
      const last = data[data.length - 1];
      if (last && (last.time as number) >= p.time) continue;
      data.push({ time: p.time as UTCTimestamp, value: p.equity });
    }
    series.setData(data);
    chart.timeScale().fitContent();
    return () => chart.removeSeries(series);
  }, [chart, colors, points, start]);

  return <div ref={box} className="h-64 w-full" role="img" aria-label={t('journal.charts.equityLabel')} />;
}

/** R-multiples in one-R buckets, losses in the down colour and wins in the up colour. */
export function RChart({ buckets }: { buckets: { label: string; count: number; loss: boolean }[] }) {
  const box = useRef<HTMLDivElement>(null);
  const colors = useChartColors();
  const chart = useChart(box, colors, {
    timeScale: { tickMarkFormatter: (time: Time) => buckets[(time as number) - 1]?.label ?? '', fixLeftEdge: true, fixRightEdge: true },
    localization: { timeFormatter: (time: Time) => `${buckets[(time as number) - 1]?.label ?? ''}R` },
  });

  useEffect(() => {
    if (!chart) return;
    const series = chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false, priceFormat: { type: 'price', precision: 0, minMove: 1 } });
    series.setData(buckets.map((b, i) => ({ time: (i + 1) as UTCTimestamp, value: b.count, color: b.loss ? colors.down : colors.up })));
    chart.timeScale().fitContent();
    return () => chart.removeSeries(series);
  }, [chart, colors, buckets]);

  return <div ref={box} className="h-64 w-full" role="img" aria-label={t('journal.charts.rLabel')} />;
}
