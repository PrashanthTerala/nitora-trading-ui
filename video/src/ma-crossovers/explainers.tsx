/**
 * The v2 explainers: plain-words pictures for the ideas a beginner needs before the chart makes
 * sense. Each one follows the narration through timing marks (useMark), so it stays in step in
 * every language. They are illustrations, labelled as such where they could be mistaken for
 * data; the only numbers (6, 8, 7, 9, 10 → 40 → 8) come from data.ts and are checked.
 */
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { body, h2, kicker, Rise, s, useMark, usePace } from '../kit';
import * as d from './data';
import { useT } from '../cinematic/strings';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const FAST = 'var(--color-chart-2)';
const SLOW = 'var(--color-chart-1)';
const card = { borderRadius: 24, border: '2px solid var(--color-line)', background: 'var(--color-surface-1)' } as const;

/** Waves on a beach, then the five-close worked example, then the window sliding forward. */
export function Average() {
  const f = useCurrentFrame();
  const p = usePace();
  const cards = useMark('cards', 12);
  const divide = useMark('divide', 19);
  const slide = useMark('slide', 23);
  const beach = interpolate(f, [cards - 12, cards], [1, 0], clamp);
  const t = useT();
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <Rise style={kicker}>{t('refresher')}</Rise>
      <div style={{ position: 'absolute', inset: '70px 0 0 0', opacity: beach }}>
        <Waves />
      </div>
      {f >= cards - 12 && (
        <div style={{ position: 'absolute', inset: '70px 0 0 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 64, opacity: 1 - beach }}>
          {f < slide ? <Sum cards={cards} divide={divide} /> : <Window slide={slide} />}
        </div>
      )}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        {f < cards - 12 ? (
          <Rise at={p(6)}>
            <p style={{ ...body, color: 'var(--color-ink)', fontSize: 44 }}>{t('waves')}</p>
          </Rise>
        ) : null}
      </div>
    </div>
  );
}

function Waves() {
  const f = useCurrentFrame();
  const p = usePace();
  const W = 1640;
  const H = 720;
  // Ten waves, each reaching a different distance up the sand (deterministic, not data).
  const reach = Array.from({ length: 10 }, (_, i) => 330 + 110 * Math.sin(i * 1.9) + 45 * Math.sin(i * 0.7 + 1));
  const avg = reach.reduce((a, b) => a + b, 0) / reach.length;
  const shown = Math.floor(interpolate(f, [p(1), p(5.5)], [0, 10], clamp));
  const avgIn = interpolate(f, [p(7), p(8)], [0, 1], clamp);
  const t = useT();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      <defs>
        <linearGradient id="sand" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="color-mix(in oklch, var(--color-chart-1) 35%, var(--color-bg))" />
          <stop offset="0.35" stopColor="color-mix(in oklch, var(--color-chart-1) 18%, var(--color-bg))" />
          <stop offset="0.36" stopColor="color-mix(in oklch, var(--color-chart-2) 22%, var(--color-surface-1))" />
          <stop offset="1" stopColor="color-mix(in oklch, var(--color-chart-2) 12%, var(--color-surface-1))" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} rx={28} fill="url(#sand)" />
      {reach.slice(0, shown).map((r, i) => {
        const x = 130 + i * 150;
        return (
          <g key={i} opacity={i === shown - 1 ? 1 : 0.55}>
            <path d={`M ${x - 64} 150 Q ${x} ${r + 40} ${x + 64} 150 Z`} fill="color-mix(in oklch, var(--color-chart-1) 30%, transparent)" stroke="var(--color-chart-1)" strokeWidth={4} />
            <circle cx={x} cy={r} r={14} fill="var(--color-ink)" />
          </g>
        );
      })}
      <g opacity={avgIn}>
        <line x1={60} x2={W - 60} y1={avg} y2={avg} stroke="var(--color-accent)" strokeWidth={6} strokeDasharray="22 14" />
        <text x={W - 70} y={avg - 22} textAnchor="end" fontSize={40} fontWeight={700} fill="var(--color-accent)" fontFamily="var(--font-sans)">
          {t('tide')}
        </text>
      </g>
      <text x={60} y={H - 40} fontSize={36} fill="var(--color-ink-soft)" fontFamily="var(--font-mono)">
        {t('wavesLegend')}
      </text>
    </svg>
  );
}

function Sum({ cards, divide }: { cards: number; divide: number }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const values = d.AVERAGE_VALUES;
  const num = { fontFamily: 'var(--font-mono)', fontSize: 112, fontWeight: 700, color: 'var(--color-ink)' } as const;
  const pop = (at: number) => spring({ frame: f - at, fps, config: { damping: 18 } });
  const sumAt = cards + s(4.5);
  const t = useT();
  return (
    <>
      <p style={{ ...body, color: 'var(--color-ink)', fontSize: 56 }}>{t('addDivide')}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 26, flexWrap: 'wrap' }}>
        {values.map((v, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 26, opacity: pop(cards + s(0.6 * i)), transform: `scale(${0.8 + 0.2 * pop(cards + s(0.6 * i))})` }}>
            {i > 0 && <span style={{ ...num, color: 'var(--color-ink-muted)' }}>+</span>}
            <span style={{ ...card, ...num, padding: '18px 34px' }}>{v}</span>
          </div>
        ))}
        <span style={{ ...num, opacity: pop(sumAt) }}>= {d.AVERAGE_SUM}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 30, opacity: pop(divide), transform: `translateY(${(1 - pop(divide)) * 30}px)` }}>
        <span style={num}>{d.AVERAGE_SUM} ÷ {values.length} =</span>
        <span style={{ ...num, fontSize: 160, color: 'var(--color-accent)' }}>{d.AVERAGE_RESULT}</span>
        <span style={{ ...body, fontSize: 52, color: 'var(--color-ink)' }}>{t('theAverage')}</span>
      </div>
    </>
  );
}

function Window({ slide }: { slide: number }) {
  const f = useCurrentFrame();
  const t = interpolate(f, [slide + s(1.5), slide + s(4)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const tr = useT();
  const cells: (number | string)[] = [...d.AVERAGE_VALUES, tr('newClose')];
  const w = 236;
  const gap = 28;
  return (
    <>
      <p style={{ ...body, color: 'var(--color-ink)', fontSize: 56 }}>{tr('slide')}</p>
      <div style={{ position: 'relative', height: 260, marginTop: 30 }}>
        {cells.map((v, i) => (
          <span
            key={i}
            style={{
              ...card,
              position: 'absolute',
              left: i * (w + gap),
              top: 40,
              width: w,
              height: 170,
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: typeof v === 'number' ? 92 : 56,
              fontWeight: 700,
              color: i === 0 ? 'var(--color-ink-muted)' : i === 5 ? 'var(--color-up)' : 'var(--color-ink)',
              opacity: i === 0 ? 1 - 0.7 * t : i === 5 ? 0.35 + 0.65 * t : 1,
              textDecoration: i === 0 && t > 0.5 ? 'line-through' : 'none',
            }}
          >
            {v}
          </span>
        ))}
        <div
          style={{
            position: 'absolute',
            left: -14 + t * (w + gap),
            top: 26,
            width: 5 * w + 4 * gap + 28,
            height: 198,
            border: '6px solid var(--color-accent)',
            borderRadius: 30,
          }}
        />
        <span style={{ position: 'absolute', left: 6 + t * (w + gap), top: -16, fontFamily: 'var(--font-mono)', fontSize: 40, color: 'var(--color-accent)' }}>{tr('last5')}</span>
      </div>
    </>
  );
}

/** Two buckets: the small one's average overtakes the big one's at the 'cross' mark. */
export function Buckets() {
  const f = useCurrentFrame();
  const p = usePace();
  const pour = useMark('pour', 7);
  const cross = useMark('cross', 17);
  // Average levels (0-100, illustrative). Both pass level 57 exactly at the cross mark.
  const smallLevel = interpolate(f, [pour, cross, cross + s(4)], [38, 57, 68], clamp);
  const bigLevel = interpolate(f, [pour, cross, cross + s(4)], [54, 57, 59], clamp);
  const crossed = f >= cross;
  const H = 520;
  const y = (level: number) => H - 40 - (level / 100) * (H - 120);
  const bucket = (x: number, width: number, level: number, color: string, label: string, sub: string) => (
    <g>
      <path d={`M ${x} 80 L ${x + 18} ${H - 40} L ${x + width - 18} ${H - 40} L ${x + width} 80`} fill="color-mix(in oklch, var(--color-surface-1) 70%, transparent)" stroke="var(--color-ink-soft)" strokeWidth={5} />
      <rect x={x + 22} y={y(level)} width={width - 44} height={H - 40 - y(level)} fill={`color-mix(in oklch, ${color} 45%, transparent)`} />
      <line x1={x + 10} x2={x + width - 10} y1={y(level)} y2={y(level)} stroke={color} strokeWidth={7} />
      <text x={x + width / 2} y={44} textAnchor="middle" fontSize={46} fontWeight={700} fill={color} fontFamily="var(--font-sans)">
        {label}
      </text>
      <text x={x + width / 2} y={H + 10} textAnchor="middle" fontSize={38} fill="var(--color-ink-soft)" fontFamily="var(--font-sans)">
        {sub}
      </text>
    </g>
  );
  // New, higher prices dropping in after 'pour' (deterministic positions).
  const balls = Array.from({ length: 14 }, (_, i) => {
    const start = pour + i * s(0.55);
    const t = interpolate(f, [start, start + s(0.9)], [0, 1], clamp);
    const inSmall = i % 2 === 0;
    const x = inSmall ? 120 + ((i * 37) % 110) : 470 + ((i * 53) % 420);
    return t > 0 && t < 1 ? <circle key={i} cx={x} cy={20 + t * 300} r={14} fill="var(--color-up)" /> : null;
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      <Rise style={kicker}>Picture it: two buckets of prices</Rise>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 40, alignItems: 'center', flex: 1 }}>
        <svg viewBox={`0 0 1000 ${H + 20}`} style={{ width: '100%' }}>
          {bucket(60, 230, smallLevel, FAST, 'small', 'last 50 days')}
          {bucket(400, 560, bigLevel, SLOW, 'big', 'last 200 days')}
          {balls}
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          <Rise at={pour}>
            <p style={{ ...body, fontSize: 40 }}>
              <span style={{ color: FAST, fontWeight: 700 }}>Small bucket:</span> each new price is a big share, so its average rises fast.
            </p>
          </Rise>
          <Rise at={pour + s(4)}>
            <p style={{ ...body, fontSize: 40 }}>
              <span style={{ color: SLOW, fontWeight: 700 }}>Big bucket:</span> still full of old prices, so it rises slowly.
            </p>
          </Rise>
          <Rise at={cross}>
            <p style={{ ...h2, fontSize: 56, color: crossed ? 'var(--color-up)' : 'var(--color-ink)' }}>Small passes big: the crossover.</p>
          </Rise>
          <Rise at={cross + p(3)}>
            <p style={{ ...body, fontSize: 36 }}>Buckets take time to fill, so the signal is always a little late.</p>
          </Rise>
        </div>
      </div>
    </div>
  );
}

/** A ship turning slowly: the lag, in one picture. Shown from the 'ship' mark. */
export function Ship({ at }: { at: number }) {
  const f = useCurrentFrame();
  const turn = interpolate(f, [at + s(1.5), at + s(7)], [0, 32], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const t = useT();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
      <svg viewBox="0 0 220 120" style={{ width: 220 }}>
        <path d="M 0 100 Q 55 92 110 100 T 220 100" fill="none" stroke="var(--color-chart-1)" strokeWidth={4} />
        <g transform={`rotate(${-turn} 110 70)`}>
          <path d="M 40 70 L 180 70 L 160 92 L 58 92 Z" fill="var(--color-ink-soft)" />
          <rect x={92} y={40} width={44} height={30} rx={4} fill="var(--color-ink)" />
        </g>
      </svg>
      <p style={{ ...body, fontSize: 40, color: 'var(--color-ink)' }}>{t('ship')}</p>
    </div>
  );
}

/** A tug-of-war rope sliding back and forth: switching sides every time loses. */
export function Rope({ at }: { at: number }) {
  const f = useCurrentFrame();
  const shift = Math.sin(((f - at) / 30) * 2.2) * 160 * interpolate(f, [at, at + s(1)], [0, 1], clamp);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
      <svg viewBox="0 0 700 90" style={{ width: 700 }}>
        <line x1={20} x2={680} y1={45} y2={45} stroke="var(--color-ink-soft)" strokeWidth={10} strokeLinecap="round" />
        <line x1={350} x2={350} y1={10} y2={80} stroke="var(--color-line)" strokeWidth={4} strokeDasharray="8 8" />
        <rect x={340 + shift} y={18} width={20} height={54} rx={6} fill="var(--color-danger)" />
      </svg>
      <p style={{ ...body, fontSize: 36, color: 'var(--color-ink)' }}>Switch sides every time it moves, and you always join the losing side.</p>
    </div>
  );
}

/** The lesson's own quiz question 2, with a thinking pause and the answer at the 'reveal' mark. */
export function Quiz() {
  const f = useCurrentFrame();
  const p = usePace();
  const think = useMark('think', 9);
  const reveal = useMark('reveal', 12);
  const shown = f >= reveal;
  const ring = interpolate(f, [think, reveal], [0, 1], clamp);
  const option = (letter: string, text: string, right: boolean, at: number) => (
    <Rise at={at} style={{ ...card, padding: '30px 40px', display: 'flex', alignItems: 'center', gap: 30, borderColor: shown ? (right ? 'var(--color-up)' : 'var(--color-line)') : 'var(--color-line)', opacity: shown && !right ? 0.45 : 1 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 44, fontWeight: 700, color: shown && right ? 'var(--color-up)' : 'var(--color-accent)' }}>{shown ? (right ? '✓' : '✕') : letter}</span>
      <span style={{ ...body, fontSize: 46, color: 'var(--color-ink)' }}>{text}</span>
    </Rise>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 34, justifyContent: 'center', height: '100%' }}>
      <Rise style={kicker}>Quick check</Rise>
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        <Rise at={p(0.6)}>
          <h2 style={{ ...h2, fontSize: 72 }}>What is a golden cross?</h2>
        </Rise>
        {f >= think && !shown && (
          <svg viewBox="0 0 100 100" style={{ width: 90 }}>
            <circle cx={50} cy={50} r={40} fill="none" stroke="var(--color-line)" strokeWidth={10} />
            <circle cx={50} cy={50} r={40} fill="none" stroke="var(--color-accent)" strokeWidth={10} strokeDasharray={`${ring * 251} 251`} transform="rotate(-90 50 50)" />
          </svg>
        )}
      </div>
      {option('A', 'The 9 EMA crossing above the 21 EMA', false, p(2.5))}
      {option('B', 'The 50-day average crossing above the 200-day average', true, p(5))}
      <Rise at={reveal + s(2)}>
        <p style={{ ...body, fontSize: 40 }}>
          The reverse, crossing below, is the <span style={{ color: 'var(--color-down)', fontWeight: 700 }}>death cross</span>.
        </p>
      </Rise>
    </div>
  );
}
