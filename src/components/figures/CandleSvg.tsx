/**
 * A small, dependency-free SVG candlestick renderer used by every teaching figure.
 * It draws OHLC bars plus optional annotations (labels, horizontal levels, zones,
 * straight lines, indicator overlays, sub-panels) and stays crisp at any width.
 */
import type { OHLC } from '@/engine/market/types';

export type Annotation =
  | { type: 'label'; index: number; text: string; position?: 'above' | 'below'; color?: string }
  | { type: 'hline'; price: number; text?: string; color?: string; dashed?: boolean; from?: number; to?: number }
  | { type: 'zone'; from: number; to: number; priceFrom: number; priceTo: number; text?: string; color?: string }
  | { type: 'line'; from: [number, number]; to: [number, number]; text?: string; color?: string; dashed?: boolean; extend?: boolean }
  | { type: 'bracket'; from: number; to: number; text: string; color?: string; position?: 'above' | 'below' }
  | { type: 'highlight'; from: number; to: number; color?: string }
  | { type: 'arrow'; index: number; direction: 'up' | 'down'; color?: string; text?: string };

export interface Overlay {
  values: number[];
  color: string;
  name?: string;
  dashed?: boolean;
  width?: number;
}

export interface SubPanel {
  name: string;
  series: { values: number[]; color: string; kind?: 'line' | 'histogram' }[];
  levels?: { value: number; color?: string; dashed?: boolean }[];
  range?: [number, number];
}

export interface CandleSvgProps {
  bars: OHLC[];
  annotations?: Annotation[];
  overlays?: Overlay[];
  panels?: SubPanel[];
  showVolume?: boolean;
  height?: number;
  width?: number;
  /** show the axis on the right */
  axis?: boolean;
  /** draw candles with hollow bodies for up-candles, like old-school charts */
  hollow?: boolean;
  /** render as a line chart of closes instead of candles */
  mode?: 'candles' | 'line' | 'bars';
  fadeBefore?: number;
  className?: string;
}

const UP = 'var(--color-up)';
const DOWN = 'var(--color-down)';
const INK = 'var(--color-ink-soft)';

export function CandleSvg({
  bars,
  annotations = [],
  overlays = [],
  panels = [],
  showVolume = false,
  height = 260,
  width = 640,
  axis = true,
  hollow = false,
  mode = 'candles',
  fadeBefore,
  className,
}: CandleSvgProps) {
  const padL = 12;
  const padR = axis ? 54 : 12;
  const padT = 18;
  // A bracket drawn under the candles puts its label below the plot; leave room for it, or the
  // label falls outside the drawing and is cut off.
  const belowBracket = annotations.some((a) => a.type === 'bracket' && (a.position ?? 'below') === 'below');
  const padB = belowBracket ? 30 : 14;
  const volH = showVolume ? 44 : 0;
  const panelH = panels.length ? 70 : 0;
  const totalH = height + volH + panels.length * (panelH + 6);
  const chartH = height - padT - padB;
  const plotW = width - padL - padR;
  const n = Math.max(bars.length, 1);
  const slot = plotW / n;
  const bodyW = Math.max(2, Math.min(slot * 0.62, 18));

  let min = Infinity;
  let max = -Infinity;
  for (const b of bars) {
    min = Math.min(min, b.l);
    max = Math.max(max, b.h);
  }
  for (const o of overlays)
    for (const v of o.values)
      if (Number.isFinite(v)) {
        min = Math.min(min, v);
        max = Math.max(max, v);
      }
  for (const a of annotations) {
    if (a.type === 'hline') {
      min = Math.min(min, a.price);
      max = Math.max(max, a.price);
    }
    if (a.type === 'zone') {
      min = Math.min(min, a.priceFrom, a.priceTo);
      max = Math.max(max, a.priceFrom, a.priceTo);
    }
    if (a.type === 'line') {
      min = Math.min(min, a.from[1], a.to[1]);
      max = Math.max(max, a.from[1], a.to[1]);
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    min = 0;
    max = 1;
  }
  const span = max - min || 1;
  min -= span * 0.06;
  max += span * 0.06;
  const y = (p: number) => padT + ((max - p) / (max - min)) * chartH;
  const x = (i: number) => padL + slot * i + slot / 2;

  const maxVol = showVolume ? Math.max(...bars.map((b) => b.v ?? 0), 1) : 1;
  const volTop = height;

  const ticks = niceTicks(min, max, 5);

  const linePath = bars.map((b, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(b.c).toFixed(1)}`).join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${totalH}`}
      className={className ?? 'w-full h-auto'}
      role="img"
      style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
    >
      {/* grid + axis */}
      {axis &&
        ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={width - padR} y1={y(t)} y2={y(t)} stroke="var(--color-grid)" strokeWidth={1} />
            <text x={width - padR + 6} y={y(t) + 4} fill={INK} fontSize={10}>
              {fmt(t)}
            </text>
          </g>
        ))}

      {/* zones + highlights first so they sit behind */}
      {annotations.map((a, i) => {
        if (a.type === 'zone') {
          const x1 = x(a.from) - slot / 2;
          const x2 = x(a.to) + slot / 2;
          const y1 = y(Math.max(a.priceFrom, a.priceTo));
          const y2 = y(Math.min(a.priceFrom, a.priceTo));
          const c = a.color ?? 'var(--color-accent)';
          return (
            <g key={i}>
              <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill={c} opacity={0.14} />
              <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="none" stroke={c} strokeDasharray="4 3" opacity={0.7} />
              {a.text && (
                <text x={x1 + 4} y={y1 - 4} fill={c} fontSize={11} fontWeight={600}>
                  {a.text}
                </text>
              )}
            </g>
          );
        }
        if (a.type === 'highlight') {
          const x1 = x(a.from) - slot / 2;
          const x2 = x(a.to) + slot / 2;
          return <rect key={i} x={x1} y={padT - 6} width={x2 - x1} height={chartH + 12} fill={a.color ?? 'var(--color-accent)'} opacity={0.1} rx={4} />;
        }
        return null;
      })}

      {/* candles */}
      {mode === 'line' ? (
        <path d={linePath} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinejoin="round" />
      ) : (
        bars.map((b, i) => {
          const up = b.c >= b.o;
          const color = up ? UP : DOWN;
          const cx = x(i);
          const top = y(Math.max(b.o, b.c));
          const bot = y(Math.min(b.o, b.c));
          const faded = fadeBefore !== undefined && i < fadeBefore;
          const opacity = faded ? 0.35 : 1;
          if (mode === 'bars') {
            return (
              <g key={i} opacity={opacity}>
                <line x1={cx} x2={cx} y1={y(b.h)} y2={y(b.l)} stroke={color} strokeWidth={1.6} />
                <line x1={cx - bodyW / 2} x2={cx} y1={y(b.o)} y2={y(b.o)} stroke={color} strokeWidth={1.6} />
                <line x1={cx} x2={cx + bodyW / 2} y1={y(b.c)} y2={y(b.c)} stroke={color} strokeWidth={1.6} />
              </g>
            );
          }
          return (
            <g key={i} opacity={opacity}>
              <line x1={cx} x2={cx} y1={y(b.h)} y2={y(b.l)} stroke={color} strokeWidth={1.4} />
              <rect
                x={cx - bodyW / 2}
                y={top}
                width={bodyW}
                height={Math.max(1.2, bot - top)}
                fill={hollow && up ? 'var(--color-surface)' : color}
                stroke={color}
                strokeWidth={1.2}
                rx={1}
              />
            </g>
          );
        })
      )}

      {/* overlays */}
      {overlays.map((o, k) => (
        <path
          key={k}
          d={pathOf(o.values, x, y)}
          fill="none"
          stroke={o.color}
          strokeWidth={o.width ?? 1.8}
          strokeDasharray={o.dashed ? '5 4' : undefined}
          strokeLinejoin="round"
        />
      ))}
      {overlays.length > 0 && (
        <g>
          {overlays.map((o, k) => (
            <g key={k} transform={`translate(${padL + 4 + k * 92}, ${padT - 6})`}>
              <line x1={0} x2={14} y1={0} y2={0} stroke={o.color} strokeWidth={2} strokeDasharray={o.dashed ? '4 3' : undefined} />
              <text x={18} y={4} fill={INK} fontSize={10}>
                {o.name}
              </text>
            </g>
          ))}
        </g>
      )}

      {/* annotations on top */}
      {annotations.map((a, i) => {
        if (a.type === 'hline') {
          const c = a.color ?? 'var(--color-accent)';
          const x1 = a.from !== undefined ? x(a.from) - slot / 2 : padL;
          const x2 = a.to !== undefined ? x(a.to) + slot / 2 : width - padR;
          return (
            <g key={i}>
              <line x1={x1} x2={x2} y1={y(a.price)} y2={y(a.price)} stroke={c} strokeWidth={1.5} strokeDasharray={a.dashed === false ? undefined : '6 4'} />
              {a.text && (
                <text x={x1 + 4} y={y(a.price) - 5} fill={c} fontSize={11} fontWeight={600}>
                  {a.text}
                </text>
              )}
            </g>
          );
        }
        if (a.type === 'line') {
          const c = a.color ?? 'var(--color-accent)';
          let [i1, p1] = a.from;
          let [i2, p2] = a.to;
          if (a.extend && i2 !== i1) {
            const slope = (p2 - p1) / (i2 - i1);
            const iEnd = bars.length - 1;
            p2 = p1 + slope * (iEnd - i1);
            i2 = iEnd;
          }
          return (
            <g key={i}>
              <line x1={x(i1)} y1={y(p1)} x2={x(i2)} y2={y(p2)} stroke={c} strokeWidth={1.8} strokeDasharray={a.dashed ? '6 4' : undefined} />
              {a.text && (
                <text x={x(i2) + 4} y={y(p2) + 4} fill={c} fontSize={11} fontWeight={600}>
                  {a.text}
                </text>
              )}
            </g>
          );
        }
        if (a.type === 'label') {
          const b = bars[a.index];
          if (!b) return null;
          const above = (a.position ?? 'above') === 'above';
          const yy = above ? y(b.h) - 8 : y(b.l) + 14;
          return (
            <text key={i} x={x(a.index)} y={yy} textAnchor="middle" fill={a.color ?? 'var(--color-ink)'} fontSize={11} fontWeight={600}>
              {a.text}
            </text>
          );
        }
        if (a.type === 'arrow') {
          const b = bars[a.index];
          if (!b) return null;
          const c = a.color ?? (a.direction === 'up' ? UP : DOWN);
          const cx = x(a.index);
          const base = a.direction === 'up' ? y(b.l) + 10 : y(b.h) - 10;
          const tip = a.direction === 'up' ? base - 12 : base + 12;
          const pts = a.direction === 'up' ? `${cx},${tip} ${cx - 5},${base} ${cx + 5},${base}` : `${cx},${tip} ${cx - 5},${base} ${cx + 5},${base}`;
          return (
            <g key={i}>
              <polygon points={pts} fill={c} />
              {a.text && (
                <text x={cx} y={a.direction === 'up' ? base + 14 : tip - 6 - 2} textAnchor="middle" fill={c} fontSize={11} fontWeight={600}>
                  {a.text}
                </text>
              )}
            </g>
          );
        }
        if (a.type === 'bracket') {
          const c = a.color ?? 'var(--color-ink-soft)';
          const x1 = x(a.from) - slot / 2 + 2;
          const x2 = x(a.to) + slot / 2 - 2;
          const above = (a.position ?? 'below') === 'above';
          const yy = above ? padT - 2 : height - padB + 6;
          return (
            <g key={i}>
              <line x1={x1} x2={x2} y1={yy} y2={yy} stroke={c} strokeWidth={1.2} />
              <line x1={x1} x2={x1} y1={yy - 4} y2={yy + 4} stroke={c} strokeWidth={1.2} />
              <line x1={x2} x2={x2} y1={yy - 4} y2={yy + 4} stroke={c} strokeWidth={1.2} />
              <text x={(x1 + x2) / 2} y={above ? yy - 6 : yy + 12} textAnchor="middle" fill={c} fontSize={10.5}>
                {a.text}
              </text>
            </g>
          );
        }
        return null;
      })}

      {/* volume */}
      {showVolume &&
        bars.map((b, i) => {
          const h = ((b.v ?? 0) / maxVol) * (volH - 6);
          return <rect key={i} x={x(i) - bodyW / 2} y={volTop + volH - h} width={bodyW} height={h} fill={b.c >= b.o ? UP : DOWN} opacity={0.55} />;
        })}

      {/* sub panels */}
      {panels.map((p, k) => {
        const top = height + volH + k * (panelH + 6) + 6;
        const all = p.series.flatMap((s) => s.values.filter(Number.isFinite));
        let lo = p.range ? p.range[0] : Math.min(...all);
        let hi = p.range ? p.range[1] : Math.max(...all);
        if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
          lo = 0;
          hi = 1;
        }
        if (hi === lo) hi = lo + 1;
        const py = (v: number) => top + 8 + ((hi - v) / (hi - lo)) * (panelH - 16);
        return (
          <g key={k}>
            <rect x={padL} y={top} width={plotW} height={panelH} fill="var(--color-panel)" rx={4} />
            <text x={padL + 6} y={top + 12} fill={INK} fontSize={10} fontWeight={600}>
              {p.name}
            </text>
            {p.levels?.map((lv, j) => (
              <g key={j}>
                <line x1={padL} x2={padL + plotW} y1={py(lv.value)} y2={py(lv.value)} stroke={lv.color ?? 'var(--color-grid)'} strokeDasharray={lv.dashed === false ? undefined : '4 3'} />
                <text x={width - padR + 6} y={py(lv.value) + 4} fill={INK} fontSize={10}>
                  {fmt(lv.value)}
                </text>
              </g>
            ))}
            {p.series.map((s, j) =>
              s.kind === 'histogram' ? (
                <g key={j}>
                  {s.values.map((v, i) =>
                    Number.isFinite(v) ? (
                      <rect
                        key={i}
                        x={x(i) - bodyW / 2}
                        y={Math.min(py(v), py(0))}
                        width={bodyW}
                        height={Math.abs(py(v) - py(0))}
                        fill={v >= 0 ? UP : DOWN}
                        opacity={0.7}
                      />
                    ) : null,
                  )}
                </g>
              ) : (
                <path key={j} d={pathOf(s.values, x, py)} fill="none" stroke={s.color} strokeWidth={1.6} strokeLinejoin="round" />
              ),
            )}
          </g>
        );
      })}
    </svg>
  );
}

function pathOf(values: number[], x: (i: number) => number, y: (p: number) => number) {
  let d = '';
  let pen = false;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v)) {
      pen = false;
      continue;
    }
    d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)} `;
    pen = true;
  }
  return d;
}

function niceTicks(min: number, max: number, count: number) {
  const span = max - min;
  const rough = span / count;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const norm = rough / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out: number[] = [];
  for (let t = Math.ceil(min / step) * step; t <= max; t += step) out.push(+t.toFixed(6));
  return out;
}

export function fmt(v: number) {
  const a = Math.abs(v);
  if (a >= 10000) return v.toFixed(0);
  if (a >= 100) return v.toFixed(1);
  if (a >= 1) return v.toFixed(2);
  return v.toFixed(4);
}
