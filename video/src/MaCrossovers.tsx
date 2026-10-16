/**
 * "Moving Average Crossovers" (module 5, lesson 3): the pilot.
 *
 * Every sentence is the lesson's own wording, shortened; narration/ma-crossovers.json names the
 * lesson lines behind each scene, and scripts/check.mjs holds it to them. Every chart is
 * synthetic and every number on a chart is computed by the site's indicator engine
 * (src/ma-crossovers/data.ts). The famous pair is the lesson's: the 50- and 200-day SMA.
 */
import type { CSSProperties, ReactNode } from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { CandleSvg, type Annotation, type Overlay } from '@/components/figures/CandleSvg';
import { body, Danger, EndCard, h2, kicker, LessonVideo, Rise, Takeaways, TitleCard, useMark, usePace, type Scene, type Timing } from './kit';
import * as d from './ma-crossovers/data';
import { Average, Buckets, Quiz, Rope, Ship } from './ma-crossovers/explainers';
import { narration } from '../narration/ma-crossovers';
import script from '../narration/ma-crossovers.json';
export { narration };

/** Scene lengths and the narration lead and tail come from the script, so captions agree. */
export const TIMING: Timing = script.timing;
const base = (id: SceneId) => (script.scenes as Record<string, { base: number }>)[id].base;

export const LANGS = Object.keys(narration) as (keyof typeof narration)[];
type SceneId = keyof (typeof narration)['en'];

export const SCENES: Scene<SceneId>[] = [
  ['title', base('title'), () => <TitleCard module="Module 5 · Indicators · Lesson 3" title={<>Moving Average <span style={{ color: 'var(--color-accent)' }}>Crossovers</span></>} />],
  ['average', base('average'), () => <Average />],
  ['race', base('race'), () => <Race />],
  ['buckets', base('buckets'), () => <Buckets />],
  ['signchange', base('signchange'), () => <SignChange />],
  ['golden', base('golden'), () => <GoldenDeath />],
  ['lag', base('lag'), () => <Lag />],
  ['tradeoff', base('tradeoff'), () => <TradeOff />],
  ['uses', base('uses'), () => <Uses />],
  ['whipsaw', base('whipsaw'), () => <Whipsaw />],
  ['structure', base('structure'), () => <Structure />],
  [
    'takeaways',
    base('takeaways'),
    () => (
      <Takeaways
        gap={4.2}
        items={[
          'A crossover fires when fast − slow changes sign.',
          'Golden cross (50 over 200) and death cross (50 under 200): slow, widely watched.',
          'Faster pairs signal earlier, with more false alarms. Slower pairs, later, with fewer.',
          'Use it as a filter or a confirmation, not a stand-alone trigger.',
          'Flat, braided averages mean a range: stop taking crossover signals.',
        ]}
      />
    ),
  ],
  ['quiz', base('quiz'), () => <Quiz />],
  ['end', base('end'), () => <EndCard action="Mark every crossover in the simulator." link="nitoratrading.com/simulator" />],
];

export function MaCrossovers({ lang }: { lang: string }) {
  return <LessonVideo scenes={SCENES} narration={narration} lang={lang} timing={TIMING} />;
}

// ---------------------------------------------------------------- helpers

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const FAST = 'var(--color-chart-2)';
const SLOW = 'var(--color-chart-1)';
const panel: CSSProperties = { borderRadius: 28, border: '2px solid var(--color-line)', background: 'var(--color-surface-1)', padding: 24 };

/** The pilot's long chart, from where the 200-day average first exists. */
export const VIEW = d.BARS.slice(d.VIEW_FROM);
const cut = (values: number[]) => values.slice(d.VIEW_FROM);
const at = (index: number) => index - d.VIEW_FROM;
export const LONG_OVERLAYS: Overlay[] = [
  { values: cut(d.SMA50), color: FAST, name: 'SMA 50', width: 2.4 },
  { values: cut(d.SMA200), color: SLOW, name: 'SMA 200', width: 2.4 },
];
export const LONG_LABEL = 'Synthetic daily price with its 50- and 200-day simple moving averages';
const fmt = (n: number) => n.toFixed(2);

/** A chart drawn on left to right between two designed times, with annotations fading in later. */
export function RevealChart({ from, to, notesAt, annotations, ...chart }: { from: number; to: number; notesAt: number; annotations: Annotation[] } & Parameters<typeof CandleSvg>[0]) {
  const f = useCurrentFrame();
  const p = usePace();
  const reveal = interpolate(f, [p(from), Math.max(p(to), p(from) + 1)], [0, 100], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const notes = interpolate(f, [p(notesAt), p(notesAt + 0.8)], [0, 1], clamp);
  return (
    <div style={{ position: 'relative', ...panel }}>
      {/* The base layer carries the same annotations, invisible, so both layers share one scale. */}
      <div style={{ clipPath: `inset(0 ${100 - reveal}% 0 0)` }}>
        <CandleSvg {...chart} annotations={annotations.map((a) => ({ ...a, color: 'transparent' }))} />
      </div>
      <div style={{ position: 'absolute', inset: 24, opacity: notes }}>
        <CandleSvg {...chart} annotations={annotations} />
      </div>
    </div>
  );
}

function Tag({ children, color = 'var(--color-ink-muted)' }: { children: ReactNode; color?: string }) {
  return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 32, color, border: '2px solid currentColor', borderRadius: 999, padding: '8px 22px' }}>{children}</span>;
}

// ---------------------------------------------------------------- scenes

/** The lesson's opening picture: a sprinter and a steady runner, and the moment one overtakes. */
function Race() {
  const f = useCurrentFrame();
  const p = usePace();
  const t = interpolate(f, [p(1), p(23)], [0, 1], clamp);
  const slowX = 0.06 + 0.82 * t;
  // The sprinter starts behind, surges and fades, and overtakes a little over halfway.
  const gap = -0.07 + 0.13 * interpolate(t, [0.3, 0.75], [0, 1], clamp) + 0.014 * Math.sin(t * 26);
  const fastX = slowX + gap;
  const ahead = gap > 0;
  const W = 1640;
  const lane = (y: number, x: number, color: string, label: string) => (
    <g>
      <line x1={40} x2={W - 40} y1={y} y2={y} stroke="var(--color-line)" strokeWidth={3} strokeDasharray="14 12" />
      <circle cx={40 + x * (W - 80)} cy={y} r={30} fill={color} />
      <text x={40 + x * (W - 80)} y={y - 50} textAnchor={x > 0.6 ? 'end' : x < 0.2 ? 'start' : 'middle'} fill={color} fontSize={30} fontFamily="var(--font-mono)">
        {label}
      </text>
    </g>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40, height: '100%' }}>
      <Rise style={kicker}>The idea</Rise>
      <svg viewBox={`0 0 ${W} 300`} style={{ width: '100%' }}>
        {lane(90, fastX, FAST, 'fast average · the sprinter')}
        {lane(230, slowX, SLOW, 'slow average · the steady runner')}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Rise at={p(8)}>
          <p style={{ ...body, fontSize: 40 }}>A fast average and a slow average, on the same chart.</p>
        </Rise>
        <Rise at={p(13)}>
          <p style={{ ...body, color: ahead ? 'var(--color-ink)' : 'var(--color-ink-soft)', fontSize: 46 }}>
            <span style={{ color: 'var(--color-up)', fontWeight: 600 }}>Fast crosses above slow:</span> recent prices are running ahead of older prices.
          </p>
        </Rise>
        <Rise at={p(17.5)}>
          <p style={{ ...body, fontSize: 40 }}>That is what an uptrend looks like from the inside.</p>
        </Rise>
        <Rise at={p(20.5)}>
          <p style={{ ...body, fontSize: 40 }}>
            <span style={{ color: 'var(--color-down)', fontWeight: 600 }}>Crosses below:</span> the opposite.
          </p>
        </Rise>
      </div>
    </div>
  );
}

/** The lesson's worked example: the difference flips sign, and that is the signal. */
function SignChange() {
  const p = usePace();
  const row = (when: string, fast: string, slow: string, diff: string, color: string, note: string) => (
    <div style={{ display: 'grid', gridTemplateColumns: '260px auto auto', justifyContent: 'start', alignItems: 'baseline', gap: 32, fontFamily: 'var(--font-mono)', fontSize: 48, whiteSpace: 'nowrap' }}>
      <span style={{ color: 'var(--color-ink-muted)', fontSize: 34 }}>{when}</span>
      <span style={{ color: 'var(--color-ink)' }}>
        <span style={{ color: FAST }}>{fast}</span> − <span style={{ color: SLOW }}>{slow}</span> =
      </span>
      <span style={{ color, fontWeight: 700 }}>
        {diff} <span style={{ fontSize: 28, fontWeight: 400 }}>{note}</span>
      </span>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 44, justifyContent: 'center', height: '100%' }}>
      <Rise style={kicker}>No new formula</Rise>
      <Rise at={p(2.5)}>
        <h2 style={h2}>
          Difference = <span style={{ color: FAST }}>fast</span> − <span style={{ color: SLOW }}>slow</span>
        </h2>
      </Rise>
      <Rise at={p(6)}>{row('Yesterday', '100.4', '100.9', '−0.5', 'var(--color-down)', 'fast below')}</Rise>
      <Rise at={p(10.5)}>{row('Today', '101.3', '101.0', '+0.3', 'var(--color-up)', 'fast above')}</Rise>
      <Rise at={p(14)}>
        <p style={{ ...body, color: 'var(--color-ink)', fontSize: 44 }}>
          Negative → positive: a <span style={{ color: 'var(--color-up)', fontWeight: 600 }}>bullish crossover</span>. Positive → negative: a{' '}
          <span style={{ color: 'var(--color-down)', fontWeight: 600 }}>bearish crossover</span>.
        </p>
      </Rise>
      <Rise at={p(20)} style={{ ...kicker, color: 'var(--color-ink)', fontSize: 34 }}>
        That sign flip is the entire signal.
      </Rise>
    </div>
  );
}

export const CROSS_ARROWS: Annotation[] = [
  { type: 'arrow', index: at(d.GOLDEN), direction: 'up' },
  { type: 'arrow', index: at(d.DEATH), direction: 'down' },
];

function GoldenDeath() {
  const p = usePace();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26, height: '100%' }}>
      <Rise style={kicker}>The famous pair</Rise>
      <Rise at={p(3)}>
        <h2 style={{ ...h2, fontSize: 52 }}>
          <span style={{ color: 'var(--color-up)' }}>Golden cross:</span> the <span style={{ color: FAST }}>50-day SMA</span> crosses above the <span style={{ color: SLOW }}>200-day</span>.{' '}
          <span style={{ color: 'var(--color-down)' }}>Death cross:</span> it crosses below.
        </h2>
      </Rise>
      <RevealChart bars={VIEW} overlays={LONG_OVERLAYS} mode="line" width={600} height={170} label={LONG_LABEL} from={1} to={11} notesAt={12} annotations={CROSS_ARROWS} />
      <Rise at={p(14)} style={{ display: 'flex', gap: 20 }}>
        <Tag color="var(--color-up)">▲ golden cross</Tag>
        <Tag color="var(--color-down)">▼ death cross</Tag>
        <Tag>synthetic data, for teaching</Tag>
      </Rise>
    </div>
  );
}

/** How late each cross came, measured on the chart: bars after the turn, and the price paid. */
function Lag() {
  const p = usePace();
  const f = useCurrentFrame();
  const ship = useMark('ship', 20);
  const notes: Annotation[] = [
    ...CROSS_ARROWS,
    { type: 'bracket', from: at(d.LOW), to: at(d.GOLDEN), text: `${d.GOLDEN - d.LOW} bars after the low`, color: 'var(--color-up)', position: 'below' },
    { type: 'bracket', from: at(d.HIGH), to: at(d.DEATH), text: `${d.DEATH - d.HIGH} bars after the high`, color: 'var(--color-down)', position: 'below' },
  ];
  const low = d.BARS[d.LOW].c;
  const golden = d.BARS[d.GOLDEN].c;
  const high = d.BARS[d.HIGH].c;
  const death = d.BARS[d.DEATH].c;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26, height: '100%' }}>
      <Rise style={kicker}>The lag</Rise>
      <Rise at={p(1)}>
        <h2 style={{ ...h2, fontSize: 52 }}>The cross waits until enough closes drag the fast average across the slow one.</h2>
      </Rise>
      <RevealChart bars={VIEW} overlays={LONG_OVERLAYS} mode="line" width={600} height={170} label={LONG_LABEL} from={0} to={0.01} notesAt={6} annotations={notes} />
      {f >= ship ? (
        <Rise at={ship}>
          <Ship at={ship} />
        </Rise>
      ) : (
      <div style={{ display: 'flex', gap: 60 }}>
        <Rise at={p(9)}>
          <p style={{ ...body, fontSize: 34 }}>
            <span style={{ color: 'var(--color-up)', fontWeight: 600 }}>Missed the first chunk:</span> low {fmt(low)}, cross at {fmt(golden)}
          </p>
        </Rise>
        <Rise at={p(12)}>
          <p style={{ ...body, fontSize: 34 }}>
            <span style={{ color: 'var(--color-down)', fontWeight: 600 }}>Gave back a chunk:</span> high {fmt(high)}, exit at {fmt(death)}
          </p>
        </Rise>
      </div>
      )}
    </div>
  );
}

/** The same chart through a fast pair and a slow pair, with each one's crosses counted. */
function TradeOff() {
  const p = usePace();
  const f = useCurrentFrame();
  const fastArrows: Annotation[] = d
    .crosses(cut(d.EMA9), cut(d.EMA21))
    .map((c) => ({ type: 'arrow', index: c.index, direction: c.direction }));
  const count = (n: number, start: number) => Math.round(interpolate(f, [p(start), p(start + 1.5)], [0, n], clamp));
  const row = (title: string, color: string, overlays: Overlay[], arrows: Annotation[], n: number, start: number) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32, alignItems: 'center' }}>
      <RevealChart bars={VIEW} overlays={overlays} mode="line" width={480} height={88} axis={false} label={`${LONG_LABEL}: ${title}`} from={start - 1} to={start - 0.2} notesAt={start} annotations={arrows} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 30, color }}>{title}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 84, fontWeight: 700, color: 'var(--color-ink)' }}>{count(n, start)}</span>
        <span style={{ fontSize: 30, color: 'var(--color-ink-soft)' }}>crosses on this chart</span>
      </div>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <Rise style={kicker}>Fast pairs vs slow pairs</Rise>
      <Rise at={p(1)}>
        <p style={{ ...body, color: 'var(--color-ink)', fontSize: 38 }}>Faster: more signals, earlier, more false ones. Slower: fewer, later, fewer false ones.</p>
      </Rise>
      {row('9 / 21 EMA', FAST, [{ values: cut(d.EMA9), color: FAST, name: 'EMA 9' }, { values: cut(d.EMA21), color: SLOW, name: 'EMA 21' }], fastArrows, d.FAST_CROSSES, 10)}
      {row('50 / 200 SMA', SLOW, LONG_OVERLAYS, CROSS_ARROWS, d.SLOW_CROSSES, 14)}
    </div>
  );
}

function Uses() {
  const p = usePace();
  const cards: [string, string, number][] = [
    ['Entry and exit', 'Buy the bull cross, sell the bear cross. In a trend, the few big moves pay for the many small losses. In a range, it bleeds.', 1.5],
    ['Bias filter', 'Fast above slow: only look for long setups. Fast below slow: only shorts.', 14],
    ['Trend-health check', 'Far apart and sloping together: a strong trend. Flat and braided: the trend is tired.', 20],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36, justifyContent: 'center', height: '100%' }}>
      <Rise style={kicker}>Three ways traders use it</Rise>
      {cards.map(([title, text, t], i) => (
        <Rise key={title} at={p(t)} style={{ ...panel, padding: '32px 40px', display: 'grid', gridTemplateColumns: '80px 420px 1fr', gap: 24, alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 34, color: 'var(--color-accent)' }}>{String(i + 1).padStart(2, '0')}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 650, color: 'var(--color-ink)' }}>{title}</span>
          <span style={{ ...body, fontSize: 36 }}>{text}</span>
        </Rise>
      ))}
    </div>
  );
}

/** The lesson's danger callout, over the site's own sideways regime and 9/21 EMA pair. */
function Whipsaw() {
  const p = usePace();
  const f = useCurrentFrame();
  const rope = useMark('rope', 22);
  const arrows: Annotation[] = d.RANGE_CROSSES.map((c) => ({ type: 'arrow', index: c.index, direction: c.direction }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, height: '100%' }}>
      <Danger label="Whipsaw: the crossover's natural enemy" title="In a sideways market, the fast average crosses the slow one again and again.">
        Each cross comes a few candles after a swing has already finished: buy the top, sell the bottom, of every wobble.
      </Danger>
      <RevealChart
        bars={d.RANGE_BARS}
        overlays={[
          { values: d.RANGE_EMA9, color: FAST, name: 'EMA 9' },
          { values: d.RANGE_EMA21, color: SLOW, name: 'EMA 21' },
        ]}
        width={640}
        height={96}
        label="Synthetic sideways market with a 9 and 21 EMA"
        from={3}
        to={10}
        notesAt={11}
        annotations={arrows}
      />
      {f >= rope ? (
        <Rise at={rope}>
          <Rope at={rope} />
        </Rise>
      ) : (
        <Rise at={p(17)} style={{ display: 'flex', gap: 20 }}>
          <Tag color="var(--color-danger)">{d.RANGE_CROSSES.length} crosses, no trend</Tag>
          <Tag>ten small losses in a row is normal in chop</Tag>
        </Rise>
      )}
    </div>
  );
}

function Structure() {
  const p = usePace();
  const checks: [string, number][] = [
    ['Price breaks out of a range', 9],
    ['It retests the level, and holds', 11],
    ['The fast average crosses above the slow one', 13],
  ];
  const mark = (ok: boolean) => (
    <span style={{ width: 52, height: 52, borderRadius: 26, flexShrink: 0, background: ok ? 'var(--color-up-soft)' : 'var(--color-danger-soft)', color: ok ? 'var(--color-up)' : 'var(--color-danger)', display: 'grid', placeItems: 'center', fontSize: 30, fontWeight: 700 }}>
      {ok ? '✓' : '✕'}
    </span>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 34, justifyContent: 'center', height: '100%' }}>
      <Rise style={kicker}>Combining with structure</Rise>
      <Rise at={p(1)}>
        <h2 style={h2}>A direction signal only. It cannot tell you where to put a stop.</h2>
      </Rise>
      <Rise at={p(6)} style={{ ...body, fontSize: 34 }}>
        The cross is the last checkmark, not the first:
      </Rise>
      {checks.map(([text, t], i) => (
        <Rise key={text} at={p(t)} style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {mark(true)}
          <span style={{ ...body, color: i === 2 ? 'var(--color-accent)' : 'var(--color-ink)' }}>{text}</span>
        </Rise>
      ))}
      <Rise at={p(16.5)} style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
        {mark(false)}
        <span style={{ ...body, color: 'var(--color-ink)' }}>A bull cross mid-range, with no breakout: ignore it.</span>
      </Rise>
    </div>
  );
}
