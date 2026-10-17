/**
 * "The Abandoned Baby and Doji Stars", in the studio look: every chart is candles, every number on
 * screen comes from ./data.ts, labels sit on what they name (no pointer lines), disclaimer tags go
 * in the corner, candles build through their sessions with a live price tag, and the gaps that
 * isolate the doji are shaded as the empty bands they are.
 */
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import type { OHLC } from '@/engine/market/types';
import { CornerTag, ILLUSTRATION, SYNTHETIC, body, kicker, s, useMark, useSpeechAt } from '../kit';
import { CinematicChart, cameraAt, type Zone } from '../cinematic/CinematicChart';
import { ACCENT, DOWN, PRICE, Panel, PatternIntro, PractiseEnd, Recap, SOFT, UP, buildCandles, countUp, fmt, upto, useOvershoot, view } from '../cinematic/pieces';
import { Headline, clamp, fade } from '../cinematic/scenes';
import * as d from './data';

const MID = 'var(--color-chart-2)';
const DANGER = 'var(--color-danger)';
const N = 9;
const wide = (bars: OHLC[]) => view(bars, -0.8, N + 0.4, 0.16);
const close = (bars: OHLC[], extra = 0) => view(bars, 4.3, N + 0.3 + extra, 0.14);
const drawIn = (f: number, at: number) => interpolate(f, [at, at + s(0.8)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
const tag = (b: { building?: number }) => (b.building !== undefined ? { index: b.building, opacity: 1 } : undefined);

/** The two gaps around the bullish baby: below candle one's low, and below candle three's low, down to the doji's high. */
const bullGaps = (opacity: number, third = 1): Zone[] => [
  { from: 6, to: 7, lo: d.BABY_HIGH, hi: d.FIRST_LOW, color: ACCENT, opacity },
  { from: 7, to: 8, lo: d.BABY_HIGH, hi: d.THIRD_LOW, color: ACCENT, opacity: opacity * third },
];
const bearGaps = (opacity: number): Zone[] => [
  { from: 6, to: 7, lo: d.BEAR_FIRST_HIGH, hi: d.BEAR_BABY_LOW, color: ACCENT, opacity },
  { from: 7, to: 8, lo: d.BEAR_THIRD_HIGH, hi: d.BEAR_BABY_LOW, color: ACCENT, opacity },
];

// ---------------------------------------------------------------- title

export function GappedIntro() {
  return <PatternIntro kicker="Module 2 · Candlestick patterns · Lesson 13" words={['The', 'abandoned', 'baby']} sub="And the doji stars: a total stall, cut off by gaps." bars={d.ABB} growIndex={8} rule={`linear-gradient(90deg, ${DOWN}, ${ACCENT}, ${UP})`} />;
}

// ---------------------------------------------------------------- intro

export function IntroCinematic() {
  const f = useCurrentFrame();
  const stars = useMark('stars', 8);
  const names = useMark('names', 13);
  const rare = useMark('rare', 22);
  const b = buildCandles(d.ABB, f, 5, [
    { index: 6, at: s(0.8), len: s(1.4) },
    { index: 7, at: s(3.2), len: s(1.2) },
    { index: 8, at: stars + s(0.4), len: s(1.6) },
  ]);
  const panels = fade(f, names, s(0.6)) * (1 - fade(f, rare, s(0.6)));
  const stat = fade(f, rare + s(0.2), s(0.6));
  const P = [
    { title: 'Morning doji star', bars: d.MDS, color: UP, tagLabel: SYNTHETIC },
    { title: 'Evening doji star', bars: d.EDS, color: DOWN, tagLabel: ILLUSTRATION },
    { title: 'Abandoned baby', bars: d.ABB, color: ACCENT, tagLabel: SYNTHETIC },
  ];
  const head = f < stars ? 'Sometimes the market jumps: a gap' : f < names ? 'Gaps around a star\'s middle candle' : f < rare ? 'Doji stars, and the abandoned baby' : 'Rare: small samples, encouraging numbers';
  return (
    <AbsoluteFill>
      <Headline key={head} kicker={f < names ? 'The idea' : 'The patterns'} at={f < stars ? s(0.3) : f < names ? stars : f < rare ? names : rare} accent={f >= rare ? DANGER : undefined}>
        {head}
      </Headline>
      <AbsoluteFill style={{ opacity: 1 - fade(f, names, s(0.6)) }}>
        <CornerTag label={SYNTHETIC} />
        <CinematicChart
          cam={cameraAt(f, [
            { at: 0, cam: wide(d.ABB) },
            { at: s(3), cam: close(d.ABB), move: s(2) },
          ])}
          bars={b.bars}
          lines={[]}
          draw={b.draw}
          head={false}
          maxBody={90}
          legend={PRICE}
          priceTag={tag(b)}
          zones={bullGaps(fade(f, s(4.6)), fade(f, stars + s(2)))}
          notes={[{ label: 'a gap', color: ACCENT, opacity: fade(f, s(5)) * (1 - fade(f, stars)), index: 6.5 }]}
        />
      </AbsoluteFill>
      {panels > 0 && (
        <AbsoluteFill style={{ opacity: panels }}>
          {P.map((p, k) => {
            const x0 = 120 + k * 570;
            return (
              <div key={k} style={{ opacity: fade(f, names + k * s(0.5)) }}>
                <Panel x0={x0} x1={x0 + 540} y0={250} y1={900} title={p.title} state={1} />
                <CinematicChart cam={view(p.bars, 4.4, N - 0.4, 0.14)} bars={p.bars} lines={[]} head={false} maxBody={56} draw={upto(8, N)} plot={{ left: x0 + 30, right: x0 + 400, top: 360, bottom: 840 }} outlines={[{ from: 7, to: 7, color: p.color, opacity: 1 }]} zones={k === 2 ? bullGaps(1) : []} />
              </div>
            );
          })}
          <CornerTag label="Middle panel: illustration · others: synthetic data" />
        </AbsoluteFill>
      )}
      {stat > 0 && (
        <AbsoluteFill style={{ opacity: stat, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 220, fontWeight: 700, color: ACCENT, lineHeight: 1 }}>{countUp(f, rare + s(0.2), d.BABY_SAMPLES, 0, s(1.6))}</div>
          <div style={{ ...body, fontSize: 46, color: 'var(--color-ink)', marginTop: 24 }}>bullish abandoned babies</div>
          <div style={{ ...body, fontSize: 40, marginTop: 8, opacity: fade(f, rare + s(1.4)) }}>in {d.CANDLES_MILLIONS} million daily candles</div>
          <div style={{ fontSize: 26, color: SOFT, marginTop: 40, opacity: fade(f, rare + s(2)) }}>Source: Thomas Bulkowski, thepatternsite.com</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- doji star

export function DojiStarCinematic() {
  const f = useCurrentFrame();
  const rules = useMark('rules', 1.5);
  const stall = useMark('stall', 13);
  const tested = useMark('tested', 21);
  const mirror = useMark('mirror', 27);
  const b = buildCandles(d.MDS, f, 5, [
    { index: 6, at: rules + s(0.4), len: s(1.4) },
    { index: 7, at: rules + s(3), len: s(1.6) },
    { index: 8, at: rules + s(7), len: s(1.8) },
  ]);
  const swap = fade(f, mirror, s(0.6));
  const head = f < stall ? 'Morning doji star: a doji in the middle' : f < tested ? 'A doji: price did not move at all' : f < mirror ? 'Stronger in theory; about the same in the tests' : 'Evening doji star: the mirror';
  return (
    <AbsoluteFill>
      <Headline key={head} kicker="Doji stars" at={f < stall ? s(0.3) : f < tested ? stall : f < mirror ? tested : mirror} accent={f < stall ? UP : f < tested ? ACCENT : f < mirror ? MID : DOWN}>
        {head}
      </Headline>
      <CornerTag label={SYNTHETIC} opacity={1 - swap} />
      <CornerTag label={ILLUSTRATION} opacity={swap} />
      <AbsoluteFill style={{ opacity: 1 - swap }}>
        <CinematicChart
          cam={cameraAt(f, [
            { at: 0, cam: wide(d.MDS) },
            { at: rules, cam: close(d.MDS), move: s(2) },
          ])}
          bars={b.bars}
          lines={[]}
          draw={b.draw}
          head={false}
          maxBody={90}
          legend={PRICE}
          priceTag={tag(b)}
          focus={{ from: 7, to: f >= rules + s(7) ? 8 : 7, strength: fade(f, rules + s(3)) * 0.8 }}
          levels={[{ price: d.MDS_MID, label: `middle ${fmt(d.MDS_MID)}`, color: MID, opacity: 1, draw: drawIn(f, rules + s(6)) }]}
          notes={[
            { label: 'doji: opens = closes', color: ACCENT, opacity: fade(f, rules + s(4.8)) * (1 - fade(f, tested)), index: 7 },
            { label: `closes ${fmt(d.MDS_THIRD_CLOSE)}`, color: UP, opacity: fade(f, rules + s(9.2)), index: 8 },
            { label: 'stronger in theory', color: MID, opacity: fade(f, tested + s(0.6)), index: 7 },
          ]}
        />
      </AbsoluteFill>
      {swap > 0 && (
        <AbsoluteFill style={{ opacity: swap }}>
          <CinematicChart cam={close(d.EDS)} bars={d.EDS} lines={[]} draw={upto(8, N)} head={false} maxBody={90} legend={PRICE} outlines={[{ from: 6, to: 8, color: DOWN, opacity: fade(f, mirror + s(1)) }]} notes={[{ label: 'doji above', color: ACCENT, opacity: fade(f, mirror + s(1.6)), index: 7 }]} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- ice

/** The lesson's car on ice: one slows and drives off; one stops dead, then drives off. */
export function IceCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const WALL = 1640;
  const lane = (y: number, label: string, color: string, start: number, dead: boolean) => {
    const slide = interpolate(f, [start, start + s(1.6)], [300, WALL - 300], { ...clamp, easing: Easing.out(Easing.cubic) });
    // The ordinary star creeps a little further before turning; the doji star stops dead.
    const creep = dead ? 0 : interpolate(f, [start + s(1.6), start + s(2.6)], [0, 60], clamp);
    const away = interpolate(f, [start + s(2.8), start + s(4)], [0, -700], { ...clamp, easing: Easing.in(Easing.cubic) });
    const x = slide + creep + away;
    return (
      <g opacity={fade(f, start - s(0.3))}>
        <line x1={160} x2={WALL} y1={y + 40} y2={y + 40} stroke="#9fd3ff" strokeWidth={6} opacity={0.5} />
        <rect x={x - 90} y={y - 40} width={180} height={70} rx={18} fill={color} />
        <circle cx={x - 50} cy={y + 32} r={16} fill="var(--color-ink)" />
        <circle cx={x + 50} cy={y + 32} r={16} fill="var(--color-ink)" />
        <text x={160} y={y - 70} fontSize={38} fontWeight={700} fill={color} fontFamily="var(--font-sans)">
          {label}
        </text>
      </g>
    );
  };
  return (
    <AbsoluteFill>
      <Headline kicker="Picture it" at={s(0.3)} accent={ACCENT}>
        A dead stop is more convincing
      </Headline>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect x={WALL} y={300} width={40} height={600} rx={6} fill={SOFT} opacity={0.7} />
        {lane(460, 'Morning star: slows right down, then drives away', UP, at(0.15), false)}
        {lane(760, 'Morning doji star: a dead stop, then drives away', ACCENT, at(0.48), true)}
      </svg>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- the abandoned baby

export function BabyCinematic() {
  const f = useCurrentFrame();
  const gaps = useMark('gaps', 6);
  const third = useMark('third', 14);
  const bearish = useMark('bearish', 19);
  const b = buildCandles(d.ABB, f, 7, [{ index: 8, at: third + s(0.2), len: s(1.6) }]);
  const swap = fade(f, bearish, s(0.6));
  const head = f < gaps ? 'Gapped away from both neighbours, wicks included' : f < third ? 'Nothing touches the baby' : f < bearish ? 'Then a big candle back into candle one\'s body' : 'The bearish mirror: isolated at the top';
  return (
    <AbsoluteFill>
      <Headline key={head} kicker="The abandoned baby" at={f < gaps ? s(0.3) : f < third ? gaps : f < bearish ? third : bearish} accent={f >= gaps && f < third ? ACCENT : undefined}>
        {head}
      </Headline>
      <AbsoluteFill style={{ opacity: 1 - swap }}>
        <CinematicChart
          cam={close(d.ABB, 0.6)}
          bars={f >= third ? b.bars : d.ABB}
          lines={[]}
          draw={f >= third ? b.draw : upto(7, N)}
          head={false}
          maxBody={90}
          legend={PRICE}
          priceTag={tag(b)}
          focus={{ from: 7, to: 7, strength: fade(f, gaps) * 0.6 * (1 - fade(f, third)) }}
          zones={bullGaps(fade(f, gaps + s(0.4)), fade(f, third + s(2)))}
          levels={[
            { price: d.BABY_HIGH, label: `doji high ${fmt(d.BABY_HIGH)}`, color: ACCENT, opacity: 1, draw: drawIn(f, gaps + s(0.6)) },
            { price: d.FIRST_LOW, label: `first low ${fmt(d.FIRST_LOW)}`, color: DOWN, opacity: 1, draw: drawIn(f, gaps + s(2.6)) },
          ]}
        />
      </AbsoluteFill>
      {swap > 0 && (
        <AbsoluteFill style={{ opacity: swap }}>
          <CinematicChart cam={close(d.ABS, 0.6)} bars={d.ABS} lines={[]} draw={upto(8, N)} head={false} maxBody={90} legend={PRICE} zones={bearGaps(fade(f, bearish + s(0.8)))} outlines={[{ from: 7, to: 7, color: ACCENT, opacity: fade(f, bearish + s(1.4)) }]} notes={[{ label: 'gap on each side', color: ACCENT, opacity: fade(f, bearish + s(2)), index: 7 }]} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- psychology

export function PsychologyCinematic() {
  const f = useCurrentFrame();
  const panic = useMark('panic', 0.5);
  const nothing = useMark('nothing', 6);
  const jump = useMark('jump', 10);
  const trapped = useMark('trapped', 14);
  const b = buildCandles(d.ABB, f, 6, [
    { index: 7, at: panic + s(0.6), len: s(2) },
    { index: 8, at: jump + s(0.3), len: s(1.8) },
  ]);
  const trapZone: Zone = { from: 7, to: N + 0.6, lo: d.BABY_LOW, hi: d.BABY_HIGH, color: DANGER, opacity: fade(f, trapped + s(0.4)) };
  return (
    <AbsoluteFill>
      <Headline kicker="The psychology" at={s(0.4)} accent={DANGER}>
        Panic, then nothing, then a jump back: a trapped crowd
      </Headline>
      <CinematicChart
        cam={close(d.ABB, 0.6)}
        bars={b.bars}
        lines={[]}
        draw={b.draw}
        head={false}
        maxBody={90}
        legend={PRICE}
        priceTag={tag(b)}
        zones={[...bullGaps(fade(f, panic + s(1.2)), fade(f, jump + s(1.4))), trapZone]}
        notes={[
          { label: 'gap down: panic', color: DOWN, opacity: fade(f, panic + s(1.4)) * (1 - fade(f, trapped)), index: 7 },
          { label: 'then nothing', color: ACCENT, opacity: fade(f, nothing + s(0.6)) * (1 - fade(f, jump)), index: 7 },
          { label: 'gap up: the jump back', color: UP, opacity: fade(f, jump + s(2)) * (1 - fade(f, trapped)), index: 8 },
          { label: 'sellers trapped below the gap', color: DANGER, opacity: fade(f, trapped + s(1)), index: 7 },
        ]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- valid

export function ValidCinematic() {
  const f = useCurrentFrame();
  const gaps = useMark('gaps', 3);
  const daily = useMark('daily', 13);
  const level = useMark('level', 16);
  const split = fade(f, gaps, s(0.6)) * (1 - fade(f, level, s(0.6)));
  const back = fade(f, level, s(0.6));
  const half = (bars: OHLC[], left: number, title: string, note: string, color: string, gapped: boolean) => (
    <>
      <div style={{ position: 'absolute', left, top: 250, fontSize: 34, fontWeight: 700, color }}>{title}</div>
      <CinematicChart cam={view(bars, 4.4, N + 0.2, 0.14)} bars={bars} lines={[]} head={false} maxBody={60} draw={upto(8, N)} plot={{ left, right: left + 640, top: 330, bottom: 830 }} zones={gapped ? bullGaps(1) : []} outlines={[{ from: 7, to: 7, color, opacity: 1 }]} notes={[{ label: note, color, opacity: fade(f, gaps + s(1.4)), index: 7 }]} />
    </>
  );
  const head = f < gaps ? 'A prior trend, and gaps' : f < daily ? 'Gaps come from markets that close overnight' : f < level ? 'More meaningful on daily and weekly charts' : 'At support or resistance: a rare, striking sight';
  return (
    <AbsoluteFill>
      <Headline key={head} kicker="Where they work" at={f < gaps ? s(0.3) : f < daily ? gaps : f < level ? daily : level}>
        {head}
      </Headline>
      <AbsoluteFill style={{ opacity: 1 - fade(f, gaps, s(0.6)) }}>
        <CornerTag label={SYNTHETIC} />
        <CinematicChart cam={wide(d.ABB)} bars={d.ABB} lines={[]} head={false} maxBody={90} draw={upto(8, N)} legend={PRICE} regions={[{ from: -0.5, to: 5.5, color: DOWN, opacity: fade(f, s(1)), label: 'a prior downtrend' }]} />
      </AbsoluteFill>
      {split > 0 && (
        <AbsoluteFill style={{ opacity: split }}>
          <CornerTag label="Left: synthetic data · Right: illustration" />
          {half(d.ABB, 160, 'Stocks: an overnight break', 'gapped', ACCENT, true)}
          {half(d.NO_GAP, 1040, '24-hour market: no break', 'no gaps', SOFT, false)}
        </AbsoluteFill>
      )}
      {back > 0 && (
        <AbsoluteFill style={{ opacity: back }}>
          <CornerTag label={SYNTHETIC} />
          <CinematicChart cam={wide(d.ABB)} bars={d.ABB} lines={[]} head={false} maxBody={90} draw={upto(8, N)} legend={PRICE} zones={bullGaps(1)} focus={{ from: 6, to: 8, strength: fade(f, level + s(0.6)) }} outlines={[{ from: 6, to: 8, color: ACCENT, opacity: fade(f, level + s(1)) }]} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- trade

export function TradeCinematic() {
  const f = useCurrentFrame();
  const entry = useMark('entry', 3);
  const stop = useMark('stop', 9);
  const bear = useMark('bear', 19);
  const head = f < entry ? 'The third candle is the confirmation' : f < stop ? 'Entry: at the third close' : f < bear ? `Stop: just under the doji's low, ${fmt(d.RISK)} of risk` : 'Bearish: short the third close, stop above the doji';
  return (
    <AbsoluteFill>
      <Headline key={head} kicker="A trade idea" at={f < entry ? s(0.3) : f < stop ? entry : f < bear ? stop : bear} accent={f < entry ? undefined : f < stop ? UP : f < bear ? DOWN : DOWN}>
        {head}
      </Headline>
      <CinematicChart
        cam={view(d.ABB, 4.3, N + 1, 0.14)}
        bars={d.ABB}
        lines={[]}
        head={false}
        maxBody={80}
        draw={upto(8, N)}
        legend={PRICE}
        zones={bullGaps(1)}
        outlines={[{ from: 6, to: 8, color: ACCENT, opacity: 1 }]}
        levels={[
          { price: d.ENTRY, label: `entry ${fmt(d.ENTRY)}`, color: UP, opacity: 1, draw: drawIn(f, entry + s(0.4)) },
          { price: d.STOP, label: `stop ${fmt(d.STOP)}`, color: DOWN, opacity: 1, draw: drawIn(f, stop + s(0.4)) },
        ]}
        brackets={[{ index: 8, from: d.STOP, to: d.ENTRY, color: ACCENT, opacity: fade(f, stop + s(2.4)), label: `risk ${fmt(d.RISK)}` }]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- gap fill

export function GapFillCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const b = buildCandles(d.FILLED, f, 8, [{ index: 9, at: at(0.12), len: s(2.6) }]);
  const filled = at(0.12) + s(1.6);
  return (
    <AbsoluteFill>
      <Headline kicker="The warning" at={s(0.3)} accent={DANGER}>
        Gaps that fill are not gaps that held
      </Headline>
      <CinematicChart
        cam={view(d.FILLED, 4.3, N + 1.4, 0.14)}
        bars={b.bars}
        lines={[]}
        draw={b.draw}
        head={false}
        maxBody={80}
        legend={PRICE}
        priceTag={tag(b)}
        zones={[...bullGaps(1 - fade(f, filled)), { from: 7, to: N + 1.4, lo: d.BABY_LOW, hi: d.BABY_HIGH, color: DANGER, opacity: fade(f, filled) }]}
        levels={[{ price: d.STOP, label: `stop ${fmt(d.STOP)}`, color: DOWN, opacity: 1, draw: drawIn(f, at(0.05)) }]}
        notes={[{ label: 'the gap filled: the stop does its job', color: DANGER, opacity: fade(f, filled + s(1.4)), index: 9 }]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- reliability

export function ReliabilityCinematic() {
  const f = useCurrentFrame();
  const at = useSpeechAt();
  const baby = useMark('baby', 9);
  const caveats = useMark('caveats', 15);
  const over = useOvershoot();
  const W = 470;
  const bar = (left: number, top: number, label: string, pct: number, start: number, color: string, quiet = false) => (
    <div style={{ position: 'absolute', left, top, opacity: fade(f, start) }}>
      <div style={{ fontSize: 28, color: quiet ? SOFT : 'var(--color-ink)', fontWeight: 700, marginBottom: 8 }}>{label}</div>
      <div style={{ position: 'relative', width: W, height: 46, borderRadius: 12, background: 'var(--color-surface-1)', border: '2px solid var(--color-line)' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: (W * pct * over(f, start)) / 100, borderRadius: 12, background: color, opacity: 0.85 }} />
        <div style={{ position: 'absolute', left: W / 2, top: -6, bottom: -6, borderLeft: '3px dashed var(--color-ink)', opacity: 0.6 }} />
      </div>
      <div style={{ position: 'absolute', left: W + 22, top: 40, fontFamily: 'var(--font-mono)', fontSize: 40, fontWeight: 700, color }}>{countUp(f, start, pct)}%</div>
    </div>
  );
  return (
    <AbsoluteFill>
      <Headline key={String(f >= caveats)} kicker="Honest reliability" at={f >= caveats ? caveats : s(0.3)} accent={f >= caveats ? DANGER : UP}>
        {f >= caveats ? 'Rare, so small samples; and stock-market patterns' : 'Good numbers, close to the plain stars'}
      </Headline>
      <div style={{ position: 'absolute', left: 140, top: 236, fontSize: 26, color: SOFT, opacity: fade(f, at(0.04)) }}>coin flip: the dashed line, 50%</div>
      {bar(140, 290, 'Morning star (plain)', d.MORNING_STAR, at(0.04), SOFT, true)}
      {bar(140, 400, 'Morning doji star', d.MORNING_DOJI, at(0.1), UP)}
      {bar(1000, 290, 'Evening star (plain)', d.EVENING_STAR, at(0.18), SOFT, true)}
      {bar(1000, 400, 'Evening doji star', d.EVENING_DOJI, at(0.24), DOWN)}
      {bar(140, 560, 'Bullish abandoned baby', d.BABY_BULL, baby + s(0.3), UP)}
      {bar(1000, 560, 'Bearish abandoned baby', d.BABY_BEAR, baby + s(1.6), DOWN)}
      <div style={{ position: 'absolute', left: 140, right: 140, top: 720, display: 'flex', gap: 40 }}>
        {[
          ['Rare: small samples', `${d.MORNING_DOJI_SAMPLES} morning doji stars; ${d.BABY_SAMPLES} bullish babies`],
          ['Stock-market patterns', 'they need overnight gaps: not forex or crypto'],
        ].map(([title, text], k) => {
          const o = fade(f, caveats + s(0.8) + k * s(2.4));
          return (
            <div key={title} style={{ flex: 1, opacity: o, transform: `translateY(${(1 - o) * 20}px)`, borderLeft: `10px solid ${DANGER}`, background: 'var(--color-surface-1)', borderRadius: 24, padding: '22px 30px' }}>
              <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--color-ink)' }}>{title}</div>
              <div style={{ fontSize: 28, color: SOFT, marginTop: 6 }}>{text}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: 140, right: 140, top: 940, fontSize: 26, color: SOFT, opacity: fade(f, at(0.04)) }}>Source: Thomas Bulkowski's published tests, thepatternsite.com. The plain stars' figures are from the stars lesson.</div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- takeaways

export function TakeawaysCinematic() {
  return (
    <Recap
      items={[
        ['A doji star: a total stall; stronger in theory, about as reliable in the tests.', ACCENT],
        ['An abandoned baby: a doji gapped away from both neighbours.', MID],
        ['Panic, then nothing, then a jump back: a trapped crowd.', DOWN],
        ['They need overnight gaps: stocks and indexes.', SOFT],
        ['Enter at the third close; stop beyond the doji; a filled gap means failure.', DANGER],
      ]}
      starts={[0.03, 0.3, 0.45, 0.62, 0.76]}
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
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700, margin: 0, lineHeight: 1.15, opacity: fade(f, s(0.4)) }}>Long on a bullish abandoned baby, price trades back into the doji's range. What does it mean?</h2>
          {f >= think && !shown && (
            <svg viewBox="0 0 100 100" style={{ width: 84, flexShrink: 0 }}>
              <circle cx={50} cy={50} r={40} fill="none" stroke="var(--color-line)" strokeWidth={10} />
              <circle cx={50} cy={50} r={40} fill="none" stroke={ACCENT} strokeWidth={10} strokeDasharray={`${ring * 251} 251`} transform="rotate(-90 50 50)" />
            </svg>
          )}
        </div>
        {option('A', 'The pattern is stronger', false, at(0.42))}
        {option('B', 'The gap has filled, and the pattern has failed', true, at(0.52))}
        <div style={{ ...body, fontSize: 32, opacity: fade(f, reveal + s(2)) }}>The stop under the doji's low should be doing its job.</div>
      </div>
      {shown && (
        <AbsoluteFill style={{ opacity: fade(f, reveal, s(0.6)) }}>
          <CornerTag label={ILLUSTRATION} />
          <CinematicChart cam={view(d.FILLED, 5.4, N + 0.6, 0.14)} bars={d.FILLED} lines={[]} head={false} maxBody={50} draw={upto(9, N + 1)} plot={{ left: 1160, right: 1660, top: 300, bottom: 860 }} zones={[{ from: 7, to: N + 0.6, lo: d.BABY_LOW, hi: d.BABY_HIGH, color: DANGER, opacity: 1 }]} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- end

export function EndCinematic() {
  return <PractiseEnd bars={d.ABB} action="Hunt for them in the pattern trainer." checks={['A doji in the middle?', 'A gap on each side?', 'A big third candle?']} link="nitoratrading.com/trainer" />;
}
