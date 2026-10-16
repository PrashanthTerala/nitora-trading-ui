/**
 * "Harami and Harami Cross", cinematic (directive V3), on CinematicChart and the shared pieces:
 * every chart is candles, every number on screen comes from ./data.ts, labels live in the band
 * under each plot, disclaimer tags go in the corner (the kit's CornerTag), and a spotlight or an
 * outline picks out whatever the narration is talking about. On-screen text is English in every
 * language; timing follows each language's marks (useMark) or its share of the narration (useSpeechAt).
 */
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import type { OHLC } from '@/engine/market/types';
import { CornerTag, ILLUSTRATION, SYNTHETIC, body, kicker, s, useMark, useSpeechAt } from '../kit';
import { CinematicChart, cameraAt } from '../cinematic/CinematicChart';
import { ACCENT, DOWN, PRICE, Panel, PatternIntro, PractiseEnd, Recap, SOFT, UP, fmt, grow, upto, view } from '../cinematic/pieces';
import { Headline, clamp, fade } from '../cinematic/scenes';
import * as d from './data';

// ---------------------------------------------------------------- title

export function HaramiIntro() {
  return <PatternIntro kicker="Module 2 · Candlestick patterns · Lesson 7" words={['Harami', '&', 'harami', 'cross']} sub="A small candle tucked inside a big one." bars={d.BULL} growIndex={7} />;
}

// ---------------------------------------------------------------- intro

/** The runner's tiny stride, then the pattern itself: a small body growing inside the big one. */
export function IntroCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const define = useMark('define', 11);
  const stall = useMark('stall', 24);
  const out = fade(f, define, s(0.6));
  const strides = [0.02, 0.05, 0.08, 0.11, 0.14, 0.17].map(at);
  const tiny = at(0.21);
  const pair = interpolate(f, [define + s(0.6), define + s(3)], [0, 1], clamp);
  const head = f < define ? 'A runner, and one tiny stride' : f < stall ? 'Harami: a small body inside a big one' : 'Harami: momentum stalling, not reversing';
  return (
    <AbsoluteFill>
      <Headline key={head} kicker={f < define ? 'The idea' : 'The definition'} at={f < define ? s(0.3) : f < stall ? define : stall} accent={f < define ? undefined : ACCENT}>
        {head}
      </Headline>
      {f < define + s(0.6) && (
        <AbsoluteFill style={{ opacity: 1 - out }}>
          <CornerTag label={ILLUSTRATION} />
          <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <line x1={120} x2={1800} y1={640} y2={640} stroke="var(--color-line)" strokeWidth={4} strokeDasharray="18 14" />
            {strides.map((t, i) => (
              <g key={i} opacity={fade(f, t, s(0.3))}>
                <path d={`M ${160 + i * 250} 640 Q ${285 + i * 250} 470 ${410 + i * 250} 640`} fill="none" stroke={DOWN} strokeWidth={6} />
                <circle cx={410 + i * 250} cy={640} r={10} fill={DOWN} />
              </g>
            ))}
            <g opacity={fade(f, tiny, s(0.3))}>
              <path d="M 1660 640 Q 1690 600 1720 640" fill="none" stroke={ACCENT} strokeWidth={6} />
              <circle cx={1720} cy={640} r={12} fill={ACCENT} />
              <text x={1690} y={720} textAnchor="middle" fontSize={34} fontWeight={700} fill={ACCENT} fontFamily="var(--font-sans)">
                one tiny stride
              </text>
            </g>
            <text x={160} y={720} fontSize={34} fill={SOFT} fontFamily="var(--font-sans)" opacity={fade(f, strides[0])}>
              long strides, one after another
            </text>
          </svg>
        </AbsoluteFill>
      )}
      {f >= define && (
        <AbsoluteFill style={{ opacity: out }}>
          <CornerTag label={SYNTHETIC} />
          <CinematicChart
            cam={view(d.BULL, 2.5, 8.6, 0.16)}
            bars={grow(d.BULL, 7, pair)}
            lines={[]}
            draw={upto(f >= define + s(0.6) ? 7 : 6, d.BULL.length)}
            head={false}
            maxBody={90}
            legend={PRICE}
            outlines={[{ from: 6, to: 7, color: ACCENT, opacity: fade(f, define + s(3)) }]}
            notes={[
              { label: 'big body, then a small body inside it', color: ACCENT, opacity: fade(f, define + s(3)) * (1 - fade(f, stall)), index: 6.5 },
              { label: 'a stall, not a turn', color: ACCENT, opacity: fade(f, stall + s(0.4)), index: 6.5 },
            ]}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- rules

/** The exact rules on the figure's own two candles, with the real prices; each rule lights its part. */
export function RulesCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const inside = useMark('inside', 6);
  const colour = useMark('colour', 13);
  const wicks = useMark('wicks', 18);
  const [c1, c2full] = [d.BULL[6], d.BULL[7]];
  const c2 = grow(d.BULL, 7, interpolate(f, [inside, inside + s(2.4)], [0, 1], clamp))[7];
  const lo = 95.5;
  const hi = 102.2;
  const top = 300;
  const bottom = 900;
  const y = (v: number) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
  const X1 = 420;
  const X2 = 720;
  const BW = 130;
  const candle = (b: OHLC, x: number, visible: boolean, wickGlow = 0) => {
    if (!visible) return null;
    const color = b.c >= b.o ? UP : DOWN;
    return (
      <g>
        <line x1={x} x2={x} y1={y(b.h)} y2={y(b.l)} stroke={color} strokeWidth={6} />
        {wickGlow > 0 && <rect x={x - 16} y={y(b.h) - 10} width={32} height={y(b.l) - y(b.h) + 20} rx={10} fill="none" stroke={ACCENT} strokeWidth={3} opacity={wickGlow} />}
        <rect x={x - BW / 2} y={y(Math.max(b.o, b.c))} width={BW} height={Math.max(3, Math.abs(y(b.o) - y(b.c)))} fill={color} />
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
  const items: { title: string; detail: string; from: number; mono?: boolean }[] = [
    { title: 'Candle one: big, with the trend', detail: 'a long red candle, after a decline', from: at(0.04) },
    { title: 'Small body inside the big body', detail: `${fmt(c2full.o)}–${fmt(c2full.c)} inside ${fmt(c1.c)}–${fmt(c1.o)}`, from: inside, mono: true },
    { title: 'Colour: usually opposite, not required', detail: 'small and inside is what matters', from: colour },
    { title: 'Wicks may poke out', detail: 'stricter: all of it inside, an "inside bar"', from: wicks },
  ];
  const current = items.filter((it) => f >= it.from).length - 1;
  // The two edges of candle one's body, drawn across to candle two (they pass outside its body and wicks).
  const edges = fade(f, inside) * (1 - fade(f, wicks));
  return (
    <AbsoluteFill>
      <Headline kicker="The exact rules" at={s(0.3)}>
        A small body inside a big body
      </Headline>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <line x1={X1 + BW / 2} x2={X2 + BW / 2 + 30} y1={y(c1.o)} y2={y(c1.o)} stroke={ACCENT} strokeWidth={4} strokeDasharray="10 8" opacity={edges} />
        <line x1={X1 + BW / 2} x2={X2 + BW / 2 + 30} y1={y(c1.c)} y2={y(c1.c)} stroke={ACCENT} strokeWidth={4} strokeDasharray="10 8" opacity={edges} />
        {candle(c1, X1, true)}
        {candle(c2, X2, f >= inside, fade(f, wicks))}
        {priceLabel(c1.o, X1, `open ${fmt(c1.o)}`, 'left', DOWN, 1)}
        {priceLabel(c1.c, X1, `close ${fmt(c1.c)}`, 'left', DOWN, 1)}
        {priceLabel(c2full.o, X2, `open ${fmt(c2full.o)}`, 'right', UP, fade(f, inside))}
        {priceLabel(c2full.c, X2, `close ${fmt(c2full.c)}`, 'right', UP, fade(f, inside + s(2.4)))}
        <text x={X1} y={960} textAnchor="middle" fontSize={30} fill={SOFT} fontFamily="var(--font-sans)">
          candle one
        </text>
        <text x={X2} y={960} textAnchor="middle" fontSize={30} fill={SOFT} fontFamily="var(--font-sans)" opacity={fade(f, inside)}>
          candle two
        </text>
      </svg>
      <div style={{ position: 'absolute', left: 1080, right: 120, top: 300, display: 'flex', flexDirection: 'column', gap: 26 }}>
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
                <div style={{ fontSize: 27, fontFamily: it.mono ? 'var(--font-mono)' : 'var(--font-sans)', color: SOFT }}>{it.detail}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- bullish / bearish

/** The two days on the figure: day one's big candle, then day two growing inside it, then the stall named. */
function PairStory({ bars, bullish, day1, day2, stall, kick, head }: { bars: OHLC[]; bullish: boolean; day1: number; day2: number; stall: number; kick: string; head: string }) {
  const f = useCurrentFrame();
  const N = bars.length;
  const b1 = bars[6];
  const growth = interpolate(f, [day2 + s(0.3), Math.max(day2 + s(2.5), stall - s(0.6))], [0, 1], clamp);
  const shown = grow(bars, 7, growth);
  const cam = cameraAt(f, [
    { at: 0, cam: view(bars, -0.8, 8.8, 0.16) },
    { at: day1, cam: view(bars, 2.5, 8.6, 0.16), move: 50 },
  ]);
  const drawTo = f >= day2 ? 7 : f >= day1 ? 6 : 5;
  const colour1 = bullish ? DOWN : UP;
  return (
    <AbsoluteFill>
      <Headline kicker={kick} at={s(0.3)} accent={bullish ? UP : DOWN}>
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
        spotlight={{ index: f >= day2 ? 7 : 6, value: f >= day2 ? (bars[7].o + bars[7].c) / 2 : (b1.o + b1.c) / 2, radius: 460, strength: fade(f, day1) * 0.75 }}
        levels={[{ price: b1.c, label: `day 1 close ${fmt(b1.c)}`, color: SOFT, opacity: fade(f, day2) }]}
        outlines={[
          { from: 6, to: 6, color: colour1, opacity: fade(f, day1) * (1 - fade(f, stall)) },
          { from: 6, to: 7, color: ACCENT, opacity: fade(f, stall) },
        ]}
        notes={[
          { label: bullish ? "day 1: the sellers' biggest win" : "day 1: the buyers' big win", color: colour1, opacity: fade(f, day1) * (1 - fade(f, day2)), index: 6 },
          { label: bullish ? 'day 2: opens inside, goes nowhere' : 'day 2: opens inside, no new high', color: ACCENT, opacity: fade(f, day2) * (1 - fade(f, stall)), index: 7 },
          { label: bullish ? 'stalled: sellers lost their grip' : 'stalled: the rally lost its push', color: ACCENT, opacity: fade(f, stall + s(0.4)), index: 6.5 },
        ]}
      />
    </AbsoluteFill>
  );
}

export function BullishCinematic() {
  return <PairStory bars={d.BULL} bullish day1={useMark('day1', 3)} day2={useMark('day2', 9)} stall={useMark('stall', 17)} kick="The psychology" head="Bullish harami: the sellers' sprint stalls" />;
}

export function BearishCinematic() {
  const at = useSpeechAt();
  return <PairStory bars={d.BEAR} bullish={false} day1={at(0.14)} day2={at(0.3)} stall={at(0.86)} kick="The mirror image" head="Bearish harami: the rally stalls at the top" />;
}

// ---------------------------------------------------------------- trolley

/** The lesson's picture: a trolley racing downhill; the engulfing shoves it back up, the harami is thick grass. */
export function TrolleyCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const engulf = at(0.2);
  const harami = at(0.5);
  const P = (p: number) => ({ x: 200 + 1520 * p, y: 300 + 520 * p });
  const angle = (Math.atan2(520, 1520) * 180) / Math.PI;
  // Fast down the slope, then (from the harami sentence) into the grass, slowing to a crawl.
  const rolled = interpolate(f, [s(0.3), engulf], [0.04, 0.42], { ...clamp, easing: Easing.in(Easing.quad) });
  const t = Math.max(0, (f - harami) / s(3));
  const pos = f < harami ? rolled : 0.42 + 0.26 * (1 - Math.exp(-2.2 * t));
  const ghost = interpolate(f, [engulf + s(0.4), engulf + s(2.4)], [0.42, 0.14], { ...clamp, easing: Easing.out(Easing.cubic) });
  const trolley = (p: number, opacity: number, dashed = false) => {
    const { x, y } = P(p);
    return (
      <g opacity={opacity} transform={`translate(${x} ${y}) rotate(${angle})`}>
        <rect x={-70} y={-110} width={140} height={80} rx={8} fill="none" stroke={dashed ? ACCENT : 'var(--color-ink)'} strokeWidth={6} strokeDasharray={dashed ? '12 8' : undefined} />
        <line x1={70} x2={110} y1={-110} y2={-140} stroke={dashed ? ACCENT : 'var(--color-ink)'} strokeWidth={6} />
        <circle cx={-45} cy={-16} r={14} fill={dashed ? 'none' : 'var(--color-ink)'} stroke={dashed ? ACCENT : 'none'} strokeWidth={4} />
        <circle cx={45} cy={-16} r={14} fill={dashed ? 'none' : 'var(--color-ink)'} stroke={dashed ? ACCENT : 'none'} strokeWidth={4} />
      </g>
    );
  };
  const grass = fade(f, harami - s(0.5));
  return (
    <AbsoluteFill>
      <Headline kicker="Picture it" at={s(0.3)}>
        The harami is thick grass, not a shove
      </Headline>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path d={`M ${P(0).x} ${P(0).y} L ${P(1).x} ${P(1).y} L ${P(1).x} 1080 L ${P(0).x} 1080 Z`} fill="var(--color-surface-1)" />
        <line x1={P(0).x} y1={P(0).y} x2={P(1).x} y2={P(1).y} stroke={SOFT} strokeWidth={5} />
        <g opacity={grass}>
          {Array.from({ length: 22 }, (_, i) => {
            const { x, y } = P(0.6 + i * 0.013);
            return <path key={i} d={`M ${x} ${y} l -8 -34 M ${x} ${y} l 4 -42 M ${x} ${y} l 14 -30`} stroke={UP} strokeWidth={4} fill="none" />;
          })}
        </g>
        {f >= engulf && f < harami && trolley(ghost, fade(f, engulf) * 0.9, true)}
        {trolley(pos, 1)}
      </svg>
      <div style={{ position: 'absolute', left: 120, right: 120, top: 940, display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ ...body, fontSize: 38, color: 'var(--color-ink)', opacity: fade(f, engulf) * (f < harami ? 1 : 0.5) }}>
          Engulfing: <span style={{ color: ACCENT, fontWeight: 700 }}>shoved back up the hill</span>
        </div>
        <div style={{ ...body, fontSize: 38, color: 'var(--color-ink)', opacity: fade(f, harami) }}>
          Harami: <span style={{ color: UP, fontWeight: 700 }}>slowed to a crawl</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- cross

/** The harami cross on the site's figure: the inside candle is a doji. */
export function CrossCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const doji = useMark('doji', 5);
  const trad = at(0.62);
  const still = at(0.82);
  const b = d.CROSS;
  const t = interpolate(f, [at(0.06), Math.max(at(0.06) + s(1.5), doji)], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Headline kicker="The harami cross" at={s(0.3)} accent={ACCENT}>
        Harami cross: the inside candle is a doji
      </Headline>
      <CinematicChart
        cam={view(b, 2.5, 8.6, 0.16)}
        bars={grow(b, 7, t)}
        lines={[]}
        draw={upto(f >= at(0.06) ? 7 : 6, b.length)}
        head={false}
        maxBody={80}
        legend={PRICE}
        spotlight={{ index: 7, value: b[7].c, radius: 420, strength: fade(f, doji) * 0.75 }}
        outlines={[{ from: 6, to: 7, color: ACCENT, opacity: fade(f, doji) }]}
        notes={[
          { label: `doji: open ${fmt(b[7].o)}, close ${fmt(b[7].c)}`, color: ACCENT, opacity: fade(f, doji + s(0.4)) * (1 - fade(f, trad)), index: 7 },
          { label: 'traditionally read as a stronger stall', color: SOFT, opacity: fade(f, trad) * (1 - fade(f, still)), index: 6.5 },
          { label: 'still a stall, until the next candle proves it', color: ACCENT, opacity: fade(f, still), index: 6.5 },
        ]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- valid

/** A reversal needs a trend: the two figures' trends shaded, then every harami on a sideways chart, counted. */
export function ValidCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const range = useMark('range', 11);
  const toRange = at(0.5);
  const showRange = fade(f, toRange, s(0.6));
  const found = d.RANGE_HARAMIS;
  const step = (k: number) => fade(f, range + s(0.5) + k * s(0.7), s(0.3));
  const shown = found.filter((_, k) => step(k) > 0.5).length;
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
      outlines={[{ from: 6, to: 7, color: ACCENT, opacity: fade(f, start + s(0.6)) }]}
    />
  );
  return (
    <AbsoluteFill>
      <Headline key={String(f >= range)} kicker="Where it is valid" at={f >= range ? range : s(0.3)} accent={f >= range ? DOWN : undefined}>
        {f >= range ? `Sideways: ${d.RANGE_HARAMI_COUNT} haramis, none of them meaningful` : 'A reversal pattern needs a trend to reverse'}
      </Headline>
      <AbsoluteFill style={{ opacity: 1 - showRange }}>
        {trend(d.BULL, { left: 160, right: 800 }, DOWN, 'decline first', at(0.12))}
        {trend(d.BEAR, { left: 1040, right: 1680 }, UP, 'rise first', at(0.25))}
      </AbsoluteFill>
      {showRange > 0 && (
        <AbsoluteFill style={{ opacity: showRange }}>
          <CinematicChart
            cam={view(d.RANGE, -1.5, d.RANGE.length + 0.5, 0.12)}
            bars={d.RANGE}
            lines={[]}
            head={false}
            legend={PRICE}
            outlines={found.map((h, k) => ({ from: h.index - 1, to: h.index, color: h.direction === 'bullish' ? UP : DOWN, opacity: step(k) }))}
            notes={[{ label: `${shown} harami${shown === 1 ? '' : 's'}, no trend to reverse`, color: DOWN, opacity: fade(f, range + s(0.5)) }]}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- locations

/** The lesson's three strongest places, as panels, each lit as it is named. */
export function LocationsCinematic() {
  const f = useCurrentFrame();
  const marks = [useMark('sprint', 2), useMark('level', 9), useMark('cross', 14)];
  const state = (i: number) => (f < marks[i] ? 0 : i === marks.filter((m) => f >= m).length - 1 ? 1 : 2);
  const o = (i: number) => (state(i) === 0 ? 0 : fade(f, marks[i]) * (state(i) === 1 ? 1 : 0.55));
  const P = [
    { x0: 120, x1: 660, y0: 240, y1: 900 },
    { x0: 690, x1: 1230, y0: 240, y1: 900 },
    { x0: 1260, x1: 1800, y0: 240, y1: 900 },
  ];
  const plot = (i: number) => ({ left: P[i].x0 + 30, right: P[i].x1 - 100, top: P[i].y0 + 100, bottom: 760 });
  const series = [d.LOC_SPRINT, d.LOC_LEVEL, d.CROSS.slice(0, 8)];
  return (
    <AbsoluteFill>
      <Headline kicker="The strongest haramis" at={s(0.3)}>
        After a big sprint, at a level, or with a doji inside
      </Headline>
      <Panel {...P[0]} title="1 · A big sprint first" state={state(0)} />
      <Panel {...P[1]} title="2 · At support or resistance" state={state(1)} />
      <Panel {...P[2]} title="3 · A doji inside" state={state(2)} />
      {series.map((bars, i) => (
        <AbsoluteFill key={i} style={{ opacity: o(i) }}>
          <CinematicChart
            cam={view(bars, -0.7, 7.7, 0.16)}
            bars={bars}
            lines={[]}
            head={false}
            maxBody={40}
            plot={plot(i)}
            outlines={[{ from: 6, to: 7, color: UP, opacity: 1 }]}
            levels={i === 1 ? [{ price: d.LOC_SUPPORT, label: `support ${d.LOC_SUPPORT}`, color: SOFT, opacity: 1 }] : []}
            notes={i === 0 ? [{ label: `big body: ${d.SPRINT_RATIO.toFixed(1)}× usual`, color: SOFT, opacity: 1 }] : i === 2 ? [{ label: 'doji inside', color: SOFT, opacity: 1 }] : []}
          />
        </AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- confirm

/** Confirmation on the figure: the third candle clears the small candle's high, the midpoint and the big candle's open. */
export function ConfirmCinematic() {
  const f = useCurrentFrame();
  const high = useMark('high', 8);
  const mid = useMark('mid', 13);
  const promote = useMark('promote', 16);
  const b = d.BULL;
  const third = interpolate(f, [high + s(0.4), high + s(3)], [0, 1], clamp);
  const head = f < high ? 'Confirmation matters most for a harami' : f < promote ? 'A third candle closes above the small candle' : 'Above the big open: a three inside up';
  return (
    <AbsoluteFill>
      <Headline key={head} kicker="Confirmation" at={f < high ? s(0.3) : f < promote ? high : promote} accent={f < high ? undefined : UP}>
        {head}
      </Headline>
      <CinematicChart
        cam={view(b, 1.5, 9.8, 0.16)}
        bars={grow(b, 8, third)}
        lines={[]}
        head={false}
        maxBody={80}
        draw={upto(f >= high + s(0.4) ? 8 : 7, b.length)}
        legend={PRICE}
        spotlight={{ index: 8, value: b[8].c, radius: 460, strength: fade(f, high) * 0.7 }}
        outlines={[{ from: 6, to: 7, color: ACCENT, opacity: 1 }]}
        levels={[
          { price: d.BULL_SMALL_HIGH, label: `small candle high ${fmt(d.BULL_SMALL_HIGH)}`, color: ACCENT, opacity: fade(f, high) },
          { price: d.BULL_MID, label: `big candle middle ${fmt(d.BULL_MID)}`, color: SOFT, opacity: fade(f, mid) },
          { price: d.BULL_BIG_OPEN, label: `big candle open ${fmt(d.BULL_BIG_OPEN)}`, color: UP, opacity: fade(f, promote) },
        ]}
        notes={[{ label: `third close ${fmt(d.BULL_THIRD_CLOSE)}: three inside up (lesson 12)`, color: UP, opacity: fade(f, promote + s(1)), index: 8 }]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- trade

/** The lesson's trade idea on the figure: entry, stop and the risk between them, all from the data. */
export function TradeCinematic() {
  const f = useCurrentFrame();
  const entry = useMark('entry', 4);
  const stop = useMark('stop', 10);
  const size = useMark('size', 21);
  const b = d.BULL;
  const head = f < entry ? 'A trade idea to practise' : f < stop ? "Entry: the confirmation closes above the harami's high" : f < size ? 'Stop: below the big red candle' : 'The stop is far away: size for it';
  const spot = f >= stop ? { index: 6, value: d.BULL_STOP + 1, radius: 440, strength: fade(f, stop) * 0.75 } : { index: 8, value: d.BULL_ENTRY, radius: 460, strength: fade(f, entry) * 0.7 };
  return (
    <AbsoluteFill>
      <Headline key={head} kicker="A trade idea" at={f < entry ? s(0.3) : f < stop ? entry : f < size ? stop : size} accent={f < entry ? undefined : f < stop ? UP : f < size ? DOWN : ACCENT}>
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
        outlines={[{ from: 6, to: 7, color: ACCENT, opacity: 1 }]}
        levels={[
          { price: d.BULL_SMALL_HIGH, label: `harami high ${fmt(d.BULL_SMALL_HIGH)}`, color: SOFT, opacity: fade(f, s(1)) },
          { price: d.BULL_ENTRY, label: `entry ${fmt(d.BULL_ENTRY)}`, color: UP, opacity: fade(f, entry + s(0.5)) },
          { price: d.BULL_STOP, label: `stop ${fmt(d.BULL_STOP)}`, color: DOWN, opacity: fade(f, stop + s(0.5)) },
        ]}
        brackets={[{ index: 8, from: d.BULL_STOP, to: d.BULL_ENTRY, color: ACCENT, opacity: fade(f, stop + s(2)), label: `risk ${fmt(d.BULL_RISK)}` }]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- trap

/** The lesson's warning: buying the small candle's close, and the trend resuming through the stop; against waiting. */
export function TrapCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const buy = at(0.08);
  const resume = at(0.45);
  const wait = at(0.75);
  const cam = view(d.TRAP_RESUME, 2.5, 8.7, 0.18);
  return (
    <AbsoluteFill>
      <Headline kicker="A stall is not a turn" at={s(0.3)} accent="var(--color-danger)">
        Buying the small candle: the most common mistake
      </Headline>
      <CornerTag label="Left: illustration · Right: synthetic data" />
      <div style={{ position: 'absolute', left: 160, top: 270, fontSize: 36, fontWeight: 700, color: 'var(--color-ink)', opacity: fade(f, buy) }}>Buy at the small candle's close</div>
      <AbsoluteFill style={{ opacity: fade(f, buy) }}>
        <CinematicChart
          cam={cam}
          bars={grow(d.TRAP_RESUME, 8, interpolate(f, [resume, resume + s(2)], [0, 1], clamp))}
          lines={[]}
          head={false}
          maxBody={60}
          draw={upto(f >= resume ? 8 : 7, d.TRAP_RESUME.length)}
          plot={{ left: 160, right: 780, top: 340, bottom: 800 }}
          outlines={[{ from: 6, to: 7, color: ACCENT, opacity: 1 }]}
          levels={[
            { price: d.TRAP_BUY, label: `bought ${fmt(d.TRAP_BUY)}`, color: ACCENT, opacity: 1 },
            { price: d.BULL_STOP, label: `stop ${fmt(d.BULL_STOP)}`, color: DOWN, opacity: 1 },
          ]}
          notes={[{ label: 'the trend resumed: stopped out', color: DOWN, opacity: fade(f, resume + s(2)), index: 8 }]}
        />
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 1040, top: 270, fontSize: 36, fontWeight: 700, color: 'var(--color-ink)', opacity: fade(f, wait) }}>Wait for the third candle</div>
      <AbsoluteFill style={{ opacity: fade(f, wait) }}>
        <CinematicChart
          cam={cam}
          bars={grow(d.BULL, 8, interpolate(f, [wait, wait + s(2)], [0, 1], clamp))}
          lines={[]}
          head={false}
          maxBody={60}
          draw={upto(f >= wait ? 8 : 7, d.BULL.length)}
          plot={{ left: 1040, right: 1660, top: 340, bottom: 800 }}
          outlines={[{ from: 6, to: 7, color: ACCENT, opacity: 1 }]}
          notes={[{ label: 'confirmed: now act', color: UP, opacity: fade(f, wait + s(2)), index: 8 }]}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- reliability

/** Bulkowski's published results, credited, against a coin flip: none of the four clears it by much. */
export function ReliabilityCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const cross = useMark('cross', 12);
  const lesson = useMark('lesson', 22);
  const L = 760;
  const R = 1640;
  const X = (pct: number) => L + (pct / 100) * (R - L);
  const bar = (label: string, pct: number, color: string, y: number, start: number) => {
    const fill = interpolate(f, [start, start + s(1.2)], [0, pct], { ...clamp, easing: Easing.out(Easing.cubic) });
    return (
      <g opacity={fade(f, start)}>
        <text x={L - 30} y={y + 42} textAnchor="end" fontSize={36} fontWeight={700} fill={color} fontFamily="var(--font-sans)">
          {label}
        </text>
        <rect x={L} y={y} width={R - L} height={62} rx={12} fill="var(--color-surface-1)" stroke="var(--color-line)" strokeWidth={2} />
        <rect x={L} y={y} width={X(fill) - L} height={62} rx={12} fill={color} opacity={0.85} />
        <text x={R + 30} y={y + 46} fontSize={44} fontWeight={700} fill={color} fontFamily="var(--font-mono)">
          {Math.round(fill)}%
        </text>
      </g>
    );
  };
  return (
    <AbsoluteFill>
      <Headline kicker="Honest reliability" at={s(0.3)}>
        How often did it reverse the trend?
      </Headline>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <text x={X(50)} y={282} textAnchor="middle" fontSize={28} fill={SOFT} fontFamily="var(--font-sans)" opacity={fade(f, at(0.03))}>
          coin flip: 50%
        </text>
        {bar('Bullish harami', d.BULKOWSKI_BULLISH, UP, 300, at(0.06))}
        {bar('Bearish harami', d.BULKOWSKI_BEARISH, DOWN, 390, at(0.2))}
        {bar('Bullish harami cross', d.BULKOWSKI_CROSS_BULLISH, UP, 480, cross + s(1.2))}
        {bar('Bearish harami cross', d.BULKOWSKI_CROSS_BEARISH, DOWN, 570, cross + s(3))}
        {/* The coin-flip line is drawn last but thin and dashed, so every bar and number stays readable. */}
        <line x1={X(50)} x2={X(50)} y1={292} y2={640} stroke="var(--color-ink)" strokeWidth={3} strokeDasharray="10 8" opacity={0.7 * fade(f, at(0.03))} />
      </svg>
      <div style={{ position: 'absolute', left: 140, right: 140, top: 670, fontSize: 28, color: SOFT, opacity: fade(f, at(0.06)) }}>Source: Thomas Bulkowski's published tests, thepatternsite.com. The share of patterns after which the trend reversed.</div>
      <div style={{ position: 'absolute', left: 140, right: 140, top: 750, opacity: fade(f, lesson + s(0.4)), transform: `translateY(${(1 - fade(f, lesson + s(0.4))) * 20}px)`, borderLeft: `10px solid ${ACCENT}`, background: 'var(--color-surface-1)', borderRadius: 24, padding: '28px 36px' }}>
        <div style={{ fontSize: 38, fontWeight: 700, color: 'var(--color-ink)' }}>All close to a coin flip: a harami tells you what to watch, not what to do</div>
        <div style={{ ...body, fontSize: 32, color: 'var(--color-ink)', marginTop: 8 }}>Add a level and wait for the third candle.</div>
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- takeaways

export function TakeawaysCinematic() {
  return (
    <Recap
      items={[
        ["A big candle, then a small candle whose body sits inside the big one's body.", ACCENT],
        ['It shows momentum stalling, not reversing.', SOFT],
        ['The harami cross, with a doji inside, is traditionally read as a deeper stall.', 'var(--color-chart-2)'],
        ['It needs a trend before it.', DOWN],
        ['Wait for a third candle to close beyond the small candle.', UP],
        ['In testing, haramis are close to a coin flip: the level and the confirmation do the work.', 'var(--color-danger)'],
      ]}
      starts={[0.03, 0.25, 0.37, 0.56, 0.63, 0.77]}
    />
  );
}

// ---------------------------------------------------------------- quiz

/** The lesson's quiz question 4, then the answer on the figure: the third candle confirms. */
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
      <div style={{ opacity: o * (shown && !right ? 0.45 : 1), borderRadius: 24, border: `3px solid ${shown && right ? UP : 'var(--color-line)'}`, background: 'var(--color-surface-1)', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 26 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 42, fontWeight: 700, color: shown ? (right ? UP : DOWN) : ACCENT }}>{shown ? (right ? '✓' : '✕') : letter}</span>
        <span style={{ ...body, fontSize: 38, color: 'var(--color-ink)' }}>{text}</span>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 140, top: 130, width: 840, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={kicker}>Quick check</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 58, fontWeight: 700, margin: 0, lineHeight: 1.15, opacity: fade(f, s(0.4)) }}>A bullish harami forms after a decline. What is the most sensible move?</h2>
          {f >= think && !shown && (
            <svg viewBox="0 0 100 100" style={{ width: 84, flexShrink: 0 }}>
              <circle cx={50} cy={50} r={40} fill="none" stroke="var(--color-line)" strokeWidth={10} />
              <circle cx={50} cy={50} r={40} fill="none" stroke={ACCENT} strokeWidth={10} strokeDasharray={`${ring * 251} 251`} transform="rotate(-90 50 50)" />
            </svg>
          )}
        </div>
        {option('A', 'Buy at the close of the small candle', false, at(0.35))}
        {option('B', "Wait for a third candle to close above the harami's high", true, at(0.5))}
        <div style={{ ...body, fontSize: 34, opacity: fade(f, reveal + s(2)) }}>The small candle only shows a stall. The third candle tells you which way it went.</div>
      </div>
      {shown && (
        <AbsoluteFill style={{ opacity: fade(f, reveal, s(0.6)) }}>
          <CornerTag label={SYNTHETIC} />
          <CinematicChart
            cam={view(d.BULL, 2.5, 9.6, 0.16)}
            bars={grow(d.BULL, 8, interpolate(f, [reveal + s(0.4), reveal + s(2.4)], [0, 1], clamp))}
            lines={[]}
            head={false}
            maxBody={50}
            plot={{ left: 1080, right: 1700, top: 300, bottom: 780 }}
            levels={[{ price: d.BULL_SMALL_HIGH, label: `harami high ${fmt(d.BULL_SMALL_HIGH)}`, color: ACCENT, opacity: 1 }]}
            outlines={[{ from: 6, to: 7, color: ACCENT, opacity: 1 }]}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- end

export function EndCinematic() {
  return <PractiseEnd bars={d.BULL} action="Spot it in the pattern trainer." checks={['Is the small body fully inside?', 'What was the trend before it?']} link="nitoratrading.com/trainer" />;
}
