/**
 * "Bullish and Bearish Engulfing" (module 2, lesson 6), narrated.
 *
 * Every sentence on screen is the lesson's own wording, shortened; nothing here makes a claim
 * the lesson does not. The two figures are the lesson's own pattern data, drawn by the site's
 * CandleSvg, revealed left to right.
 */
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { CandleSvg } from '@/components/figures/CandleSvg';
import { CANDLE_PATTERNS } from '@/content/figures/candlePatterns';
import { body, Danger, EndCard, h2, kicker, LessonVideo, Rise, Takeaways, TitleCard, usePace, type Scene } from './kit';
import { narration } from '../narration/engulfing';

export const LANGS = Object.keys(narration) as (keyof typeof narration)[];
type SceneId = keyof (typeof narration)['en'];

/** The scenes, in order, with each one's designed length in seconds (see kit.tsx for timing). */
export const SCENES: Scene<SceneId>[] = [
  ['title', 4, () => <TitleCard module="Module 2 · Candlestick Patterns · Lesson 6" title={<>Bullish and Bearish <span style={{ color: 'var(--color-accent)' }}>Engulfing</span></>} />],
  ['definition', 11, () => <Definition />],
  ['bullish', 13, () => <PatternScene name="bullish-engulfing" kicker="After a decline" />],
  ['psychology', 10, () => <Psychology />],
  ['bearish', 10, () => <PatternScene name="bearish-engulfing" kicker="At the top of a rise" />],
  ['valid', 10, () => <WhereValid />],
  ['trap', 9, () => <Trap />],
  [
    'takeaways',
    10,
    () => (
      <Takeaways
        items={[
          'Two candles: the second is the opposite colour and its body fully covers the first.',
          'It needs a prior trend. Engulfing candles inside ranges mean nothing.',
          'Confirm with a third candle, and look for high volume on the engulfing one.',
          'The stop goes beyond the far extreme of the engulfing candle.',
        ]}
      />
    ),
  ],
  ['end', 4, () => <EndCard action="Practise spotting it in the pattern trainer." link="nitoratrading.com/trainer" />],
];
export { narration };

export function Engulfing({ lang }: { lang: string }) {
  return <LessonVideo scenes={SCENES} narration={narration} lang={lang} />;
}

// ---------------------------------------------------------------- scenes

/** Two big candles: the small first one, then the second growing until its body swallows it. */
function Definition() {
  const p = usePace();
  const f = useCurrentFrame();
  const ease = Easing.bezier(0.3, 0, 0, 1);
  const red = interpolate(f, [p(0.6), p(1.4)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const green = interpolate(f, [p(2.4), p(4.2)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const outline = interpolate(f, [p(4.4), p(5)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // Price units: red opens 60, closes 48; green opens 44, closes 70. 12 px per unit.
  const Y = (price: number) => 470 - (price - 40) * 12;
  const redTop = Y(60);
  const redBottom = Y(48);
  const gOpen = Y(44);
  const gClose = Y(44 + (70 - 44) * green);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 80, height: '100%' }}>
      <svg viewBox="0 0 560 560" style={{ width: 720, flexShrink: 0 }}>
        <g opacity={red}>
          <line x1={170} x2={170} y1={Y(63)} y2={Y(46)} stroke="var(--color-down)" strokeWidth={6} />
          <rect x={120} width={100} y={redTop} height={(redBottom - redTop) * red} rx={8} fill="var(--color-down)" />
        </g>
        {green > 0 && (
          <g>
            <line x1={370} x2={370} y1={Math.min(gClose, gOpen) - 18 * green} y2={gOpen + 14} stroke="var(--color-up)" strokeWidth={6} />
            <rect x={300} width={140} y={gClose} height={gOpen - gClose} rx={10} fill="var(--color-up)" />
          </g>
        )}
        {/* the first body's height, carried across: inside the green body */}
        <g opacity={outline}>
          <rect x={296} width={148} y={redTop} height={redBottom - redTop} rx={6} fill="none" stroke="var(--color-ink)" strokeWidth={4} strokeDasharray="12 9" />
          <line x1={220} x2={296} y1={redTop} y2={redTop} stroke="var(--color-ink-muted)" strokeWidth={2} strokeDasharray="6 6" />
          <line x1={220} x2={296} y1={redBottom} y2={redBottom} stroke="var(--color-ink-muted)" strokeWidth={2} strokeDasharray="6 6" />
        </g>
        <text x={170} y={540} textAnchor="middle" fill="var(--color-ink-muted)" fontSize={26} fontFamily="var(--font-mono)">
          day 1
        </text>
        <text x={370} y={540} textAnchor="middle" fill="var(--color-ink-muted)" fontSize={26} fontFamily="var(--font-mono)">
          day 2
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
        <Rise at={p(0.4)} style={kicker}>
          The pattern
        </Rise>
        <Rise at={p(1)}>
          <h2 style={h2}>Two candles. The second body completely covers the first, in the opposite colour.</h2>
        </Rise>
        <Rise at={p(5.2)}>
          <p style={body}>
            <span style={{ color: 'var(--color-up)', fontWeight: 600 }}>Bullish:</span> a small red candle, then a big green one that swallows it.
          </p>
        </Rise>
        <Rise at={p(6.6)}>
          <p style={body}>
            <span style={{ color: 'var(--color-down)', fontWeight: 600 }}>Bearish:</span> a small green candle, then a big red one.
          </p>
        </Rise>
      </div>
    </div>
  );
}

/** One of the lesson's figures, revealed candle by candle, then its annotations and caption. */
function PatternScene({ name, kicker: k }: { name: 'bullish-engulfing' | 'bearish-engulfing'; kicker: string }) {
  const p = usePace();
  const f = useCurrentFrame();
  const fig = CANDLE_PATTERNS[name];
  const reveal = interpolate(f, [p(0.8), p(5.5)], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) });
  const notes = interpolate(f, [p(5.8), p(6.6)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const chart = { bars: fig.bars, height: 280, width: 960 };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 28 }}>
      <Rise style={kicker}>{k}</Rise>
      <Rise at={6}>
        <h2 style={h2}>{fig.title}</h2>
      </Rise>
      <div style={{ position: 'relative', borderRadius: 28, border: '2px solid var(--color-line)', background: 'var(--color-surface-1)', padding: 28 }}>
        <div style={{ clipPath: `inset(0 ${100 - reveal}% 0 0)` }}>
          <CandleSvg {...chart} label={fig.title} />
        </div>
        <div style={{ position: 'absolute', inset: 28, opacity: notes }}>
          <CandleSvg {...chart} annotations={fig.annotations} label={fig.title} />
        </div>
      </div>
      <Rise at={p(6.8)}>
        <p style={{ ...body, color: 'var(--color-ink)', fontSize: 38 }}>{fig.caption}</p>
      </Rise>
    </div>
  );
}

function Psychology() {
  const p = usePace();
  const beats: [string, string][] = [
    ['Day one', 'In a downtrend, sellers win again, but only by a little. Enthusiasm for selling is fading.'],
    ['Day two', 'Price opens even lower. Then buyers arrive in force and push above where yesterday started.'],
    ['By the close', 'Every seller from yesterday is losing money. Control has flipped in two sessions.'],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 44, justifyContent: 'center', height: '100%' }}>
      <Rise style={kicker}>The psychology</Rise>
      {beats.map(([label, text], i) => (
        <Rise key={label} at={p(0.6 + i * 2.6)} style={{ display: 'flex', gap: 40, alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 34, color: 'var(--color-accent)', minWidth: 260 }}>{label}</span>
          <span style={{ ...body, color: 'var(--color-ink)', fontSize: 46 }}>{text}</span>
        </Rise>
      ))}
    </div>
  );
}

function WhereValid() {
  const p = usePace();
  const points = ['At a clear support or resistance level, after a trend', 'High volume on the engulfing candle', 'A third candle that closes beyond it: confirmation'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40, justifyContent: 'center', height: '100%' }}>
      <Rise style={kicker}>Where it is valid</Rise>
      <Rise at={8}>
        <h2 style={h2}>It needs a trend to reverse. Inside a sideways range, candles engulf each other constantly, and it means nothing.</h2>
      </Rise>
      {points.map((point, i) => (
        <Rise key={point} at={p(3 + i * 1.6)} style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          <span style={{ width: 44, height: 44, borderRadius: 22, background: 'var(--color-up-soft)', color: 'var(--color-up)', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 700 }}>✓</span>
          <span style={{ ...body, color: 'var(--color-ink)' }}>{point}</span>
        </Rise>
      ))}
    </div>
  );
}

function Trap() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <Danger label="The trap" title="Big engulfing candles are strong signals and terrible entries.">
        Your stop goes beyond the far end of the candle. A huge candle means a huge risk, and much of the move may already be over. Wait for a pullback, or take a smaller position.
      </Danger>
    </div>
  );
}
