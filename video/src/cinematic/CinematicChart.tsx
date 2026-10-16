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
 * Layout rule: nothing covers information, and labels sit on what they name, without pointer
 * lines: a level's label on its own line, a note by its candle, an arrow's label beside the
 * arrow, each moved to the nearest spot clear of candles, arrows, lines and other labels. Region
 * labels, and any label with no clear spot, go in the band under the plot (placeLabels), under
 * what they name. A scene that needs room below (the ship card) shrinks the plot with
 * `plotBottom` instead of drawing over it.
 */
import { useId } from 'react';
import { Easing, interpolate } from 'remotion';
import type { OHLC } from '@/engine/market/types';
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

/** The price range of the candles and lines between two bars, with breathing room above for pills. */
export function frameOf(bars: OHLC[], lines: number[][], x0: number, x1: number, pad = 0.12): Camera {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = Math.max(0, Math.floor(x0)); i <= Math.min(bars.length - 1, Math.ceil(x1)); i++) {
    for (const v of [bars[i].l, bars[i].h, ...lines.map((l) => l[i])]) {
      if (Number.isFinite(v)) {
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
    }
  }
  const span = hi - lo || 1;
  return { x0, x1, y0: lo - span * pad, y1: hi + span * (pad + 0.12) }; // extra headroom for marker pills
}

/** The pilot series' frame between two bars (candles and both SMAs). */
export const frameBars = (x0: number, x1: number, pad = 0.12) => frameOf(BARS, [SMA50, SMA200], x0, x1, pad);

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
export function placeLabels(items: { x: number; w: number; pri?: number }[], reserved: { x0: number; x1: number }[], minX: number, maxX: number, rows = 2, gap = 18) {
  // Labels with a leader to draw (pri 0) claim the first row before labels without one (pri 1).
  const order = items.map((it, i) => ({ ...it, i })).sort((a, b) => (a.pri ?? 0) - (b.pri ?? 0) || a.x - b.x);
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
  for (const list of members) list.sort((a, b) => a.x - b.x);
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

/** A labelled ring at a crossing; `value` is the price it sits on (default: the pilot's SMA 50). */
export type Marker = { index: number; label: string; color: string; opacity: number; pulse: number; value?: number };
/** A small triangle at a crossing, without a label (for showing many crosses at once). */
export type Tick = { index: number; value: number; up: boolean; opacity?: number };
/** A dashed horizontal level (support, resistance); its label goes in the band, never on the candles. */
export type Level = { price: number; label: string; color: string; opacity: number };
export type Line = { values: number[]; color: string; width?: number };
export type LegendItem = { label: string; color: string; kind: 'candle' | 'line' };
/** A label for the band that belongs to no shape (a count, a summary); `index` places it, else it sits right. */
export type Note = { label: string; color: string; opacity: number; index?: number };
/** Dims the plot away from one point, to direct the eye; the labels are never dimmed. */
export type Spotlight = { index: number; value: number; radius: number; strength: number };
/** `labelOpacity` (default 1) lets a label leave while its shading stays on the chart. */
export type Region = { from: number; to: number; color: string; opacity: number; label?: string; labelOpacity?: number };
export type Bracket = { index: number; from: number; to: number; label: string; color: string; opacity: number; labelOpacity?: number };
/** A rounded box drawn around bars `from`..`to` (their whole high-low range, with room to spare), so a pattern is picked out without covering it. */
export type Outline = { from: number; to: number; color: string; opacity: number };

export function CinematicChart({
  cam,
  draw = 1,
  smaOpacity = 1,
  markers = [],
  regions = [],
  brackets = [],
  head = true,
  legend,
  plotBottom,
  dim = 1,
  spotlight,
  bars = BARS,
  lines,
  plot,
  ticks: crossTicks = [],
  levels = [],
  notes = [],
  outlines = [],
  maxBody = 22,
}: {
  cam: Camera;
  /** The candles (default: the pilot series) and the lines drawn over them (default: its SMA 200 and 50). */
  bars?: OHLC[];
  lines?: Line[];
  /** The plot rectangle (default PLOT), so a scene can place a smaller chart. */
  plot?: Partial<typeof PLOT>;
  ticks?: Tick[];
  levels?: Level[];
  notes?: Note[];
  outlines?: Outline[];
  /** The widest a candle body may be drawn (px): wider for close-ups of a few candles. */
  maxBody?: number;
  /** How much of the series is drawn, 0-1 (candles and both averages advance together). */
  draw?: number;
  smaOpacity?: number;
  markers?: Marker[];
  regions?: Region[];
  brackets?: Bracket[];
  /** A price tag at the latest candle while drawing. */
  head?: boolean;
  legend?: { price: string; sma50: string; sma200: string } | LegendItem[];
  plotBottom?: number;
  dim?: number;
  spotlight?: Spotlight;
}) {
  const { left, right, top } = { ...PLOT, ...plot };
  const bottom = plotBottom ?? plot?.bottom ?? PLOT.bottom;
  const N = bars.length;
  const drawn: Line[] = lines ?? [
    { values: SMA200, color: 'var(--color-chart-1)' },
    { values: SMA50, color: 'var(--color-chart-2)' },
  ];
  // Unique ids: several charts can share a frame.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const legendItems: LegendItem[] | undefined = Array.isArray(legend)
    ? legend
    : legend && [
        { label: legend.price, color: 'var(--color-ink-soft)', kind: 'candle' },
        { label: legend.sma50, color: 'var(--color-chart-2)', kind: 'line' },
        { label: legend.sma200, color: 'var(--color-chart-1)', kind: 'line' },
      ];
  const markerY = (m: Marker) => m.value ?? SMA50[m.index];
  const x = (i: number) => left + ((i - cam.x0) / (cam.x1 - cam.x0)) * (right - left);
  const y = (v: number) => top + ((cam.y1 - v) / (cam.y1 - cam.y0)) * (bottom - top);
  const slot = (right - left) / (cam.x1 - cam.x0);
  const body = Math.max(1.6, Math.min(slot * 0.62, maxBody));
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
    const b = bars[i];
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

  // Labels sit on what they name, with no pointer lines: a level's label on its own line at the
  // right, a note just under (or over) its candle, an arrow's label beside its arrow. Each spot is
  // checked against the candles, arrows, outlines, other level lines and labels already placed,
  // and the label slides to the nearest clear spot; only if there is none does it go to the band
  // under the plot. Region labels always go to the band, under their shaded columns.
  type Box = { x0: number; y0: number; x1: number; y1: number };
  const PILL_H = 46;
  const PAD = 8;
  const obstacles: Box[] = [];
  for (let i = from; i <= to; i++) {
    const b = bars[i];
    obstacles.push({ x0: x(i) - body / 2 - PAD, x1: x(i) + body / 2 + PAD, y0: y(b.h) - PAD, y1: y(b.l) + PAD });
  }
  for (const b of brackets.filter((b) => b.opacity > 0.01)) {
    const bx = x(b.index + 0.5);
    obstacles.push({ x0: bx - 24, x1: bx + 24, y0: Math.min(y(b.from), y(b.to)) - 14, y1: Math.max(y(b.from), y(b.to)) + 14 });
  }
  for (const o of outlines.filter((o) => o.opacity > 0.01)) {
    let hi = -Infinity;
    let lo = Infinity;
    for (let i = Math.max(0, o.from); i <= Math.min(N - 1, o.to); i++) {
      hi = Math.max(hi, bars[i].h);
      lo = Math.min(lo, bars[i].l);
    }
    obstacles.push({ x0: x(o.from) - body / 2 - 18, x1: x(o.to) + body / 2 + 18, y0: y(hi) - 20, y1: y(lo) + 20 });
  }
  const levelLine = (lv: Level): Box => ({ x0: left, x1: right, y0: y(lv.price) - 3, y1: y(lv.price) + 3 });
  const clash = (r: Box, others: Box[]) => r.x0 < left + 4 || r.x1 > right - 4 || r.y0 < top - 6 || r.y1 > bottom - 2 || others.some((o) => r.x0 < o.x1 && r.x1 > o.x0 && r.y0 < o.y1 && r.y1 > o.y0);
  const boxAt = (cx: number, cy: number, w: number): Box => ({ x0: cx - w / 2, x1: cx + w / 2, y0: cy - PILL_H / 2, y1: cy + PILL_H / 2 });
  type Pill = { text: string; color: string; opacity: number; mono: boolean; box: Box };
  const pills: Pill[] = [];
  const bandItems: { kind: 'region' | 'bracket'; text: string; color: string; opacity: number; x: number }[] = [];
  const place = (text: string, color: string, opacity: number, mono: boolean, candidates: Box[], others: Box[], bandX: number) => {
    const hit = candidates.find((c) => !clash(c, others));
    if (hit) {
      pills.push({ text, color, opacity, mono, box: hit });
      obstacles.push({ x0: hit.x0 - 10, x1: hit.x1 + 10, y0: hit.y0 - 6, y1: hit.y1 + 6 });
    } else bandItems.push({ kind: mono ? 'bracket' : 'region', text, color, opacity, x: bandX });
  };
  const steps = (n: number, d: number) => Array.from({ length: n }, (_, k) => k * d);
  const liveLevels = levels.filter((lv) => lv.opacity > 0.01);
  for (const lv of liveLevels) {
    if (!lv.label) continue; // an unlabelled line, explained once by the scene itself
    const w = textWidth(lv.label);
    const cy = y(lv.price);
    // On its own line, as far right as it fits, sliding left past anything in the way; where
    // another line runs close, resting just above or just below its own line instead.
    const xs = steps(Math.ceil((right - left) / 12), 12).map((d) => right - 12 - w / 2 - d);
    const cands = [cy, cy - PILL_H / 2 - 4, cy + PILL_H / 2 + 4].flatMap((yy) => xs.map((xx) => boxAt(xx, yy, w)));
    place(lv.label, lv.color, lv.opacity, false, cands, [...obstacles, ...liveLevels.filter((o) => o !== lv).map(levelLine)], right - 60);
  }
  const lineBoxes = liveLevels.map(levelLine);
  for (const b of brackets.filter((b) => Math.min(b.opacity, b.labelOpacity ?? 1) > 0.01)) {
    const o = Math.min(b.opacity, b.labelOpacity ?? 1);
    const w = textWidth(b.label);
    const bx = x(b.index + 0.5);
    const mid = (y(b.from) + y(b.to)) / 2;
    const half = Math.abs(y(b.from) - y(b.to)) / 2;
    const ys = steps(Math.max(1, Math.ceil(half / 10)), 10).flatMap((d) => (d ? [mid - d, mid + d] : [mid]));
    // Beside the arrow: right of it first, then left of it, anywhere along its length.
    const cands = [...ys.map((cy) => boxAt(bx + 30 + w / 2, cy, w)), ...ys.map((cy) => boxAt(bx - 30 - w / 2, cy, w))];
    place(b.label, b.color, o, true, cands, [...obstacles, ...lineBoxes], x(b.index));
  }
  const lowAt = (index: number) => Math.min(...[Math.floor(index), Math.ceil(index)].filter((i) => i >= 0 && i < N).map((i) => bars[i].l));
  const highAt = (index: number) => Math.max(...[Math.floor(index), Math.ceil(index)].filter((i) => i >= 0 && i < N).map((i) => bars[i].h));
  for (const n of notes.filter((n) => n.opacity > 0.01)) {
    if (n.index === undefined) {
      bandItems.push({ kind: 'region', text: n.label, color: n.color, opacity: n.opacity, x: right - 260 });
      continue;
    }
    const w = textWidth(n.label);
    const cx = x(n.index);
    const shifts = steps(40, 14).flatMap((d) => (d ? [-d, d] : [0]));
    // Just under the candle(s) it is about, then just over them, sliding sideways if needed.
    const below = y(lowAt(n.index)) + PAD + 28 + PILL_H / 2;
    const above = y(highAt(n.index)) - PAD - 28 - PILL_H / 2;
    const cands = [...shifts.map((d) => boxAt(cx + d, below, w)), ...shifts.map((d) => boxAt(cx + d, above, w))];
    place(n.label, n.color, n.opacity, false, cands, [...obstacles, ...lineBoxes], x(n.index));
  }
  for (const r of regions) {
    const o = Math.min(r.opacity, r.labelOpacity ?? 1);
    if (r.label && o > 0.01) bandItems.push({ kind: 'region', text: r.label, color: r.color, opacity: o, x: (x(r.from) + x(r.to)) / 2 });
  }
  const bandY = bottom + BAND_GAP;
  // Disclaimer tags ("synthetic data") are not drawn here: the kit's CornerTag carries them.
  const { placed: slots, overflow } = placeLabels(bandItems.map((it) => ({ x: it.x, w: textWidth(it.text) })), [], left, right + 150, BAND_ROWS);
  // A label that fits nowhere is a layout bug, not something to draw over other text.
  if (overflow.length) throw new Error(`CinematicChart: ${overflow.length} label(s) do not fit in the band: ${overflow.map((i) => bandItems[i].text).join(' | ')}`);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: dim }}>
      <defs>
        <clipPath id={`plot${uid}`}>
          <rect x={left} y={top - 10} width={right - left} height={bottom - top + 10} />
        </clipPath>
        {spotlight && (
          <radialGradient id={`spot${uid}`} gradientUnits="userSpaceOnUse" cx={x(spotlight.index)} cy={y(spotlight.value)} r={spotlight.radius}>
            <stop offset="0" stopColor="var(--color-bg)" stopOpacity={0} />
            <stop offset="0.55" stopColor="var(--color-bg)" stopOpacity={0} />
            <stop offset="1" stopColor="var(--color-bg)" stopOpacity={0.78 * spotlight.strength} />
          </radialGradient>
        )}
        <filter id={`glow${uid}`} x="-20%" y="-20%" width="140%" height="140%">
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

      <g clipPath={`url(#plot${uid})`}>
        {regions.map((r, k) => (
          <g key={k} opacity={r.opacity}>
            <rect x={x(r.from)} y={top} width={Math.max(0, x(r.to) - x(r.from))} height={bottom - top} fill={r.color} opacity={0.12} />
            <line x1={x(r.from)} x2={x(r.from)} y1={top} y2={bottom} stroke={r.color} strokeWidth={2} strokeDasharray="8 8" />
            <line x1={x(r.to)} x2={x(r.to)} y1={top} y2={bottom} stroke={r.color} strokeWidth={2} strokeDasharray="8 8" />
          </g>
        ))}
        {candles}
        {outlines.map((o, k) => {
          let hi = -Infinity;
          let lo = Infinity;
          for (let i = Math.max(0, o.from); i <= Math.min(N - 1, o.to); i++) {
            hi = Math.max(hi, bars[i].h);
            lo = Math.min(lo, bars[i].l);
          }
          const x0 = x(o.from) - body / 2 - 12;
          const x1 = x(o.to) + body / 2 + 12;
          return <rect key={k} x={x0} y={y(hi) - 14} width={x1 - x0} height={y(lo) - y(hi) + 28} rx={12} fill="none" stroke={o.color} strokeWidth={4} opacity={o.opacity} />;
        })}
        {levels.map((lv, k) => (
          <line key={k} x1={left} x2={right} y1={y(lv.price)} y2={y(lv.price)} stroke={lv.color} strokeWidth={3} strokeDasharray="14 10" opacity={lv.opacity} />
        ))}
        <g opacity={smaOpacity} filter={`url(#glow${uid})`}>
          {drawn.map((l, k) => (
            <path key={k} d={line(l.values)} fill="none" stroke={l.color} strokeWidth={l.width ?? 6} strokeLinejoin="round" strokeLinecap="round" />
          ))}
        </g>

        {spotlight && spotlight.strength > 0 && <rect x={left} y={top - 10} width={right - left} height={bottom - top + 10} fill={`url(#spot${uid})`} />}
        {crossTicks.map((tk, k) => (
          <polygon key={k} points={arrow(x(tk.index), tk.up ? y(tk.value) + 34 : y(tk.value) - 34, tk.up)} fill={tk.up ? 'var(--color-up)' : 'var(--color-down)'} opacity={tk.opacity ?? 1} />
        ))}
        {/* Arrows stand half a bar to the right of their candle, so they never cover it. */}
        {brackets.map((b, k) => {
          const bx = x(b.index + 0.5);
          return (
            <g key={k} opacity={b.opacity}>
              <line x1={bx} x2={bx} y1={y(b.from)} y2={y(b.to)} stroke={b.color} strokeWidth={5} />
              <line x1={bx - 16} x2={bx + 16} y1={y(b.from)} y2={y(b.from)} stroke={b.color} strokeWidth={5} />
              <polygon points={arrow(bx, y(b.to), b.to > b.from)} fill={b.color} />
            </g>
          );
        })}
        {markers.map((m, k) => (
          <g key={k} opacity={m.opacity}>
            <circle cx={x(m.index)} cy={y(markerY(m))} r={18 + 30 * m.pulse} fill="none" stroke={m.color} strokeWidth={4} opacity={1 - m.pulse} />
            <circle cx={x(m.index)} cy={y(markerY(m))} r={15} fill="none" stroke={m.color} strokeWidth={6} />
          </g>
        ))}
      </g>

      {/* Marker pills: above the local candle highs, joined to the marker by a leader line. */}
      {markers.map((m, k) => {
        const mx = x(m.index);
        if (mx < left - 40 || mx > right + 40 || m.opacity < 0.01) return null;
        let hi = -Infinity;
        for (let i = Math.max(0, m.index - 8); i <= Math.min(N - 1, m.index + 8); i++) hi = Math.max(hi, bars[i].h, ...drawn.map((l) => (Number.isFinite(l.values[i]) ? l.values[i] : -Infinity)));
        const w = textWidth(m.label, 32);
        const py = Math.max(top + 34, y(hi) - 56);
        const px = Math.min(Math.max(mx, left + w / 2), right - w / 2);
        return (
          <g key={k} opacity={m.opacity}>
            <line x1={mx} x2={mx} y1={py + 30} y2={y(markerY(m)) - 18} stroke={m.color} strokeWidth={2.5} strokeDasharray="6 6" />
            <rect x={px - w / 2} y={py - 30} width={w} height={60} rx={30} fill="var(--color-bg)" stroke={m.color} strokeWidth={3} />
            <text x={px} y={py + 11} textAnchor="middle" fontSize={32} fontWeight={700} fill={m.color} fontFamily="var(--font-sans)">
              {m.label}
            </text>
          </g>
        );
      })}

      {/* Labels on what they name (see the layout above). */}
      {pills.map((pl, k) => {
        const cx = (pl.box.x0 + pl.box.x1) / 2;
        const cy = (pl.box.y0 + pl.box.y1) / 2;
        const pop = 0.88 + 0.12 * pl.opacity;
        return (
          <g key={`pill${k}`} opacity={pl.opacity} transform={`translate(${cx} ${cy}) scale(${pop}) translate(${-cx} ${-cy})`}>
            <rect x={pl.box.x0} y={pl.box.y0} width={pl.box.x1 - pl.box.x0} height={PILL_H} rx={14} fill="var(--color-bg)" stroke={pl.color} strokeWidth={3} />
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize={30} fontWeight={700} fill={pl.color} fontFamily={pl.mono ? 'var(--font-mono)' : 'var(--font-sans)'}>
              {pl.text}
            </text>
          </g>
        );
      })}

      {/* The label band. */}
      {bandItems.map((it, k) => {
        const s = slots[k];
        if (!s) return null;
        const cx = (s.x0 + s.x1) / 2;
        const ry = bandY + s.row * BAND_H;
        // Labels arrive with a small pop, so the eye goes to the new number.
        const pop = 0.88 + 0.12 * it.opacity;
        return (
          <g key={k} opacity={it.opacity} transform={`translate(${cx} ${ry + 27}) scale(${pop}) translate(${-cx} ${-(ry + 27)})`}>
            <rect x={s.x0} y={ry} width={s.x1 - s.x0} height={BAND_H - 10} rx={14} fill="var(--color-bg)" stroke={it.color} strokeWidth={3} />
            <text x={cx} y={ry + 37} textAnchor="middle" fontSize={30} fontWeight={700} fill={it.color} fontFamily={it.kind === 'bracket' ? 'var(--font-mono)' : 'var(--font-sans)'}>
              {it.text}
            </text>
          </g>
        );
      })}

      {head && draw < 1 && (
        <g>
          <rect x={Math.min(x(last) + 18, right - 150)} y={y(bars[last].c) - 26} width={140} height={50} rx={10} fill="var(--color-surface-1)" stroke="var(--color-line)" strokeWidth={2} />
          <text x={Math.min(x(last) + 88, right - 80)} y={y(bars[last].c) + 10} textAnchor="middle" fontSize={30} fill="var(--color-ink)" fontFamily="var(--font-mono)">
            {bars[last].c.toFixed(2)}
          </text>
        </g>
      )}
      {legendItems && (
        <g fontFamily="var(--font-sans)" fontSize={32} fontWeight={600}>
          {legendItems.map(({ label, color, kind }, k) => (
            <g key={k} transform={`translate(${right - legendItems.length * 260 + k * 260}, ${top - 40})`}>
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
