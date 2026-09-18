/**
 * The simulator chart: lightweight-charts v5 with candles, volume, overlays,
 * indicator panes, position/order price lines and entry markers.
 *
 * The chart instance is created once and then fed incrementally. Data is rebuilt
 * with setData when the symbol or timeframe changes, and updated with update()
 * on every clock tick so the forming candle animates.
 */
import { useEffect, useRef } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  createSeriesMarkers,
  LineStyle,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
  type UTCTimestamp,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
} from 'lightweight-charts';
import type { Bar, Timeframe } from '@/engine/market/types';
import type { AccountState } from '@/engine/broker/types';
import * as ind from '@/engine/market/indicators';
import type { Overlays } from '@/store/sim';
import { sessionDayStart } from '@/engine/market/generator';

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

function cssVar(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
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
  const themeRef = useRef('');

  // create chart once
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: 'transparent' },
        textColor: cssVar('--color-ink-soft', '#94a0b8'),
        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: cssVar('--color-grid', '#1b2435') },
        horzLines: { color: cssVar('--color-grid', '#1b2435') },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: cssVar('--color-line', '#263044'), scaleMargins: { top: 0.08, bottom: 0.08 } },
      timeScale: { borderColor: cssVar('--color-line', '#263044'), timeVisible: true, secondsVisible: false, rightOffset: 6, barSpacing: 8 },
      localization: { priceFormatter: (p: number) => p.toFixed(decimals) },
    });
    chartRef.current = chart;
    const candles = chart.addSeries(CandlestickSeries, {
      upColor: cssVar('--color-up', '#22c55e'),
      downColor: cssVar('--color-down', '#ef4444'),
      borderUpColor: cssVar('--color-up', '#22c55e'),
      borderDownColor: cssVar('--color-down', '#ef4444'),
      wickUpColor: cssVar('--color-up', '#22c55e'),
      wickDownColor: cssVar('--color-down', '#ef4444'),
      priceFormat: { type: 'price', precision: decimals, minMove: 1 / 10 ** decimals },
    });
    candleRef.current = candles;
    markersRef.current = createSeriesMarkers(candles, []);
    return () => {
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volRef.current = null;
      overlayRefs.current = {};
      paneRefs.current = {};
      priceLinesRef.current = [];
      markersRef.current = null;
      lastKeyRef.current = '';
      prevLastTimeRef.current = 0;
      prevLenRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // react to theme changes
  useEffect(() => {
    const obs = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      const key = isDark ? 'dark' : 'light';
      if (key === themeRef.current) return;
      themeRef.current = key;
      chartRef.current?.applyOptions({
        layout: { textColor: cssVar('--color-ink-soft', '#94a0b8') },
        grid: { vertLines: { color: cssVar('--color-grid', '#1b2435') }, horzLines: { color: cssVar('--color-grid', '#1b2435') } },
        rightPriceScale: { borderColor: cssVar('--color-line', '#263044') },
        timeScale: { borderColor: cssVar('--color-line', '#263044') },
      });
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

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
    if (!chart) return;
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
      paneRefs.current.rsi = chart.addSeries(LineSeries, { color: '#a855f7', lineWidth: 2, priceLineVisible: false }, pane);
      chart.panes()[pane]?.setHeight(92);
      pane++;
    }
    if (overlays.macd) {
      paneRefs.current.macdHist = chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false }, pane);
      paneRefs.current.macdLine = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 2, priceLineVisible: false }, pane);
      paneRefs.current.macdSignal = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, priceLineVisible: false, lastValueVisible: false }, pane);
      chart.panes()[pane]?.setHeight(92);
      pane++;
    }
    lastKeyRef.current = '';
  }, [overlays.volume, overlays.rsi, overlays.macd]);

  // overlay lines
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const defs: Record<string, { on: boolean; color: string; dashed?: boolean }> = {
      sma20: { on: overlays.sma20, color: '#3b82f6' },
      sma50: { on: overlays.sma50, color: '#8b5cf6' },
      ema9: { on: overlays.ema9, color: '#f59e0b' },
      ema21: { on: overlays.ema21, color: '#14b8a6' },
      bbUpper: { on: overlays.bb, color: '#64748b', dashed: true },
      bbMiddle: { on: overlays.bb, color: '#64748b', dashed: true },
      bbLower: { on: overlays.bb, color: '#64748b', dashed: true },
      vwap: { on: overlays.vwap, color: '#ec4899' },
    };
    for (const [k, d] of Object.entries(defs)) {
      const has = !!overlayRefs.current[k];
      if (d.on && !has) {
        overlayRefs.current[k] = chart.addSeries(
          LineSeries,
          { color: d.color, lineWidth: 1, lineStyle: d.dashed ? LineStyle.Dashed : LineStyle.Solid, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false },
          0,
        );
      } else if (!d.on && has) {
        chart.removeSeries(overlayRefs.current[k]);
        delete overlayRefs.current[k];
      }
    }
    lastKeyRef.current = '';
  }, [overlays.sma20, overlays.sma50, overlays.ema9, overlays.ema21, overlays.bb, overlays.vwap]);

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

    if (volRef.current) {
      const up = cssVar('--color-up', '#22c55e');
      const dn = cssVar('--color-down', '#ef4444');
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
    if (paneRefs.current.macdLine) {
      const m = ind.macd(closes);
      const up = cssVar('--color-up', '#22c55e');
      const dn = cssVar('--color-down', '#ef4444');
      (paneRefs.current.macdLine as ISeriesApi<'Line'>).setData(m.line.map((v, i) => ({ time: t(i), value: v })).filter((d) => Number.isFinite(d.value)));
      if (paneRefs.current.macdSignal) (paneRefs.current.macdSignal as ISeriesApi<'Line'>).setData(m.signal.map((v, i) => ({ time: t(i), value: v })).filter((d) => Number.isFinite(d.value)));
      if (paneRefs.current.macdHist)
        (paneRefs.current.macdHist as ISeriesApi<'Histogram'>).setData(
          m.histogram.map((v, i) => ({ time: t(i), value: v, color: (v >= 0 ? up : dn) + '99' })).filter((d) => Number.isFinite(d.value)),
        );
    }
  }, [bars, symbol, timeframe, clock, overlays]);

  // price lines for position, orders and brackets + entry markers
  useEffect(() => {
    const candles = candleRef.current;
    if (!candles) return;
    for (const pl of priceLinesRef.current) candles.removePriceLine(pl);
    priceLinesRef.current = [];

    const pos = account.positions[symbol];
    if (pos) {
      priceLinesRef.current.push(
        candles.createPriceLine({
          price: pos.avgPrice,
          color: cssVar('--color-accent', '#60a5fa'),
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
          color: isStopLoss ? cssVar('--color-down', '#ef4444') : isTp ? cssVar('--color-up', '#22c55e') : cssVar('--color-ink-soft', '#94a0b8'),
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
        color: f.side === 'buy' ? cssVar('--color-up', '#22c55e') : cssVar('--color-down', '#ef4444'),
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
  }, [account, symbol, bars]);

  return <div ref={containerRef} className="tv-chart" />;
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
