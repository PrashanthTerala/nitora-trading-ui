/**
 * The rest of the cinematic lesson (directive V3, after the proof of concept): every price
 * series as candles, every number from the engine (../ma-crossovers/data.ts), no layer over
 * another's information, the camera and a spotlight on whatever the narration is talking
 * about. On-screen text is English in every language; timing follows each language's marks.
 */
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { body, kicker, s, useMark, usePace } from '../kit';
import * as d from '../ma-crossovers/data';
import { Rope } from '../ma-crossovers/explainers';
import {
  BAND_SPACE,
  CLOSES,
  CinematicChart,
  DEATH,
  GOLDEN,
  PLOT,
  SMA200,
  SMA50,
  WIDE,
  at,
  cameraAt,
  frameBars,
  frameOf,
  type LegendItem,
  type Line,
} from './CinematicChart';
import { Headline, clamp, fade, pulse } from './scenes';

const UP = 'var(--color-up)';
const DOWN = 'var(--color-down)';
const FAST = 'var(--color-chart-2)';
const SLOW = 'var(--color-chart-1)';
const TAG = 'Synthetic data, for teaching';
const AVERAGES: LegendItem[] = [
  { label: 'price', color: 'var(--color-ink-soft)', kind: 'candle' },
  { label: 'SMA 50', color: FAST, kind: 'line' },
  { label: 'SMA 200', color: SLOW, kind: 'line' },
];
const fmt = (v: number) => v.toFixed(2);
const signed = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}`;

// ---------------------------------------------------------------- race

/** The lesson's runners above the real thing: the sprinter overtakes as the 50-day crosses the 200-day. */
export function RaceCinematic() {
  const f = useCurrentFrame();
  const cross = useMark('cross', 13);
  // The sprinter draws level exactly at the narration's "crosses above".
  const lead = interpolate(f, [cross - s(5), cross, cross + s(4)], [-0.08, 0, 0.07], clamp);
  const wobble = 0.012 * Math.sin(f / 9) * Math.min(1, Math.abs(lead) / 0.03);
  const slowX = 0.08 + 0.74 * interpolate(f, [0, cross + s(8)], [0, 1], clamp);
  const fastX = slowX + lead + wobble;
  const W = 1680;
  const lane = (yy: number, xx: number, color: string, label: string) => {
    const cx = 40 + xx * (W - 80);
    return (
      <g>
        <line x1={40} x2={W - 40} y1={yy} y2={yy} stroke="var(--color-line)" strokeWidth={3} strokeDasharray="14 12" />
        <circle cx={cx} cy={yy} r={26} fill={color} />
        <text x={cx} y={yy - 44} textAnchor={xx > 0.6 ? 'end' : xx < 0.2 ? 'start' : 'middle'} fill={color} fontSize={30} fontFamily="var(--font-mono)">
          {label}
        </text>
      </g>
    );
  };
  const overtake = fade(f, cross, s(0.3)) * (1 - fade(f, cross + s(1.2), s(0.6)));
  const idx = (i: number) => i / (d.BARS.length - d.VIEW_FROM - 1);
  const draw = interpolate(f, [s(1), cross, cross + s(5)], [idx(GOLDEN - 60), idx(GOLDEN), idx(GOLDEN + 40)], clamp);
  const after = f >= cross;
  return (
    <AbsoluteFill>
      <Headline key={String(after)} kicker="The idea" at={after ? cross : s(0.3)} accent={after ? UP : undefined}>
        {after ? 'Fast crosses above slow: recent prices lead' : 'A fast average and a slow average, on one chart'}
      </Headline>
      <svg viewBox={`0 0 ${W} 300`} style={{ position: 'absolute', left: 120, top: 250, width: W }}>
        {lane(80, fastX, FAST, 'fast average · the sprinter')}
        {lane(210, slowX, SLOW, 'slow average · the steady runner')}
        {overtake > 0 && <circle cx={40 + fastX * (W - 80)} cy={145} r={40 + 30 * overtake} fill="none" stroke={UP} strokeWidth={5} opacity={overtake} />}
      </svg>
      <CinematicChart
        cam={frameBars(GOLDEN - 60, GOLDEN + 40)}
        draw={draw}
        plot={{ top: 640, bottom: 880 }}
        legend={[
          { label: 'fast: SMA 50', color: FAST, kind: 'line' },
          { label: 'slow: SMA 200', color: SLOW, kind: 'line' },
        ]}
        tag={TAG}
        markers={[{ index: GOLDEN, label: 'fast crosses above', color: UP, opacity: fade(f, cross), pulse: pulse(f, cross) }]}
        spotlight={{ index: GOLDEN, value: SMA50[GOLDEN], radius: 420, strength: fade(f, cross) * 0.8 }}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- sign change

/** The lesson's worked example on a number line: the difference crosses zero, and that is the signal. */
export function SignChangeCinematic() {
  const f = useCurrentFrame();
  const p = usePace();
  const today = useMark('today', 10);
  const flip = useMark('flip', 14);
  const { fps } = useVideoConfig();
  const v = interpolate(f, [today, today + s(1.6)], [-0.5, 0.3], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const crossedAt = today + s(1.6) * (0.5 / 0.8);
  const flash = f >= crossedAt ? 1 - Math.min(1, (f - crossedAt) / s(1.2)) : 0;
  const reverse = flip + s(5);
  const ghost = interpolate(f, [reverse, reverse + s(1.6)], [0.3, -0.3], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const L = 300;
  const R = 1620;
  const X = (val: number) => L + ((val + 1) / 2) * (R - L);
  const AY = 700;
  const row = (label: string, a: string, b: string, diff: string, color: string, atF: number) => {
    const o = spring({ frame: f - atF, fps, config: { damping: 200 } });
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '260px auto', alignItems: 'baseline', gap: 30, opacity: o, transform: `translateY(${(1 - o) * 20}px)`, fontFamily: 'var(--font-mono)', fontSize: 54 }}>
        <span style={{ fontSize: 34, color: 'var(--color-ink-soft)' }}>{label}</span>
        <span>
          <span style={{ color: FAST }}>{a}</span> − <span style={{ color: SLOW }}>{b}</span> = <span style={{ color, fontWeight: 700 }}>{diff}</span>
        </span>
      </div>
    );
  };
  const positive = v > 0;
  return (
    <AbsoluteFill>
      <Headline kicker="No new formula">Difference = fast average − slow average</Headline>
      <div style={{ position: 'absolute', left: 140, top: 300, display: 'flex', flexDirection: 'column', gap: 26 }}>
        {row('Yesterday', '100.4', '100.9', '−0.5', DOWN, p(5))}
        {row('Today', '101.3', '101.0', '+0.3', UP, today)}
      </div>
      <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect x={L} y={AY - 50} width={X(0) - L} height={100} fill={DOWN} opacity={0.1} />
        <rect x={X(0)} y={AY - 50} width={R - X(0)} height={100} fill={UP} opacity={0.1} />
        <line x1={L} x2={R} y1={AY} y2={AY} stroke="var(--color-ink-soft)" strokeWidth={4} />
        {[-1, -0.5, 0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={X(t)} x2={X(t)} y1={AY - (t === 0 ? 60 : 18)} y2={AY + (t === 0 ? 60 : 18)} stroke={t === 0 ? 'var(--color-ink)' : 'var(--color-ink-soft)'} strokeWidth={t === 0 ? 5 : 3} />
            <text x={X(t)} y={AY + 100} textAnchor="middle" fontSize={34} fill="var(--color-ink-soft)" fontFamily="var(--font-mono)">
              {t > 0 ? `+${t}` : t < 0 ? `−${Math.abs(t)}` : '0'}
            </text>
          </g>
        ))}
        <text x={(L + X(0)) / 2} y={AY - 80} textAnchor="middle" fontSize={34} fontWeight={700} fill={DOWN} fontFamily="var(--font-sans)">
          fast below slow
        </text>
        <text x={(X(0) + R) / 2} y={AY - 80} textAnchor="middle" fontSize={34} fontWeight={700} fill={UP} fontFamily="var(--font-sans)">
          fast above slow
        </text>
        {flash > 0 && <circle cx={X(0)} cy={AY} r={40 + 70 * (1 - flash)} fill="none" stroke={UP} strokeWidth={6} opacity={flash} />}
        {f >= reverse && <circle cx={X(ghost)} cy={AY} r={22} fill="none" stroke={DOWN} strokeWidth={6} strokeDasharray="6 6" opacity={fade(f, reverse)} />}
        <circle cx={X(v)} cy={AY} r={24} fill={positive ? UP : DOWN} />
      </svg>
      <div style={{ position: 'absolute', left: 140, right: 140, top: 860, display: 'flex', gap: 60, justifyContent: 'center' }}>
        <div style={{ ...body, fontSize: 40, color: 'var(--color-ink)', opacity: fade(f, flip) }}>
          Negative → positive: <span style={{ color: UP, fontWeight: 700 }}>bullish crossover</span>
        </div>
        <div style={{ ...body, fontSize: 40, color: 'var(--color-ink)', opacity: fade(f, reverse) }}>
          Positive → negative: <span style={{ color: DOWN, fontWeight: 700 }}>bearish crossover</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 960, textAlign: 'center', ...kicker, color: 'var(--color-ink)', fontSize: 36, opacity: fade(f, reverse + s(3)) }}>
        The sign flip is the entire signal
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- trade-off

/** The same candles through a fast pair and a slow pair: every cross ticked and counted. */
export function TradeOffCinematic() {
  const f = useCurrentFrame();
  const chart = useMark('chart', 10);
  const view = (a: number[]) => a.slice(d.VIEW_FROM);
  const ema9 = view(d.EMA9);
  const ema21 = view(d.EMA21);
  const fast = d.crosses(ema9, ema21);
  const slow = d.crosses(SMA50, SMA200);
  const step = (k: number, n: number, start: number) => fade(f, start + Math.round((k * s(2.4)) / Math.max(n, 1)), s(0.3));
  const fastLines: Line[] = [
    { values: ema21, color: SLOW, width: 4 },
    { values: ema9, color: FAST, width: 4 },
  ];
  const shownFast = fast.filter((_, k) => step(k, fast.length, chart) > 0.5).length;
  const shownSlow = slow.filter((_, k) => step(k, slow.length, chart + s(3)) > 0.5).length;
  return (
    <AbsoluteFill>
      <Headline kicker="Fast pairs vs slow pairs">Faster: more signals, earlier, more false ones</Headline>
      <CinematicChart
        cam={WIDE}
        plot={{ top: 290, bottom: 500 }}
        lines={fastLines}
        legend={[
          { label: 'EMA 9', color: FAST, kind: 'line' },
          { label: 'EMA 21', color: SLOW, kind: 'line' },
        ]}
        ticks={fast.map((c, k) => ({ index: c.index, value: ema9[c.index], up: c.direction === 'up', opacity: step(k, fast.length, chart) }))}
        notes={[{ label: `9 / 21 EMA: ${shownFast} crosses`, color: FAST, opacity: fade(f, chart) }]}
      />
      <CinematicChart
        cam={WIDE}
        plot={{ top: 660, bottom: 870 }}
        legend={AVERAGES.slice(1)}
        tag={TAG}
        ticks={slow.map((c, k) => ({ index: c.index, value: SMA50[c.index], up: c.direction === 'up', opacity: step(k, slow.length, chart + s(3)) }))}
        notes={[{ label: `50 / 200 SMA: ${shownSlow} crosses`, color: SLOW, opacity: fade(f, chart + s(3)) }]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- uses

/** Three uses on one chart: entry and exit, bias filter, trend health. */
export function UsesCinematic() {
  const f = useCurrentFrame();
  const bias = useMark('bias', 13);
  const health = useMark('health', 20);
  const p1 = 1 - fade(f, bias);
  const p2 = fade(f, bias) * (1 - fade(f, health));
  const p3 = fade(f, health);
  const head =
    f < bias ? '1 · Entry and exit: buy the bull cross, sell the bear cross' : f < health ? '2 · Bias filter: fast above slow, look only for longs' : '3 · Trend health: far apart is strong, braided is tired';
  const headAt = f < bias ? s(0.3) : f < health ? bias : health;
  const maxGap = at(d.MAX_GAP_INDEX);
  const narrow = at(d.NARROW_INDEX);
  const cam = cameraAt(f, [
    { at: 0, cam: WIDE },
    { at: health + s(0.5), cam: frameBars(maxGap - 70, narrow + 25), move: 54 },
  ]);
  const spot =
    p3 > 0
      ? { index: f < health + s(4) ? maxGap : narrow, value: (SMA50[maxGap] + SMA200[maxGap]) / 2, radius: 520, strength: p3 * 0.8 }
      : { index: GOLDEN, value: CLOSES[GOLDEN], radius: 520, strength: 0 };
  return (
    <AbsoluteFill>
      <Headline key={head} kicker="Three ways traders use it" at={headAt} accent={f < bias ? UP : f < health ? FAST : SLOW}>
        {head}
      </Headline>
      <CinematicChart
        cam={cam}
        legend={AVERAGES}
        tag={TAG}
        spotlight={spot}
        markers={[
          { index: GOLDEN, label: 'buy: bull cross', color: UP, opacity: fade(f, s(1.5)) * (p1 + p2), pulse: 0 },
          { index: DEATH, label: 'sell: bear cross', color: DOWN, opacity: fade(f, s(3)) * (p1 + p2), pulse: 0 },
        ]}
        brackets={[
          { index: DEATH, from: CLOSES[GOLDEN], to: CLOSES[DEATH], color: UP, opacity: fade(f, s(4.5)) * p1, label: `held: ${fmt(CLOSES[GOLDEN])} → ${fmt(CLOSES[DEATH])}` },
          { index: maxGap, from: SMA200[maxGap], to: SMA50[maxGap], color: SLOW, opacity: fade(f, health + s(1.5)), label: `far apart: ${d.MAX_GAP.toFixed(2)}` },
          { index: narrow, from: SMA200[narrow], to: SMA50[narrow], color: FAST, opacity: fade(f, health + s(4)), label: `narrowing: ${d.NARROW_GAP.toFixed(2)}` },
        ]}
        regions={[
          { from: 0, to: GOLDEN, color: DOWN, opacity: p2, label: 'fast below: shorts only' },
          { from: GOLDEN, to: DEATH, color: UP, opacity: p2, label: 'fast above: longs only' },
          { from: DEATH, to: CLOSES.length - 1, color: DOWN, opacity: p2 },
        ]}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- whipsaw

/** The danger, measured: every buy-at-the-bull-cross, sell-at-the-bear-cross round trip on a range. */
export function WhipsawCinematic() {
  const f = useCurrentFrame();
  const trade = useMark('trade', 10);
  const rope = useMark('rope', 20);
  const trips = d.ROUND_TRIPS;
  const each = Math.max(s(1.6), Math.round((rope - trade - s(1.5)) / Math.max(trips.length, 1)));
  const active = Math.min(trips.length - 1, Math.max(-1, Math.floor((f - trade) / each)));
  const summary = trade + each * trips.length;
  const lines: Line[] = [
    { values: d.RANGE_EMA21, color: SLOW, width: 5 },
    { values: d.RANGE_EMA9, color: FAST, width: 5 },
  ];
  const all = frameOf(d.RANGE_BARS, [d.RANGE_EMA9, d.RANGE_EMA21], -2, d.RANGE_BARS.length + 1, 0.1);
  const shots = [{ at: 0, cam: all }, ...trips.map((t, k) => ({ at: trade + k * each, cam: frameOf(d.RANGE_BARS, [d.RANGE_EMA9, d.RANGE_EMA21], t.buyIndex - 10, t.sellIndex + 10), move: 30 })), { at: summary, cam: all, move: 40 }];
  const cam = cameraAt(f, shots);
  const total = trips.reduce((n, t) => n + t.result, 0);
  const ropeIn = fade(f, rope, s(0.8));
  const plotBottom = interpolate(ropeIn, [0, 1], [PLOT.bottom, 640]);
  const t = active >= 0 && f < summary ? trips[active] : undefined;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 120, top: 70, right: 120 }}>
        <div style={{ ...kicker, color: 'var(--color-danger)' }}>Whipsaw: the crossover's natural enemy</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 58, fontWeight: 700, lineHeight: 1.15, marginTop: 10, whiteSpace: 'nowrap' }}>
          {f < trade ? 'In a sideways market, the averages cross again and again' : 'Buy every bull cross, sell every bear cross'}
        </div>
      </div>
      <CinematicChart
        cam={cam}
        bars={d.RANGE_BARS}
        lines={lines}
        plotBottom={plotBottom}
        legend={[
          { label: 'price', color: 'var(--color-ink-soft)', kind: 'candle' },
          { label: 'EMA 9', color: FAST, kind: 'line' },
          { label: 'EMA 21', color: SLOW, kind: 'line' },
        ]}
        tag={TAG}
        ticks={d.RANGE_CROSSES.map((c, k) => ({ index: c.index, value: d.RANGE_EMA9[c.index], up: c.direction === 'up', opacity: fade(f, s(1) + k * s(0.5), s(0.3)) }))}
        spotlight={t ? { index: (t.buyIndex + t.sellIndex) / 2, value: (t.buy + t.sell) / 2, radius: 480, strength: 0.8 } : undefined}
        brackets={trips.map((tr, k) => ({
          index: tr.sellIndex,
          from: tr.buy,
          to: tr.sell,
          color: DOWN,
          opacity: fade(f, trade + k * each + s(0.4)),
          // Each trip's price label stays until the next trip starts (the last until the summary).
          labelOpacity: 1 - fade(f, k === trips.length - 1 ? summary : trade + (k + 1) * each),
          label: `buy ${fmt(tr.buy)} → sell ${fmt(tr.sell)}: ${signed(tr.result)}`,
        }))}
        notes={[{ label: `${trips.length} round trips: ${signed(total)} in total`, color: DOWN, opacity: fade(f, summary + s(0.6)) }]}
      />
      {f >= rope && (
        <div style={{ position: 'absolute', left: 120, right: 190, top: plotBottom + BAND_SPACE + 24, opacity: ropeIn, borderRadius: 28, border: '2px solid var(--color-line)', background: 'var(--color-surface-1)', padding: '28px 44px' }}>
          <Rope at={rope} />
        </div>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- structure

/** Structure first: breakout, retest, then the cross as the last checkmark; and the veto. */
export function StructureCinematic() {
  const f = useCurrentFrame();
  const setup = useMark('setup', 8);
  const veto = useMark('veto', 16);
  const sb = d.STRUCT_BARS;
  const structView = frameOf(sb, [], -1, sb.length, 0.1);
  const rangeView = frameOf(d.RANGE_BARS, [d.RANGE_EMA9, d.RANGE_EMA21], 38, 82, 0.1);
  const showRange = fade(f, veto, s(0.6));
  const rangeHigh = Math.max(...d.RANGE_BARS.map((b) => b.h));
  const rangeLow = Math.min(...d.RANGE_BARS.map((b) => b.l));
  const vetoCross = d.RANGE_CROSSES.find((c) => c.direction === 'up' && c.index > 50) ?? d.RANGE_CROSSES[0];
  const head = f < setup ? 'A direction signal only: it cannot tell you where to put a stop' : f < veto ? 'Structure first: the cross is the last checkmark' : 'Ignore: a bull cross mid-range, with no breakout';
  return (
    <AbsoluteFill>
      <Headline key={head} kicker="Combining with structure" at={f < setup ? s(0.3) : f < veto ? setup : veto} accent={f < setup ? undefined : f < veto ? UP : DOWN}>
        {head}
      </Headline>
      <AbsoluteFill style={{ opacity: 1 - showRange }}>
        <CinematicChart
          cam={structView}
          bars={sb}
          lines={[]}
          legend={[{ label: 'price', color: 'var(--color-ink-soft)', kind: 'candle' }]}
          tag={TAG}
          levels={[{ price: d.STRUCT_RESISTANCE, label: `resistance ${d.STRUCT_RESISTANCE}`, color: 'var(--color-ink-soft)', opacity: fade(f, s(1.5)) }]}
          markers={[
            { index: d.STRUCT_BREAKOUT, value: sb[d.STRUCT_BREAKOUT].c, label: '1 · breakout', color: UP, opacity: fade(f, setup + s(0.6)), pulse: pulse(f, setup + s(0.6)) },
            { index: d.STRUCT_RETEST, value: sb[d.STRUCT_RETEST].l, label: '2 · retest holds', color: UP, opacity: fade(f, setup + s(3)), pulse: pulse(f, setup + s(3)) },
          ]}
          notes={[{ label: '3 · then the cross confirms', color: FAST, opacity: fade(f, setup + s(5.5)) }]}
        />
      </AbsoluteFill>
      {showRange > 0 && (
        <AbsoluteFill style={{ opacity: showRange }}>
          <CinematicChart
            cam={rangeView}
            bars={d.RANGE_BARS}
            lines={[
              { values: d.RANGE_EMA21, color: SLOW, width: 5 },
              { values: d.RANGE_EMA9, color: FAST, width: 5 },
            ]}
            legend={[
              { label: 'price', color: 'var(--color-ink-soft)', kind: 'candle' },
              { label: 'EMA 9', color: FAST, kind: 'line' },
              { label: 'EMA 21', color: SLOW, kind: 'line' },
            ]}
            tag={TAG}
            levels={[
              { price: rangeHigh, label: 'range high', color: 'var(--color-ink-soft)', opacity: 1 },
              { price: rangeLow, label: 'range low', color: 'var(--color-ink-soft)', opacity: 1 },
            ]}
            markers={[{ index: vetoCross.index, value: d.RANGE_EMA9[vetoCross.index], label: '✕ no breakout: ignore', color: DOWN, opacity: fade(f, veto + s(0.8)), pulse: pulse(f, veto + s(0.8)) }]}
            spotlight={{ index: vetoCross.index, value: d.RANGE_EMA9[vetoCross.index], radius: 460, strength: fade(f, veto + s(0.8)) * 0.8 }}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- takeaways

/** The recap: each point lights up as it is said; the earlier ones stay, dimmed, for review. */
export function TakeawaysCinematic() {
  const f = useCurrentFrame();
  const p = usePace();
  const items: [string, string][] = [
    ['A crossover fires when fast − slow changes sign.', FAST],
    ['Golden cross (50 over 200) and death cross (50 under 200): slow, widely watched.', UP],
    ['Faster pairs signal earlier, with more false alarms. Slower pairs, later, with fewer.', SLOW],
    ['Use it as a filter or a confirmation, not a stand-alone trigger.', 'var(--color-accent)'],
    ['Flat, braided averages mean a range: stop taking crossover signals.', DOWN],
  ];
  const starts = items.map((_, i) => p(0.8 + i * 4.2));
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

/** The lesson's quiz question 2, then the answer shown on the chart. */
export function QuizCinematic() {
  const f = useCurrentFrame();
  const p = usePace();
  const think = useMark('think', 9);
  const reveal = useMark('reveal', 12);
  const shown = f >= reveal;
  const ring = interpolate(f, [think, reveal], [0, 1], clamp);
  const option = (letter: string, text: string, right: boolean, atF: number) => {
    const o = fade(f, atF, s(0.5));
    return (
      <div style={{ opacity: o * (shown && !right ? 0.45 : 1), borderRadius: 24, border: `3px solid ${shown && right ? UP : 'var(--color-line)'}`, background: 'var(--color-surface-1)', padding: '26px 34px', display: 'flex', alignItems: 'center', gap: 26 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 42, fontWeight: 700, color: shown ? (right ? UP : DOWN) : 'var(--color-accent)' }}>{shown ? (right ? '✓' : '✕') : letter}</span>
        <span style={{ ...body, fontSize: 40, color: 'var(--color-ink)' }}>{text}</span>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 140, top: 150, width: 820, display: 'flex', flexDirection: 'column', gap: 30 }}>
        <div style={kicker}>Quick check</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 72, fontWeight: 700, margin: 0, opacity: fade(f, p(0.6)) }}>What is a golden cross?</h2>
          {f >= think && !shown && (
            <svg viewBox="0 0 100 100" style={{ width: 84, flexShrink: 0 }}>
              <circle cx={50} cy={50} r={40} fill="none" stroke="var(--color-line)" strokeWidth={10} />
              <circle cx={50} cy={50} r={40} fill="none" stroke="var(--color-accent)" strokeWidth={10} strokeDasharray={`${ring * 251} 251`} transform="rotate(-90 50 50)" />
            </svg>
          )}
        </div>
        {option('A', 'The 9 EMA crossing above the 21 EMA', false, p(2.5))}
        {option('B', 'The 50-day average crossing above the 200-day average', true, p(5))}
        <div style={{ ...body, fontSize: 38, opacity: fade(f, reveal + s(2)) }}>
          The reverse, crossing below, is the <span style={{ color: DOWN, fontWeight: 700 }}>death cross</span>.
        </div>
      </div>
      {shown && (
        <AbsoluteFill style={{ opacity: fade(f, reveal, s(0.6)) }}>
          <CinematicChart
            cam={frameBars(GOLDEN - 45, GOLDEN + 45)}
            plot={{ left: 1040, right: 1740, top: 300, bottom: 820 }}
            legend={[
              { label: 'SMA 50', color: FAST, kind: 'line' },
              { label: 'SMA 200', color: SLOW, kind: 'line' },
            ]}
            markers={[{ index: GOLDEN, label: 'golden cross', color: UP, opacity: 1, pulse: pulse(f, reveal) }]}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- end

/** The close: the call to practise and the disclaimer, over the lesson's chart, out of focus. */
export function EndCinematic() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0, filter: 'blur(3px)' }}>
        <CinematicChart cam={WIDE} head={false} dim={0.25} />
      </div>
      <AbsoluteFill style={{ background: 'radial-gradient(60% 60% at 50% 50%, color-mix(in oklch, var(--color-bg) 70%, transparent) 0%, var(--color-bg) 85%)' }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', gap: 34, textAlign: 'center', opacity: fade(f, 0, s(0.6)) }}>
        <div style={{ fontSize: 34, fontWeight: 700 }}>
          Nitora <span style={{ fontWeight: 400, color: 'var(--color-ink-soft)' }}>Trading Academy</span>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 72, fontWeight: 700 }}>Mark every crossover in the simulator.</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 46, color: 'var(--color-accent)' }}>nitoratrading.com/simulator</div>
        <div style={{ fontSize: 32, color: 'var(--color-ink-soft)', opacity: fade(f, s(1)) }}>An educational tool. Charts use synthetic data. Nothing here is financial advice.</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
