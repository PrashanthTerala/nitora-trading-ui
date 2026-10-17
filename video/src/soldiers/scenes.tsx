/**
 * "Three White Soldiers and Three Black Crows", in the studio look: every chart is candles, every
 * number on screen comes from ./data.ts, labels sit on what they name (no pointer lines),
 * disclaimer tags go in the corner, candles build through their sessions with a live price tag,
 * the camera pushes onto the pattern with the rest of the chart soft, and levels draw themselves.
 */
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { CornerTag, ILLUSTRATION, SYNTHETIC, body, kicker, s, useMark, useSpeechAt } from '../kit';
import { CinematicChart, cameraAt } from '../cinematic/CinematicChart';
import { ACCENT, Checklist, DOWN, PRICE, Panel, PatternIntro, PractiseEnd, Recap, SOFT, UP, Volume, buildCandles, countUp, fmt, upto, useOvershoot, view } from '../cinematic/pieces';
import { Headline, clamp, fade } from '../cinematic/scenes';
import * as d from './data';

const MID = 'var(--color-chart-2)';
const DANGER = 'var(--color-danger)';
/** The figures' framing: the whole figure, and pushed in on the pattern (bars 5-7). */
const WIDE = view(d.TWS, -0.8, 8.4, 0.16);
const CLOSE = view(d.TWS, 3.3, 8.2, 0.14);
const WIDE_C = view(d.TBC, -0.8, 8.4, 0.16);
const CLOSE_C = view(d.TBC, 3.3, 8.2, 0.14);
/** A level drawing itself in over 0.8 s from `at`. */
const drawIn = (f: number, at: number) => interpolate(f, [at, at + s(0.8)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

// ---------------------------------------------------------------- title

export function SoldiersIntro() {
  return <PatternIntro kicker="Module 2 · Candlestick patterns · Lesson 11" words={['Three', 'white', 'soldiers']} sub="And three black crows: one side in control, three days running." bars={d.TWS} growIndex={7} rule={`linear-gradient(90deg, ${UP}, ${ACCENT})`} />;
}

// ---------------------------------------------------------------- intro

/** One candle, then three building in turn as the camera pushes in; then soldiers and crows side by side. */
export function IntroCinematic() {
  const f = useCurrentFrame();
  const three = useMark('three', 6);
  const names = useMark('names', 15);
  const momentum = useMark('momentum', 25);
  const b = buildCandles(d.TWS, f, 4, [
    { index: 5, at: s(0.8) },
    { index: 6, at: three + s(0.3) },
    { index: 7, at: three + s(2.1) },
  ]);
  const cam = cameraAt(f, [
    { at: 0, cam: WIDE },
    { at: three, cam: CLOSE, move: s(2.4) },
  ]);
  const split = fade(f, names, s(0.6));
  const head = f < three ? 'One strong candle can be a fluke' : f < names ? 'Three in a row: a crowd that has decided' : f < momentum ? 'Soldiers march up; crows drop down' : 'Momentum: no long wicks, no stalls';
  const side = (bars: typeof d.TWS, left: number, label: string, color: string) => (
    <CinematicChart
      cam={view(bars, 2.4, 8.4, 0.14)}
      bars={bars}
      lines={[]}
      head={false}
      maxBody={60}
      draw={upto(7, bars.length)}
      plot={{ left, right: left + 640, top: 320, bottom: 880 }}
      focus={{ from: 5, to: 7, strength: fade(f, names + s(0.6)) }}
      outlines={[{ from: 5, to: 7, color, opacity: fade(f, names + s(0.8)) }]}
      notes={[
        { label, color, opacity: fade(f, names + s(1.2)) * (1 - fade(f, momentum)), index: 6 },
        { label: 'small wicks', color: SOFT, opacity: fade(f, momentum + s(0.6)), index: 6 },
      ]}
    />
  );
  return (
    <AbsoluteFill>
      <Headline key={head} kicker={f < names ? 'The idea' : 'The patterns'} at={f < three ? s(0.3) : f < names ? three : f < momentum ? names : momentum} accent={f < three ? undefined : f < names ? UP : f < momentum ? ACCENT : undefined}>
        {head}
      </Headline>
      <AbsoluteFill style={{ opacity: 1 - split }}>
        <CinematicChart cam={cam} bars={b.bars} lines={[]} head={false} maxBody={90} draw={b.draw} legend={PRICE} focus={{ from: 5, to: 7, strength: fade(f, three, s(1.2)) }} priceTag={b.building !== undefined ? { index: b.building, opacity: 1 } : undefined} />
      </AbsoluteFill>
      {split > 0 && (
        <AbsoluteFill style={{ opacity: split }}>
          {side(d.TWS, 160, 'three white soldiers', UP)}
          {side(d.TBC, 1020, 'three black crows', DOWN)}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- rules

const RULES_PLOT = { left: 120, right: 960, top: 300, bottom: 900 };

export function RulesCinematic() {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const at = useSpeechAt();
  const trend = useMark('trend', 1.5);
  const tall = useMark('tall', 4);
  const inside = useMark('inside', 10);
  const similar = useMark('similar', 20);
  const b = buildCandles(d.TWS, f, 4, [
    { index: 5, at: tall, len: s(1.2) },
    { index: 6, at: tall + s(1.2), len: s(1.2) },
    { index: 7, at: tall + s(2.4), len: s(1.2) },
  ]);
  const cam = cameraAt(f, [
    { at: 0, cam: view(d.TWS, -0.8, 8.4, 0.16) },
    { at: inside, cam: view(d.TWS, 3.3, 8.2, 0.14), move: s(1.6) },
  ]);
  const closeAt = (k: number) => inside + s(1.4) + k * s(1.6);
  // Leaves into the next scene (a match cut): the checklist and headline go, the chart stays.
  const leave = 1 - fade(f, durationInFrames - s(0.5), s(0.45));
  return (
    <AbsoluteFill>
      <div style={{ opacity: leave }}>
        <Headline kicker="The exact rules" at={s(0.3)} accent={UP}>
          Three white soldiers: three tall steps up
        </Headline>
      </div>
      <CinematicChart
        cam={cam}
        bars={b.bars}
        lines={[]}
        draw={b.draw}
        head={false}
        maxBody={70}
        plot={RULES_PLOT}
        priceTag={b.building !== undefined ? { index: b.building, opacity: 1 } : undefined}
        regions={[{ from: -0.5, to: 4.5, color: DOWN, opacity: fade(f, trend) * (1 - fade(f, tall)) }]}
        focus={{ from: 5, to: 7, strength: fade(f, inside, s(1.2)) * leave }}
        levels={[d.CLOSE_1, d.CLOSE_2, d.CLOSE_3].map((price, k) => ({ price, label: `close ${fmt(price)}`, color: UP, opacity: leave, draw: drawIn(f, closeAt(k)) }))}
        notes={[{ label: 'opens inside', color: ACCENT, opacity: fade(f, inside + s(0.4)) * (1 - fade(f, closeAt(0))), index: 6 }]}
      />
      <div style={{ opacity: leave }}>
        <Checklist
          items={[
            { title: 'After a decline', detail: 'the soldiers turn it', from: Math.max(trend, at(0.02)) },
            { title: 'Three tall green candles', detail: `small upper wicks: ${fmt(d.WICK)} each`, from: tall, mono: true },
            { title: 'Each opens inside the last body', detail: `closes ${fmt(d.CLOSE_1)} → ${fmt(d.CLOSE_2)} → ${fmt(d.CLOSE_3)}`, from: inside, mono: true },
            { title: 'Bodies roughly the same size', detail: 'shrinking bodies say: tiring', from: similar },
          ]}
        />
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- psychology

/** Continues the rules' chart (a match cut): the plot widens, and the three days build again. */
export function PsychologyCinematic() {
  const f = useCurrentFrame();
  const day1 = useMark('day1', 0.5);
  const day2 = useMark('day2', 3);
  const day3 = useMark('day3', 9);
  const widen = interpolate(f, [0, s(1.2)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const plot = { left: 120, right: RULES_PLOT.right + (1730 - RULES_PLOT.right) * widen, top: 300, bottom: 900 };
  const rebuild = f >= day1 + s(0.6);
  const b = buildCandles(d.TWS, f, 4, [
    { index: 5, at: day1 + s(0.6), len: s(2) },
    { index: 6, at: day2 + s(0.4), len: s(2.6) },
    { index: 7, at: day3 + s(0.4), len: s(2.2) },
  ]);
  const current = f >= day3 ? 7 : f >= day2 ? 6 : 5;
  return (
    <AbsoluteFill>
      <Headline kicker="The psychology" at={s(0.4)} accent={UP}>
        Every dip bought: three sessions of orderly demand
      </Headline>
      <CinematicChart
        cam={view(d.TWS, 3.3, 8.2, 0.14)}
        bars={rebuild ? b.bars : d.TWS}
        lines={[]}
        draw={rebuild ? b.draw : upto(7, d.TWS.length)}
        head={false}
        maxBody={70 + 20 * widen}
        plot={plot}
        legend={widen > 0.95 ? PRICE : undefined}
        priceTag={rebuild && b.building !== undefined ? { index: b.building, opacity: 1 } : undefined}
        focus={{ from: current, to: current, strength: fade(f, day1) * 0.8 * (1 - fade(f, day3 + s(4))) }}
        notes={[
          { label: 'day 1: closes strong', color: UP, opacity: fade(f, day1 + s(2.4)), index: 5 },
          { label: 'day 2: dip bought, new high', color: UP, opacity: fade(f, day2 + s(2.8)), index: 6 },
          { label: 'day 3: the same', color: UP, opacity: fade(f, day3 + s(2.4)), index: 7 },
        ]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- staircase

/** The lesson's staircase: three friends, a heavy box, three clean steps up. */
export function StaircaseCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const steps = [at(0.3), at(0.48), at(0.66)];
  const X0 = 420;
  const STEP_W = 360;
  const RISE = 150;
  const BASE = 880;
  // The box: hops from step to step (a short arc), pausing between hops to "grip".
  let k = -1;
  let t = 1;
  steps.forEach((st, i) => {
    if (f >= st) {
      k = i;
      t = interpolate(f, [st, st + s(0.7)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    }
  });
  const pos = (i: number) => ({ x: X0 + (i + 0.5) * STEP_W, y: BASE - (i + 1) * RISE });
  const from = k <= 0 ? { x: X0 - 160, y: BASE } : pos(k - 1);
  const to = k < 0 ? { x: X0 - 160, y: BASE } : pos(k);
  const bx = from.x + (to.x - from.x) * t;
  const by = from.y + (to.y - from.y) * t - Math.sin(Math.PI * t) * 90;
  return (
    <AbsoluteFill>
      <Headline kicker="Picture it" at={s(0.3)} accent={UP}>
        Three clean steps: the box is going up
      </Headline>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <line x1={X0 - 260} x2={X0 + 3 * STEP_W + 120} y1={BASE} y2={BASE} stroke="var(--color-line)" strokeWidth={4} />
        {[0, 1, 2].map((i) => {
          const lit = f >= steps[i];
          return (
            <g key={i} opacity={fade(f, at(0.05) + i * s(0.3))}>
              <rect x={X0 + i * STEP_W} y={BASE - (i + 1) * RISE} width={STEP_W - 24} height={(i + 1) * RISE} rx={16} fill={lit ? UP : 'var(--color-surface-1)'} opacity={lit ? 0.9 : 1} stroke={UP} strokeWidth={4} />
              <text x={X0 + i * STEP_W + (STEP_W - 24) / 2} y={BASE - 40} textAnchor="middle" fontSize={40} fontWeight={700} fill={lit ? 'var(--color-bg)' : UP} fontFamily="var(--font-sans)">
                step {i + 1}
              </text>
            </g>
          );
        })}
        <rect x={bx - 70} y={by - 140} width={140} height={110} rx={12} fill="#c9a86a" opacity={fade(f, at(0.1))} />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 930, textAlign: 'center', ...body, fontSize: 38, color: 'var(--color-ink)', opacity: fade(f, at(0.82)) }}>
        No slipping, no dropping it: everyone watching believes it is going up.
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- crows

export function CrowsCinematic() {
  const f = useCurrentFrame();
  const bounce = useMark('bounce', 6);
  const drop = useMark('drop', 12);
  const b = buildCandles(d.TBC, f, 4, [
    { index: 5, at: s(1.6), len: s(1.4) },
    { index: 6, at: bounce + s(0.2), len: s(2.6) },
    { index: 7, at: bounce + s(3), len: s(1.6) },
  ]);
  const cam = cameraAt(f, [
    { at: 0, cam: WIDE_C },
    { at: s(1.4), cam: CLOSE_C, move: s(2.4) },
  ]);
  return (
    <AbsoluteFill>
      <Headline kicker="The mirror image" at={s(0.3)} accent={DOWN}>
        Three black crows: every bounce sold
      </Headline>
      <CinematicChart
        cam={cam}
        bars={b.bars}
        lines={[]}
        draw={b.draw}
        head={false}
        maxBody={90}
        legend={PRICE}
        priceTag={b.building !== undefined ? { index: b.building, opacity: 1 } : undefined}
        focus={{ from: 5, to: 7, strength: fade(f, s(1.4), s(1.2)) }}
        levels={[
          { price: d.CROW_OPEN, label: `first open ${fmt(d.CROW_OPEN)}`, color: DOWN, opacity: 1, draw: drawIn(f, drop + s(0.4)) },
          { price: d.CROW_CLOSE, label: `last close ${fmt(d.CROW_CLOSE)}`, color: DOWN, opacity: 1, draw: drawIn(f, drop + s(1.6)) },
        ]}
        notes={[{ label: 'bounce at the open, sold', color: DOWN, opacity: fade(f, bounce + s(2.8)) * (1 - fade(f, drop + s(0.4))), index: 6 }]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- variations

export function VariationsCinematic() {
  const f = useCurrentFrame();
  const block = useMark('block', 3);
  const stall = useMark('stall', 13);
  const identical = useMark('identical', 19);
  const quality = useMark('quality', 27);
  const P = [
    { x0: 120, x1: 660, title: 'Advance block: tiring', bars: d.ADVANCE_BLOCK, color: ACCENT, at: block, stat: true },
    { x0: 690, x1: 1230, title: 'Stalled: a pause at the top', bars: d.DELIBERATION, color: ACCENT, at: stall, stat: false },
    { x0: 1260, x1: 1800, title: 'Identical crows: no bounce', bars: d.IDENTICAL, color: DOWN, at: identical, stat: false },
  ];
  const current = f >= quality ? -1 : f >= identical ? 2 : f >= stall ? 1 : 0;
  return (
    <AbsoluteFill>
      <Headline key={String(f >= quality)} kicker="Reading the quality" at={f >= quality ? quality : s(0.3)} accent={f >= quality ? UP : undefined}>
        {f >= quality ? 'Judge the quality: tall bodies, small wicks, strong closes' : 'Three candles of one colour are not automatically soldiers'}
      </Headline>
      {P.map((pn, k) => {
        const b = buildCandles(pn.bars, f, 4, [5, 6, 7].map((index, j) => ({ index, at: pn.at + s(0.4) + j * s(0.9), len: s(0.9) })));
        return (
          <div key={k} style={{ opacity: fade(f, pn.at) }}>
            <Panel x0={pn.x0} x1={pn.x1} y0={240} y1={900} title={pn.title} state={current === k || current < 0 ? 1 : 2} />
            <CinematicChart
              cam={view(pn.bars, 3.4, 7.7, 0.14)}
              bars={b.bars}
              lines={[]}
              draw={b.draw}
              head={false}
              maxBody={56}
              plot={{ left: pn.x0 + 30, right: pn.x1 - 150, top: 330, bottom: pn.stat ? 720 : 800 }}
              outlines={[{ from: 5, to: 7, color: pn.color, opacity: fade(f, pn.at + s(3.2)) }]}
            />
            {pn.stat && (
              <div style={{ position: 'absolute', left: pn.x0 + 30, width: pn.x1 - pn.x0 - 60, top: 800, fontSize: 30, color: 'var(--color-ink)', opacity: fade(f, pn.at + s(4)) }}>
                price still rose: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: UP }}>{countUp(f, pn.at + s(4), d.ADVANCE_BLOCK_UP)}%</span>
              </div>
            )}
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 940, textAlign: 'center', fontSize: 26, color: SOFT, opacity: fade(f, block + s(4)) }}>Source: Thomas Bulkowski's published tests, thepatternsite.com</div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- valid

export function ValidCinematic() {
  const f = useCurrentFrame();
  const continuation = useMark('continuation', 9);
  const blowoff = useMark('blowoff', 15);
  const split = fade(f, blowoff, s(0.6));
  const head = f < continuation ? 'Best after a decline, or a long sideways stretch' : f < blowoff ? 'Also a sign the trend is healthy, after a pullback' : 'Least useful at the end of a long rally';
  return (
    <AbsoluteFill>
      <Headline key={head} kicker="Where they are valid" at={f < continuation ? s(0.3) : f < blowoff ? continuation : blowoff} accent={f >= blowoff ? DANGER : undefined}>
        {head}
      </Headline>
      <AbsoluteFill style={{ opacity: 1 - split }}>
        <CornerTag label={SYNTHETIC} />
        <CinematicChart cam={WIDE} bars={d.TWS} lines={[]} head={false} maxBody={90} draw={upto(7, d.TWS.length)} legend={PRICE} regions={[{ from: -0.5, to: 4.5, color: DOWN, opacity: fade(f, s(1)), label: 'a decline first' }]} outlines={[{ from: 5, to: 7, color: UP, opacity: fade(f, s(2)) }]} />
      </AbsoluteFill>
      {split > 0 && (
        <AbsoluteFill style={{ opacity: split }}>
          <CornerTag label={ILLUSTRATION} />
          <CinematicChart
            cam={cameraAt(f, [
              { at: 0, cam: view(d.BLOWOFF, -0.8, 15.4, 0.12) },
              { at: blowoff + s(2.4), cam: view(d.BLOWOFF, 6.5, 15.4, 0.12), move: s(2) },
            ])}
            bars={d.BLOWOFF}
            lines={[]}
            head={false}
            maxBody={70}
            draw={upto(14, d.BLOWOFF.length)}
            legend={PRICE}
            focus={{ from: 12, to: 14, strength: fade(f, blowoff + s(2.4), s(1)) }}
            regions={[{ from: -0.5, to: 11.5, color: UP, opacity: fade(f, blowoff + s(0.6)), label: 'a long rally' }]}
            outlines={[{ from: 12, to: 14, color: DANGER, opacity: fade(f, blowoff + s(1.6)) }]}
            notes={[{ label: 'the final blow-off?', color: DANGER, opacity: fade(f, blowoff + s(3.6)), index: 13 }]}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- confirmation

export function ConfirmationCinematic() {
  const f = useCurrentFrame();
  const fourth = useMark('fourth', 6);
  const volume = useMark('volume', 11);
  const split = fade(f, volume, s(0.6));
  const b = buildCandles(d.CONFIRM, f, 7, [{ index: 8, at: fourth + s(0.6), len: s(1.6) }]);
  const half = (bars: typeof d.CONFIRM, left: number, title: string, label: string, color: string) => {
    const cam = view(bars, 2.4, 8.6, 0.14);
    return (
      <>
        <div style={{ position: 'absolute', left, top: 250, fontSize: 34, fontWeight: 700, color }}>{title}</div>
        <CinematicChart cam={cam} bars={bars} lines={[]} head={false} maxBody={50} draw={upto(8, bars.length)} plot={{ left, right: left + 640, top: 330, bottom: 640 }} outlines={[{ from: 5, to: 7, color, opacity: 1 }]} />
        <Volume bars={bars} cam={cam} left={left} right={left + 640} top={700} bottom={880} highlight={-1} opacity={1} />
        <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {[5, 6, 7].map((i) => {
            const max = Math.max(...bars.map((x) => x.v ?? 0));
            const x = left + ((i - cam.x0) / (cam.x1 - cam.x0)) * 640;
            const h = ((bars[i].v ?? 0) / max) * 180;
            const w = Math.min(40, (640 / (cam.x1 - cam.x0)) * 0.62);
            return <rect key={i} x={x - w / 2} y={880 - h} width={w} height={h} rx={3} fill={color} opacity={fade(f, volume + s(0.8) + (i - 5) * s(0.3))} />;
          })}
        </svg>
        <div style={{ position: 'absolute', left, width: 640, top: 900, textAlign: 'center', fontSize: 30, fontWeight: 700, color, opacity: fade(f, volume + s(2)) }}>{label}</div>
      </>
    );
  };
  return (
    <AbsoluteFill>
      <Headline key={String(f >= volume)} kicker="Confirmation" at={f >= volume ? volume : s(0.3)}>
        {f >= volume ? 'Volume: steady or rising supports it' : 'The cautious wait for a fourth candle that holds'}
      </Headline>
      <CornerTag label={ILLUSTRATION} />
      <AbsoluteFill style={{ opacity: 1 - split }}>
        <CinematicChart
          cam={view(d.CONFIRM, 2.4, 9.4, 0.14)}
          bars={b.bars}
          lines={[]}
          draw={b.draw}
          head={false}
          maxBody={80}
          legend={PRICE}
          priceTag={b.building !== undefined ? { index: b.building, opacity: 1 } : undefined}
          focus={{ from: 7, to: 8, strength: fade(f, fourth, s(1)) }}
          outlines={[{ from: 5, to: 7, color: UP, opacity: fade(f, s(1)) }]}
          notes={[{ label: 'keeps the gain', color: UP, opacity: fade(f, fourth + s(2.4)), index: 8 }]}
        />
      </AbsoluteFill>
      {split > 0 && (
        <AbsoluteFill style={{ opacity: split }}>
          {half(d.CONFIRM, 160, 'Rising volume', 'supports the pattern', UP)}
          {half(d.FADING, 1040, 'Shrinking volume', 'running out of buyers', DANGER)}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- trade

/** The wide stop at the third close, then the pullback with its tight stop (the fourth candle is an illustration). */
export function TradeCinematic() {
  const f = useCurrentFrame();
  const wide = useMark('wide', 2);
  const pullback = useMark('pullback', 12);
  const smaller = useMark('smaller', 24);
  const crows = useMark('crows', 28);
  const b = buildCandles(d.PULLBACK_BARS, f, 7, [{ index: 8, at: pullback + s(1.6), len: s(2.4) }]);
  const cam = cameraAt(f, [
    { at: 0, cam: view(d.TWS, 2.3, 9.2, 0.14) },
    { at: pullback + s(0.4), cam: view(d.PULLBACK_BARS, 4.3, 9.4, 0.12), move: s(1.6) },
    { at: smaller, cam: view(d.TWS, 2.3, 9.2, 0.14), move: s(1.6) },
    { at: crows + s(1), cam: view(d.PULLBACK_BARS, 4.3, 9.4, 0.12), move: s(1.6) },
  ]);
  const showWide = (f < pullback ? 1 : 1 - fade(f, pullback, s(0.6))) + (f >= smaller && f < crows ? fade(f, smaller + s(0.4)) : 0);
  const showTight = f >= pullback ? fade(f, pullback + s(4)) * (1 - fade(f, smaller)) : 0;
  const head = f < wide ? 'This is where soldiers get awkward' : f < pullback ? `At the third close: ${fmt(d.WIDE_RISK)} of risk` : f < smaller ? `On a pullback: ${fmt(d.TIGHT_RISK)} of risk` : f < crows ? 'Or: the wide stop, a smaller position' : 'Crows: short the bounce, stop above its high';
  return (
    <AbsoluteFill>
      <Headline key={head} kicker="A trade idea" at={f < wide ? s(0.3) : f < pullback ? wide : f < smaller ? pullback : f < crows ? smaller : crows} accent={f < wide ? undefined : f < pullback ? DANGER : f < smaller ? UP : f < crows ? ACCENT : DOWN}>
        {head}
      </Headline>
      <CornerTag label={SYNTHETIC} opacity={1 - fade(f, pullback + s(1.6))} />
      <CornerTag label={ILLUSTRATION} opacity={fade(f, pullback + s(1.6))} />
      <CinematicChart
        cam={cam}
        bars={b.bars}
        lines={[]}
        draw={f >= pullback + s(1.6) ? b.draw : upto(7, d.PULLBACK_BARS.length)}
        head={false}
        maxBody={80}
        legend={PRICE}
        priceTag={b.building !== undefined ? { index: b.building, opacity: 1 } : undefined}
        outlines={[{ from: 5, to: 7, color: ACCENT, opacity: 1 }]}
        levels={[
          { price: d.ENTRY, label: `entry ${fmt(d.ENTRY)}`, color: UP, opacity: showWide, draw: drawIn(f, wide + s(0.4)) },
          { price: d.WIDE_STOP, label: `stop ${fmt(d.WIDE_STOP)}`, color: DOWN, opacity: showWide, draw: drawIn(f, wide + s(2.4)) },
          { price: d.PULLBACK, label: `entry ${fmt(d.PULLBACK)}`, color: UP, opacity: showTight, draw: drawIn(f, pullback + s(4)) },
          { price: d.TIGHT_STOP, label: `stop ${fmt(d.TIGHT_STOP)}`, color: DOWN, opacity: showTight, draw: drawIn(f, pullback + s(6)) },
        ]}
        brackets={[
          { index: 7, from: d.WIDE_STOP, to: d.ENTRY, color: DANGER, opacity: fade(f, wide + s(4)) * showWide, label: `risk ${fmt(d.WIDE_RISK)}` },
          { index: 7, from: d.TIGHT_STOP, to: d.PULLBACK, color: UP, opacity: fade(f, pullback + s(8)) * showTight, label: `risk ${fmt(d.TIGHT_RISK)}` },
        ]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- chase

/** Continues the trade's chart (a match cut): the third close everyone buys, and the pullback. */
export function ChaseCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  return (
    <AbsoluteFill>
      <Headline kicker="The trap" at={s(0.3)} accent={DANGER}>
        Chasing the third candle: the fear of missing out
      </Headline>
      <CornerTag label={ILLUSTRATION} />
      <CinematicChart
        cam={view(d.PULLBACK_BARS, 4.3, 9.4, 0.12)}
        bars={d.PULLBACK_BARS}
        lines={[]}
        draw={upto(8, d.PULLBACK_BARS.length)}
        head={false}
        maxBody={80}
        legend={PRICE}
        plotBottom={780}
        focus={{ from: f >= at(0.7) ? 8 : 7, to: f >= at(0.7) ? 8 : 7, strength: fade(f, at(0.05)) * 0.7 }}
        outlines={[
          { from: 7, to: 7, color: DANGER, opacity: fade(f, at(0.05)) * (1 - fade(f, at(0.7))) },
          { from: 8, to: 8, color: UP, opacity: fade(f, at(0.75)) },
        ]}
        notes={[
          { label: 'everyone buys this close', color: DANGER, opacity: fade(f, at(0.35)), index: 7 },
          { label: 'the entry', color: UP, opacity: fade(f, at(0.85)), index: 8 },
        ]}
      />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 960, textAlign: 'center', ...body, fontSize: 38, color: 'var(--color-ink)', opacity: fade(f, at(0.72)) }}>
        The pattern is a reason to be bullish. The pullback is the entry.
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- reliability

export function ReliabilityCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const but = useMark('but', 9);
  const ranks = useMark('ranks', 13);
  const summary = useMark('summary', 22);
  const over = useOvershoot();
  const L = 700;
  const R = 1440;
  const X = (pct: number) => L + (pct / 100) * (R - L);
  const bar = (label: string, pct: number, color: string, y: number, start: number, rank: number, note: string) => {
    const fill = pct * over(f, start);
    return (
      <g opacity={fade(f, start)}>
        <text x={L - 30} y={y + 46} textAnchor="end" fontSize={36} fontWeight={700} fill={color} fontFamily="var(--font-sans)">
          {label}
        </text>
        <rect x={L} y={y} width={R - L} height={70} rx={14} fill="var(--color-surface-1)" stroke="var(--color-line)" strokeWidth={2} />
        <rect x={L} y={y} width={Math.max(0, X(fill) - L)} height={70} rx={14} fill={color} opacity={0.85} />
        <text x={R + 24} y={y + 50} fontSize={46} fontWeight={700} fill={color} fontFamily="var(--font-mono)">
          {countUp(f, start, pct)}%
        </text>
        <text x={L} y={y + 112} fontSize={28} fill={SOFT} fontFamily="var(--font-sans)" opacity={fade(f, ranks + s(0.4) + (rank === d.RANK_CROWS ? s(3.5) : 0))}>
          {`overall rank ${rank} of ${d.PATTERNS}: ${note}`}
        </text>
      </g>
    );
  };
  return (
    <AbsoluteFill>
      <Headline key={String(f >= but)} kicker="Honest reliability" at={f >= but ? but : s(0.3)} accent={f >= but ? DANGER : UP}>
        {f >= but ? 'Direction, not distance: they count which way, not how far' : 'At calling direction: very good'}
      </Headline>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <text x={X(50)} y={292} textAnchor="middle" fontSize={28} fill={SOFT} fontFamily="var(--font-sans)" opacity={fade(f, at(0.03))}>
          coin flip: 50%
        </text>
        {bar('Three white soldiers', d.BULKOWSKI_SOLDIERS, UP, 320, at(0.08), d.RANK_SOLDIERS, 'price does not trend all that well after')}
        {bar('Three black crows', d.BULKOWSKI_CROWS, DOWN, 480, at(0.2), d.RANK_CROWS, 'best results when price broke upward')}
        {/* The coin-flip line crosses the bars only, never the rank lines under them. */}
        {[[302, 390], [480, 550]].map(([y1, y2]) => (
          <line key={y1} x1={X(50)} x2={X(50)} y1={y1} y2={y2} stroke="var(--color-ink)" strokeWidth={3} strokeDasharray="10 8" opacity={0.7 * fade(f, at(0.03))} />
        ))}
      </svg>
      <div style={{ position: 'absolute', left: 140, right: 140, top: 660, fontSize: 26, color: SOFT, opacity: fade(f, at(0.08)) }}>Source: Thomas Bulkowski's published tests, thepatternsite.com. The rank also weighs how far price moved afterwards.</div>
      <div style={{ position: 'absolute', left: 140, right: 140, top: 730, display: 'flex', gap: 40 }}>
        {[
          ['Which way it turned', 'very good', UP],
          ['How much further it goes', 'only fair', DANGER],
        ].map(([title, text, color], k) => {
          const o = fade(f, summary + s(0.4) + k * s(1.6));
          return (
            <div key={title} style={{ flex: 1, opacity: o, transform: `translateY(${(1 - o) * 20}px)`, borderLeft: `10px solid ${color}`, background: 'var(--color-surface-1)', borderRadius: 24, padding: '26px 34px' }}>
              <div style={{ fontSize: 32, color: SOFT }}>{title}</div>
              <div style={{ fontSize: 46, fontWeight: 700, color, marginTop: 6 }}>{text}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- takeaways

export function TakeawaysCinematic() {
  return (
    <Recap
      items={[
        ['Three white soldiers: three tall green candles after a decline, each opening inside the last body.', UP],
        ['Three black crows: the mirror, after a rise.', DOWN],
        ['They show orderly control by one side.', ACCENT],
        ['Shrinking bodies or growing wicks: tiring, not strength.', MID],
        ['Entering at the third close: a wide stop. Prefer the pullback.', DANGER],
      ]}
      starts={[0.03, 0.4, 0.52, 0.64, 0.8]}
    />
  );
}

// ---------------------------------------------------------------- quiz

export function QuizCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const think = useMark('think', 10);
  const reveal = useMark('reveal', 13);
  const shown = f >= reveal;
  const ring = interpolate(f, [think, reveal], [0, 1], clamp);
  const option = (letter: string, text: string, right: boolean, atF: number) => {
    const o = fade(f, atF, s(0.5));
    return (
      <div style={{ opacity: o * (shown && !right ? 0.45 : 1), transform: `translateX(${(1 - o) * -24}px)`, borderRadius: 24, border: `3px solid ${shown && right ? UP : 'var(--color-line)'}`, background: 'var(--color-surface-1)', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 26 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 42, fontWeight: 700, color: shown ? (right ? UP : DOWN) : ACCENT }}>{shown ? (right ? '✓' : '✕') : letter}</span>
        <span style={{ ...body, fontSize: 36, color: 'var(--color-ink)' }}>{text}</span>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 140, top: 140, width: 880, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={kicker}>Quick check</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 700, margin: 0, lineHeight: 1.15, opacity: fade(f, s(0.4)) }}>Why is buying at the close of the third soldier often a poor entry?</h2>
          {f >= think && !shown && (
            <svg viewBox="0 0 100 100" style={{ width: 84, flexShrink: 0 }}>
              <circle cx={50} cy={50} r={40} fill="none" stroke="var(--color-line)" strokeWidth={10} />
              <circle cx={50} cy={50} r={40} fill="none" stroke={ACCENT} strokeWidth={10} strokeDasharray={`${ring * 251} 251`} transform="rotate(-90 50 50)" />
            </svg>
          )}
        </div>
        {option('A', 'The pattern is bearish', false, at(0.4))}
        {option('B', 'The stop is far away, and part of the move has happened', true, at(0.5))}
        <div style={{ ...body, fontSize: 34, opacity: fade(f, reveal + s(2)) }}>A pullback into the third candle gives a better entry and a tighter stop.</div>
      </div>
      {shown && (
        <AbsoluteFill style={{ opacity: fade(f, reveal, s(0.6)) }}>
          <CornerTag label={SYNTHETIC} />
          <CinematicChart
            cam={view(d.TWS, 3.3, 8.6, 0.14)}
            bars={d.TWS}
            lines={[]}
            head={false}
            maxBody={50}
            draw={upto(7, d.TWS.length)}
            plot={{ left: 1100, right: 1640, top: 300, bottom: 860 }}
            outlines={[{ from: 5, to: 7, color: ACCENT, opacity: 1 }]}
            brackets={[{ index: 7, from: d.WIDE_STOP, to: d.ENTRY, color: DANGER, opacity: fade(f, reveal + s(0.8)), label: `risk ${fmt(d.WIDE_RISK)}` }]}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- end

export function EndCinematic() {
  return <PractiseEnd bars={d.TWS} action="Judge them in the pattern trainer." checks={['Tall, similar bodies?', 'Small wicks?', 'Each close beyond the last?']} link="nitoratrading.com/trainer" />;
}
