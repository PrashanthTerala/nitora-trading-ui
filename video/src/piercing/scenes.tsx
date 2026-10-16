/**
 * "Piercing Line and Dark Cloud Cover", cinematic (directive V3), on CinematicChart and the shared
 * pieces: every chart is candles, every number on screen comes from ./data.ts, labels sit on what
 * they name (no pointer lines), disclaimer tags go in the corner, and the middle of the first body,
 * the whole point of the lesson, is drawn as a line wherever it matters.
 */
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import type { OHLC } from '@/engine/market/types';
import { CornerTag, ILLUSTRATION, SYNTHETIC, body, kicker, s, useMark, useSpeechAt } from '../kit';
import { CinematicChart, cameraAt, type Camera } from '../cinematic/CinematicChart';
import { ACCENT, DOWN, PRICE, PatternIntro, PractiseEnd, Recap, SOFT, UP, fmt, grow, upto, view } from '../cinematic/pieces';
import { Headline, clamp, fade } from '../cinematic/scenes';
import * as d from './data';

const MID = 'var(--color-chart-2)';

// ---------------------------------------------------------------- title

export function PiercingIntro() {
  return <PatternIntro kicker="Module 2 · Candlestick patterns · Lesson 8" words={['Piercing', 'line', '&', 'dark', 'cloud']} sub="Past the middle of the rope." bars={d.PIERCE} growIndex={7} />;
}

// ---------------------------------------------------------------- intro

/** The tug of war, then the pattern: the second candle closing past the middle of the first body. */
export function IntroCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const define = useMark('define', 12);
  const half = useMark('half', 22);
  const out = fade(f, define, s(0.6));
  const STEP = 70;
  // The rope's mark: dragged five steps toward the other team, back three, then six past the middle.
  const pos = interpolate(f, [at(0.05), at(0.14), at(0.2), at(0.27), at(0.31), at(0.4)], [0, 5, 5, 2, 2, -4], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const markX = 960 + pos * STEP;
  const grown = interpolate(f, [define + s(0.6), define + s(3)], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Headline key={String(f >= define)} kicker={f < define ? 'The idea' : 'The halfway rule'} at={f < define ? s(0.3) : define} accent={f < define ? undefined : MID}>
        {f < define ? 'A tug of war, and the middle of the rope' : 'Past the middle: more than half won back'}
      </Headline>
      {f < define + s(0.6) && (
        <AbsoluteFill style={{ opacity: 1 - out }}>
          <CornerTag label={ILLUSTRATION} />
          <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <line x1={960} x2={960} y1={420} y2={780} stroke={SOFT} strokeWidth={4} strokeDasharray="14 10" />
            <text x={960} y={400} textAnchor="middle" fontSize={34} fontWeight={700} fill={SOFT} fontFamily="var(--font-sans)">
              the middle
            </text>
            <line x1={220} x2={1700} y1={600} y2={600} stroke="#c9a86a" strokeWidth={14} strokeLinecap="round" />
            <rect x={markX - 14} y={570} width={28} height={60} rx={6} fill={DOWN} />
            <text x={300} y={700} fontSize={34} fontWeight={700} fill={UP} fontFamily="var(--font-sans)">
              your team
            </text>
            <text x={1620} y={700} textAnchor="end" fontSize={34} fontWeight={700} fill={SOFT} fontFamily="var(--font-sans)">
              the other team
            </text>
            <text x={markX} y={540} textAnchor="middle" fontSize={30} fill="var(--color-ink)" fontFamily="var(--font-sans)" opacity={fade(f, at(0.2))}>
              {f < at(0.31) ? 'three steps back: still their side' : 'six steps: past the middle'}
            </text>
          </svg>
        </AbsoluteFill>
      )}
      {f >= define && (
        <AbsoluteFill style={{ opacity: out }}>
          <CornerTag label={SYNTHETIC} />
          <CinematicChart
            cam={view(d.PIERCE, 2.5, 8.6, 0.16)}
            bars={grow(d.PIERCE, 7, grown)}
            lines={[]}
            draw={upto(f >= define + s(0.6) ? 7 : 6, d.PIERCE.length)}
            head={false}
            maxBody={90}
            legend={PRICE}
            levels={[{ price: d.PIERCE_MID, label: `middle ${fmt(d.PIERCE_MID)}`, color: MID, opacity: fade(f, define + s(0.4)) }]}
            outlines={[{ from: 6, to: 7, color: ACCENT, opacity: fade(f, half) }]}
            notes={[{ label: 'more than half won back', color: UP, opacity: fade(f, half + s(0.4)), index: 7 }]}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- rules

/** The four rules on the figure itself, each lighting its level and its line in the checklist. */
export function RulesCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const trend = useMark('trend', 2);
  const gap = useMark('gap', 6);
  const mid = useMark('mid', 10);
  const open = useMark('open', 14);
  const b = d.PIERCE;
  const g = interpolate(f, [gap + s(0.3), open], [0, 1], clamp);
  const items: { title: string; detail: string; from: number; mono?: boolean }[] = [
    { title: 'After a decline: a big red candle', detail: 'candle one', from: Math.max(trend, at(0.02)) },
    { title: 'Opens below candle one\'s low', detail: `${fmt(d.SECOND_OPEN)} < ${fmt(d.FIRST_LOW)}`, from: gap, mono: true },
    { title: 'Closes above the middle', detail: `${fmt(d.SECOND_CLOSE)} > ${fmt(d.PIERCE_MID)}`, from: mid, mono: true },
    { title: 'But below candle one\'s open', detail: `${fmt(d.SECOND_CLOSE)} < ${fmt(d.FIRST_OPEN)}`, from: open, mono: true },
  ];
  const current = items.filter((it) => f >= it.from).length - 1;
  return (
    <AbsoluteFill>
      <Headline kicker="The exact rules" at={s(0.3)}>
        Piercing line: past the middle, short of the open
      </Headline>
      <CinematicChart
        cam={view(b, 3.3, 7.8, 0.14)}
        bars={grow(b, 7, g)}
        lines={[]}
        draw={upto(f >= gap ? 7 : 6, b.length)}
        head={false}
        maxBody={80}
        plot={{ left: 120, right: 960, top: 300, bottom: 900 }}
        levels={[
          { price: d.FIRST_LOW, label: `low ${fmt(d.FIRST_LOW)}`, color: SOFT, opacity: fade(f, gap) * (1 - fade(f, mid)) },
          { price: d.PIERCE_MID, label: `middle ${fmt(d.PIERCE_MID)}`, color: MID, opacity: fade(f, mid) },
          { price: d.FIRST_OPEN, label: `open ${fmt(d.FIRST_OPEN)}`, color: DOWN, opacity: fade(f, open) },
        ]}
      />
      <div style={{ position: 'absolute', left: 1120, right: 120, top: 320, display: 'flex', flexDirection: 'column', gap: 30 }}>
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
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- psychology

/** Day one, then day two gapping down and climbing back past the middle; who is losing now. */
export function PsychologyCinematic() {
  const f = useCurrentFrame();
  const day1 = useMark('day1', 0.5);
  const day2 = useMark('day2', 4);
  const hurt = useMark('hurt', 13);
  const b = d.PIERCE;
  const g = interpolate(f, [day2 + s(0.5), Math.max(day2 + s(3), hurt - s(0.8))], [0, 1], clamp);
  const cam = cameraAt(f, [
    { at: 0, cam: view(b, -0.8, 8.8, 0.16) },
    { at: day1 + s(0.6), cam: view(b, 2.5, 8.6, 0.16), move: 50 },
  ]);
  return (
    <AbsoluteFill>
      <Headline kicker="The psychology" at={s(0.3)} accent={UP}>
        Piercing line: the sellers wasted their gap
      </Headline>
      <CinematicChart
        cam={cam}
        bars={grow(b, 7, g)}
        lines={[]}
        draw={interpolate(f, [0, s(1)], [0.05, 1], clamp) * upto(f >= day2 ? 7 : 6, b.length)}
        head={false}
        maxBody={80}
        legend={PRICE}
        spotlight={{ index: f >= day2 ? 7 : 6, value: f >= day2 ? (b[7].o + b[7].c) / 2 : (b[6].o + b[6].c) / 2, radius: 460, strength: fade(f, day1 + s(0.6)) * 0.7 }}
        levels={[
          { price: d.PIERCE_MID, label: `middle ${fmt(d.PIERCE_MID)}`, color: MID, opacity: fade(f, day2 + s(1)) },
          { price: d.SECOND_OPEN, label: `gap-down open ${fmt(d.SECOND_OPEN)}`, color: DOWN, opacity: fade(f, hurt) },
        ]}
        notes={[
          { label: 'day 1: a solid win for sellers', color: DOWN, opacity: fade(f, day1 + s(0.6)) * (1 - fade(f, day2)), index: 6 },
          { label: 'day 2: gaps down, then buyers push', color: UP, opacity: fade(f, day2) * (1 - fade(f, hurt)), index: 7 },
          { label: `sold below ${fmt(d.SECOND_CLOSE)}: losing`, color: UP, opacity: fade(f, hurt + s(0.4)), index: 7 },
        ]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- snowball

/** The lesson's picture: one big throw knocks the winning team back more than halfway to its line. */
export function SnowballCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const thr = at(0.32);
  const flight = interpolate(f, [thr, thr + s(0.9)], [0, 1], clamp);
  const push = interpolate(f, [thr + s(0.9), thr + s(2.2)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const START = 1720;
  const from = 900;
  const halfway = (from + START) / 2;
  const teamX = from + push * (1450 - from);
  const bx = 360 + flight * (teamX - 380);
  const by = 600 - Math.sin(flight * Math.PI) * 260;
  return (
    <AbsoluteFill>
      <Headline kicker="Picture it" at={s(0.3)}>
        One big throw, more than halfway back
      </Headline>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect x={200} y={640} width={1520} height={8} rx={4} fill="var(--color-line)" />
        <line x1={START} x2={START} y1={520} y2={700} stroke={SOFT} strokeWidth={5} />
        <text x={START} y={500} textAnchor="end" fontSize={30} fill={SOFT} fontFamily="var(--font-sans)">
          their starting line
        </text>
        <line x1={halfway} x2={halfway} y1={560} y2={700} stroke={MID} strokeWidth={4} strokeDasharray="12 8" opacity={fade(f, thr + s(1.6))} />
        <text x={halfway} y={740} textAnchor="middle" fontSize={30} fill={MID} fontFamily="var(--font-sans)" opacity={fade(f, thr + s(1.6))}>
          halfway back
        </text>
        {[0, 1, 2].map((k) => (
          <circle key={k} cx={teamX + k * 46} cy={610} r={20} fill={DOWN} />
        ))}
        <text x={teamX + 46} y={580} textAnchor="middle" fontSize={30} fontWeight={700} fill={DOWN} fontFamily="var(--font-sans)">
          winning all afternoon
        </text>
        {[0, 1].map((k) => (
          <circle key={k} cx={300 + k * 46} cy={610} r={20} fill={UP} />
        ))}
        {f >= thr && flight < 1 && <circle cx={bx} cy={by} r={18} fill="var(--color-ink)" />}
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 900, textAlign: 'center', ...body, fontSize: 38, color: 'var(--color-ink)', opacity: fade(f, thr + s(2.4)) }}>
        Not a total rout, but the confident team is <span style={{ color: DOWN, fontWeight: 700 }}>not so confident now</span>
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- dark cloud

/** The mirror on the bearish figure: a gap above the high, then a close below the middle. */
export function DarkCloudCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const gap = useMark('gap', 4);
  const mid = useMark('mid', 9);
  const b = d.DARK;
  const g = interpolate(f, [gap + s(0.3), Math.max(gap + s(2.5), mid + s(1.5))], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Headline kicker="The mirror image" at={s(0.3)} accent={DOWN}>
        Dark cloud cover: a gap up, then below the middle
      </Headline>
      <CinematicChart
        cam={view(b, 2.5, 8.6, 0.16)}
        bars={grow(b, 7, g)}
        lines={[]}
        draw={upto(f >= gap ? 7 : 6, b.length)}
        head={false}
        maxBody={80}
        legend={PRICE}
        spotlight={{ index: 7, value: (b[7].o + b[7].c) / 2, radius: 460, strength: fade(f, gap) * 0.7 }}
        levels={[
          { price: d.DARK_FIRST_HIGH, label: `first high ${fmt(d.DARK_FIRST_HIGH)}`, color: SOFT, opacity: fade(f, gap) * (1 - fade(f, mid)) },
          { price: d.DARK_MID, label: `middle ${fmt(d.DARK_MID)}`, color: MID, opacity: fade(f, mid) },
        ]}
        outlines={[{ from: 6, to: 7, color: ACCENT, opacity: fade(f, at(0.75)) }]}
        notes={[
          { label: `opens ${fmt(d.DARK_SECOND_OPEN)}, above the high`, color: DOWN, opacity: fade(f, gap + s(1)) * (1 - fade(f, mid)), index: 7 },
          { label: 'late buyers trapped above the close', color: DOWN, opacity: fade(f, at(0.8)), index: 7 },
        ]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- scale

/** One red body, five second candles: the classic names along the scale, then the honest test result. */
export function ScaleCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const scale = useMark('scale', 4);
  const test = useMark('test', 18);
  const starts = [scale, at(0.2), at(0.27), at(0.42), at(0.48)];
  const cam: Camera = { x0: -0.9, x1: 1.9, y0: 95.6, y1: 105.2 };
  const W = 300;
  const GAP = 45;
  return (
    <AbsoluteFill>
      <Headline key={String(f >= test)} kicker="Why the middle" at={f >= test ? test : s(0.3)} accent={f >= test ? ACCENT : undefined}>
        {f >= test ? 'The middle is a convention: measure, then confirm' : 'One shape, five depths, five names'}
      </Headline>
      {d.SCALE.map((sc, k) => {
        const left = 120 + k * (W + GAP);
        const o = fade(f, starts[k]);
        const thrust = sc.name === 'thrusting';
        return (
          <AbsoluteFill key={sc.name} style={{ opacity: o }}>
            <CinematicChart
              cam={cam}
              bars={[...sc.pair] as OHLC[]}
              lines={[]}
              head={false}
              maxBody={56}
              plot={{ left, right: left + W - 80, top: 300, bottom: 740 }}
              levels={[{ price: d.PIERCE_MID, label: '', color: MID, opacity: 1 }]}
              outlines={thrust ? [{ from: 0, to: 1, color: ACCENT, opacity: fade(f, test) }] : []}
            />
            <div style={{ position: 'absolute', left, width: W - 40, top: 770, textAlign: 'center' }}>
              <div style={{ fontSize: 34, fontWeight: 700, color: sc.reading === 'reversal' ? UP : 'var(--color-ink)' }}>{sc.name}</div>
              <div style={{ fontSize: 26, color: SOFT }}>classic: {sc.reading}</div>
              {thrust && <div style={{ fontSize: 26, fontWeight: 700, color: ACCENT, marginTop: 8, opacity: fade(f, test + s(0.5)) }}>tested: reversed {d.BULKOWSKI_THRUSTING_REVERSAL}%</div>}
            </div>
          </AbsoluteFill>
        );
      })}
      <div style={{ position: 'absolute', left: 120, top: 262, fontSize: 28, fontWeight: 700, color: MID, opacity: fade(f, scale) }}>- - -  the middle of the red body</div>
      <div style={{ position: 'absolute', left: 120, right: 120, top: 990, fontSize: 24, color: SOFT, textAlign: 'center', opacity: fade(f, test + s(0.5)) }}>Tested result: Thomas Bulkowski, thepatternsite.com (Thrusting.html)</div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- valid

/** A trend first; then the gap, which stock markets have and 24-hour markets do not. */
export function ValidCinematic() {
  const f = useCurrentFrame();
  const markets = useMark('markets', 10);
  const split = fade(f, markets, s(0.6));
  const half = (bars: OHLC[], left: number, title: string, note: string) => (
    <>
      <div style={{ position: 'absolute', left, top: 270, fontSize: 36, fontWeight: 700, color: 'var(--color-ink)' }}>{title}</div>
      <CinematicChart cam={view(d.PIERCE, 2.5, 7.8, 0.16)} bars={bars} lines={[]} head={false} maxBody={60} draw={upto(7, bars.length)} plot={{ left, right: left + 620, top: 340, bottom: 800 }} outlines={[{ from: 6, to: 7, color: ACCENT, opacity: 1 }]} notes={[{ label: note, color: ACCENT, opacity: fade(f, markets + s(1)), index: 7 }]} />
    </>
  );
  return (
    <AbsoluteFill>
      <Headline key={String(f >= markets)} kicker="Where it is valid" at={f >= markets ? markets : s(0.3)}>
        {f >= markets ? 'The gap: common in stocks, rare in 24-hour markets' : 'A clear trend first, ideally into support'}
      </Headline>
      <AbsoluteFill style={{ opacity: 1 - split }}>
        <CornerTag label={SYNTHETIC} />
        <CinematicChart cam={view(d.PIERCE, -0.8, 8.8, 0.16)} bars={d.PIERCE} lines={[]} head={false} maxBody={80} draw={upto(7, d.PIERCE.length)} legend={PRICE} regions={[{ from: -0.5, to: 5.5, color: DOWN, opacity: fade(f, s(1)), label: 'a decline first' }]} outlines={[{ from: 6, to: 7, color: ACCENT, opacity: fade(f, s(2)) }]} />
      </AbsoluteFill>
      {split > 0 && (
        <AbsoluteFill style={{ opacity: split }}>
          <CornerTag label="Left: synthetic data · Right: illustration" />
          {half(d.PIERCE, 160, 'Stock: a gap at the open', 'gap down')}
          {half(d.NO_GAP, 1040, '24-hour market: no gap', 'relaxed rule')}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- confirm

export function ConfirmCinematic() {
  const f = useCurrentFrame();
  const third = useMark('third', 0.5);
  const volume = useMark('volume', 9);
  const b = d.PIERCE;
  const g = interpolate(f, [third + s(0.4), third + s(3)], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Headline kicker="Confirmation" at={s(0.3)} accent={UP}>
        Confirmation: a close above the first open
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
        levels={[{ price: d.FIRST_OPEN, label: `first open ${fmt(d.FIRST_OPEN)}`, color: DOWN, opacity: fade(f, third) }]}
        notes={[
          { label: `third close ${fmt(d.CONFIRM_CLOSE)}`, color: UP, opacity: fade(f, third + s(3)), index: 8 },
          { label: 'heavier volume on the second candle adds weight', color: SOFT, opacity: fade(f, volume + s(0.4)) },
        ]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- trade

export function TradeCinematic() {
  const f = useCurrentFrame();
  const entry = useMark('entry', 3);
  const stop = useMark('stop', 9);
  const b = d.PIERCE;
  const head = f < entry ? 'A trade idea to practise' : f < stop ? 'Entry: the confirmation closes above the first open' : "Stop: below the second candle's low";
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
        spotlight={f >= stop ? { index: 7, value: d.PIERCE_STOP + 1, radius: 440, strength: fade(f, stop) * 0.75 } : { index: 8, value: d.PIERCE_ENTRY, radius: 460, strength: fade(f, entry) * 0.7 }}
        outlines={[{ from: 6, to: 7, color: ACCENT, opacity: 1 }]}
        levels={[
          { price: d.PIERCE_ENTRY, label: `entry ${fmt(d.PIERCE_ENTRY)}`, color: UP, opacity: fade(f, entry + s(0.5)) },
          { price: d.PIERCE_STOP, label: `stop ${fmt(d.PIERCE_STOP)}`, color: DOWN, opacity: fade(f, stop + s(0.5)) },
        ]}
        brackets={[{ index: 8, from: d.PIERCE_STOP, to: d.PIERCE_ENTRY, color: ACCENT, opacity: fade(f, stop + s(2.5)), label: `risk ${fmt(d.PIERCE_RISK)}` }]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- measure

/** The lesson's warning, done: the first body's open, close and middle, then the second close, and how far back it reached. */
export function MeasureCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const body1 = at(0.4);
  const middle = at(0.58);
  const close2 = at(0.72);
  const reach = at(0.85);
  const b = d.PIERCE;
  return (
    <AbsoluteFill>
      <Headline kicker="Measure, do not guess" at={s(0.3)} accent={ACCENT}>
        {`Measured: ${d.PIERCE_REACH}% of the body won back`}
      </Headline>
      <CinematicChart
        cam={view(b, 4.6, 8.2, 0.12)}
        bars={b}
        lines={[]}
        head={false}
        maxBody={110}
        draw={upto(7, b.length)}
        legend={PRICE}
        levels={[
          { price: d.FIRST_OPEN, label: `first open ${fmt(d.FIRST_OPEN)}`, color: DOWN, opacity: fade(f, body1) },
          { price: d.FIRST_CLOSE, label: `first close ${fmt(d.FIRST_CLOSE)}`, color: DOWN, opacity: fade(f, body1 + s(0.6)) },
          { price: d.PIERCE_MID, label: `middle ${fmt(d.PIERCE_MID)}`, color: MID, opacity: fade(f, middle) },
          { price: d.SECOND_CLOSE, label: `second close ${fmt(d.SECOND_CLOSE)}`, color: UP, opacity: fade(f, close2) },
        ]}
        brackets={[{ index: 7, from: d.FIRST_CLOSE, to: d.SECOND_CLOSE, color: ACCENT, opacity: fade(f, reach), label: `${d.PIERCE_REACH}% back` }]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- reliability

/** Bulkowski's published rates, each beside its engulfing cousin, against a coin flip. */
export function ReliabilityCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const dark = useMark('dark', 10);
  const use = useMark('use', 18);
  const L = 760;
  const R = 1640;
  const X = (pct: number) => L + (pct / 100) * (R - L);
  const bar = (label: string, pct: number, color: string, y: number, start: number, dim = false) => {
    const fill = interpolate(f, [start, start + s(1.2)], [0, pct], { ...clamp, easing: Easing.out(Easing.cubic) });
    return (
      <g opacity={fade(f, start) * (dim ? 0.6 : 1)}>
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
        {bar('Piercing line', d.BULKOWSKI_PIERCING, UP, 300, at(0.06))}
        {bar('Bullish engulfing', d.BULKOWSKI_BULL_ENGULF, UP, 390, at(0.3), true)}
        {bar('Dark cloud cover', d.BULKOWSKI_DARK_CLOUD, DOWN, 480, dark + s(0.3))}
        {bar('Bearish engulfing', d.BULKOWSKI_BEAR_ENGULF, DOWN, 570, dark + s(2.5), true)}
        <line x1={X(50)} x2={X(50)} y1={292} y2={640} stroke="var(--color-ink)" strokeWidth={3} strokeDasharray="10 8" opacity={0.7 * fade(f, at(0.03))} />
      </svg>
      <div style={{ position: 'absolute', left: 140, right: 140, top: 670, fontSize: 28, color: SOFT, opacity: fade(f, at(0.06)) }}>Source: Thomas Bulkowski's published tests, thepatternsite.com. The share of patterns after which the trend reversed.</div>
      <div style={{ position: 'absolute', left: 140, right: 140, top: 750, opacity: fade(f, use + s(0.4)), borderLeft: `10px solid ${ACCENT}`, background: 'var(--color-surface-1)', borderRadius: 24, padding: '28px 36px' }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--color-ink)' }}>At support, confirmed: decent. At resistance: moderate. In open space, unconfirmed: noise.</div>
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- takeaways

export function TakeawaysCinematic() {
  return (
    <Recap
      items={[
        ['Piercing line: after a decline, the second candle closes past the red body\'s middle, below its open.', UP],
        ['Dark cloud cover: the mirror, after a rise.', DOWN],
        ['The middle is where the classic definitions draw the line; deeper is stronger.', MID],
        ['Confirm with a third candle beyond the first candle\'s open.', ACCENT],
        ['Measure: open, close, middle.', 'var(--color-danger)'],
      ]}
      starts={[0.03, 0.42, 0.52, 0.72, 0.87]}
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
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 60, fontWeight: 700, margin: 0, lineHeight: 1.15, opacity: fade(f, s(0.4)) }}>For a piercing line, where must the second candle close?</h2>
          {f >= think && !shown && (
            <svg viewBox="0 0 100 100" style={{ width: 84, flexShrink: 0 }}>
              <circle cx={50} cy={50} r={40} fill="none" stroke="var(--color-line)" strokeWidth={10} />
              <circle cx={50} cy={50} r={40} fill="none" stroke={ACCENT} strokeWidth={10} strokeDasharray={`${ring * 251} 251`} transform="rotate(-90 50 50)" />
            </svg>
          )}
        </div>
        {option('A', "Above the first candle's open", false, at(0.3))}
        {option('B', 'Above the middle of its body, but below its open', true, at(0.5))}
        <div style={{ ...body, fontSize: 34, opacity: fade(f, reveal + s(2)) }}>Above the open, it would be an engulfing.</div>
      </div>
      {shown && (
        <AbsoluteFill style={{ opacity: fade(f, reveal, s(0.6)) }}>
          <CornerTag label={SYNTHETIC} />
          <CinematicChart
            cam={view(d.PIERCE, 4.6, 8.0, 0.12)}
            bars={d.PIERCE}
            lines={[]}
            head={false}
            maxBody={70}
            draw={upto(7, d.PIERCE.length)}
            plot={{ left: 1080, right: 1700, top: 300, bottom: 820 }}
            levels={[
              { price: d.FIRST_OPEN, label: 'open', color: DOWN, opacity: 1 },
              { price: d.PIERCE_MID, label: 'middle', color: MID, opacity: 1 },
            ]}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- end

export function EndCinematic() {
  return <PractiseEnd bars={d.PIERCE} action="Spot it in the pattern trainer." checks={['Where is the middle of the red body?', 'Piercing, thrusting or engulfing?']} link="nitoratrading.com/trainer" />;
}
