/**
 * Pieces every candlestick lesson video shares (first written for the engulfing lesson): colours,
 * camera helpers, a candle that grows through its session, panels, volume bars, and the opening,
 * recap and closing scenes. Each lesson passes its own words and data.
 */
import { useGsapTimeline } from '@remotion/gsap';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { OHLC } from '@/engine/market/types';
import { Brand, body, kicker, s, useSpeechAt } from '../kit';
import { CinematicChart, frameOf, type Camera, type LegendItem } from './CinematicChart';
import { clamp, fade } from './scenes';

export const UP = 'var(--color-up)';
export const DOWN = 'var(--color-down)';
export const ACCENT = 'var(--color-accent)';
export const SOFT = 'var(--color-ink-soft)';
export const PRICE: LegendItem[] = [{ label: 'price', color: SOFT, kind: 'candle' }];
export const fmt = (v: number) => v.toFixed(2);
export const view = (bars: OHLC[], x0: number, x1: number, pad = 0.14) => frameOf(bars, [], x0, x1, pad);
/** `draw` that shows bars 0..index of a series of n bars. */
export const upto = (index: number, n: number) => (index + 0.001) / (n - 1);
export const bodyOf = (b: OHLC) => Math.abs(b.c - b.o);

/**
 * The series with one candle drawn part-way through its session (t from 0 to 1): price leaves the
 * open, goes to the far extreme first, then the near one, and settles at the close, so the candle
 * grows the way the narration tells it (a bullish engulfing opens lower, dips, then rallies).
 */
export function grow(bars: OHLC[], index: number, t: number): OHLC[] {
  const b = bars[index];
  const path = b.c >= b.o ? [b.o, b.l, b.h, b.c] : [b.o, b.h, b.l, b.c];
  const knots = [0, 0.2, 0.8, 1];
  const tt = Math.max(0, Math.min(1, t));
  let price = b.o;
  let hi = b.o;
  let lo = b.o;
  for (let k = 1; k < path.length; k++) {
    if (tt < knots[k - 1]) break;
    const seg = Math.min(1, (tt - knots[k - 1]) / (knots[k] - knots[k - 1]));
    price = path[k - 1] + (path[k] - path[k - 1]) * seg;
    hi = Math.max(hi, price);
    lo = Math.min(lo, price);
  }
  return bars.map((x, i) => (i === index ? { ...b, h: hi, l: lo, c: price } : x));
}

/** A panel's frame and caption, lit while it is the one being talked about. */
export function Panel({ x0, x1, y0, y1, title, state }: { x0: number; x1: number; y0: number; y1: number; title: string; state: number }) {
  // state: 0 hidden, 1 current, 2 done (kept, dimmed).
  return (
    <div style={{ position: 'absolute', left: x0, top: y0, width: x1 - x0, height: y1 - y0, borderRadius: 26, border: `3px solid ${state === 1 ? ACCENT : 'var(--color-line)'}`, background: 'var(--color-surface-1)', opacity: state === 0 ? 0 : 1 }}>
      <div style={{ padding: '14px 28px', fontSize: 30, fontWeight: 700, color: state === 1 ? 'var(--color-ink)' : SOFT, whiteSpace: 'nowrap' }}>{title}</div>
    </div>
  );
}

/** Volume bars under a chart, on the chart's own x scale (CinematicChart draws no volume). */
export function Volume({ bars, cam, left, right, top, bottom, highlight, opacity = 1 }: { bars: OHLC[]; cam: Camera; left: number; right: number; top: number; bottom: number; highlight: number; opacity?: number }) {
  const x = (i: number) => left + ((i - cam.x0) / (cam.x1 - cam.x0)) * (right - left);
  const max = Math.max(...bars.map((b) => b.v ?? 0));
  const w = Math.min(40, ((right - left) / (cam.x1 - cam.x0)) * 0.62);
  return (
    <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity }}>
      <line x1={left} x2={right} y1={bottom} y2={bottom} stroke="var(--color-line)" strokeWidth={2} />
      {bars.map((b, i) => {
        const h = ((b.v ?? 0) / max) * (bottom - top);
        return <rect key={i} x={x(i) - w / 2} y={bottom - h} width={w} height={h} rx={3} fill={i === highlight ? (b.c >= b.o ? UP : DOWN) : SOFT} opacity={i === highlight ? 1 : 0.45} />;
      })}
      <text x={right + 14} y={bottom - 8} fontSize={22} fill={SOFT} fontFamily="var(--font-mono)">
        volume
      </text>
    </svg>
  );
}

/**
 * The opening: the lesson's figure, its key candle growing, out of focus, behind kinetic type
 * (GSAP; words split by hand so Telugu and Devanagari clusters stay whole). The last title word
 * is the accent.
 */
export function PatternIntro({ kicker: kick, words, sub, bars, growIndex, rule = `linear-gradient(90deg, ${DOWN}, ${UP})` }: { kicker: string; words: string[]; sub: string; bars: OHLC[]; growIndex: number; rule?: string }) {
  const f = useCurrentFrame();
  const scope = useGsapTimeline<HTMLDivElement>(({ timeline, selector }) => {
    timeline
      .from(selector('[data-kicker]'), { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out' }, 0.3)
      .from(selector('[data-word]'), { y: 90, opacity: 0, filter: 'blur(14px)', duration: 1.1, ease: 'expo.out', stagger: 0.12 }, 0.6)
      .from(selector('[data-rule]'), { scaleX: 0, duration: 1.0, ease: 'expo.inOut' }, 1.4)
      .from(selector('[data-sub]'), { y: 24, opacity: 0, duration: 0.8, ease: 'power2.out' }, 2.0);
  });
  const push = interpolate(f, [0, s(6)], [0, 1], clamp);
  const grown = grow(bars, growIndex, interpolate(f, [s(0.8), s(3.4)], [0, 1], clamp));
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0, filter: 'blur(3px)', transform: `scale(${1.04 + 0.03 * push})` }}>
        <CinematicChart cam={view(bars, -0.8 + 1.6 * push, bars.length + 0.2 - 0.4 * push, 0.2)} bars={grown} lines={[]} draw={upto(growIndex, bars.length)} head={false} dim={0.32} maxBody={90} />
      </div>
      <AbsoluteFill style={{ background: 'radial-gradient(70% 70% at 30% 55%, transparent 0%, var(--color-bg) 92%)' }} />
      <div ref={scope} style={{ position: 'absolute', left: 140, right: 140, top: 330 }}>
        <div data-kicker style={{ fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT }}>
          {kick}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 132, fontWeight: 750, lineHeight: 1.05, letterSpacing: '-0.025em', margin: '26px 0 0' }}>
          {words.map((word, i) => (
            <span key={i} data-word style={{ display: 'inline-block', marginRight: '0.28em', color: i === words.length - 1 ? ACCENT : 'var(--color-ink)' }}>
              {word}
            </span>
          ))}
        </h1>
        <div data-rule style={{ height: 8, width: 360, borderRadius: 4, marginTop: 34, transformOrigin: 'left center', background: rule }} />
        <div data-sub style={{ fontSize: 46, color: SOFT, marginTop: 34 }}>
          {sub}
        </div>
      </div>
    </AbsoluteFill>
  );
}

/** The recap: each point lights as it is said (at its share of the narration); earlier ones stay, dimmed. */
export function Recap({ items, starts }: { items: [string, string][]; starts: number[] }) {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const frames = starts.map(at);
  const current = frames.filter((st) => f >= st).length - 1;
  return (
    <AbsoluteFill style={{ padding: '80px 140px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 30 }}>
      <div style={kicker}>Key takeaways</div>
      {items.map(([text, color], i) => {
        const o = fade(f, frames[i], s(0.5));
        const isNow = i === current;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 34, opacity: o * (isNow ? 1 : 0.55), transform: `translateX(${(1 - o) * -30}px)` }}>
            <span style={{ flexShrink: 0, width: 76, height: 76, borderRadius: 38, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 34, fontWeight: 700, color: isNow ? 'var(--color-bg)' : color, background: isNow ? color : 'transparent', border: `3px solid ${color}` }}>
              {i + 1}
            </span>
            <span style={{ ...body, fontSize: isNow ? 50 : 44, color: 'var(--color-ink)', fontWeight: isNow ? 650 : 400 }}>{text}</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

/** The close: the Nitora icon and name, the call to practise, the checks, the link and the disclaimer, over the figure out of focus. */
export function PractiseEnd({ bars, action, checks, link }: { bars: OHLC[]; action: string; checks: string[]; link: string }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = (delay: number) => spring({ frame: f - delay, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0, filter: 'blur(3px)' }}>
        <CinematicChart cam={view(bars, -0.8, bars.length + 0.2, 0.2)} bars={bars} lines={[]} head={false} dim={0.25} maxBody={90} />
      </div>
      <AbsoluteFill style={{ background: 'radial-gradient(60% 60% at 50% 50%, color-mix(in oklch, var(--color-bg) 70%, transparent) 0%, var(--color-bg) 85%)' }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', gap: 34, textAlign: 'center' }}>
        <div style={{ opacity: rise(0) }}>
          <Brand />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 72, fontWeight: 700, opacity: rise(6) }}>{action}</div>
        <div style={{ display: 'flex', gap: 50, fontSize: 40, opacity: rise(18) }}>
          {checks.map((c) => (
            <span key={c}>
              <span style={{ color: UP, fontWeight: 700 }}>✓</span> {c}
            </span>
          ))}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 46, color: ACCENT, opacity: rise(26) }}>{link}</div>
        <div style={{ fontSize: 32, color: SOFT, opacity: rise(36) }}>An educational tool. Charts use synthetic data. Nothing here is financial advice.</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/** A checklist that lights each item as it is said (the current one bright, earlier ones dimmed). */
export function Checklist({ items, left = 1120, top = 320 }: { items: { title: string; detail: string; from: number; mono?: boolean }[]; left?: number; top?: number }) {
  const f = useCurrentFrame();
  const current = items.filter((it) => f >= it.from).length - 1;
  return (
    <div style={{ position: 'absolute', left, right: 120, top, display: 'flex', flexDirection: 'column', gap: 30 }}>
      {items.map((it, i) => {
        const o = fade(f, it.from);
        const now = i === current;
        return (
          <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'center', opacity: o * (now ? 1 : 0.55) }}>
            <span style={{ flexShrink: 0, width: 64, height: 64, borderRadius: 32, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 700, color: now ? 'var(--color-bg)' : ACCENT, background: now ? ACCENT : 'transparent', border: `3px solid ${ACCENT}` }}>
              {i + 1}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: now ? 36 : 33, fontWeight: now ? 700 : 500, color: 'var(--color-ink)' }}>{it.title}</div>
              <div style={{ fontSize: 28, fontFamily: it.mono ? 'var(--font-mono)' : 'var(--font-sans)', color: SOFT }}>{it.detail}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
