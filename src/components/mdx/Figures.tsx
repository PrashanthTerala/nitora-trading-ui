/**
 * Figure components available inside lessons.
 *   <PatternFigure name="hammer" />                  a named preset (candle or chart pattern)
 *   <CandleFigure bars={[...]} annotations={[...]} /> inline custom bars
 *   <IndicatorFigure indicator="rsi" regime="reversal" />
 */
import { useMemo, type ReactNode } from 'react';
import { CandleSvg, type Annotation, type Overlay, type SubPanel } from '@/components/figures/CandleSvg';
import type { OHLC } from '@/engine/market/types';
import { FIGURES, regimeSeries, type Regime } from '@/content/figures';
import * as ind from '@/engine/market/indicators';

export function FigureFrame({ title, caption, children }: { title?: string; caption?: ReactNode; children: ReactNode }) {
  return (
    <figure className="not-prose my-7 overflow-hidden rounded-2xl border border-line bg-surface">
      {title && <figcaption className="border-b border-line px-4 py-2 text-sm font-semibold text-ink">{title}</figcaption>}
      <div className="p-3">{children}</div>
      {caption && <figcaption className="border-t border-line px-4 py-3 text-sm leading-relaxed text-ink-soft">{caption}</figcaption>}
    </figure>
  );
}

export function PatternFigure({ name, caption, title, height, showVolume, mode }: { name: string; caption?: ReactNode; title?: string; height?: number; showVolume?: boolean; mode?: 'candles' | 'line' | 'bars' }) {
  const preset = FIGURES[name];
  if (!preset) {
    return (
      <div className="my-6 rounded-lg border border-down bg-down/10 p-3 text-sm">
        Unknown figure <code>{name}</code>
      </div>
    );
  }
  return (
    <FigureFrame title={title ?? preset.title} caption={caption ?? preset.caption}>
      <CandleSvg bars={preset.bars} annotations={preset.annotations} showVolume={showVolume ?? preset.showVolume} height={height ?? 240} fadeBefore={preset.fadeBefore} mode={mode} />
    </FigureFrame>
  );
}

export function CandleFigure({
  bars,
  annotations,
  overlays,
  caption,
  title,
  height,
  showVolume,
  mode,
  hollow,
}: {
  bars: OHLC[];
  annotations?: Annotation[];
  overlays?: Overlay[];
  caption?: ReactNode;
  title?: string;
  height?: number;
  showVolume?: boolean;
  mode?: 'candles' | 'line' | 'bars';
  hollow?: boolean;
}) {
  return (
    <FigureFrame title={title} caption={caption}>
      <CandleSvg bars={bars} annotations={annotations} overlays={overlays} showVolume={showVolume} height={height ?? 220} mode={mode} hollow={hollow} />
    </FigureFrame>
  );
}

/** Same data drawn three ways, for the chart-types lesson. */
export function ChartTypesFigure({ regime = 'trend-up', caption }: { regime?: Regime; caption?: ReactNode }) {
  const bars = useMemo(() => regimeSeries(regime, 40), [regime]);
  return (
    <FigureFrame title="The same 40 days, drawn three ways" caption={caption}>
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <p className="mb-1 text-xs font-semibold text-ink-soft">Line (closes only)</p>
          <CandleSvg bars={bars} mode="line" height={180} axis={false} />
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-ink-soft">OHLC bars</p>
          <CandleSvg bars={bars} mode="bars" height={180} axis={false} />
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-ink-soft">Candlesticks</p>
          <CandleSvg bars={bars} mode="candles" height={180} axis={false} />
        </div>
      </div>
    </FigureFrame>
  );
}

export type IndicatorName =
  | 'sma'
  | 'ema'
  | 'sma-vs-ema'
  | 'crossover'
  | 'rsi'
  | 'macd'
  | 'stochastic'
  | 'bollinger'
  | 'atr'
  | 'vwap'
  | 'obv'
  | 'adx'
  | 'fibonacci'
  | 'pivots'
  | 'divergence'
  | 'overload'
  | 'clean';

// Overlay colours come from the chart palette in tokens.css: colour-blind-safe, none of
// them green or red, so an indicator line is never mistaken for price direction.
const C1 = 'var(--color-chart-1)';
const C2 = 'var(--color-chart-2)';
const C3 = 'var(--color-chart-3)';
// Envelopes and reference series (Bollinger bands) in the palette's neutral slate.
const C_BAND = 'var(--color-chart-6)';
const C_VWAP = 'var(--color-chart-4)';

export function IndicatorFigure({ indicator, regime, caption, title, period }: { indicator: IndicatorName; regime?: Regime; caption?: ReactNode; title?: string; period?: number }) {
  const bars = useMemo(() => regimeSeries(regime ?? defaultRegime(indicator)), [regime, indicator]);
  const closes = useMemo(() => ind.closes(bars), [bars]);

  const { overlays, panels, annotations, showVolume, defaultTitle } = useMemo(() => {
    const overlays: Overlay[] = [];
    const panels: SubPanel[] = [];
    const annotations: Annotation[] = [];
    let showVolume = false;
    let defaultTitle = '';
    switch (indicator) {
      case 'sma': {
        const p = period ?? 20;
        overlays.push({ values: ind.sma(closes, p), color: C1, name: `SMA ${p}` });
        defaultTitle = `${p}-period simple moving average`;
        break;
      }
      case 'ema': {
        const p = period ?? 20;
        overlays.push({ values: ind.ema(closes, p), color: C2, name: `EMA ${p}` });
        defaultTitle = `${p}-period exponential moving average`;
        break;
      }
      case 'sma-vs-ema': {
        const p = period ?? 20;
        overlays.push({ values: ind.sma(closes, p), color: C1, name: `SMA ${p}` });
        overlays.push({ values: ind.ema(closes, p), color: C2, name: `EMA ${p}` });
        defaultTitle = 'SMA vs EMA of the same period';
        break;
      }
      case 'crossover': {
        const fast = ind.ema(closes, 9);
        const slow = ind.ema(closes, 21);
        overlays.push({ values: fast, color: C2, name: 'EMA 9' });
        overlays.push({ values: slow, color: C1, name: 'EMA 21' });
        for (let i = 1; i < closes.length; i++) {
          if (Number.isNaN(fast[i - 1]) || Number.isNaN(slow[i - 1])) continue;
          const was = fast[i - 1] - slow[i - 1];
          const now = fast[i] - slow[i];
          if (was <= 0 && now > 0) annotations.push({ type: 'arrow', index: i, direction: 'up', text: 'bull cross' });
          if (was >= 0 && now < 0) annotations.push({ type: 'arrow', index: i, direction: 'down', text: 'bear cross' });
        }
        defaultTitle = 'Fast and slow EMA crossovers';
        break;
      }
      case 'rsi': {
        const p = period ?? 14;
        panels.push({ name: `RSI ${p}`, series: [{ values: ind.rsi(closes, p), color: C3 }], levels: [{ value: 70, color: 'var(--color-down)' }, { value: 30, color: 'var(--color-up)' }], range: [0, 100] });
        defaultTitle = 'Relative Strength Index';
        break;
      }
      case 'macd': {
        const m = ind.macd(closes);
        panels.push({ name: 'MACD 12, 26, 9', series: [{ values: m.histogram, color: C1, kind: 'histogram' }, { values: m.line, color: C1 }, { values: m.signal, color: C2 }], levels: [{ value: 0 }] });
        defaultTitle = 'MACD line, signal line and histogram';
        break;
      }
      case 'stochastic': {
        const s = ind.stochastic(bars);
        panels.push({ name: 'Stochastic 14, 3, 3', series: [{ values: s.k, color: C1 }, { values: s.d, color: C2 }], levels: [{ value: 80, color: 'var(--color-down)' }, { value: 20, color: 'var(--color-up)' }], range: [0, 100] });
        defaultTitle = 'Stochastic oscillator (%K blue, %D orange)';
        break;
      }
      case 'bollinger': {
        const b = ind.bollinger(closes, 20, 2);
        overlays.push({ values: b.upper, color: C1, name: 'Upper' });
        overlays.push({ values: b.middle, color: C2, name: 'SMA 20', dashed: true });
        overlays.push({ values: b.lower, color: C1, name: 'Lower' });
        defaultTitle = 'Bollinger Bands (20, 2)';
        break;
      }
      case 'atr': {
        panels.push({ name: 'ATR 14', series: [{ values: ind.atr(bars, 14), color: C2 }] });
        defaultTitle = 'Average True Range';
        break;
      }
      case 'vwap': {
        overlays.push({ values: ind.vwap(bars), color: C3, name: 'VWAP' });
        showVolume = true;
        defaultTitle = 'VWAP over one session';
        break;
      }
      case 'obv': {
        panels.push({ name: 'On-Balance Volume', series: [{ values: ind.obv(bars), color: C1 }] });
        showVolume = true;
        defaultTitle = 'On-Balance Volume';
        break;
      }
      case 'adx': {
        const a = ind.adx(bars, 14);
        panels.push({ name: 'ADX 14 (white), +DI (green), -DI (red)', series: [{ values: a.plusDI, color: 'var(--color-up)' }, { values: a.minusDI, color: 'var(--color-down)' }, { values: a.adx, color: 'var(--color-ink)' }], levels: [{ value: 25 }], range: [0, 60] });
        defaultTitle = 'ADX and directional indicators';
        break;
      }
      case 'fibonacci': {
        let hiI = 0;
        let loI = 0;
        bars.forEach((b, i) => {
          if (b.h > bars[hiI].h) hiI = i;
          if (b.l < bars[loI].l) loI = i;
        });
        const upSwing = loI < hiI;
        const hi = bars[hiI].h;
        const lo = bars[loI].l;
        const from = Math.min(hiI, loI);
        for (const lv of ind.fibLevels(hi, lo, upSwing ? 'up' : 'down')) {
          if (lv.ratio > 1) continue;
          annotations.push({ type: 'hline', price: lv.price, text: `${(lv.ratio * 100).toFixed(1)}%`, from, to: bars.length - 1, color: lv.ratio === 0.618 ? 'var(--color-accent)' : 'var(--color-ink-soft)' });
        }
        defaultTitle = 'Fibonacci retracement of the main swing';
        break;
      }
      case 'pivots': {
        const prev = bars[Math.floor(bars.length / 2) - 1];
        const pv = ind.pivotPoints(prev);
        const from = Math.floor(bars.length / 2);
        annotations.push({ type: 'hline', price: pv.p, text: 'P', from, color: 'var(--color-accent)' });
        annotations.push({ type: 'hline', price: pv.r1, text: 'R1', from, color: 'var(--color-down)' });
        annotations.push({ type: 'hline', price: pv.s1, text: 'S1', from, color: 'var(--color-up)' });
        annotations.push({ type: 'hline', price: pv.r2, text: 'R2', from, color: 'var(--color-down)' });
        annotations.push({ type: 'hline', price: pv.s2, text: 'S2', from, color: 'var(--color-up)' });
        annotations.push({ type: 'highlight', from: 0, to: from - 1 });
        defaultTitle = 'Pivot points computed from the highlighted prior period';
        break;
      }
      case 'divergence': {
        const r = ind.rsi(closes, 14);
        panels.push({ name: 'RSI 14', series: [{ values: r, color: C3 }], levels: [{ value: 70, color: 'var(--color-down)' }, { value: 30, color: 'var(--color-up)' }], range: [0, 100] });
        annotations.push({ type: 'line', from: [50, bars[50].h], to: [61, bars[61].h], color: 'var(--color-down)', text: 'higher high' });
        defaultTitle = 'Bearish divergence: price makes a higher high, RSI makes a lower high';
        break;
      }
      case 'overload': {
        overlays.push({ values: ind.sma(closes, 10), color: C1, name: 'SMA 10' });
        overlays.push({ values: ind.sma(closes, 20), color: C2, name: 'SMA 20' });
        overlays.push({ values: ind.ema(closes, 50), color: C3, name: 'EMA 50' });
        const b = ind.bollinger(closes, 20, 2);
        overlays.push({ values: b.upper, color: C_BAND, name: 'BB' });
        overlays.push({ values: b.lower, color: C_BAND });
        overlays.push({ values: ind.vwap(bars), color: C_VWAP, name: 'VWAP' });
        const m = ind.macd(closes);
        panels.push({ name: 'RSI', series: [{ values: ind.rsi(closes, 14), color: C3 }], range: [0, 100] });
        panels.push({ name: 'MACD', series: [{ values: m.histogram, color: C1, kind: 'histogram' }, { values: m.line, color: C1 }, { values: m.signal, color: C2 }] });
        const s = ind.stochastic(bars);
        panels.push({ name: 'Stochastic', series: [{ values: s.k, color: C1 }, { values: s.d, color: C2 }], range: [0, 100] });
        showVolume = true;
        defaultTitle = 'Indicator overload';
        break;
      }
      case 'clean': {
        overlays.push({ values: ind.ema(closes, 20), color: C2, name: 'EMA 20' });
        showVolume = true;
        defaultTitle = 'A clean chart: price, one moving average, volume';
        break;
      }
    }
    return { overlays, panels, annotations, showVolume, defaultTitle };
  }, [indicator, bars, closes, period]);

  return (
    <FigureFrame title={title ?? defaultTitle} caption={caption}>
      <CandleSvg bars={bars} overlays={overlays} panels={panels} annotations={annotations} showVolume={showVolume} height={230} />
    </FigureFrame>
  );
}

function defaultRegime(i: IndicatorName): Regime {
  switch (i) {
    case 'rsi':
    case 'stochastic':
    case 'bollinger':
      return 'range';
    case 'divergence':
    case 'macd':
      return 'reversal';
    case 'vwap':
      return 'intraday';
    case 'atr':
      return 'volatile';
    case 'fibonacci':
      return 'trend-up';
    default:
      return 'trend-up';
  }
}
