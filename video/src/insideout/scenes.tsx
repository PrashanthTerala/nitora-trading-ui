/**
 * "Three Inside and Three Outside", in the studio look: every chart is candles, every number on
 * screen comes from ./data.ts, labels sit on what they name (no pointer lines), disclaimer tags go
 * in the corner, candles build through their sessions with a live price tag, the camera pushes
 * onto the pattern with the rest of the chart soft, and the test each third candle must pass (a
 * level) draws itself before the third candle closes through it.
 */
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import type { OHLC } from '@/engine/market/types';
import { CornerTag, SYNTHETIC, body, kicker, s, useMark, useSpeechAt } from '../kit';
import { CinematicChart, cameraAt } from '../cinematic/CinematicChart';
import { ACCENT, DOWN, PRICE, Panel, PatternIntro, PractiseEnd, Recap, SOFT, UP, buildCandles, countUp, fmt, upto, useOvershoot, view } from '../cinematic/pieces';
import { Headline, clamp, fade } from '../cinematic/scenes';
import * as d from './data';

const MID = 'var(--color-chart-2)';
const DANGER = 'var(--color-danger)';
const N = 9;
const wide = (bars: OHLC[]) => view(bars, -0.8, N + 0.4, 0.16);
const close = (bars: OHLC[]) => view(bars, 4.3, N + 0.3, 0.14);
const drawIn = (f: number, at: number) => interpolate(f, [at, at + s(0.8)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
const tag = (b: { building?: number }) => (b.building !== undefined ? { index: b.building, opacity: 1 } : undefined);

// ---------------------------------------------------------------- title

export function InsideOutIntro() {
  return <PatternIntro kicker="Module 2 · Candlestick patterns · Lesson 12" words={['Three', 'inside', '&', 'outside']} sub="A harami or an engulfing, confirmed by a third candle." bars={d.TIU} growIndex={8} rule={`linear-gradient(90deg, ${DOWN}, ${UP})`} />;
}

// ---------------------------------------------------------------- intro

const FOUR = [
  { title: 'Three inside up', bars: d.TIU, color: UP },
  { title: 'Three inside down', bars: d.TID, color: DOWN },
  { title: 'Three outside up', bars: d.TOU, color: UP },
  { title: 'Three outside down', bars: d.TOD, color: DOWN },
];

/** The harami and the engulfing, each completed by a third candle; then all four, side by side. */
export function IntroCinematic() {
  const f = useCurrentFrame();
  const named = useMark('named', 7);
  const inside = useMark('inside', 12);
  const outside = useMark('outside', 20);
  const fresh = useMark('new', 28);
  const grid = fade(f, fresh, s(0.6));
  const half = (bars: OHLC[], left: number, base: string, done: string, at: number, color: string) => {
    const b = buildCandles(bars, f, 7, [{ index: 8, at: at + s(0.6), len: s(1.6) }]);
    return (
      <CinematicChart
        cam={view(bars, 2.4, N + 0.3, 0.14)}
        bars={b.bars}
        lines={[]}
        head={false}
        maxBody={60}
        draw={b.draw}
        plot={{ left, right: left + 640, top: 320, bottom: 840 }}
        focus={{ from: 6, to: 8, strength: fade(f, named) }}
        outlines={[
          { from: 6, to: 7, color: ACCENT, opacity: fade(f, named + s(0.4)) * (1 - fade(f, at + s(2.2))) },
          { from: 6, to: 8, color, opacity: fade(f, at + s(2.2)) },
        ]}
        notes={[
          { label: base, color: ACCENT, opacity: fade(f, named + s(0.8)) * (1 - fade(f, at + s(2.2))), index: 6.5 },
          { label: done, color, opacity: fade(f, at + s(2.4)), index: 7 },
        ]}
      />
    );
  };
  const head = f < named ? 'Wait for the next candle to confirm' : f < inside ? 'The confirmed versions got their own names' : f < outside ? 'Inside: a harami, plus a third candle' : f < fresh ? 'Outside: an engulfing, plus a third candle' : 'Four patterns you already half know';
  return (
    <AbsoluteFill>
      <Headline key={head} kicker={f < named ? 'The idea' : 'The patterns'} at={f < named ? s(0.3) : f < inside ? named : f < outside ? inside : f < fresh ? outside : fresh} accent={f >= inside && f < fresh ? (f < outside ? ACCENT : MID) : undefined}>
        {head}
      </Headline>
      <AbsoluteFill style={{ opacity: 1 - grid }}>
        {half(d.TIU, 160, 'harami', 'three inside up', inside, UP)}
        {half(d.TOU, 1020, 'engulfing', 'three outside up', outside, UP)}
      </AbsoluteFill>
      {grid > 0 && (
        <AbsoluteFill style={{ opacity: grid }}>
          {FOUR.map((p, k) => {
            const x0 = 120 + k * 430;
            return (
              <div key={k} style={{ opacity: fade(f, fresh + k * s(0.3)) }}>
                <Panel x0={x0} x1={x0 + 400} y0={260} y1={880} title={p.title} state={1} />
                <CinematicChart cam={view(p.bars, 4.4, N - 0.4, 0.14)} bars={p.bars} lines={[]} head={false} maxBody={50} draw={upto(8, N)} plot={{ left: x0 + 24, right: x0 + 290, top: 360, bottom: 820 }} outlines={[{ from: 6, to: 8, color: p.color, opacity: 1 }]} />
              </div>
            );
          })}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- three inside up

export function InsideUpCinematic() {
  const f = useCurrentFrame();
  const trend = useMark('trend', 1.5);
  const harami = useMark('harami', 3);
  const third = useMark('third', 9);
  const story = useMark('story', 17);
  const looser = useMark('looser', 27);
  const b = buildCandles(d.TIU, f, 5, [
    { index: 6, at: harami + s(0.2), len: s(1.4) },
    { index: 7, at: harami + s(1.8), len: s(1.4) },
    { index: 8, at: third + s(1.8), len: s(1.8) },
  ]);
  const cam = cameraAt(f, [
    { at: 0, cam: wide(d.TIU) },
    { at: harami, cam: close(d.TIU), move: s(2) },
  ]);
  const notStory = 1 - fade(f, story);
  return (
    <AbsoluteFill>
      <Headline key={String(f >= looser)} kicker="Three inside up" at={f >= looser ? looser : s(0.3)} accent={f >= looser ? MID : UP}>
        {f >= looser ? "Bulkowski's test: a close above candle two's close" : 'A harami, then a close above the first open'}
      </Headline>
      <CinematicChart
        cam={cam}
        bars={b.bars}
        lines={[]}
        draw={b.draw}
        head={false}
        maxBody={90}
        legend={PRICE}
        priceTag={tag(b)}
        focus={{ from: 6, to: 8, strength: fade(f, harami, s(1.2)) }}
        regions={[{ from: -0.5, to: 5.5, color: DOWN, opacity: fade(f, trend) * (1 - fade(f, harami)) }]}
        levels={[
          { price: d.TIU_FIRST_OPEN, label: `first open ${fmt(d.TIU_FIRST_OPEN)}`, color: UP, opacity: 1, draw: drawIn(f, third + s(0.4)) },
          { price: d.EARLY, label: `2nd close ${fmt(d.EARLY)}`, color: MID, opacity: 1, draw: drawIn(f, looser + s(0.6)) },
        ]}
        notes={[
          { label: 'harami', color: ACCENT, opacity: fade(f, harami + s(3.4)) * (1 - fade(f, third)), index: 6.5 },
          { label: `closes ${fmt(d.TIU_THIRD_CLOSE)}: above it`, color: UP, opacity: fade(f, third + s(3.8)) * notStory, index: 8 },
          { label: 'day 1: sellers win', color: DOWN, opacity: fade(f, story + s(0.3)) * (1 - fade(f, looser)), index: 6 },
          { label: 'day 2: stall', color: ACCENT, opacity: fade(f, story + s(1.2)) * (1 - fade(f, looser)), index: 7 },
          { label: 'day 3: past the open', color: UP, opacity: fade(f, story + s(2.4)) * (1 - fade(f, looser)), index: 8 },
        ]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- trolley

/** The lesson's trolley: rolls down into thick grass, slows, then rolls back up past its start. */
export function TrolleyCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const A = { x: 300, y: 420 };
  const B = { x: 1160, y: 820 };
  const along = (t: number) => ({ x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t });
  const START = 0.35;
  const t1 = at(0.05);
  const t2 = at(0.35);
  const t3 = at(0.55);
  let pos: { x: number; y: number };
  if (f < t2) pos = along(interpolate(f, [t1, t2], [START, 1], { ...clamp, easing: Easing.in(Easing.quad) }));
  else if (f < t3) pos = { x: B.x + interpolate(f, [t2, t3], [0, 150], { ...clamp, easing: Easing.out(Easing.cubic) }), y: B.y };
  else {
    const back = interpolate(f, [t3, t3 + s(0.8)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    const up = interpolate(f, [t3 + s(0.8), at(0.85)], [1, 0.12], { ...clamp, easing: Easing.out(Easing.cubic) });
    pos = back < 1 ? { x: B.x + 150 * (1 - back), y: B.y } : along(up);
  }
  const angle = (Math.atan2(B.y - A.y, B.x - A.x) * 180) / Math.PI;
  const onSlope = pos.y < B.y - 1;
  const start = along(START);
  const captions: [string, string, number][] = [
    ['day one: rolling down', DOWN, t1],
    ['day two: slows in the grass', ACCENT, t2],
    ['day three: back up, past the start', UP, t3],
  ];
  return (
    <AbsoluteFill>
      <Headline kicker="Picture it" at={s(0.3)} accent={UP}>
        Slowed by the grass, then back past the start
      </Headline>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <line x1={A.x - 80} y1={A.y - 37} x2={B.x} y2={B.y} stroke={SOFT} strokeWidth={6} />
        <line x1={B.x} y1={B.y} x2={1700} y2={B.y} stroke={SOFT} strokeWidth={6} />
        {Array.from({ length: 28 }, (_, i) => (
          <line key={i} x1={B.x + 20 + i * 18} y1={B.y} x2={B.x + 26 + i * 18} y2={B.y - 26 - (i % 3) * 8} stroke={UP} strokeWidth={4} opacity={0.75} />
        ))}
        <g opacity={fade(f, at(0.02))}>
          <line x1={start.x} y1={start.y - 90} x2={start.x} y2={start.y + 20} stroke={ACCENT} strokeWidth={4} strokeDasharray="10 8" />
          <text x={start.x} y={start.y - 104} textAnchor="middle" fontSize={32} fontWeight={700} fill={ACCENT} fontFamily="var(--font-sans)">
            start
          </text>
        </g>
        <g transform={`translate(${pos.x} ${pos.y}) rotate(${onSlope ? angle : 0})`} opacity={fade(f, at(0.02))}>
          <rect x={-60} y={-86} width={120} height={60} rx={8} fill="none" stroke="var(--color-ink)" strokeWidth={6} />
          <line x1={60} y1={-86} x2={86} y2={-110} stroke="var(--color-ink)" strokeWidth={6} />
          <circle cx={-36} cy={-12} r={12} fill="var(--color-ink)" />
          <circle cx={36} cy={-12} r={12} fill="var(--color-ink)" />
        </g>
      </svg>
      <div style={{ position: 'absolute', left: 120, right: 120, top: 920, display: 'flex', justifyContent: 'space-between' }}>
        {captions.map(([text, color, from]) => (
          <div key={text} style={{ ...body, fontSize: 34, fontWeight: 700, color, opacity: fade(f, from) }}>
            {text}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- the mirrors and the outside versions

/** One figure, built candle by candle, with the third candle's test drawn as a level before it closes through. */
function Confirmed({ bars, test, testLabel, third, thirdClose, color, base, baseAt, thirdAt, notes = [] }: { bars: OHLC[]; test: number; testLabel: string; third: string; thirdClose: number; color: string; base: string; baseAt: number; thirdAt: number; notes?: { label: string; color: string; opacity: number; index: number }[] }) {
  const f = useCurrentFrame();
  const b = buildCandles(bars, f, 5, [
    { index: 6, at: baseAt, len: s(1.3) },
    { index: 7, at: baseAt + s(1.4), len: s(1.3) },
    { index: 8, at: thirdAt + s(1.6), len: s(1.8) },
  ]);
  return (
    <CinematicChart
      cam={cameraAt(f, [
        { at: 0, cam: wide(bars) },
        { at: baseAt, cam: close(bars), move: s(2) },
      ])}
      bars={b.bars}
      lines={[]}
      draw={b.draw}
      head={false}
      maxBody={90}
      legend={PRICE}
      priceTag={tag(b)}
      focus={{ from: 6, to: 8, strength: fade(f, baseAt, s(1.2)) }}
      levels={[{ price: test, label: testLabel, color, opacity: 1, draw: drawIn(f, thirdAt + s(0.4)) }]}
      notes={[
        { label: base, color: ACCENT, opacity: fade(f, baseAt + s(3)) * (1 - fade(f, thirdAt)), index: 6.5 },
        { label: `${third} ${fmt(thirdClose)}`, color, opacity: fade(f, thirdAt + s(3.6)), index: 8 },
        ...notes,
      ]}
    />
  );
}

export function InsideDownCinematic() {
  const third = useMark('third', 7);
  return (
    <AbsoluteFill>
      <Headline kicker="The mirror image" at={s(0.3)} accent={DOWN}>
        Three inside down: a close below the first open
      </Headline>
      <Confirmed bars={d.TID} test={d.TID_FIRST_OPEN} testLabel={`first open ${fmt(d.TID_FIRST_OPEN)}`} third="closes" thirdClose={d.TID_THIRD_CLOSE} color={DOWN} base="bearish harami" baseAt={s(1.2)} thirdAt={third} />
    </AbsoluteFill>
  );
}

export function OutsideUpCinematic() {
  const f = useCurrentFrame();
  const trend = useMark('trend', 1.5);
  const engulf = useMark('engulf', 3);
  const third = useMark('third', 9);
  const why = useMark('why', 16);
  return (
    <AbsoluteFill>
      <Headline kicker="Three outside up" at={s(0.3)} accent={UP}>
        An engulfing, then a higher close
      </Headline>
      <AbsoluteFill style={{ opacity: fade(f, trend) * (1 - fade(f, engulf)) }}>
        <CinematicChart cam={wide(d.TOU)} bars={d.TOU} lines={[]} draw={upto(5, N)} head={false} maxBody={90} regions={[{ from: -0.5, to: 5.5, color: DOWN, opacity: 1 }]} />
      </AbsoluteFill>
      {f >= engulf && (
        <Confirmed
          bars={d.TOU}
          test={d.TOU_SECOND_CLOSE}
          testLabel={`second close ${fmt(d.TOU_SECOND_CLOSE)}`}
          third="closes"
          thirdClose={d.TOU_THIRD_CLOSE}
          color={UP}
          base="engulfing"
          baseAt={engulf + s(0.2)}
          thirdAt={third}
          notes={[
            { label: 'one big order?', color: SOFT, opacity: fade(f, why + s(1.6)), index: 6.5 },
          ]}
        />
      )}
    </AbsoluteFill>
  );
}

export function OutsideDownCinematic() {
  const third = useMark('third', 4);
  return (
    <AbsoluteFill>
      <Headline kicker="The mirror image" at={s(0.3)} accent={DOWN}>
        Three outside down: an engulfing, then a lower close
      </Headline>
      <Confirmed bars={d.TOD} test={d.TOD_SECOND_CLOSE} testLabel={`second close ${fmt(d.TOD_SECOND_CLOSE)}`} third="closes" thirdClose={d.TOD_THIRD_CLOSE} color={DOWN} base="bearish engulfing" baseAt={s(0.8)} thirdAt={third} />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- the third candle

export function ThirdCinematic() {
  const f = useCurrentFrame();
  const inside = useMark('inside', 3);
  const outside = useMark('outside', 7);
  const why = useMark('why', 12);
  const split = fade(f, why, s(0.6));
  const rows: [string, string, string, number][] = [
    ['Three inside up', 'Bullish harami', "Above the first candle's open", inside],
    ['Three inside down', 'Bearish harami', "Below the first candle's open", inside + s(0.5)],
    ['Three outside up', 'Bullish engulfing', "Above the second candle's close", outside],
    ['Three outside down', 'Bearish engulfing', "Below the second candle's close", outside + s(0.5)],
  ];
  const cell = { padding: '20px 28px', fontSize: 34 } as const;
  const panel = (bars: OHLC[], left: number, title: string, children: { levels: Parameters<typeof CinematicChart>[0]['levels']; brackets?: Parameters<typeof CinematicChart>[0]['brackets'] }) => (
    <>
      <div style={{ position: 'absolute', left, top: 250, fontSize: 34, fontWeight: 700, color: 'var(--color-ink)' }}>{title}</div>
      <CinematicChart cam={view(bars, 4.4, N + 0.6, 0.14)} bars={bars} lines={[]} head={false} maxBody={60} draw={upto(8, N)} plot={{ left, right: left + 640, top: 330, bottom: 860 }} outlines={[{ from: 6, to: 8, color: ACCENT, opacity: 1 }]} {...children} />
    </>
  );
  return (
    <AbsoluteFill>
      <Headline key={String(f >= why)} kicker="What the third candle must do" at={f >= why ? why : s(0.3)} accent={f >= why ? ACCENT : undefined}>
        {f >= why ? 'Inside: the harder test, a longer way to go' : 'Inside: beyond the first open. Outside: beyond the second close'}
      </Headline>
      <div style={{ position: 'absolute', left: 140, right: 140, top: 270, opacity: 1 - split, borderRadius: 24, border: '2px solid var(--color-line)', overflow: 'hidden', background: 'var(--color-surface-1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', color: SOFT, borderBottom: '2px solid var(--color-line)' }}>
          {['Pattern', 'Two-candle base', 'Third candle must close…'].map((h) => (
            <div key={h} style={{ ...cell, fontSize: 28, fontWeight: 700 }}>
              {h}
            </div>
          ))}
        </div>
        {rows.map(([p, base, rule, from], k) => (
          <div key={p} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', opacity: fade(f, from), transform: `translateX(${(1 - fade(f, from)) * -24}px)`, borderTop: k ? '2px solid var(--color-line)' : undefined }}>
            <div style={{ ...cell, fontWeight: 700, color: k % 2 ? DOWN : UP }}>{p}</div>
            <div style={{ ...cell, color: 'var(--color-ink)' }}>{base}</div>
            <div style={{ ...cell, fontWeight: 700, color: k < 2 ? ACCENT : MID }}>{rule}</div>
          </div>
        ))}
      </div>
      {split > 0 && (
        <AbsoluteFill style={{ opacity: split }}>
          <CornerTag label={SYNTHETIC} />
          {panel(d.TIU, 160, 'Inside: past the first open', {
            levels: [{ price: d.TIU_FIRST_OPEN, label: `first open ${fmt(d.TIU_FIRST_OPEN)}`, color: ACCENT, opacity: 1, draw: drawIn(f, why + s(0.8)) }],
            brackets: [{ index: 7, from: d.EARLY, to: d.TIU_FIRST_OPEN, color: ACCENT, opacity: fade(f, why + s(2)), label: `+${fmt(d.INSIDE_GAP)}` }],
          })}
          {panel(d.TOU, 1020, 'Outside: one more close', {
            levels: [{ price: d.TOU_SECOND_CLOSE, label: `second close ${fmt(d.TOU_SECOND_CLOSE)}`, color: MID, opacity: 1, draw: drawIn(f, why + s(3)) }],
          })}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- valid

export function ValidCinematic() {
  const f = useCurrentFrame();
  const watch = useMark('watch', 8);
  return (
    <AbsoluteFill>
      <Headline key={String(f >= watch)} kicker="Where they are valid" at={f >= watch ? watch : s(0.3)} accent={f >= watch ? UP : undefined}>
        {f >= watch ? 'A harami: watch. Three inside up: the watch is over' : 'A prior trend, at support or resistance, on daily charts'}
      </Headline>
      <CinematicChart
        cam={cameraAt(f, [
          { at: 0, cam: wide(d.TIU) },
          { at: watch, cam: close(d.TIU), move: s(1.6) },
        ])}
        bars={d.TIU}
        lines={[]}
        head={false}
        maxBody={90}
        draw={upto(f >= watch + s(3) ? 8 : 7, N)}
        legend={PRICE}
        focus={{ from: 6, to: 8, strength: fade(f, watch, s(1)) }}
        regions={[{ from: -0.5, to: 5.5, color: DOWN, opacity: fade(f, s(1)) * (1 - fade(f, watch)), label: 'a prior downtrend' }]}
        outlines={[
          { from: 6, to: 7, color: ACCENT, opacity: fade(f, watch + s(0.8)) * (1 - fade(f, watch + s(3))) },
          { from: 6, to: 8, color: UP, opacity: fade(f, watch + s(3.2)) },
        ]}
        notes={[
          { label: 'harami: watch', color: ACCENT, opacity: fade(f, watch + s(1)) * (1 - fade(f, watch + s(3))), index: 6.5 },
          { label: 'the watch is over', color: UP, opacity: fade(f, watch + s(3.6)), index: 8 },
        ]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- trade

function TradeChart({ bars, entry, stop, risk, stopLabel, at, opacity }: { bars: OHLC[]; entry: number; stop: number; risk: number; stopLabel: string; at: number; opacity: number }) {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity }}>
      <CinematicChart
        cam={view(bars, 3.3, N + 0.8, 0.14)}
        bars={bars}
        lines={[]}
        head={false}
        maxBody={80}
        draw={upto(8, N)}
        legend={PRICE}
        outlines={[{ from: 6, to: 8, color: ACCENT, opacity: 1 }]}
        levels={[
          { price: entry, label: `entry ${fmt(entry)}`, color: UP, opacity: 1, draw: drawIn(f, at + s(0.6)) },
          { price: stop, label: `${stopLabel} ${fmt(stop)}`, color: DOWN, opacity: 1, draw: drawIn(f, at + s(2.6)) },
        ]}
        brackets={[{ index: 8, from: stop, to: entry, color: ACCENT, opacity: fade(f, at + s(4.4)), label: `risk ${fmt(risk)}` }]}
      />
    </AbsoluteFill>
  );
}

export function TradeCinematic() {
  const f = useCurrentFrame();
  const inside = useMark('inside', 4);
  const outside = useMark('outside', 13);
  const size = useMark('size', 22);
  const swap = fade(f, outside, s(0.6));
  const head = f < inside ? 'Enter at the third close' : f < outside ? `Three inside up: ${fmt(d.IN_RISK)} of risk` : f < size ? `Three outside up: ${fmt(d.OUT_RISK)} of risk` : 'Size the position to the stop';
  return (
    <AbsoluteFill>
      <Headline key={head} kicker="A trade idea" at={f < inside ? s(0.3) : f < outside ? inside : f < size ? outside : size} accent={f >= inside && f < size ? UP : DANGER}>
        {head}
      </Headline>
      <TradeChart bars={d.TIU} entry={d.IN_ENTRY} stop={d.IN_STOP} risk={d.IN_RISK} stopLabel="stop" at={inside} opacity={1 - swap} />
      {swap > 0 && <TradeChart bars={d.TOU} entry={d.OUT_ENTRY} stop={d.OUT_STOP} risk={d.OUT_RISK} stopLabel="stop" at={outside} opacity={swap} />}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- cost

export function CostCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const tradeoff = useMark('tradeoff', 10);
  return (
    <AbsoluteFill>
      <Headline key={String(f >= tradeoff)} kicker="The catch" at={f >= tradeoff ? tradeoff : s(0.3)} accent={DANGER}>
        {f >= tradeoff ? 'Confirmation buys accuracy with price' : `Confirmation costs you price: ${fmt(d.COST)} later`}
      </Headline>
      <CinematicChart
        cam={view(d.TIU, 4.3, N + 0.8, 0.14)}
        bars={d.TIU}
        lines={[]}
        head={false}
        maxBody={90}
        draw={upto(8, N)}
        legend={PRICE}
        focus={{ from: 7, to: 8, strength: fade(f, at(0.05)) }}
        levels={[
          { price: d.EARLY, label: `early entry ${fmt(d.EARLY)}`, color: MID, opacity: 1, draw: drawIn(f, at(0.12)) },
          { price: d.IN_ENTRY, label: `confirmed ${fmt(d.IN_ENTRY)}`, color: UP, opacity: 1, draw: drawIn(f, at(0.3)) },
        ]}
        brackets={[{ index: 8, from: d.EARLY, to: d.IN_ENTRY, color: DANGER, opacity: fade(f, at(0.42)), label: `${fmt(d.COST)} later` }]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- reliability

export function ReliabilityCinematic() {
  const f = useCurrentFrame();
  const harami = useMark('harami', 2);
  const engulfing = useMark('engulfing', 13);
  const lesson = useMark('lesson', 24);
  const over = useOvershoot();
  const W = 470;
  const pair = (left: number, top: number, base: [string, number], conf: [string, number], start: number, helped: boolean) => {
    const bar = (label: string, pct: number, y: number, at: number, color: string) => (
      <div style={{ position: 'absolute', left, top: y, opacity: fade(f, at) }}>
        <div style={{ fontSize: 28, color: label === base[0] ? SOFT : 'var(--color-ink)', fontWeight: 700, marginBottom: 8 }}>{label}</div>
        <div style={{ position: 'relative', width: W, height: 46, borderRadius: 12, background: 'var(--color-surface-1)', border: '2px solid var(--color-line)' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: (W * pct * over(f, at)) / 100, borderRadius: 12, background: color, opacity: 0.85 }} />
          <div style={{ position: 'absolute', left: W / 2, top: -6, bottom: -6, borderLeft: '3px dashed var(--color-ink)', opacity: 0.6 }} />
        </div>
        <div style={{ position: 'absolute', left: W + 22, top: 40, fontFamily: 'var(--font-mono)', fontSize: 40, fontWeight: 700, color }}>{countUp(f, at, pct)}%</div>
      </div>
    );
    const o = fade(f, start + s(2.6));
    return (
      <>
        {bar(base[0], base[1], top, start, SOFT)}
        {bar(conf[0], conf[1], top + 110, start + s(1), helped ? UP : DANGER)}
        <div style={{ position: 'absolute', left: left + W + 130, top: top + 70, opacity: o, transform: `scale(${0.8 + 0.2 * o})`, fontSize: 30, fontWeight: 700, color: helped ? UP : DANGER, border: `3px solid ${helped ? UP : DANGER}`, borderRadius: 14, padding: '6px 16px' }}>
          {helped ? '▲ helped' : '▼ did not'}
        </div>
      </>
    );
  };
  return (
    <AbsoluteFill>
      <Headline key={f >= lesson ? 'c' : f >= engulfing ? 'b' : 'a'} kicker="Honest reliability" at={f >= lesson ? lesson : f >= engulfing ? engulfing : s(0.3)} accent={f >= lesson ? ACCENT : f >= engulfing ? MID : UP}>
        {f >= lesson ? 'Spend your patience where it pays: on the harami' : f >= engulfing ? 'Outside versions: mixed' : 'Inside versions: confirmation helped the harami'}
      </Headline>
      <div style={{ position: 'absolute', left: 140, top: 236, fontSize: 26, color: SOFT, opacity: fade(f, harami) }}>coin flip: the dashed line, 50%</div>
      {pair(140, 290, ['Bullish harami', d.HARAMI_BULL], ['Three inside up', d.TIU_PCT], harami + s(0.4), true)}
      {pair(140, 580, ['Bearish harami', d.HARAMI_BEAR], ['Three inside down', d.TID_PCT], harami + s(4.4), true)}
      {pair(1000, 290, ['Bullish engulfing', d.ENGULF_BULL], ['Three outside up', d.TOU_PCT], engulfing + s(0.4), true)}
      {pair(1000, 580, ['Bearish engulfing', d.ENGULF_BEAR], ['Three outside down', d.TOD_PCT], engulfing + s(3.6), false)}
      <div style={{ position: 'absolute', left: 140, right: 140, top: 900, fontSize: 26, color: SOFT, opacity: fade(f, harami + s(0.4)) }}>
        Source: Thomas Bulkowski's published tests, thepatternsite.com. His tested versions close beyond the second candle's close.
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- takeaways

export function TakeawaysCinematic() {
  return (
    <Recap
      items={[
        ["Three inside: a harami, then a close beyond the first candle's open.", ACCENT],
        ["Three outside: an engulfing, then a close beyond the second candle's close.", MID],
        ['A prior trend, at support or resistance.', SOFT],
        ["Enter at the third close; stop beyond the pattern's extreme; size to it.", UP],
        ['Confirmation helps the harami far more than the engulfing.', DANGER],
      ]}
      starts={[0.03, 0.26, 0.5, 0.62, 0.84]}
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
        <span style={{ ...body, fontSize: 34, color: 'var(--color-ink)' }}>{text}</span>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 140, top: 140, width: 900, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={kicker}>Quick check</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 50, fontWeight: 700, margin: 0, lineHeight: 1.15, opacity: fade(f, s(0.4)) }}>Why does confirmation help the harami more than the engulfing?</h2>
          {f >= think && !shown && (
            <svg viewBox="0 0 100 100" style={{ width: 84, flexShrink: 0 }}>
              <circle cx={50} cy={50} r={40} fill="none" stroke="var(--color-line)" strokeWidth={10} />
              <circle cx={50} cy={50} r={40} fill="none" stroke={ACCENT} strokeWidth={10} strokeDasharray={`${ring * 251} 251`} transform="rotate(-90 50 50)" />
            </svg>
          )}
        </div>
        {option('A', 'It does not help either', false, at(0.32))}
        {option('B', 'The harami is only a stall; the engulfing already showed a change of control', true, at(0.42))}
        <div style={{ ...body, fontSize: 32, opacity: fade(f, reveal + s(2)) }}>Confirmation filters out the stalls that resume the trend.</div>
      </div>
      {shown && (
        <AbsoluteFill style={{ opacity: fade(f, reveal, s(0.6)) }}>
          <CornerTag label={SYNTHETIC} />
          <CinematicChart cam={view(d.TIU, 4.4, N - 0.3, 0.14)} bars={d.TIU} lines={[]} head={false} maxBody={50} draw={upto(8, N)} plot={{ left: 1160, right: 1660, top: 300, bottom: 860 }} outlines={[{ from: 6, to: 7, color: ACCENT, opacity: 1 }]} notes={[{ label: 'only a stall', color: ACCENT, opacity: fade(f, reveal + s(0.8)), index: 7 }]} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- end

export function EndCinematic() {
  return <PractiseEnd bars={d.TIU} action="Find them in the pattern trainer." checks={['A harami or an engulfing?', 'Then the next candle?', 'Beyond the open, or the close?']} link="nitoratrading.com/trainer" />;
}
