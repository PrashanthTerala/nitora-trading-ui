/**
 * A full-frame candlestick chart with a camera: the pilot's synthetic series and its 50/200
 * SMAs, as computed by the site's indicator engine (../ma-crossovers/data.ts), drawn at
 * 1920x1080 with large type, viewed through a camera (a window of bars and prices) that the
 * scene moves.
 *
 * Accuracy: the camera only changes which part of the data is shown. Candles and lines are
 * plotted from the engine's values, axis ticks are recomputed for every frame's window, markers
 * sit on the engine's crossing bars, and every number in a label comes from the data.
 *
 * Layout rule: nothing covers information. The plot holds only data (candles, averages, the
 * cross markers and arrows); every text label lives in the band under the plot, spaced by
 * placeLabels() so labels never overlap each other or the "synthetic data" tag; marker pills
 * sit above the local candle highs with a leader line. A scene that needs room below (the ship
 * card) shrinks the plot with `plotBottom` instead of drawing over it.
 */
import { Easing, interpolate } from 'remotion';
import * as d from '../ma-crossovers/data';

export const W = 1920;
export const H = 1080;
export const PLOT = { left: 120, right: W - 190, top: 300, bottom: 900 };
const BAND_GAP = 26; // between the plot's bottom edge and the label band
const BAND_H = 64;
export const BAND_ROWS = 2;
/** The height the label band can take under the plot (both rows). */
export const BAND_SPACE = BAND_GAP + BAND_ROWS * BAND_H;

const view = <T,>(a: T[]) => a.slice(d.VIEW_FROM);
export const BARS = view(d.BARS);
export const CLOSES = BARS.map((b) => b.c);
export const SMA50 = view(d.SMA50);
export const SMA200 = view(d.SMA200);
export const N = BARS.length;
export const at = (index: number) => index - d.VIEW_FROM;
export const GOLDEN = at(d.GOLDEN);
export const DEATH = at(d.DEATH);
export const LOW = at(d.LOW);
export const HIGH = at(d.HIGH);

export type Camera = { x0: number; x1: number; y0: number; y1: number };

/** The price range of the candles and both averages between two bars, with breathing room. */
export function frameBars(x0: number, x1: number, pad = 0.12): Camera {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = Math.max(0, Math.floor(x0)); i <= Math.min(N - 1, Math.ceil(x1)); i++) {
    for (const v of [BARS[i].l, BARS[i].h, SMA50[i], SMA200[i]]) {
      if (Number.isFinite(v)) {
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
    }
  }
  const span = hi - lo || 1;
  return { x0, x1, y0: lo - span * pad, y1: hi + span * (pad + 0.12) }; // extra headroom for marker pills
}

export const WIDE = frameBars(-4, N + 3, 0.08);

/** A camera that holds each shot and eases between them (cubic in-out), shot by shot. */
export function cameraAt(frame: number, shots: { at: number; cam: Camera; move?: number }[]): Camera {
  let cam = shots[0].cam;
  for (let k = 1; k < shots.length; k++) {
    const { at: start, cam: next, move = 48 } = shots[k];
    if (frame <= start) break;
    const t = interpolate(frame, [start, start + move], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
    cam = { x0: lerp(cam.x0, next.x0, t), x1: lerp(cam.x1, next.x1, t), y0: lerp(cam.y0, next.y0, t), y1: lerp(cam.y1, next.y1, t) };
  }
  return cam;
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** "Nice" axis ticks (1, 2 or 5 × 10^n steps) for a price range. */
function ticks(lo: number, hi: number, count = 5): number[] {
  const raw = (hi - lo) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push(Number(v.toFixed(6)));
  return out;
}

/** Text width estimate for layout (the band's sans/mono at 30 px); generous so boxes never clip. */
const textWidth = (text: string, px = 30) => [...text].length * px * 0.6 + 56;

/**
 * Places labels without overlap, in up to `rows` rows. Labels (in order of their points) go to
 * the first row with enough free width; within a row they are centred on their points where
 * possible, then pushed right past earlier labels and the reserved span (the tag, row 0), then
 * pulled back left from the frame edge. Returns each label's row and span, and `overflow` (labels
 * that fit nowhere): the chart refuses to draw those over other text. Deterministic.
 */
export function placeLabels(items: { x: number; w: number }[], reserved: { x0: number; x1: number }[], minX: number, maxX: number, rows = 2, gap = 18) {
  const order = items.map((it, i) => ({ ...it, i })).sort((a, b) => a.x - b.x);
  const reservedW = (row: number) => (row === 0 ? reserved.reduce((n, r) => n + (r.x1 - r.x0) + gap, 0) : 0);
  const used = Array.from({ length: rows }, (_, r) => reservedW(r));
  const members: (typeof order)[] = Array.from({ length: rows }, () => []);
  const overflow: number[] = [];
  for (const it of order) {
    const row = used.findIndex((u) => maxX - minX - u >= it.w);
    if (row < 0) overflow.push(it.i);
    else {
      members[row].push(it);
      used[row] += it.w + gap;
    }
  }
  const placed: Record<number, { row: number; x0: number; x1: number }> = {};
  members.forEach((list, row) => {
    const spans = list.map((it) => ({ it, x0: it.x - it.w / 2 }));
    let cursor = minX;
    for (const sp of spans) {
      sp.x0 = Math.max(sp.x0, cursor);
      if (row === 0) for (const r of reserved) if (sp.x0 < r.x1 + gap && sp.x0 + sp.it.w > r.x0 - gap) sp.x0 = r.x1 + gap;
      cursor = sp.x0 + sp.it.w + gap;
    }
    let limit = maxX;
    for (let k = spans.length - 1; k >= 0; k--) {
      spans[k].x0 = Math.min(spans[k].x0, limit - spans[k].it.w);
      limit = spans[k].x0 - gap;
    }
    for (const sp of spans) placed[sp.it.i] = { row, x0: sp.x0, x1: sp.x0 + sp.it.w };
  });
  return { placed, overflow };
}

export type Marker = { index: number; label: string; color: string; opacity: number; pulse: number };
/** Dims the plot away from one point, to direct the eye; the labels are never dimmed. */
export type Spotlight = { index: number; value: number; radius: number; strength: number };
/** `labelOpacity` (default 1) lets a label leave while its shading stays on the chart. */
export type Region = { from: number; to: number; color: string; opacity: number; label?: string; labelOpacity?: number };
export type Bracket = { index: number; from: number; to: number; label: string; color: string; opacity: number; labelOpacity?: number };

export function CinematicChart({
  cam,
  draw = 1,
  smaOpacity = 1,
  markers = [],
  regions = [],
  brackets = [],
  head = true,
  legend,
  tag,
  plotBottom = PLOT.bottom,
  dim = 1,
  spotlight,
}: {
  cam: Camera;
  /** How much of the series is drawn, 0-1 (candles and both averages advance together). */
  draw?: number;
  smaOpacity?: number;
  markers?: Marker[];
  regions?: Region[];
  brackets?: Bracket[];
  /** A price tag at the latest candle while drawing. */
  head?: boolean;
  legend?: { price: string; sma50: string; sma200: string };
  /** The "synthetic data" note, drawn at the left of the label band (its space is reserved). */
  tag?: string;
  plotBottom?: number;
  dim?: number;
  spotlight?: Spotlight;
}) {
  const { left, right, top } = PLOT;
  const bottom = plotBottom;
  const x = (i: number) => left + ((i - cam.x0) / (cam.x1 - cam.x0)) * (right - left);
  const y = (v: number) => top + ((cam.y1 - v) / (cam.y1 - cam.y0)) * (bottom - top);
  const slot = (right - left) / (cam.x1 - cam.x0);
  const body = Math.max(1.6, Math.min(slot * 0.62, 22));
  const last = Math.max(0, Math.min(N - 1, Math.floor(draw * (N - 1))));
  const from = Math.max(0, Math.floor(cam.x0) - 2);
  const to = Math.min(last, Math.ceil(cam.x1) + 2);

  const line = (values: number[]) => {
    let dpath = '';
    for (let i = from; i <= to; i++) {
      if (!Number.isFinite(values[i])) continue;
      dpath += `${dpath ? 'L' : 'M'}${x(i).toFixed(1)},${y(values[i]).toFixed(1)}`;
    }
    return dpath;
  };
  const candles = [];
  for (let i = from; i <= to; i++) {
    const b = BARS[i];
    const up = b.c >= b.o;
    const color = up ? 'var(--color-up)' : 'var(--color-down)';
    const yo = y(b.o);
    const yc = y(b.c);
    candles.push(
      <g key={i}>
        <line x1={x(i)} x2={x(i)} y1={y(b.h)} y2={y(b.l)} stroke={color} strokeWidth={Math.max(1, Math.min(body * 0.18, 2.5))} />
        <rect x={x(i) - body / 2} y={Math.min(yo, yc)} width={body} height={Math.max(1.5, Math.abs(yc - yo))} fill={color} />
      </g>,
    );
  }
  const tickValues = ticks(cam.y0, cam.y1);

  // The label band: region labels and arrow labels, spaced so none overlap, the tag reserved.
  const bandY = bottom + BAND_GAP;
  const tagW = tag ? textWidth(tag, 28) : 0;
  const reserved = tag ? [{ x0: left, x1: left + tagW }] : [];
  const bandItems = [
    ...regions.map((r) => ({ r, o: Math.min(r.opacity, r.labelOpacity ?? 1) })).filter(({ r, o }) => r.label && o > 0.01).map(({ r, o }) => ({ kind: 'region' as const, text: r.label!, color: r.color, opacity: o, x: (x(r.from) + x(r.to)) / 2 })),
    ...brackets.map((b) => ({ b, o: Math.min(b.opacity, b.labelOpacity ?? 1) })).filter(({ o }) => o > 0.01).map(({ b, o }) => ({ kind: 'bracket' as const, text: b.label, color: b.color, opacity: o, x: x(b.index) })),
  ];
  const { placed: slots, overflow } = placeLabels(bandItems.map((it) => ({ x: it.x, w: textWidth(it.text) })), reserved, left, right + 150, BAND_ROWS);
  // A label that fits nowhere is a layout bug, not something to draw over other text.
  if (overflow.length) throw new Error(`CinematicChart: ${overflow.length} label(s) do not fit in the band: ${overflow.map((i) => bandItems[i].text).join(' | ')}`);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: dim }}>
      <defs>
        <clipPath id="plot">
          <rect x={left} y={top - 10} width={right - left} height={bottom - top + 10} />
        </clipPath>
        {spotlight && (
          <radialGradient id="spot" gradientUnits="userSpaceOnUse" cx={x(spotlight.index)} cy={y(spotlight.value)} r={spotlight.radius}>
            <stop offset="0" stopColor="var(--color-bg)" stopOpacity={0} />
            <stop offset="0.55" stopColor="var(--color-bg)" stopOpacity={0} />
            <stop offset="1" stopColor="var(--color-bg)" stopOpacity={0.78 * spotlight.strength} />
          </radialGradient>
        )}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {tickValues.map((v) => (
        <g key={v}>
          <line x1={left} x2={right} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeWidth={1.5} />
          <text x={right + 20} y={y(v) + 11} fontSize={30} fill="var(--color-ink-soft)" fontFamily="var(--font-mono)">
            {v.toFixed(v % 1 ? 1 : 0)}
          </text>
        </g>
      ))}

      <g clipPath="url(#plot)">
        {regions.map((r, k) => (
          <g key={k} opacity={r.opacity}>
            <rect x={x(r.from)} y={top} width={Math.max(0, x(r.to) - x(r.from))} height={bottom - top} fill={r.color} opacity={0.12} />
            <line x1={x(r.from)} x2={x(r.from)} y1={top} y2={bottom} stroke={r.color} strokeWidth={2} strokeDasharray="8 8" />
            <line x1={x(r.to)} x2={x(r.to)} y1={top} y2={bottom} stroke={r.color} strokeWidth={2} strokeDasharray="8 8" />
          </g>
        ))}
        {candles}
        <g opacity={smaOpacity} filter="url(#glow)">
          <path d={line(SMA200)} fill="none" stroke="var(--color-chart-1)" strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
          <path d={line(SMA50)} fill="none" stroke="var(--color-chart-2)" strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
        </g>
        {spotlight && spotlight.strength > 0 && <rect x={left} y={top - 10} width={right - left} height={bottom - top + 10} fill="url(#spot)" />}
        {brackets.map((b, k) => (
          <g key={k} opacity={b.opacity}>
            <line x1={x(b.index)} x2={x(b.index)} y1={y(b.from)} y2={y(b.to)} stroke={b.color} strokeWidth={5} />
            <line x1={x(b.index) - 16} x2={x(b.index) + 16} y1={y(b.from)} y2={y(b.from)} stroke={b.color} strokeWidth={5} />
            <polygon points={arrow(x(b.index), y(b.to), b.to > b.from)} fill={b.color} />
          </g>
        ))}
        {markers.map((m, k) => (
          <g key={k} opacity={m.opacity}>
            <circle cx={x(m.index)} cy={y(SMA50[m.index])} r={18 + 30 * m.pulse} fill="none" stroke={m.color} strokeWidth={4} opacity={1 - m.pulse} />
            <circle cx={x(m.index)} cy={y(SMA50[m.index])} r={15} fill="none" stroke={m.color} strokeWidth={6} />
          </g>
        ))}
      </g>

      {/* Marker pills: above the local candle highs, joined to the marker by a leader line. */}
      {markers.map((m, k) => {
        const mx = x(m.index);
        if (mx < left - 40 || mx > right + 40 || m.opacity < 0.01) return null;
        let hi = -Infinity;
        for (let i = Math.max(0, m.index - 8); i <= Math.min(N - 1, m.index + 8); i++) hi = Math.max(hi, BARS[i].h, SMA50[i], Number.isFinite(SMA200[i]) ? SMA200[i] : -Infinity);
        const w = textWidth(m.label, 32);
        const py = Math.max(top + 34, y(hi) - 56);
        const px = Math.min(Math.max(mx, left + w / 2), right - w / 2);
        return (
          <g key={k} opacity={m.opacity}>
            <line x1={mx} x2={mx} y1={py + 30} y2={y(SMA50[m.index]) - 18} stroke={m.color} strokeWidth={2.5} strokeDasharray="6 6" />
            <rect x={px - w / 2} y={py - 30} width={w} height={60} rx={30} fill="var(--color-bg)" stroke={m.color} strokeWidth={3} />
            <text x={px} y={py + 11} textAnchor="middle" fontSize={32} fontWeight={700} fill={m.color} fontFamily="var(--font-sans)">
              {m.label}
            </text>
          </g>
        );
      })}

      {/* The label band. */}
      {tag && (
        <g>
          <rect x={left} y={bandY} width={tagW} height={BAND_H - 10} rx={27} fill="none" stroke="var(--color-line)" strokeWidth={2} />
          <text x={left + tagW / 2} y={bandY + 37} textAnchor="middle" fontSize={28} fill="var(--color-ink-soft)" fontFamily="var(--font-mono)">
            {tag}
          </text>
        </g>
      )}
      {bandItems.map((it, k) => {
        const s = slots[k];
        if (!s) return null;
        const cx = (s.x0 + s.x1) / 2;
        const ry = bandY + s.row * BAND_H;
        // Labels arrive with a small pop, so the eye goes to the new number.
        const pop = 0.88 + 0.12 * it.opacity;
        return (
          <g key={k} opacity={it.opacity} transform={`translate(${cx} ${ry + 27}) scale(${pop}) translate(${-cx} ${-(ry + 27)})`}>
            {Math.abs(cx - it.x) > 4 && s.row === 0 && <line x1={it.x} x2={cx} y1={bottom + 4} y2={ry} stroke={it.color} strokeWidth={2} opacity={0.6} />}
            <rect x={s.x0} y={ry} width={s.x1 - s.x0} height={BAND_H - 10} rx={14} fill="var(--color-bg)" stroke={it.color} strokeWidth={3} />
            <text x={cx} y={ry + 37} textAnchor="middle" fontSize={30} fontWeight={700} fill={it.color} fontFamily={it.kind === 'bracket' ? 'var(--font-mono)' : 'var(--font-sans)'}>
              {it.text}
            </text>
          </g>
        );
      })}

      {head && draw < 1 && (
        <g>
          <rect x={Math.min(x(last) + 18, right - 150)} y={y(BARS[last].c) - 26} width={140} height={50} rx={10} fill="var(--color-surface-1)" stroke="var(--color-line)" strokeWidth={2} />
          <text x={Math.min(x(last) + 88, right - 80)} y={y(BARS[last].c) + 10} textAnchor="middle" fontSize={30} fill="var(--color-ink)" fontFamily="var(--font-mono)">
            {BARS[last].c.toFixed(2)}
          </text>
        </g>
      )}
      {legend && (
        <g fontFamily="var(--font-sans)" fontSize={32} fontWeight={600}>
          {[
            [legend.price, 'var(--color-ink-soft)', 'candle'],
            [legend.sma50, 'var(--color-chart-2)', 'line'],
            [legend.sma200, 'var(--color-chart-1)', 'line'],
          ].map(([label, color, kind], k) => (
            <g key={k} transform={`translate(${right - 760 + k * 270}, ${top - 40})`}>
              {kind === 'candle' ? (
                <g>
                  <rect x={4} y={-24} width={12} height={22} fill="var(--color-up)" />
                  <rect x={24} y={-20} width={12} height={16} fill="var(--color-down)" />
                </g>
              ) : (
                <rect x={0} y={-10} width={44} height={8} rx={4} fill={color} />
              )}
              <text x={58} y={0} fill={color}>
                {label}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

function arrow(cx: number, cy: number, up: boolean) {
  const s = 18;
  return up ? `${cx - s},${cy + s} ${cx + s},${cy + s} ${cx},${cy - 6}` : `${cx - s},${cy - s} ${cx + s},${cy - s} ${cx},${cy + 6}`;
}
