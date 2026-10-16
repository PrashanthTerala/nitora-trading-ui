/**
 * "Tweezers and Counterattack Lines", cinematic (directive V3), on CinematicChart and the shared
 * pieces: every chart is candles, every number on screen comes from ./data.ts, labels sit on what
 * they name (no pointer lines), disclaimer tags go in the corner, and the defended level, the whole
 * point of the lesson, is drawn as a line wherever it matters.
 */
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import type { OHLC } from '@/engine/market/types';
import { CornerTag, ILLUSTRATION, SYNTHETIC, body, kicker, s, useMark, useSpeechAt } from '../kit';
import { CinematicChart } from '../cinematic/CinematicChart';
import { ACCENT, DOWN, PRICE, PatternIntro, PractiseEnd, Recap, SOFT, UP, fmt, grow, upto, view } from '../cinematic/pieces';
import { Headline, clamp, fade } from '../cinematic/scenes';
import * as d from './data';

const LEVEL = 'var(--color-chart-2)';

/** A checklist that lights each item as it is said (the current one bright, earlier ones dimmed). */
function Checklist({ items, left = 1120, top = 320 }: { items: { title: string; detail: string; from: number; mono?: boolean }[]; left?: number; top?: number }) {
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

// ---------------------------------------------------------------- title

export function TweezersIntro() {
  return <PatternIntro kicker="Module 2 · Candlestick patterns · Lesson 9" words={['Tweezers', '&', 'counterattack']} sub="A level tested twice, and defended." bars={d.TW_BOT} growIndex={7} />;
}

// ---------------------------------------------------------------- intro

/** The door that stops at the same point twice; then the tweezer, then the counterattack. */
export function IntroCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const define = useMark('define', 10);
  const counter = useMark('counter', 20);
  const out = fade(f, define, s(0.6));
  // The door swings to the same stop twice: open, back off, open again.
  const angle = interpolate(f, [at(0.04), at(0.1), at(0.14), at(0.18), at(0.24)], [0, 52, 20, 20, 52], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const toCounter = fade(f, counter, s(0.6));
  const chart = (bars: OHLC[], level: number, label: string, note: string, o: number) => (
    <AbsoluteFill style={{ opacity: o }}>
      <CinematicChart
        cam={view(bars, 2.5, 8.6, 0.16)}
        bars={bars}
        lines={[]}
        draw={upto(7, bars.length)}
        head={false}
        maxBody={90}
        legend={PRICE}
        levels={[{ price: level, label, color: LEVEL, opacity: 1 }]}
        outlines={[{ from: 6, to: 7, color: ACCENT, opacity: 1 }]}
        notes={[{ label: note, color: ACCENT, opacity: 1, index: 6.5 }]}
      />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      <Headline key={f < define ? 'a' : f < counter ? 'b' : 'c'} kicker={f < define ? 'The idea' : 'This lesson'} at={f < define ? s(0.3) : f < counter ? define : counter} accent={f < define ? undefined : LEVEL}>
        {f < define ? 'A door that stops at the same point, twice' : f < counter ? 'Tweezer: the same low, twice' : 'Counterattack: a gap, then all the way back'}
      </Headline>
      {f < define + s(0.6) && (
        <AbsoluteFill style={{ opacity: 1 - out }}>
          <CornerTag label={ILLUSTRATION} />
          <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <rect x={760} y={320} width={20} height={560} fill={SOFT} />
            {/* The door, seen from above: a panel turning on its hinge. */}
            <line x1={780} y1={600} x2={780 + 360 * Math.cos((angle * Math.PI) / 180)} y2={600 + 360 * Math.sin((angle * Math.PI) / 180)} stroke="#c9a86a" strokeWidth={22} strokeLinecap="round" />
            <line x1={780} y1={600} x2={780 + 420 * Math.cos((52 * Math.PI) / 180)} y2={600 + 420 * Math.sin((52 * Math.PI) / 180)} stroke={LEVEL} strokeWidth={4} strokeDasharray="12 10" opacity={fade(f, at(0.1))} />
            <text x={1080} y={950} fontSize={32} fontWeight={700} fill={LEVEL} fontFamily="var(--font-sans)" opacity={fade(f, at(0.1))}>
              the same stop, twice
            </text>
          </svg>
        </AbsoluteFill>
      )}
      {f >= define && (
        <AbsoluteFill style={{ opacity: out }}>
          <CornerTag label={SYNTHETIC} />
          {chart(d.TW_BOT, d.SHARED_LOW, `same low ${fmt(d.SHARED_LOW)}`, 'stopped at the same price twice', 1 - toCounter)}
          {toCounter > 0 && chart(d.CA_BULL, d.CA_FIRST_CLOSE, `first close ${fmt(d.CA_FIRST_CLOSE)}`, 'gapped down, closed back here', toCounter)}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- rules

export function RulesCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const trend = useMark('trend', 2);
  const lows = useMark('lows', 4);
  const colour = useMark('colour', 9);
  const b = d.TW_BOT;
  const g = interpolate(f, [lows, lows + s(2.2)], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Headline kicker="The exact rules" at={s(0.3)}>
        Tweezer bottom: two candles, one low
      </Headline>
      <CinematicChart
        cam={view(b, 2.3, 7.8, 0.14)}
        bars={grow(b, 7, g)}
        lines={[]}
        draw={upto(f >= lows ? 7 : 6, b.length)}
        head={false}
        maxBody={70}
        plot={{ left: 120, right: 960, top: 300, bottom: 900 }}
        regions={[{ from: -0.5, to: 5.5, color: DOWN, opacity: fade(f, trend) * (1 - fade(f, lows)) }]}
        levels={[{ price: d.SHARED_LOW, label: `same low ${fmt(d.SHARED_LOW)}`, color: LEVEL, opacity: fade(f, lows + s(2.2)) }]}
      />
      <Checklist
        items={[
          { title: 'After a decline', detail: 'a trend to reverse', from: Math.max(trend, at(0.02)) },
          { title: 'Two candles, the same low', detail: `${fmt(b[6].l)} and ${fmt(b[7].l)}`, from: lows, mono: true },
          { title: 'Colour comes second', detail: 'red, then green, here', from: colour },
          { title: 'A reversal shape helps', detail: 'here: a strong green candle', from: at(0.72) },
        ]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- psychology

export function PsychologyCinematic() {
  const f = useCurrentFrame();
  const day1 = useMark('day1', 0.5);
  const day2 = useMark('day2', 3.5);
  const floor = useMark('floor', 8);
  const b = d.TW_BOT;
  const g = interpolate(f, [day2 + s(0.3), Math.max(day2 + s(2.4), floor - s(0.5))], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Headline key={String(f >= floor)} kicker="The psychology" at={f >= floor ? floor : s(0.3)} accent={f >= floor ? UP : undefined}>
        {f >= floor ? 'A floor: the level just became support' : 'Two attempts, stopped at the same price'}
      </Headline>
      <CinematicChart
        cam={view(b, 2.5, 8.6, 0.16)}
        bars={grow(b, 7, g)}
        lines={[]}
        draw={interpolate(f, [0, s(1)], [0.05, 1], clamp) * upto(f >= day2 ? 7 : 6, b.length)}
        head={false}
        maxBody={80}
        legend={PRICE}
        spotlight={{ index: f >= day2 ? 7 : 6, value: d.SHARED_LOW + 1, radius: 440, strength: fade(f, day1) * 0.7 }}
        levels={[{ price: d.SHARED_LOW, label: f < floor ? `day 1 low ${fmt(d.SHARED_LOW)}` : `support ${fmt(d.SHARED_LOW)}`, color: LEVEL, opacity: fade(f, day1 + s(1)) }]}
        outlines={[{ from: 6, to: 7, color: ACCENT, opacity: fade(f, floor) }]}
        notes={[
          { label: 'day 1: stopped here', color: DOWN, opacity: fade(f, day1 + s(1)) * (1 - fade(f, day2)), index: 6 },
          { label: 'day 2: the same price, to the cent', color: UP, opacity: fade(f, day2 + s(2)) * (1 - fade(f, floor)), index: 7 },
        ]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- castle

/** The lesson's picture: two bounces that stop at exactly the same height. */
export function CastleCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const FLOOR = 760;
  // Two bounces: up, down to the floor, up, down to the floor again.
  const t1 = at(0.15);
  const t2 = at(0.4);
  const bounce = (t0: number) => {
    const p = (f - t0) / s(1.4);
    return p >= 0 && p <= 1 ? Math.abs(Math.sin(p * Math.PI)) : 0;
  };
  const yy = FLOOR - 40 - 300 * Math.max(bounce(t1), bounce(t2));
  const x = interpolate(f, [t1, t2 + s(1.4)], [760, 1160], clamp);
  return (
    <AbsoluteFill>
      <Headline kicker="Picture it" at={s(0.3)}>
        Two identical bounces show where the floor is
      </Headline>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect x={520} y={FLOOR} width={880} height={60} rx={20} fill="var(--color-chart-2)" opacity={0.35} />
        <circle cx={x} cy={yy} r={40} fill={UP} />
        {[t1, t2].map((t, k) => (
          <circle key={k} cx={k === 0 ? 760 : 1160} cy={FLOOR - 40} r={44} fill="none" stroke={LEVEL} strokeWidth={4} strokeDasharray="8 6" opacity={fade(f, t + s(1.4))} />
        ))}
        <line x1={520} x2={1400} y1={FLOOR} y2={FLOOR} stroke={LEVEL} strokeWidth={4} strokeDasharray="14 10" opacity={fade(f, t2 + s(1.4))} />
        <text x={960} y={FLOOR + 110} textAnchor="middle" fontSize={34} fontWeight={700} fill={LEVEL} fontFamily="var(--font-sans)" opacity={fade(f, t2 + s(1.4))}>
          the same height twice: that is the floor
        </text>
      </svg>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- top

export function TopCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const high = useMark('high', 3);
  const b = d.TW_TOP;
  const g = interpolate(f, [high, high + s(2.2)], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Headline kicker="The mirror image" at={s(0.3)} accent={DOWN}>
        Tweezer top: the same high, twice
      </Headline>
      <CinematicChart
        cam={view(b, 2.5, 8.6, 0.16)}
        bars={grow(b, 7, g)}
        lines={[]}
        draw={upto(f >= high ? 7 : 6, b.length)}
        head={false}
        maxBody={80}
        legend={PRICE}
        spotlight={{ index: 6.5, value: d.SHARED_HIGH - 1, radius: 440, strength: fade(f, high) * 0.7 }}
        levels={[{ price: d.SHARED_HIGH, label: f < at(0.75) ? `same high ${fmt(d.SHARED_HIGH)}` : `resistance ${fmt(d.SHARED_HIGH)}`, color: LEVEL, opacity: fade(f, high + s(2.2)) }]}
        notes={[{ label: 'sold into, twice', color: DOWN, opacity: fade(f, high + s(2.6)), index: 6.5 }]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- counterattack

export function CounterattackCinematic() {
  const f = useCurrentFrame();
  const gap = useMark('gap', 4);
  const close = useMark('close', 8);
  const b = d.CA_BULL;
  const g = interpolate(f, [gap + s(0.3), Math.max(gap + s(2.5), close + s(1.5))], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Headline kicker="Counterattack line" at={s(0.3)} accent={UP}>
        Counterattack: gaps down, closes back at the close
      </Headline>
      <CinematicChart
        cam={view(b, 2.5, 8.6, 0.16)}
        bars={grow(b, 7, g)}
        lines={[]}
        draw={upto(f >= gap ? 7 : 6, b.length)}
        head={false}
        maxBody={80}
        legend={PRICE}
        spotlight={{ index: 7, value: (b[7].o + b[7].c) / 2, radius: 440, strength: fade(f, gap) * 0.7 }}
        levels={[{ price: d.CA_FIRST_CLOSE, label: `first close ${fmt(d.CA_FIRST_CLOSE)}`, color: LEVEL, opacity: fade(f, gap) }]}
        brackets={[{ index: 7, from: b[7].o, to: b[7].c, color: UP, opacity: fade(f, close + s(1.5)), label: '' }]}
        notes={[
          { label: `opens ${fmt(b[7].o)}: a ${fmt(d.CA_GAP)} gap down`, color: DOWN, opacity: fade(f, gap + s(0.8)) * (1 - fade(f, close)), index: 7 },
          { label: `the ${fmt(d.CA_GAP)} gap, erased`, color: UP, opacity: fade(f, close + s(1.5)), index: 7 },
        ]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- compare

/** Against the piercing line: back to the close vs past the middle; then the bearish mirror. */
export function CompareCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const weaker = useMark('weaker', 5);
  const gap = useMark('gap', 11);
  const mirror = at(0.84);
  const toMirror = fade(f, mirror, s(0.6));
  const half = (bars: OHLC[], left: number, title: string, level: number, label: string, o: number) => (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: 'absolute', left, top: 270, fontSize: 34, fontWeight: 700, color: 'var(--color-ink)' }}>{title}</div>
      <CinematicChart
        cam={view(bars, 3.4, 7.7, 0.14)}
        bars={bars}
        lines={[]}
        head={false}
        maxBody={60}
        draw={upto(7, bars.length)}
        plot={{ left, right: left + 620, top: 340, bottom: 860 }}
        levels={[{ price: level, label, color: LEVEL, opacity: 1 }]}
      />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      <Headline key={String(f >= gap)} kicker="Compared with the piercing line" at={f >= gap ? gap : s(0.3)} accent={f >= gap ? ACCENT : undefined}>
        {f >= gap ? 'Its punch is the size of the gap it erased' : 'Back to the close, not into the body'}
      </Headline>
      <CornerTag label={SYNTHETIC} />
      {half(d.CA_BULL, 160, `Counterattack: a ${fmt(d.CA_GAP)} gap, erased`, d.CA_FIRST_CLOSE, `close ${fmt(d.CA_FIRST_CLOSE)}`, fade(f, s(0.4)))}
      {half(d.PIERCE, 1040, 'Piercing line: past the middle', d.PIERCE_MID, `middle ${fmt(d.PIERCE_MID)}`, fade(f, at(0.04)) * (1 - toMirror))}
      {toMirror > 0 && half(d.CA_BEAR, 1040, 'Bearish counterattack: the mirror', d.CA_BEAR_FIRST_CLOSE, `close ${fmt(d.CA_BEAR_FIRST_CLOSE)}`, toMirror)}
      <div style={{ position: 'absolute', left: 160, top: 920, ...body, fontSize: 32, color: 'var(--color-ink)', opacity: fade(f, weaker) * (1 - fade(f, gap)) }}>
        On paper, weaker: it never gets into the first body.
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- valid

export function ValidCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const range = useMark('range', 9);
  const toRange = at(0.4);
  const showRange = fade(f, toRange, s(0.6));
  const found = d.RANGE_TWEEZERS;
  const step = (k: number) => fade(f, range + s(0.4) + k * s(0.5), s(0.3));
  const shown = found.filter((_, k) => step(k) > 0.5).length;
  return (
    <AbsoluteFill>
      <Headline key={String(f >= range)} kicker="Where they are valid" at={f >= range ? range : s(0.3)} accent={f >= range ? DOWN : undefined}>
        {f >= range ? `Sideways: ${d.RANGE_TWEEZER_COUNT} matching pairs, not one signal` : 'A trend first: tweezers are easy to over-find'}
      </Headline>
      <CornerTag label={SYNTHETIC} />
      <AbsoluteFill style={{ opacity: 1 - showRange }}>
        <CinematicChart cam={view(d.TW_BOT, -0.8, 8.8, 0.16)} bars={d.TW_BOT} lines={[]} head={false} maxBody={80} draw={upto(7, d.TW_BOT.length)} legend={PRICE} regions={[{ from: -0.5, to: 5.5, color: DOWN, opacity: fade(f, s(1)), label: 'a decline first' }]} outlines={[{ from: 6, to: 7, color: ACCENT, opacity: fade(f, s(2)) }]} />
      </AbsoluteFill>
      {showRange > 0 && (
        <AbsoluteFill style={{ opacity: showRange }}>
          <CinematicChart
            cam={view(d.RANGE, -1.5, d.RANGE.length + 0.5, 0.12)}
            bars={d.RANGE}
            lines={[]}
            head={false}
            legend={PRICE}
            outlines={found.map((t, k) => ({ from: t.index - 1, to: t.index, color: t.kind === 'bottom' ? UP : DOWN, opacity: step(k) }))}
            notes={[{ label: `${shown} matching pair${shown === 1 ? '' : 's'}, no trend to reverse`, color: DOWN, opacity: fade(f, range + s(0.4)) }]}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- confirm

export function ConfirmCinematic() {
  const f = useCurrentFrame();
  const third = useMark('third', 0.5);
  const b = d.TW_BOT;
  const g = interpolate(f, [third + s(0.4), third + s(3)], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Headline kicker="Confirmation" at={s(0.3)} accent={UP}>
        Confirmation: a close above the pattern's high
      </Headline>
      <CinematicChart
        cam={view(b, 1.5, 9.8, 0.16)}
        bars={grow(b, 8, g)}
        lines={[]}
        head={false}
        maxBody={80}
        draw={upto(f >= third + s(0.4) ? 8 : 7, b.length)}
        legend={PRICE}
        spotlight={{ index: 8, value: b[8].c, radius: 460, strength: fade(f, third) * 0.7 }}
        outlines={[{ from: 6, to: 7, color: ACCENT, opacity: 1 }]}
        levels={[
          { price: d.PATTERN_HIGH, label: `pattern high ${fmt(d.PATTERN_HIGH)}`, color: UP, opacity: fade(f, third) },
          { price: d.SHARED_LOW, label: `shared low ${fmt(d.SHARED_LOW)}`, color: LEVEL, opacity: 1 },
        ]}
        notes={[{ label: `third close ${fmt(d.CONFIRM_CLOSE)}`, color: UP, opacity: fade(f, third + s(3)), index: 8 }]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- trade

export function TradeCinematic() {
  const f = useCurrentFrame();
  const entry = useMark('entry', 2);
  const stop = useMark('stop', 8);
  const b = d.TW_BOT;
  const head = f < entry ? 'A trade idea to practise' : f < stop ? "Entry: a close above the pattern's high" : 'Stop: a small buffer below the shared low';
  return (
    <AbsoluteFill>
      <Headline key={head} kicker="A trade idea" at={f < entry ? s(0.3) : f < stop ? entry : stop} accent={f < entry ? undefined : f < stop ? UP : DOWN}>
        {head}
      </Headline>
      <CinematicChart
        cam={view(b, 1.5, 9.8, 0.16)}
        bars={b}
        lines={[]}
        head={false}
        maxBody={80}
        legend={PRICE}
        spotlight={f >= stop ? { index: 6.5, value: d.SHARED_LOW + 1, radius: 440, strength: fade(f, stop) * 0.75 } : { index: 8, value: d.ENTRY, radius: 460, strength: fade(f, entry) * 0.7 }}
        outlines={[{ from: 6, to: 7, color: ACCENT, opacity: 1 }]}
        levels={[
          { price: d.ENTRY, label: `entry ${fmt(d.ENTRY)}`, color: UP, opacity: fade(f, entry + s(0.5)) },
          { price: d.SHARED_LOW, label: `shared low ${fmt(d.SHARED_LOW)}`, color: LEVEL, opacity: 1 - fade(f, stop) },
          { price: d.STOP, label: `stop ${fmt(d.STOP)}`, color: DOWN, opacity: fade(f, stop + s(0.5)) },
        ]}
        brackets={[{ index: 8, from: d.STOP, to: d.ENTRY, color: ACCENT, opacity: fade(f, stop + s(2.5)), label: `risk ${fmt(d.RISK)}` }]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- warning

/** The lesson's three questions, asked of the figure. */
export function WarningCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const b = d.TW_BOT;
  return (
    <AbsoluteFill>
      <Headline kicker="Two prongs, or just noise?" at={s(0.3)} accent="var(--color-danger)">
        Three questions before you count a tweezer
      </Headline>
      <CinematicChart
        cam={view(b, 2.3, 7.8, 0.14)}
        bars={b}
        lines={[]}
        draw={upto(7, b.length)}
        head={false}
        maxBody={70}
        plot={{ left: 120, right: 960, top: 300, bottom: 900 }}
        regions={[{ from: -0.5, to: 5.5, color: DOWN, opacity: fade(f, at(0.22)) * (1 - fade(f, at(0.4))) }]}
        levels={[{ price: d.SHARED_LOW, label: `same low ${fmt(d.SHARED_LOW)}`, color: LEVEL, opacity: fade(f, at(0.4)) }]}
        outlines={[{ from: 7, to: 7, color: ACCENT, opacity: fade(f, at(0.58)) }]}
      />
      <Checklist
        items={[
          { title: 'Was there a trend to reverse?', detail: 'a decline, here', from: at(0.22) },
          { title: 'Does the level match an old one?', detail: 'a prior low, a round number, an average', from: at(0.4) },
          { title: 'Is candle two a reversal shape?', detail: 'a strong green candle, here', from: at(0.58) },
        ]}
      />
      <div style={{ position: 'absolute', left: 1120, right: 120, top: 760, ...body, fontSize: 32, color: 'var(--color-ink)', opacity: fade(f, at(0.78)) }}>
        Three no's: two candles, <span style={{ color: DOWN, fontWeight: 700 }}>not a tweezer</span>.
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- reliability

/** Bulkowski's results, each measured the way he reports it: tweezers as continuation, counterattacks as reversal. */
export function ReliabilityCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const counter = useMark('counter', 10);
  const use = useMark('use', 19);
  const L = 820;
  const R = 1640;
  const X = (pct: number) => L + (pct / 100) * (R - L);
  const bar = (label: string, pct: number, color: string, y: number, start: number) => {
    const fill = interpolate(f, [start, start + s(1.2)], [0, pct], { ...clamp, easing: Easing.out(Easing.cubic) });
    return (
      <g opacity={fade(f, start)}>
        <text x={L - 30} y={y + 42} textAnchor="end" fontSize={34} fontWeight={700} fill={color} fontFamily="var(--font-sans)">
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
        Close to a coin flip, all four
      </Headline>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <text x={X(50)} y={262} textAnchor="middle" fontSize={28} fill={SOFT} fontFamily="var(--font-sans)" opacity={fade(f, at(0.03))}>
          coin flip: 50%
        </text>
        <text x={120} y={300} fontSize={26} fontWeight={700} fill={SOFT} fontFamily="var(--font-sans)" opacity={fade(f, at(0.06))}>
          THE TREND CARRIED ON
        </text>
        {bar('Tweezer bottom', d.BULKOWSKI_TW_BOTTOM_CONT, DOWN, 320, at(0.08))}
        {bar('Tweezer top', d.BULKOWSKI_TW_TOP_CONT, UP, 400, at(0.22))}
        <text x={120} y={520} fontSize={26} fontWeight={700} fill={SOFT} fontFamily="var(--font-sans)" opacity={fade(f, counter)}>
          IT REVERSED
        </text>
        {bar('Counterattack, bullish', d.BULKOWSKI_MEETING_BULL, UP, 540, counter + s(1))}
        {bar('Counterattack, bearish', d.BULKOWSKI_MEETING_BEAR, DOWN, 620, counter + s(2.5))}
        <line x1={X(50)} x2={X(50)} y1={272} y2={690} stroke="var(--color-ink)" strokeWidth={3} strokeDasharray="10 8" opacity={0.7 * fade(f, at(0.03))} />
      </svg>
      <div style={{ position: 'absolute', left: 140, right: 140, top: 720, fontSize: 26, color: SOFT, opacity: fade(f, counter) }}>Source: Thomas Bulkowski's published tests, thepatternsite.com. Counterattack lines are tested there as "meeting lines".</div>
      <div style={{ position: 'absolute', left: 140, right: 140, top: 790, opacity: fade(f, use + s(0.4)), borderLeft: `10px solid ${ACCENT}`, background: 'var(--color-surface-1)', borderRadius: 24, padding: '26px 36px' }}>
        <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--color-ink)' }}>Their real value: marking a level the market defended</div>
        <div style={{ ...body, fontSize: 30, color: 'var(--color-ink)', marginTop: 6 }}>Add a trend, a prior level and a reversal candle, and it becomes a trade.</div>
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- takeaways

export function TakeawaysCinematic() {
  return (
    <Recap
      items={[
        ['A tweezer: two candles with matching lows after a decline, or matching highs after a rise.', LEVEL],
        ['It shows a level tested twice and defended.', UP],
        ['A counterattack line gaps hard against the trend and closes back at the previous close.', ACCENT],
        ['All of them need a trend before them.', DOWN],
        ['Confirm beyond the second candle; stop just beyond the shared extreme.', 'var(--color-chart-1)'],
        ['On their own, close to a coin flip: use them to find levels.', 'var(--color-danger)'],
      ]}
      starts={[0.03, 0.27, 0.38, 0.56, 0.64, 0.83]}
    />
  );
}

// ---------------------------------------------------------------- quiz

export function QuizCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const think = useMark('think', 9);
  const reveal = useMark('reveal', 12);
  const shown = f >= reveal;
  const ring = interpolate(f, [think, reveal], [0, 1], clamp);
  const pair = d.RANGE_TWEEZERS.filter((t) => t.kind === 'bottom').at(-1) ?? d.RANGE_TWEEZERS[0];
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
      <div style={{ position: 'absolute', left: 140, top: 150, width: 840, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={kicker}>Quick check</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 58, fontWeight: 700, margin: 0, lineHeight: 1.15, opacity: fade(f, s(0.4)) }}>Two candles with the same low, in the middle of a range. What is it?</h2>
          {f >= think && !shown && (
            <svg viewBox="0 0 100 100" style={{ width: 84, flexShrink: 0 }}>
              <circle cx={50} cy={50} r={40} fill="none" stroke="var(--color-line)" strokeWidth={10} />
              <circle cx={50} cy={50} r={40} fill="none" stroke={ACCENT} strokeWidth={10} strokeDasharray={`${ring * 251} 251`} transform="rotate(-90 50 50)" />
            </svg>
          )}
        </div>
        {option('A', 'A strong tweezer bottom', false, at(0.3))}
        {option('B', 'Noise: there is no trend to reverse', true, at(0.42))}
        <div style={{ ...body, fontSize: 34, opacity: fade(f, reveal + s(2)) }}>Ranges produce matching lows all the time.</div>
      </div>
      {shown && (
        <AbsoluteFill style={{ opacity: fade(f, reveal, s(0.6)) }}>
          <CornerTag label={SYNTHETIC} />
          <CinematicChart
            cam={view(d.RANGE, -1.5, d.RANGE.length + 0.5, 0.12)}
            bars={d.RANGE}
            lines={[]}
            head={false}
            plot={{ left: 1080, right: 1700, top: 300, bottom: 820 }}
            outlines={[{ from: pair.index - 1, to: pair.index, color: DOWN, opacity: 1 }]}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- end

export function EndCinematic() {
  return <PractiseEnd bars={d.TW_BOT} action="Spot them in the pattern trainer." checks={['Do the lows (or highs) match?', 'Was there a trend before them?']} link="nitoratrading.com/trainer" />;
}
