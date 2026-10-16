/**
 * "Bullish and Bearish Engulfing", cinematic (directive V3), on the same CinematicChart as the
 * crossover lesson: every chart is candles, every number on screen comes from ./data.ts, labels
 * live in the band under each plot so nothing covers a candle, and a spotlight or an outline picks
 * out whatever the narration is talking about. On-screen text is English in every language;
 * timing follows each language's marks (useMark) or its share of the narration (useSpeechAt).
 */
import { useGsapTimeline } from '@remotion/gsap';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { OHLC } from '@/engine/market/types';
import { Brand, CornerTag, ILLUSTRATION, SYNTHETIC, body, kicker, s, useMark, useSpeechAt } from '../kit';
import { CinematicChart, cameraAt, frameOf, type Camera, type LegendItem } from '../cinematic/CinematicChart';
import { Headline, clamp, fade } from '../cinematic/scenes';
import * as d from './data';

const UP = 'var(--color-up)';
const DOWN = 'var(--color-down)';
const ACCENT = 'var(--color-accent)';
const SOFT = 'var(--color-ink-soft)';
const PRICE: LegendItem[] = [{ label: 'price', color: SOFT, kind: 'candle' }];
const fmt = (v: number) => v.toFixed(2);
const view = (bars: OHLC[], x0: number, x1: number, pad = 0.14) => frameOf(bars, [], x0, x1, pad);
/** `draw` that shows bars 0..index of a series of n bars. */
const upto = (index: number, n: number) => (index + 0.001) / (n - 1);
const bodyOf = (b: OHLC) => Math.abs(b.c - b.o);

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
function Panel({ x0, x1, y0, y1, title, state }: { x0: number; x1: number; y0: number; y1: number; title: string; state: number }) {
  // state: 0 hidden, 1 current, 2 done (kept, dimmed).
  return (
    <div style={{ position: 'absolute', left: x0, top: y0, width: x1 - x0, height: y1 - y0, borderRadius: 26, border: `3px solid ${state === 1 ? ACCENT : 'var(--color-line)'}`, background: 'var(--color-surface-1)', opacity: state === 0 ? 0 : 1 }}>
      <div style={{ padding: '14px 28px', fontSize: 30, fontWeight: 700, color: state === 1 ? 'var(--color-ink)' : SOFT, whiteSpace: 'nowrap' }}>{title}</div>
    </div>
  );
}

/** Volume bars under a chart, on the chart's own x scale (CinematicChart draws no volume). */
function Volume({ bars, cam, left, right, top, bottom, highlight, opacity = 1 }: { bars: OHLC[]; cam: Camera; left: number; right: number; top: number; bottom: number; highlight: number; opacity?: number }) {
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

// ---------------------------------------------------------------- title

/** The opening: the bullish figure's engulfing candle growing, out of focus, behind kinetic type (GSAP). */
export function EngulfingIntro() {
  const f = useCurrentFrame();
  const scope = useGsapTimeline<HTMLDivElement>(({ timeline, selector }) => {
    timeline
      .from(selector('[data-kicker]'), { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out' }, 0.3)
      .from(selector('[data-word]'), { y: 90, opacity: 0, filter: 'blur(14px)', duration: 1.1, ease: 'expo.out', stagger: 0.12 }, 0.6)
      .from(selector('[data-rule]'), { scaleX: 0, duration: 1.0, ease: 'expo.inOut' }, 1.4)
      .from(selector('[data-sub]'), { y: 24, opacity: 0, duration: 0.8, ease: 'power2.out' }, 2.0);
  });
  const push = interpolate(f, [0, s(6)], [0, 1], clamp);
  const bars = grow(d.BULL, 7, interpolate(f, [s(0.8), s(3.4)], [0, 1], clamp));
  const words = ['Bullish', '&', 'bearish', 'engulfing'];
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0, filter: 'blur(3px)', transform: `scale(${1.04 + 0.03 * push})` }}>
        <CinematicChart cam={view(d.BULL, -0.8 + 1.6 * push, 9.2 - 0.4 * push, 0.2)} bars={bars} lines={[]} draw={upto(7, d.BULL.length)} head={false} dim={0.32} maxBody={90} />
      </div>
      <AbsoluteFill style={{ background: 'radial-gradient(70% 70% at 30% 55%, transparent 0%, var(--color-bg) 92%)' }} />
      <div ref={scope} style={{ position: 'absolute', left: 140, right: 140, top: 330 }}>
        <div data-kicker style={{ fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT }}>
          Module 2 · Candlestick patterns · Lesson 6
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 132, fontWeight: 750, lineHeight: 1.05, letterSpacing: '-0.025em', margin: '26px 0 0' }}>
          {words.map((word, i) => (
            <span key={i} data-word style={{ display: 'inline-block', marginRight: '0.28em', color: i === words.length - 1 ? ACCENT : 'var(--color-ink)' }}>
              {word}
            </span>
          ))}
        </h1>
        <div data-rule style={{ height: 8, width: 360, borderRadius: 4, marginTop: 34, transformOrigin: 'left center', background: `linear-gradient(90deg, ${DOWN}, ${UP})` }} />
        <div data-sub style={{ fontSize: 46, color: SOFT, marginTop: 34 }}>
          Two candles. The second body swallows the first.
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- intro

/** The playground argument, then the definition: both versions side by side, each second body growing over the first. */
export function IntroCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const define = useMark('define', 12);
  const yesterday = at(0.06);
  const today = at(0.2);
  const big = interpolate(f, [today, Math.max(today + s(1), define - s(1))], [0.25, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const out = fade(f, define, s(0.6));
  const bullAt = at(0.66);
  const bearAt = at(0.85);
  const pair = (bars: OHLC[], start: number, plot: { left: number; right: number }, color: string, note: string) => {
    const t = interpolate(f, [start, start + s(2.2)], [0, 1], clamp);
    const shown = f >= start;
    return (
      <CinematicChart
        cam={view(bars, 2.4, 7.7, 0.18)}
        bars={grow(bars, 7, t)}
        lines={[]}
        draw={upto(shown ? 7 : 6, bars.length)}
        head={false}
        maxBody={70}
        plot={{ ...plot, top: 330, bottom: 800 }}
        outlines={[{ from: 6, to: 7, color, opacity: fade(f, start + s(2.2)) }]}
        notes={[{ label: note, color, opacity: fade(f, start + s(2.2)), index: 6.5 }]}
      />
    );
  };
  return (
    <AbsoluteFill>
      {f < define + s(0.6) && (
        <AbsoluteFill style={{ opacity: 1 - out }}>
          <Headline kicker="The idea" at={s(0.3)}>
            A playground argument
          </Headline>
          <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            {/* Today's answer is drawn around yesterday's remark, not over it: the remark stays readable inside. */}
            <g opacity={fade(f, today)} transform={`translate(960 620) scale(${big}) translate(-960 -620)`}>
              <rect x={410} y={330} width={1100} height={560} rx={80} fill={ACCENT} fillOpacity={0.12} stroke={ACCENT} strokeWidth={6} />
              <path d="M 640 890 L 600 980 L 740 890 Z" fill={ACCENT} fillOpacity={0.12} stroke={ACCENT} strokeWidth={6} />
              <text x={960} y={830} textAnchor="middle" fontSize={50} fontWeight={700} fill={ACCENT} fontFamily="var(--font-sans)">
                Today: a loud, complete answer
              </text>
            </g>
            <g opacity={fade(f, yesterday)}>
              <rect x={760} y={470} width={400} height={150} rx={40} fill="var(--color-surface-1)" stroke={SOFT} strokeWidth={4} />
              <text x={960} y={530} textAnchor="middle" fontSize={28} fontWeight={700} fill={SOFT} fontFamily="var(--font-sans)">
                Yesterday
              </text>
              <text x={960} y={580} textAnchor="middle" fontSize={30} fill="var(--color-ink)" fontFamily="var(--font-sans)">
                something small and mean
              </text>
            </g>
          </svg>
        </AbsoluteFill>
      )}
      {f >= define && (
        <AbsoluteFill style={{ opacity: out }}>
          <CornerTag label={SYNTHETIC} />
          <Headline kicker="The definition" at={define} accent={ACCENT}>
            Engulfing: the second body covers the first
          </Headline>
          <div style={{ position: 'absolute', left: 160, top: 250, fontSize: 38, fontWeight: 700, color: UP }}>Bullish engulfing</div>
          <div style={{ position: 'absolute', left: 1040, top: 250, fontSize: 38, fontWeight: 700, color: DOWN }}>Bearish engulfing</div>
          {pair(d.BULL, bullAt, { left: 160, right: 800 }, UP, 'small red, then big green')}
          {pair(d.BEAR, bearAt, { left: 1040, right: 1680 }, DOWN, 'small green, then big red')}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- rules

/** The exact rules on the figure's own two candles: each rule lights its part, with the real prices. */
export function RulesCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const open = useMark('open', 4);
  const close = useMark('close', 8);
  const wicks = useMark('wicks', 13);
  const size = useMark('size', 18);
  const [c1, c2full] = [d.BULL[6], d.BULL[7]];
  const c2 = grow(d.BULL, 7, interpolate(f, [open, close + s(1.2)], [0, 1], clamp))[7];
  const lo = 98.1;
  const hi = 103.9;
  const top = 300;
  const bottom = 900;
  const y = (v: number) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
  const X1 = 420;
  const X2 = 720;
  const BW = 130;
  const wickO = 1 - 0.7 * fade(f, wicks);
  const bodyGlow = fade(f, wicks);
  const candle = (b: OHLC, x: number, visible: boolean) => {
    if (!visible) return null;
    const color = b.c >= b.o ? UP : DOWN;
    return (
      <g>
        <line x1={x} x2={x} y1={y(b.h)} y2={y(b.l)} stroke={color} strokeWidth={6} opacity={wickO} />
        <rect x={x - BW / 2} y={y(Math.max(b.o, b.c))} width={BW} height={Math.max(3, Math.abs(y(b.o) - y(b.c)))} fill={color} />
        {bodyGlow > 0 && <rect x={x - BW / 2 - 12} y={y(Math.max(b.o, b.c)) - 12} width={BW + 24} height={Math.abs(y(b.o) - y(b.c)) + 24} rx={10} fill="none" stroke={ACCENT} strokeWidth={4} opacity={bodyGlow} />}
      </g>
    );
  };
  const priceLabel = (v: number, x: number, text: string, side: 'left' | 'right', color: string, o: number) => (
    <g opacity={o}>
      <line x1={side === 'left' ? x - BW / 2 - 10 : x + BW / 2 + 10} x2={side === 'left' ? x - BW / 2 - 40 : x + BW / 2 + 40} y1={y(v)} y2={y(v)} stroke={color} strokeWidth={3} />
      <text x={side === 'left' ? x - BW / 2 - 50 : x + BW / 2 + 50} y={y(v) + 11} textAnchor={side === 'left' ? 'end' : 'start'} fontSize={32} fontWeight={700} fill={color} fontFamily="var(--font-mono)">
        {text}
      </text>
    </g>
  );
  const items: { title: string; detail: string; from: number }[] = [
    { title: 'Opposite colour', detail: 'red, then green', from: at(0.04) },
    { title: "Opens beyond candle one's close", detail: `${fmt(c2full.o)} is below ${fmt(c1.c)}`, from: open },
    { title: "Closes beyond candle one's open", detail: `${fmt(c2full.c)} is above ${fmt(c1.o)}`, from: close },
    { title: 'Bodies only: wicks do not count', detail: 'the classic definition', from: wicks },
    { title: 'Big compared with recent candles', detail: 'a tiny pair means nothing', from: size },
  ];
  const current = items.filter((it) => f >= it.from).length - 1;
  return (
    <AbsoluteFill>
      <Headline kicker="The exact rules" at={s(0.3)}>
        Candle two's body covers candle one's body
      </Headline>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {/* The level each rule compares against, drawn between the candles, never across a body. */}
        <line x1={X1 + BW / 2} x2={X2 - BW / 2} y1={y(c1.c)} y2={y(c1.c)} stroke={ACCENT} strokeWidth={4} strokeDasharray="10 8" opacity={fade(f, open) * (1 - fade(f, close))} />
        <line x1={X1 + BW / 2} x2={X2 - BW / 2} y1={y(c1.o)} y2={y(c1.o)} stroke={ACCENT} strokeWidth={4} strokeDasharray="10 8" opacity={fade(f, close) * (1 - fade(f, wicks))} />
        {candle(c1, X1, true)}
        {candle(c2, X2, f >= open)}
        {priceLabel(c1.o, X1, `open ${fmt(c1.o)}`, 'left', DOWN, 1)}
        {priceLabel(c1.c, X1, `close ${fmt(c1.c)}`, 'left', DOWN, 1)}
        {priceLabel(c2full.o, X2, `open ${fmt(c2full.o)}`, 'right', UP, fade(f, open))}
        {priceLabel(c2full.c, X2, `close ${fmt(c2full.c)}`, 'right', UP, fade(f, close + s(1.2)))}
        <text x={X1} y={960} textAnchor="middle" fontSize={30} fill={SOFT} fontFamily="var(--font-sans)">
          candle one
        </text>
        <text x={X2} y={960} textAnchor="middle" fontSize={30} fill={SOFT} fontFamily="var(--font-sans)" opacity={fade(f, open)}>
          candle two
        </text>
      </svg>
      <div style={{ position: 'absolute', left: 1080, right: 120, top: 280, display: 'flex', flexDirection: 'column', gap: 22 }}>
        {items.map((it, i) => {
          const o = fade(f, it.from);
          const now = i === current;
          return (
            <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'center', opacity: o * (now ? 1 : 0.55) }}>
              <span style={{ flexShrink: 0, width: 64, height: 64, borderRadius: 32, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 700, color: now ? 'var(--color-bg)' : ACCENT, background: now ? ACCENT : 'transparent', border: `3px solid ${ACCENT}` }}>
                {i + 1}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: now ? 38 : 34, fontWeight: now ? 700 : 500, color: 'var(--color-ink)' }}>{it.title}</div>
                <div style={{ fontSize: 28, fontFamily: i === 1 || i === 2 ? 'var(--font-mono)' : 'var(--font-sans)', color: SOFT }}>{it.detail}</div>
              </div>
              {i === 4 && (
                <svg viewBox="0 0 120 80" style={{ width: 120, flexShrink: 0 }}>
                  <line x1={40} x2={40} y1={30} y2={50} stroke={DOWN} strokeWidth={2} />
                  <rect x={34} y={38} width={12} height={5} fill={DOWN} />
                  <line x1={70} x2={70} y1={28} y2={52} stroke={UP} strokeWidth={2} />
                  <rect x={64} y={36} width={12} height={9} fill={UP} />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- bullish / bearish

/**
 * The two days, told on the figure: day one appears, day two grows from its open as the voice
 * describes it, and the close is measured against everything day one traded.
 */
function PairStory({ bars, bullish, day1, day2, flip, kick, head }: { bars: OHLC[]; bullish: boolean; day1: number; day2: number; flip: number; kick: string; head: string }) {
  const f = useCurrentFrame();
  const N = bars.length;
  const [b1, b2] = [bars[6], bars[7]];
  const growth = interpolate(f, [day2 + s(0.3), Math.max(day2 + s(2.5), flip - s(0.6))], [0, 1], clamp);
  const shown = grow(bars, 7, growth);
  const price = shown[7].c;
  const color = bullish ? UP : DOWN;
  const crossed = bullish ? price > b1.o : price < b1.o;
  const wide = view(bars, -0.8, 8.8, 0.16);
  const close = view(bars, 2.5, 8.6, 0.16);
  const cam = cameraAt(f, [
    { at: 0, cam: wide },
    { at: day1, cam: close, move: 50 },
  ]);
  const drawTo = f >= day2 ? 7 : f >= day1 ? 6 : 5;
  const edge = bullish ? b1.h : b1.l;
  return (
    <AbsoluteFill>
      <Headline kicker={kick} at={s(0.3)} accent={color}>
        {head}
      </Headline>
      <CinematicChart
        cam={cam}
        bars={shown}
        lines={[]}
        draw={interpolate(f, [0, s(1.5)], [0.05, 1], clamp) * upto(drawTo, N)}
        head={false}
        maxBody={80}
        legend={PRICE}
        spotlight={{ index: f >= day2 ? 7 : 6, value: f >= day2 ? (b2.o + price) / 2 : (b1.o + b1.c) / 2, radius: 460, strength: fade(f, day1) * 0.75 }}
        levels={[{ price: b1.o, label: `day 1 open ${fmt(b1.o)}`, color: SOFT, opacity: fade(f, day2) * (crossed ? 1 : 0.6) }]}
        outlines={[
          { from: 6, to: 6, color: bullish ? DOWN : UP, opacity: fade(f, day1) * (1 - fade(f, flip)) },
          { from: 6, to: 7, color, opacity: fade(f, flip) },
        ]}
        notes={[
          { label: bullish ? 'day 1: sellers win, by a little' : 'day 1: buyers win, barely', color: bullish ? DOWN : UP, opacity: fade(f, day1) * (1 - fade(f, day2)), index: 6 },
          { label: bullish ? 'day 2: opens lower, then buyers take over' : 'day 2: opens higher, then sellers take over', color, opacity: fade(f, day2) * (1 - fade(f, flip)), index: 7 },
        ]}
        brackets={[
          {
            index: 7,
            from: edge,
            to: b2.c,
            color,
            opacity: fade(f, flip),
            label: bullish ? `close ${fmt(b2.c)}, above all of day 1 (high ${fmt(edge)})` : `close ${fmt(b2.c)}, below all of day 1 (low ${fmt(edge)})`,
          },
        ]}
      />
    </AbsoluteFill>
  );
}

export function BullishCinematic() {
  return <PairStory bars={d.BULL} bullish day1={useMark('day1', 5)} day2={useMark('day2', 9)} flip={useMark('flip', 19)} kick="The psychology" head="Bullish engulfing: buyers swallow the sellers" />;
}

export function BearishCinematic() {
  const at = useSpeechAt();
  return <PairStory bars={d.BEAR} bullish={false} day1={at(0.16)} day2={useMark('turn', 8)} flip={at(0.8)} kick="The mirror image" head="Bearish engulfing: at the top of a rise" />;
}

// ---------------------------------------------------------------- wave

/** The lesson's picture: little kicks wear the sandcastle down, then one wave flattens it. */
export function WaveCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const kicks = [at(0.1), at(0.2), at(0.3)];
  const wave = at(0.42);
  const sweep = interpolate(f, [wave, wave + s(1.8)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const crest = -500 + sweep * 2900;
  const k = kicks.filter((t) => f >= t).length;
  const worn = 1 - 0.1 * k;
  const flat = interpolate(crest, [700, 1200], [1, 0.04], clamp);
  const h = 300 * worn * flat;
  const G = 820;
  const burst = (t: number) => {
    const p = (f - t) / s(0.6);
    if (p < 0 || p > 1) return null;
    return (
      <g opacity={1 - p}>
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={1180 + 40 * p * Math.cos(i * 1.2)} cy={G - 40 - 60 * p * Math.sin(i * 0.9 + 0.3)} r={8} fill="#c9a86a" />
        ))}
      </g>
    );
  };
  return (
    <AbsoluteFill>
      <Headline kicker="Picture it" at={s(0.3)}>
        The engulfing candle is the wave
      </Headline>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect x={0} y={G} width={1920} height={260} fill="#c9a86a" opacity={0.35} />
        <g transform={`translate(0 ${G}) scale(1 ${Math.max(0.001, h / 300)}) translate(0 ${-G})`}>
          <rect x={800} y={G - 200} width={320} height={200} fill="#c9a86a" />
          <rect x={760} y={G - 300} width={90} height={300} fill="#c9a86a" />
          <rect x={1070} y={G - 300} width={90} height={300} fill="#c9a86a" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={810 + i * 82} y={G - 236} width={44} height={36} fill="#c9a86a" />
          ))}
        </g>
        {kicks.map((t, i) => (
          <g key={i}>{burst(t)}</g>
        ))}
        {f >= wave && (
          <path
            d={`M ${crest - 1400} ${G + 40} L ${crest - 200} ${G + 40} Q ${crest - 40} ${G - 380} ${crest + 80} ${G - 300} Q ${crest + 10} ${G - 220} ${crest + 60} ${G + 40} L ${crest + 60} 1080 L ${crest - 1400} 1080 Z`}
            fill="var(--color-chart-2)"
            opacity={0.55 * (1 - fade(f, wave + s(2.4)))}
          />
        )}
      </svg>
      <div style={{ position: 'absolute', left: 120, right: 120, top: 920, display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ ...body, fontSize: 38, color: 'var(--color-ink)', opacity: fade(f, kicks[0]) }}>
          Little kicks: <span style={{ color: DOWN, fontWeight: 700 }}>small candles</span>
        </div>
        <div style={{ ...body, fontSize: 38, color: 'var(--color-ink)', opacity: fade(f, wave + s(1)) }}>
          The wave: <span style={{ color: UP, fontWeight: 700 }}>the engulfing candle</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- valid

/** A reversal needs a trend: the two figures' trends shaded, then every engulfing on a sideways chart, counted. */
export function ValidCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const range = useMark('range', 14);
  const toRange = at(0.56);
  const showRange = fade(f, toRange, s(0.6));
  const found = d.RANGE_ENGULFINGS;
  const step = (k: number) => fade(f, range + s(0.5) + k * s(0.55), s(0.3));
  const shown = found.filter((_, k) => step(k) > 0.5).length;
  const all = view(d.RANGE, -1.5, d.RANGE.length + 0.5, 0.12);
  const trend = (bars: OHLC[], plot: { left: number; right: number }, color: string, label: string, start: number) => (
    <CinematicChart
      cam={view(bars, -0.8, 7.8, 0.16)}
      bars={bars}
      lines={[]}
      draw={upto(7, bars.length)}
      head={false}
      maxBody={50}
      plot={{ ...plot, top: 330, bottom: 800 }}
      regions={[{ from: -0.5, to: 5.5, color, opacity: fade(f, start), label }]}
      outlines={[{ from: 6, to: 7, color: color === UP ? DOWN : UP, opacity: fade(f, start + s(0.6)) }]}
    />
  );
  return (
    <AbsoluteFill>
      <Headline key={String(f >= range)} kicker="Where it is valid" at={f >= range ? range : s(0.3)} accent={f >= range ? DOWN : undefined}>
        {f >= range ? `Sideways: ${d.RANGE_ENGULFING_COUNT} engulfing patterns, none of them meaningful` : 'A reversal pattern needs a trend to reverse'}
      </Headline>
      <AbsoluteFill style={{ opacity: 1 - showRange }}>
        {trend(d.BULL, { left: 160, right: 800 }, DOWN, 'decline first', at(0.22))}
        {trend(d.BEAR, { left: 1040, right: 1680 }, UP, 'rise first', at(0.38))}
      </AbsoluteFill>
      {showRange > 0 && (
        <AbsoluteFill style={{ opacity: showRange }}>
          <CinematicChart
            cam={all}
            bars={d.RANGE}
            lines={[]}
            head={false}
            legend={PRICE}
            outlines={found.map((e, k) => ({ from: e.index - 1, to: e.index, color: e.direction === 'bullish' ? UP : DOWN, opacity: step(k) }))}
            notes={[{ label: `${shown} engulfing pattern${shown === 1 ? '' : 's'}, no trend to reverse`, color: DOWN, opacity: fade(f, range + s(0.5)) }]}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- locations

/** The lesson's best locations, in order, as four illustrated panels, each lit as it is named. */
export function LocationsCinematic() {
  const f = useCurrentFrame();
  const marks = [useMark('level', 2), useMark('slowing', 7), useMark('volume', 12), useMark('count', 17)];
  const state = (i: number) => (f < marks[i] ? 0 : i === marks.filter((m) => f >= m).length - 1 ? 1 : 2);
  const o = (i: number) => (state(i) === 0 ? 0 : fade(f, marks[i]) * (state(i) === 1 ? 1 : 0.55));
  const cams = [d.LOC_LEVEL, d.LOC_SLOWING, d.LOC_VOLUME, d.LOC_COUNT].map((b) => view(b, -0.7, 7.7, 0.16));
  const slow = d.LOC_SLOWING;
  const P = [
    { x0: 120, x1: 940, y0: 230, y1: 600 },
    { x0: 980, x1: 1800, y0: 230, y1: 600 },
    { x0: 120, x1: 940, y0: 625, y1: 985 },
    { x0: 980, x1: 1800, y0: 625, y1: 985 },
  ];
  const plot = (i: number, bottom: number) => ({ left: P[i].x0 + 30, right: P[i].x1 - 110, top: P[i].y0 + 80, bottom });
  return (
    <AbsoluteFill>
      <Headline kicker="The best places, in order" at={s(0.3)}>
        After a trend, and better still at a level
      </Headline>
      <Panel {...P[0]} title="1 · At support or resistance, after a trend" state={state(0)} />
      <Panel {...P[1]} title="2 · After a long trend that is slowing" state={state(1)} />
      <Panel {...P[2]} title="3 · After a trend, on high volume" state={state(2)} />
      <Panel {...P[3]} title="+ · How many bodies it covers" state={state(3)} />
      <AbsoluteFill style={{ opacity: o(0) }}>
        <CinematicChart cam={cams[0]} bars={d.LOC_LEVEL} lines={[]} head={false} maxBody={40} plot={plot(0, 500)} levels={[{ price: d.LOC_SUPPORT, label: `support ${d.LOC_SUPPORT}`, color: SOFT, opacity: 1 }]} outlines={[{ from: 6, to: 7, color: UP, opacity: 1 }]} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: o(1) }}>
        <CinematicChart cam={cams[1]} bars={slow} lines={[]} head={false} maxBody={40} plot={plot(1, 500)} outlines={[{ from: 6, to: 7, color: UP, opacity: 1 }]} notes={[{ label: `bodies shrink: ${fmt(bodyOf(slow[0]))} → ${fmt(bodyOf(slow[6]))}`, color: SOFT, opacity: 1 }]} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: o(2) }}>
        <CinematicChart cam={cams[2]} bars={d.LOC_VOLUME} lines={[]} head={false} maxBody={40} plot={plot(2, 840)} outlines={[{ from: 6, to: 7, color: UP, opacity: 1 }]} />
        <Volume bars={d.LOC_VOLUME} cam={cams[2]} left={plot(2, 0).left} right={plot(2, 0).right} top={872} bottom={960} highlight={7} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: o(3) }}>
        <CinematicChart
          cam={cams[3]}
          bars={d.LOC_COUNT}
          lines={[]}
          head={false}
          maxBody={40}
          plot={plot(3, 890)}
          regions={[{ from: 7 - d.COUNT_COVERED - 0.5, to: 6.5, color: DOWN, opacity: 1, label: `${d.COUNT_COVERED} red bodies covered` }]}
          outlines={[{ from: 7, to: 7, color: UP, opacity: 1 }]}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- confirm

/** Confirmation on the figure (the third candle), then volume, then timeframe. */
export function ConfirmCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const volume = useMark('volume', 9);
  const timeframe = useMark('timeframe', 16);
  const b = d.BULL;
  const third = interpolate(f, [at(0.06), at(0.28)], [0, 1], clamp);
  const pA = 1 - fade(f, volume);
  const pB = fade(f, volume) * (1 - fade(f, timeframe));
  const pC = fade(f, timeframe);
  const cams = view(d.LOC_VOLUME, -0.7, 7.7, 0.16);
  const head = f < volume ? 'Confirmation: a third candle closes beyond it' : f < timeframe ? 'Volume: look for it on the engulfing candle' : 'Timeframe: bigger timeframes carry more weight';
  const half = (bars: OHLC[], left: number, right: number, title: string, color: string) => (
    <>
      <div style={{ position: 'absolute', left, top: 270, fontSize: 36, fontWeight: 700, color }}>{title}</div>
      <CinematicChart cam={cams} bars={bars} lines={[]} head={false} maxBody={50} plot={{ left, right, top: 340, bottom: 720 }} outlines={[{ from: 6, to: 7, color: UP, opacity: 1 }]} />
      <Volume bars={bars} cam={cams} left={left} right={right} top={760} bottom={900} highlight={7} />
    </>
  );
  const candleCard = (title: string, sub: string, big: boolean, o: number) => (
    <div style={{ opacity: o, flex: 1, borderRadius: 28, border: `3px solid ${big ? UP : 'var(--color-line)'}`, background: 'var(--color-surface-1)', padding: '40px 48px', display: 'flex', alignItems: 'center', gap: 44 }}>
      <svg viewBox="0 0 100 300" style={{ width: big ? 110 : 60, flexShrink: 0 }}>
        <line x1={50} x2={50} y1={big ? 10 : 110} y2={big ? 290 : 190} stroke={UP} strokeWidth={big ? 8 : 6} />
        <rect x={20} y={big ? 50 : 130} width={60} height={big ? 200 : 40} fill={UP} />
      </svg>
      <div>
        <div style={{ fontSize: 44, fontWeight: 700, color: 'var(--color-ink)' }}>{title}</div>
        <div style={{ ...body, fontSize: 36 }}>{sub}</div>
      </div>
    </div>
  );
  return (
    <AbsoluteFill>
      <Headline key={head} kicker="Confirmation" at={f < volume ? s(0.3) : f < timeframe ? volume : timeframe} accent={UP}>
        {head}
      </Headline>
      {pA > 0 && (
        <AbsoluteFill style={{ opacity: pA }}>
          <CinematicChart
            cam={view(b, 1.5, 9.8, 0.16)}
            bars={grow(b, 8, third)}
            lines={[]}
            head={false}
            maxBody={80}
            draw={upto(f >= at(0.06) ? 8 : 7, b.length)}
            legend={PRICE}
            spotlight={{ index: 8, value: b[8].c, radius: 460, strength: fade(f, at(0.06)) * 0.7 }}
            levels={[{ price: b[7].c, label: `engulfing close ${fmt(b[7].c)}`, color: SOFT, opacity: fade(f, at(0.04)) }]}
            outlines={[{ from: 6, to: 7, color: UP, opacity: 1 }]}
            brackets={[{ index: 8, from: b[7].c, to: b[8].c, color: UP, opacity: fade(f, at(0.3)), label: `third candle closes higher: ${fmt(b[8].c)}` }]}
          />
        </AbsoluteFill>
      )}
      {pB > 0 && (
        <AbsoluteFill style={{ opacity: pB }}>
          {half(d.LOC_VOLUME, 160, 820, 'High volume: a real change of hands', UP)}
          {half(d.THIN_VOLUME, 1040, 1700, 'Thin volume: maybe one large order', SOFT)}
        </AbsoluteFill>
      )}
      <CornerTag label={SYNTHETIC} opacity={pA} />
      <CornerTag label={`${ILLUSTRATION}: same candles, different volume`} opacity={pB} />
      {pC > 0 && (
        <AbsoluteFill style={{ opacity: pC, padding: '300px 120px 160px', display: 'flex', flexDirection: 'row', gap: 60 }}>
          {candleCard('Daily engulfing', 'a whole day of trading', true, fade(f, timeframe + s(0.4)))}
          {candleCard('One-minute engulfing', 'can be a single order', false, fade(f, at(0.86)))}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- trade

/** The lesson's trade idea on the figure: entry, stop and the risk between them, all from the data. */
export function TradeCinematic() {
  const f = useCurrentFrame();
  const entry = useMark('entry', 5);
  const stop = useMark('stop', 11);
  const why = useMark('why', 20);
  const b = d.BULL;
  const head = f < entry ? 'A trade idea to practise' : f < stop ? 'Entry: the confirmation closes above the engulfing high' : f < why ? 'Stop: below the low of the pattern' : 'Why there: that low is where buyers proved control';
  const spot = f >= why ? { index: 7, value: d.BULL_STOP, radius: 440, strength: fade(f, why) * 0.8 } : { index: 8, value: d.BULL_ENTRY, radius: 460, strength: fade(f, entry) * 0.7 };
  return (
    <AbsoluteFill>
      <Headline key={head} kicker="A trade idea" at={f < entry ? s(0.3) : f < stop ? entry : f < why ? stop : why} accent={f < entry ? undefined : f < stop ? UP : f < why ? DOWN : ACCENT}>
        {head}
      </Headline>
      <CinematicChart
        cam={view(b, 1.5, 9.8, 0.16)}
        bars={b}
        lines={[]}
        head={false}
        maxBody={80}
        legend={PRICE}
        spotlight={spot}
        outlines={[{ from: 6, to: 7, color: UP, opacity: 1 }]}
        levels={[
          { price: d.BULL_ENGULF_HIGH, label: `engulfing high ${fmt(d.BULL_ENGULF_HIGH)}`, color: SOFT, opacity: fade(f, s(1)) },
          { price: d.BULL_ENTRY, label: `entry ${fmt(d.BULL_ENTRY)}`, color: UP, opacity: fade(f, entry + s(0.5)) },
          { price: d.BULL_STOP, label: `stop ${fmt(d.BULL_STOP)}`, color: DOWN, opacity: fade(f, stop + s(0.5)) },
        ]}
        brackets={[{ index: 8, from: d.BULL_STOP, to: d.BULL_ENTRY, color: ACCENT, opacity: fade(f, stop + s(2)), label: `risk ${fmt(d.BULL_RISK)}` }]}
        notes={[{ label: `back below ${fmt(d.BULL_STOP)}: the pattern failed`, color: DOWN, opacity: fade(f, why + s(1)), index: 7 }]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- trap

/** The lesson's danger: the same engulfing candle at three times the average range, stops compared. */
export function TrapCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const giantAt = at(0.08);
  const risks = at(0.3);
  const wait = at(0.82);
  const cam = view(d.TRAP_GIANT, 2.5, 8.7, 0.14);
  const g = d.TRAP_GIANT[7];
  const side = (bars: OHLC[], left: number, right: number, title: string, risk: number, start: number, extra?: boolean) => (
    <>
      <div style={{ position: 'absolute', left, top: 270, fontSize: 36, fontWeight: 700, color: 'var(--color-ink)', opacity: fade(f, start) }}>{title}</div>
      <AbsoluteFill style={{ opacity: fade(f, start) }}>
        <CinematicChart
          cam={cam}
          bars={grow(bars, 7, interpolate(f, [start, start + s(1.6)], [0, 1], clamp))}
          lines={[]}
          head={false}
          maxBody={60}
          plot={{ left, right, top: 340, bottom: 800 }}
          brackets={[{ index: 7, from: bars[7].l, to: bars[7].c, color: DOWN, opacity: fade(f, risks), label: `stop to entry: ${fmt(risk)}` }]}
          levels={extra ? [{ price: (g.o + g.c) / 2, label: 'wait for a pullback into the body', color: ACCENT, opacity: fade(f, wait) }] : []}
        />
      </AbsoluteFill>
    </>
  );
  return (
    <AbsoluteFill>
      <Headline kicker="A common trap" at={s(0.3)} accent="var(--color-danger)">
        Giant engulfing candles: strong signals, terrible entries
      </Headline>
      {side(d.TRAP_NORMAL, 160, 780, 'The figure’s engulfing candle', d.NORMAL_RISK, 0)}
      {side(d.TRAP_GIANT, 1040, 1660, `3 × the average range (${fmt(d.AVG_RANGE)})`, d.GIANT_RISK, giantAt, true)}
      <CornerTag label={SYNTHETIC} opacity={1 - fade(f, giantAt)} />
      <CornerTag label="Left: synthetic data · Right: illustration" opacity={fade(f, giantAt)} />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- reliability

/** Bulkowski's published reversal rates, credited, against a coin flip; then the two warnings. */
export function ReliabilityCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const warn = useMark('warn', 13);
  const second = Math.max(warn + s(3), at(0.6));
  const L = 640;
  const R = 1640;
  const X = (pct: number) => L + (pct / 100) * (R - L);
  const bar = (label: string, pct: number, color: string, y: number, start: number) => {
    const fill = interpolate(f, [start, start + s(1.2)], [0, pct], { ...clamp, easing: Easing.out(Easing.cubic) });
    return (
      <g opacity={fade(f, start)}>
        <text x={L - 30} y={y + 46} textAnchor="end" fontSize={40} fontWeight={700} fill={color} fontFamily="var(--font-sans)">
          {label}
        </text>
        <rect x={L} y={y} width={R - L} height={70} rx={14} fill="var(--color-surface-1)" stroke="var(--color-line)" strokeWidth={2} />
        <rect x={L} y={y} width={X(fill) - L} height={70} rx={14} fill={color} opacity={0.85} />
        <text x={R + 30} y={y + 50} fontSize={48} fontWeight={700} fill={color} fontFamily="var(--font-mono)">
          {Math.round(fill)}%
        </text>
      </g>
    );
  };
  const card = (title: string, text: string, o: number) => (
    <div style={{ flex: 1, opacity: o, transform: `translateY(${(1 - o) * 20}px)`, borderLeft: '10px solid var(--color-danger)', background: 'var(--color-danger-soft)', borderRadius: 24, padding: '28px 36px' }}>
      <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--color-ink)' }}>{title}</div>
      <div style={{ ...body, fontSize: 32, color: 'var(--color-ink)', marginTop: 8 }}>{text}</div>
    </div>
  );
  return (
    <AbsoluteFill>
      <Headline kicker="Honest reliability" at={s(0.3)}>
        How often did it reverse the trend?
      </Headline>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <line x1={X(50)} x2={X(50)} y1={300} y2={590} stroke={SOFT} strokeWidth={3} strokeDasharray="10 8" opacity={fade(f, at(0.03))} />
        <text x={X(50)} y={288} textAnchor="middle" fontSize={28} fill={SOFT} fontFamily="var(--font-sans)" opacity={fade(f, at(0.03))}>
          coin flip: 50%
        </text>
        {bar('Bearish engulfing', d.BULKOWSKI.bearish, DOWN, 330, at(0.1))}
        {bar('Bullish engulfing', d.BULKOWSKI.bullish, UP, 470, at(0.3))}
      </svg>
      <div style={{ position: 'absolute', left: 140, right: 140, top: 610, fontSize: 28, color: SOFT, opacity: fade(f, at(0.1)) }}>Source: Thomas Bulkowski's published tests, thepatternsite.com. Patterns with a proper prior trend only.</div>
      <div style={{ position: 'absolute', left: 140, right: 140, top: 690, display: 'flex', gap: 40 }}>
        {card('Only patterns after a proper trend', 'Engulfings inside ranges were not counted.', fade(f, warn + s(0.6)))}
        {card('A turn, not a size', `It moved the expected way, not necessarily far. In Bulkowski's performance ranking the bearish engulfing places ${d.BULKOWSKI.bearishOverallRank} of ${d.BULKOWSKI.patterns}: the trend after it is often short-lived.`, fade(f, second))}
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- takeaways

/** The recap: each point lights as it is said; the earlier ones stay, dimmed. */
export function TakeawaysCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const items: [string, string][] = [
    ["Two candles: the second is the opposite colour, and its body covers the first's.", ACCENT],
    ['It needs a trend before it. Inside a range, it means nothing.', DOWN],
    ['Confirm with a third candle, and look for high volume.', UP],
    ['Put the stop beyond the far end of the engulfing candle.', 'var(--color-chart-2)'],
    ['Very big engulfing candles: wide stops and poor entries.', 'var(--color-danger)'],
  ];
  const starts = [0.04, 0.33, 0.53, 0.7, 0.83].map(at);
  const current = starts.filter((st) => f >= st).length - 1;
  return (
    <AbsoluteFill style={{ padding: '80px 140px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 30 }}>
      <div style={kicker}>Key takeaways</div>
      {items.map(([text, color], i) => {
        const o = fade(f, starts[i], s(0.5));
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

// ---------------------------------------------------------------- quiz

/** The lesson's quiz question 2, then the answer on an illustrated chart. */
export function QuizCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const think = useMark('think', 9);
  const reveal = useMark('reveal', 12);
  const shown = f >= reveal;
  const ring = interpolate(f, [think, reveal], [0, 1], clamp);
  const option = (letter: string, text: string, right: boolean, atF: number) => {
    const o = fade(f, atF, s(0.5));
    return (
      <div style={{ opacity: o * (shown && !right ? 0.45 : 1), borderRadius: 24, border: `3px solid ${shown && right ? UP : 'var(--color-line)'}`, background: 'var(--color-surface-1)', padding: '26px 34px', display: 'flex', alignItems: 'center', gap: 26 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 42, fontWeight: 700, color: shown ? (right ? UP : DOWN) : ACCENT }}>{shown ? (right ? '✓' : '✕') : letter}</span>
        <span style={{ ...body, fontSize: 40, color: 'var(--color-ink)' }}>{text}</span>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 140, top: 150, width: 820, display: 'flex', flexDirection: 'column', gap: 30 }}>
        <div style={kicker}>Quick check</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 700, margin: 0, lineHeight: 1.15, opacity: fade(f, s(0.4)) }}>Where does a bullish engulfing mean the most?</h2>
          {f >= think && !shown && (
            <svg viewBox="0 0 100 100" style={{ width: 84, flexShrink: 0 }}>
              <circle cx={50} cy={50} r={40} fill="none" stroke="var(--color-line)" strokeWidth={10} />
              <circle cx={50} cy={50} r={40} fill="none" stroke={ACCENT} strokeWidth={10} strokeDasharray={`${ring * 251} 251`} transform="rotate(-90 50 50)" />
            </svg>
          )}
        </div>
        {option('A', 'In the middle of a sideways range', false, at(0.3))}
        {option('B', 'At a support level, after a decline', true, at(0.5))}
        <div style={{ ...body, fontSize: 36, opacity: fade(f, reveal + s(2)) }}>A reversal pattern needs a trend to reverse, and a level makes it stronger.</div>
      </div>
      {shown && (
        <AbsoluteFill style={{ opacity: fade(f, reveal, s(0.6)) }}>
          <CinematicChart
            cam={view(d.LOC_LEVEL, -0.7, 7.7, 0.16)}
            bars={d.LOC_LEVEL}
            lines={[]}
            head={false}
            maxBody={50}
            plot={{ left: 1060, right: 1700, top: 300, bottom: 780 }}
            levels={[{ price: d.LOC_SUPPORT, label: `support ${d.LOC_SUPPORT}`, color: SOFT, opacity: 1 }]}
            outlines={[{ from: 6, to: 7, color: UP, opacity: 1 }]}
          />
        </AbsoluteFill>
      )}
      <CornerTag label={ILLUSTRATION} opacity={shown ? fade(f, reveal, s(0.6)) : 0} />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- end

/** The close: the call to practise, the two checks, the disclaimer, over the figure out of focus. */
export function EndCinematic() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = (delay: number) => spring({ frame: f - delay, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0, filter: 'blur(3px)' }}>
        <CinematicChart cam={view(d.BULL, -0.8, 9.2, 0.2)} bars={d.BULL} lines={[]} head={false} dim={0.25} maxBody={90} />
      </div>
      <AbsoluteFill style={{ background: 'radial-gradient(60% 60% at 50% 50%, color-mix(in oklch, var(--color-bg) 70%, transparent) 0%, var(--color-bg) 85%)' }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', gap: 34, textAlign: 'center' }}>
        <div style={{ opacity: rise(0) }}>
          <Brand />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 72, fontWeight: 700, opacity: rise(6) }}>Spot it in the pattern trainer.</div>
        <div style={{ display: 'flex', gap: 50, fontSize: 40, opacity: rise(18) }}>
          <span>
            <span style={{ color: UP, fontWeight: 700 }}>✓</span> Is the whole first body covered?
          </span>
          <span>
            <span style={{ color: UP, fontWeight: 700 }}>✓</span> Was there a trend before it?
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 46, color: ACCENT, opacity: rise(26) }}>nitoratrading.com/trainer</div>
        <div style={{ fontSize: 32, color: SOFT, opacity: rise(36) }}>An educational tool. Charts use synthetic data. Nothing here is financial advice.</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
