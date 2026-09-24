/**
 * The simulator chart: lightweight-charts v5 with candles, volume, overlays,
 * indicator panes, position/order price lines and entry markers.
 *
 * The chart instance is created once and then fed incrementally. Data is rebuilt
 * with setData when the symbol or timeframe changes, and updated with update()
 * on every clock tick so the forming candle animates.
 *
 * Every colour is a design token: candles from up/down, indicator lines from the chart
 * palette (colour-blind safe, never green or red), chrome from grid/line/ink. A theme change
 * re-reads all of them and repaints, series included.
 */
import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  createSeriesMarkers,
  createTextWatermark,
  LineStyle,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
  type UTCTimestamp,
  type ISeriesMarkersPluginApi,
  type ITextWatermarkPluginApi,
  type SeriesMarker,
  type Time,
} from 'lightweight-charts';
import type { Bar, Timeframe } from '@/engine/market/types';
import type { AccountState } from '@/engine/broker/types';
import * as ind from '@/engine/market/indicators';
import type { Overlays } from '@/store/sim';
import { sessionDayStart } from '@/engine/market/generator';
import { cssColor } from '@/lib/cssColor';
import { t } from '@/i18n';

interface Props {
  bars: Bar[];
  symbol: string;
  timeframe: Timeframe;
  overlays: Overlays;
  account: AccountState;
  decimals: number;
  /** ticks; changing this triggers an incremental update */
  clock: number;
}

/**
 * The chart's colours, read from the tokens as six-digit hex. lightweight-charts cannot parse
 * oklch() (handed one, it throws and takes the simulator down), and hex specifically because
 * the volume and MACD bars append an alpha byte to the string (`up + '80'`).
 */
function readColors() {
  return {
    text: cssColor('--color-ink-soft'),
    muted: cssColor('--color-ink-muted'),
    grid: cssColor('--color-grid'),
    line: cssColor('--color-line'),
    label: cssColor('--color-surface-3'),
    up: cssColor('--color-up'),
    down: cssColor('--color-down'),
    accent: cssColor('--color-accent'),
    ink: cssColor('--color-ink'),
    c1: cssColor('--color-chart-1'),
    c2: cssColor('--color-chart-2'),
    c3: cssColor('--color-chart-3'),
    c4: cssColor('--color-chart-4'),
    c5: cssColor('--color-chart-5'),
    c6: cssColor('--color-chart-6'),
  };
}
type Colors = ReturnType<typeof readColors>;

/** Which chart-palette colour each overlay takes. */
const OVERLAY_TONE = { sma20: 'c1', sma50: 'c5', ema9: 'c2', ema21: 'c4', bbUpper: 'c6', bbMiddle: 'c6', bbLower: 'c6', vwap: 'c3' } as const;

const monoFont = () => getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() || 'ui-monospace, monospace';

function chartChrome(c: Colors) {
  return {
    layout: { textColor: c.text, panes: { separatorColor: c.line, separatorHoverColor: c.label } },
    grid: { vertLines: { color: c.grid }, horzLines: { color: c.grid } },
    rightPriceScale: { borderColor: c.line },
    timeScale: { borderColor: c.line },
    crosshair: {
      vertLine: { color: c.muted, labelBackgroundColor: c.label },
      horzLine: { color: c.muted, labelBackgroundColor: c.label },
    },
  };
}

function candleColors(c: Colors) {
  return { upColor: c.up, downColor: c.down, borderUpColor: c.up, borderDownColor: c.down, wickUpColor: c.up, wickDownColor: c.down };
}

export function TradingChart({ bars, symbol, timeframe, overlays, account, decimals, clock }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const overlayRefs = useRef<Record<string, ISeriesApi<'Line'>>>({});
  const paneRefs = useRef<Record<string, ISeriesApi<'Line'> | ISeriesApi<'Histogram'>>>({});
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const lastKeyRef = useRef('');
  const prevLastTimeRef = useRef(0);
  /** Bar count of the last render, to tell a normal tick from a replaced series. */
  const prevLenRef = useRef(0);
  const watermarkRef = useRef<ITextWatermarkPluginApi<Time> | null>(null);
  const colorsRef = useRef<Colors | null>(null);
  const [theme, setTheme] = useState(() => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'));

  // create chart once
  useEffect(() => {
    if (!containerRef.current) return;
    const c = readColors();
    colorsRef.current = c;
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: 'transparent' },
        textColor: c.text,
        fontFamily: monoFont(),
        fontSize: 11,
        attributionLogo: false,
        panes: { separatorColor: c.line, separatorHoverColor: c.label },
      },
      grid: { vertLines: { color: c.grid }, horzLines: { color: c.grid } },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: c.muted, labelBackgroundColor: c.label },
        horzLine: { color: c.muted, labelBackgroundColor: c.label },
      },
      // Fewer, better-spaced price labels than the default density.
      rightPriceScale: { borderColor: c.line, scaleMargins: { top: 0.08, bottom: 0.08 }, tickMarkDensity: 3.2 },
      timeScale: { borderColor: c.line, timeVisible: true, secondsVisible: false, rightOffset: 6, barSpacing: 8 },
      localization: { priceFormatter: (p: number) => p.toFixed(decimals) },
      hoveredSeriesOnTop: true,
    });
    chartRef.current = chart;
    // lightweight-charts lays its panes out with a <table>; it is layout, not data.
    containerRef.current.querySelector('table')?.setAttribute('role', 'presentation');
    const candles = chart.addSeries(CandlestickSeries, {
      ...candleColors(c),
      // The last price, as a line across the chart and a label on the scale.
      priceLineVisible: true,
      lastValueVisible: true,
      priceFormat: { type: 'price', precision: decimals, minMove: 1 / 10 ** decimals },
    });
    candleRef.current = candles;
    markersRef.current = createSeriesMarkers(candles, []);
    watermarkRef.current = createTextWatermark(chart.panes()[0], { horzAlign: 'center', vertAlign: 'center', lines: [] });
    return () => {
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volRef.current = null;
      overlayRefs.current = {};
      paneRefs.current = {};
      priceLinesRef.current = [];
      markersRef.current = null;
      watermarkRef.current = null;
      lastKeyRef.current = '';
      prevLastTimeRef.current = 0;
      prevLenRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A theme change re-reads every colour: chrome and candles here, and everything drawn per
  // bar (volume, MACD) or per series (overlays, panes) through `theme` in their effects.
  useEffect(() => {
    const obs = new MutationObserver(() => {
      const key = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      setTheme((prev) => {
        if (prev === key) return prev;
        const c = readColors();
        colorsRef.current = c;
        chartRef.current?.applyOptions(chartChrome(c));
        candleRef.current?.applyOptions(candleColors(c));
        lastKeyRef.current = '';
        return key;
      });
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // The symbol and timeframe, faintly, behind the candles.
  useEffect(() => {
    const c = colorsRef.current;
    if (!c) return;
    watermarkRef.current?.applyOptions({
      lines: [
        { text: symbol, color: `${c.ink}0f`, fontSize: 56, fontStyle: '700', fontFamily: monoFont() },
        { text: timeframe, color: `${c.ink}0f`, fontSize: 22, fontFamily: monoFont() },
      ],
    });
  }, [symbol, timeframe, theme]);

  // price precision follows the symbol
  useEffect(() => {
    candleRef.current?.applyOptions({ priceFormat: { type: 'price', precision: decimals, minMove: 1 / 10 ** decimals } });
    chartRef.current?.applyOptions({ localization: { priceFormatter: (p: number) => p.toFixed(decimals) } });
  }, [decimals]);

  /**
   * Sub-panes (volume, RSI, MACD) are rebuilt together whenever the set changes,
   * because pane indices shift when a pane is removed. Rebuilding is cheap and
   * keeps the index maths trivial: pane 0 is always price, the rest follow in order.
   */
  useEffect(() => {
    const chart = chartRef.current;
    const c = colorsRef.current;
    if (!chart || !c) return;
    if (volRef.current) {
      chart.removeSeries(volRef.current);
      volRef.current = null;
    }
    for (const s of Object.values(paneRefs.current)) chart.removeSeries(s);
    paneRefs.current = {};

    let pane = 1;
    if (overlays.volume) {
      volRef.current = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'vol', priceLineVisible: false, lastValueVisible: false }, pane);
      chart.panes()[pane]?.setHeight(78);
      pane++;
    }
    if (overlays.rsi) {
      paneRefs.current.rsi = chart.addSeries(LineSeries, { color: c.c3, lineWidth: 2, priceLineVisible: false }, pane);
      chart.panes()[pane]?.setHeight(92);
      pane++;
    }
    if (overlays.macd) {
      paneRefs.current.macdHist = chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false }, pane);
      paneRefs.current.macdLine = chart.addSeries(LineSeries, { color: c.c1, lineWidth: 2, priceLineVisible: false }, pane);
      paneRefs.current.macdSignal = chart.addSeries(LineSeries, { color: c.c2, lineWidth: 1, priceLineVisible: false, lastValueVisible: false }, pane);
      chart.panes()[pane]?.setHeight(92);
      pane++;
    }
    lastKeyRef.current = '';
  }, [overlays.volume, overlays.rsi, overlays.macd, theme]);

  // overlay lines
  useEffect(() => {
    const chart = chartRef.current;
    const c = colorsRef.current;
    if (!chart || !c) return;
    const on: Record<keyof typeof OVERLAY_TONE, boolean> = {
      sma20: overlays.sma20,
      sma50: overlays.sma50,
      ema9: overlays.ema9,
      ema21: overlays.ema21,
      bbUpper: overlays.bb,
      bbMiddle: overlays.bb,
      bbLower: overlays.bb,
      vwap: overlays.vwap,
    };
    for (const k of Object.keys(OVERLAY_TONE) as (keyof typeof OVERLAY_TONE)[]) {
      const color = c[OVERLAY_TONE[k]];
      const has = overlayRefs.current[k];
      if (on[k] && !has) {
        overlayRefs.current[k] = chart.addSeries(
          LineSeries,
          { color, lineWidth: 1, lineStyle: k.startsWith('bb') ? LineStyle.Dashed : LineStyle.Solid, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false },
          0,
        );
      } else if (!on[k] && has) {
        chart.removeSeries(has);
        delete overlayRefs.current[k];
      } else if (has) {
        has.applyOptions({ color });
      }
    }
    lastKeyRef.current = '';
  }, [overlays.sma20, overlays.sma50, overlays.ema9, overlays.ema21, overlays.bb, overlays.vwap, theme]);

  // data: full reset when symbol/timeframe changes, incremental otherwise
  useEffect(() => {
    const candles = candleRef.current;
    const chart = chartRef.current;
    if (!candles || !chart || bars.length === 0) return;
    const key = `${symbol}|${timeframe}`;
    const lastTime = bars[bars.length - 1].time;
    /**
     * update() only accepts a time at or after the last one the series holds. Rolling a
     * new market rewinds the clock to the start of history without changing symbol or
     * timeframe, so the key alone would not catch it and the chart would throw
     * "Cannot update oldest data" on every tick afterwards. Any backwards jump forces a
     * full setData instead.
     */
    /**
     * The incremental path is only valid when this render continues the last one: same
     * series, and either the same forming bar or exactly one more. Anything else means
     * the data underneath was replaced, and update() would either be rejected or leave
     * the chart showing a stale window.
     *
     * Two ways that happens. Rolling a new market rewinds the clock, so the last bar's
     * time moves backwards and update() throws "Cannot update oldest data". Loading real
     * history arrives in two steps, a single forming bar and then the full series, so the
     * bar count jumps by thousands; without this the chart would keep rendering the one
     * bar it first saw.
     */
    const wentBackwards = lastTime < prevLastTimeRef.current;
    const jumped = prevLenRef.current > 0 && bars.length !== prevLenRef.current && bars.length !== prevLenRef.current + 1;
    const full = key !== lastKeyRef.current || wentBackwards || jumped;

    const toCandle = (b: Bar) => ({ time: b.time as UTCTimestamp, open: b.open, high: b.high, low: b.low, close: b.close });

    if (full) {
      candles.setData(bars.map(toCandle));
      lastKeyRef.current = key;
      chart.timeScale().fitContent();
      const visible = Math.min(bars.length, 160);
      chart.timeScale().setVisibleLogicalRange({ from: bars.length - visible, to: bars.length + 6 });
    } else {
      candles.update(toCandle(bars[bars.length - 1]));
    }
    prevLastTimeRef.current = lastTime;
    prevLenRef.current = bars.length;

    const colors = colorsRef.current;
    if (volRef.current && colors) {
      const up = colors.up;
      const dn = colors.down;
      const toVol = (b: Bar) => ({ time: b.time as UTCTimestamp, value: b.volume, color: (b.close >= b.open ? up : dn) + '80' });
      if (full) volRef.current.setData(bars.map(toVol));
      else volRef.current.update(toVol(bars[bars.length - 1]));
    }

    // overlays recompute on the whole visible array (cheap: a few thousand points)
    const closes = bars.map((b) => b.close);
    const t = (i: number) => bars[i].time as UTCTimestamp;
    const setLine = (k: string, values: number[]) => {
      const s = overlayRefs.current[k];
      if (!s) return;
      const data = [];
      for (let i = 0; i < values.length; i++) if (Number.isFinite(values[i])) data.push({ time: t(i), value: values[i] });
      s.setData(data);
    };
    if (overlayRefs.current.sma20) setLine('sma20', ind.sma(closes, 20));
    if (overlayRefs.current.sma50) setLine('sma50', ind.sma(closes, 50));
    if (overlayRefs.current.ema9) setLine('ema9', ind.ema(closes, 9));
    if (overlayRefs.current.ema21) setLine('ema21', ind.ema(closes, 21));
    if (overlayRefs.current.bbUpper) {
      const bb = ind.bollinger(closes, 20, 2);
      setLine('bbUpper', bb.upper);
      setLine('bbMiddle', bb.middle);
      setLine('bbLower', bb.lower);
    }
    if (overlayRefs.current.vwap) {
      // VWAP resets each session day
      const out: number[] = [];
      let pv = 0;
      let vv = 0;
      let day = -1;
      for (const b of bars) {
        const d = sessionDayStart(b.time);
        if (d !== day) {
          day = d;
          pv = 0;
          vv = 0;
        }
        const typical = (b.high + b.low + b.close) / 3;
        pv += typical * (b.volume || 1);
        vv += b.volume || 1;
        out.push(pv / vv);
      }
      setLine('vwap', out);
    }
    if (paneRefs.current.rsi) {
      const s = paneRefs.current.rsi as ISeriesApi<'Line'>;
      const r = ind.rsi(closes, 14);
      s.setData(r.map((v, i) => ({ time: t(i), value: v })).filter((d) => Number.isFinite(d.value)));
    }
    if (paneRefs.current.macdLine && colors) {
      const m = ind.macd(closes);
      const up = colors.up;
      const dn = colors.down;
      (paneRefs.current.macdLine as ISeriesApi<'Line'>).setData(m.line.map((v, i) => ({ time: t(i), value: v })).filter((d) => Number.isFinite(d.value)));
      if (paneRefs.current.macdSignal) (paneRefs.current.macdSignal as ISeriesApi<'Line'>).setData(m.signal.map((v, i) => ({ time: t(i), value: v })).filter((d) => Number.isFinite(d.value)));
      if (paneRefs.current.macdHist)
        (paneRefs.current.macdHist as ISeriesApi<'Histogram'>).setData(
          m.histogram.map((v, i) => ({ time: t(i), value: v, color: (v >= 0 ? up : dn) + '99' })).filter((d) => Number.isFinite(d.value)),
        );
    }
  }, [bars, symbol, timeframe, clock, overlays, theme]);

  // price lines for position, orders and brackets + entry markers
  useEffect(() => {
    const candles = candleRef.current;
    const c = colorsRef.current;
    if (!candles || !c) return;
    for (const pl of priceLinesRef.current) candles.removePriceLine(pl);
    priceLinesRef.current = [];

    const pos = account.positions[symbol];
    if (pos) {
      priceLinesRef.current.push(
        candles.createPriceLine({
          price: pos.avgPrice,
          color: c.accent,
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `${pos.qty > 0 ? 'LONG' : 'SHORT'} ${Math.abs(pos.qty)}`,
        }),
      );
    }
    for (const o of account.orders) {
      if (o.status !== 'working' || o.symbol !== symbol) continue;
      const price = o.type === 'limit' ? o.limitPrice : o.stopPrice ?? o.limitPrice;
      if (!price) continue;
      const isStopLoss = o.role === 'stop_loss';
      const isTp = o.role === 'take_profit';
      priceLinesRef.current.push(
        candles.createPriceLine({
          price,
          color: isStopLoss ? c.down : isTp ? c.up : c.text,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: isStopLoss ? 'STOP' : isTp ? 'TARGET' : `${o.side.toUpperCase()} ${o.type.replace('_', '-')}`,
        }),
      );
    }

    // markers for fills on this symbol, limited to the visible window
    const firstTime = bars.length ? bars[0].time : 0;
    const markers: SeriesMarker<Time>[] = account.fills
      .filter((f) => f.symbol === symbol && f.time >= firstTime)
      .slice(-60)
      .map((f) => ({
        time: alignToBar(f.time, bars) as Time,
        position: f.side === 'buy' ? ('belowBar' as const) : ('aboveBar' as const),
        color: f.side === 'buy' ? c.up : c.down,
        shape: f.side === 'buy' ? ('arrowUp' as const) : ('arrowDown' as const),
        text: `${f.side === 'buy' ? 'B' : 'S'} ${f.qty}`,
      }));
    // markers must align to existing bar times and be ascending
    const seen = new Set<number>();
    const clean = markers
      .filter((m) => {
        const t = m.time as number;
        if (!t || seen.has(t)) return false;
        seen.add(t);
        return true;
      })
      .sort((a, b) => (a.time as number) - (b.time as number));
    markersRef.current?.setMarkers(clean);
  }, [account, symbol, bars, theme]);

  // A canvas chart has nothing a screen reader can read, and the library lays it out with a
  // table that would otherwise be announced as data. One image with a description instead;
  // the price, the account and every position are in text around it.
  const last = bars[bars.length - 1];
  return (
    <div
      ref={containerRef}
      className="tv-chart"
      role="img"
      aria-label={t('sim.chartLabel', { symbol, timeframe, price: last ? last.close.toFixed(decimals) : '—' })}
    />
  );
}

/** Snap an arbitrary timestamp to the nearest bar time at or before it. */
function alignToBar(time: number, bars: Bar[]): number {
  if (!bars.length) return time;
  let lo = 0;
  let hi = bars.length - 1;
  if (time <= bars[0].time) return bars[0].time;
  if (time >= bars[hi].time) return bars[hi].time;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (bars[mid].time <= time) lo = mid;
    else hi = mid - 1;
  }
  return bars[lo].time;
}
