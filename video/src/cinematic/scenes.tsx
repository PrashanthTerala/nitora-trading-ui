/**
 * The cinematic scenes. Every camera move and reveal is tied to the frame (useCurrentFrame,
 * useMark) or to a GSAP timeline that @remotion/gsap seeks to the frame, so a frame always
 * renders the same picture, in preview, scrubbing and render alike.
 */
import { useGsapTimeline } from '@remotion/gsap';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { s, useMark } from '../kit';
import { Ship } from '../ma-crossovers/explainers';
import { BAND_SPACE, CLOSES, CinematicChart, DEATH, GOLDEN, HIGH, LOW, PLOT, SMA50, WIDE, cameraAt, frameBars } from './CinematicChart';
import { useT } from './strings';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const fade = (f: number, from: number, len = s(0.5)) => interpolate(f, [from, from + len], [0, 1], clamp);
/** A ring that pulses every 1.6 s once shown: deterministic, from the frame alone. */
const pulse = (f: number, from: number) => (f < from ? 0 : ((f - from) % s(1.6)) / s(1.6));

/**
 * The scene's headline. With `accent`, the key term (the text before the first colon) is drawn
 * in that colour with an underline that sweeps in: the thing to pay attention to.
 */
function Headline({ kicker, children, at = 0, accent }: { kicker: string; children: string; at?: number; accent?: string }) {
  const f = useCurrentFrame();
  const o = fade(f, at, s(0.6));
  const sweep = interpolate(f, [at + s(0.4), at + s(1.1)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const cut = accent ? children.indexOf(':') : -1;
  const key = cut > 0 ? children.slice(0, cut) : '';
  const rest = cut > 0 ? children.slice(cut) : children;
  return (
    <div style={{ position: 'absolute', left: 120, top: 70, right: 120, opacity: o, transform: `translateY(${(1 - o) * 16}px)` }}>
      <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>{kicker}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 58, fontWeight: 700, lineHeight: 1.15, marginTop: 10, color: 'var(--color-ink)' }}>
        {key && (
          <span style={{ position: 'relative', color: accent }}>
            {key}
            <span style={{ position: 'absolute', left: 0, bottom: -6, height: 6, borderRadius: 3, width: `${sweep * 100}%`, background: accent }} />
          </span>
        )}
        {rest}
      </div>
    </div>
  );
}

/**
 * The opening: the lesson's own chart drawing itself, out of focus, behind kinetic type. The
 * type is a GSAP timeline (@remotion/gsap seeks it to the frame); words are split by hand, not
 * by SplitText, so Telugu and Devanagari clusters are never broken apart.
 */
export function CinematicIntro() {
  const f = useCurrentFrame();
  const t = useT();
  const scope = useGsapTimeline<HTMLDivElement>(({ timeline, selector }) => {
    timeline
      .from(selector('[data-kicker]'), { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out' }, 0.3)
      .from(selector('[data-word]'), { y: 90, opacity: 0, filter: 'blur(14px)', duration: 1.1, ease: 'expo.out', stagger: 0.12 }, 0.6)
      .from(selector('[data-rule]'), { scaleX: 0, duration: 1.0, ease: 'expo.inOut' }, 1.4)
      .from(selector('[data-sub]'), { y: 24, opacity: 0, duration: 0.8, ease: 'power2.out' }, 2.0);
  });
  // A slow push-in on the chart, drawing as the title lands.
  const push = interpolate(f, [0, s(8)], [0, 1], clamp);
  const cam = { x0: WIDE.x0 + 40 * push, x1: WIDE.x1 - 30 * push, y0: WIDE.y0 + 2 * push, y1: WIDE.y1 - 2 * push };
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0, filter: 'blur(3px)', transform: `scale(${1.04 + 0.03 * push})` }}>
        <CinematicChart cam={cam} draw={interpolate(f, [0, s(6)], [0.05, 0.75], clamp)} head={false} dim={0.32} />
      </div>
      <AbsoluteFill style={{ background: 'radial-gradient(70% 70% at 30% 55%, transparent 0%, var(--color-bg) 92%)' }} />
      <div ref={scope} style={{ position: 'absolute', left: 140, right: 140, top: 330 }}>
        <div data-kicker style={{ fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
          {t('kicker')}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 132, fontWeight: 750, lineHeight: 1.05, letterSpacing: '-0.025em', margin: '26px 0 0' }}>
          {t('title')
            .split(' ')
            .map((word, i) => (
              <span key={i} data-word style={{ display: 'inline-block', marginRight: '0.28em', color: i === t('title').split(' ').length - 1 ? 'var(--color-accent)' : 'var(--color-ink)' }}>
                {word}
              </span>
            ))}
        </h1>
        <div data-rule style={{ height: 8, width: 360, borderRadius: 4, marginTop: 34, transformOrigin: 'left center', background: 'linear-gradient(90deg, var(--color-chart-2), var(--color-chart-1))' }} />
        <div data-sub style={{ fontSize: 46, color: 'var(--color-ink-soft)', marginTop: 34 }}>
          {t('subtitle')}
        </div>
      </div>
    </AbsoluteFill>
  );
}

/** The golden and death crosses: the camera finds each one as the narration names it. */
export function GoldenCinematic() {
  const f = useCurrentFrame();
  const t = useT();
  const g = useMark('golden', 6);
  const de = useMark('death', 11);
  const back = de + s(5.5);
  const cam = cameraAt(f, [
    { at: 0, cam: WIDE },
    { at: g, cam: frameBars(GOLDEN - 75, GOLDEN + 75), move: 54 },
    { at: de, cam: frameBars(DEATH - 75, DEATH + 37), move: 54 },
    { at: back, cam: WIDE, move: 60 },
  ]);
  const head = f < g ? t('wideHead') : f < de ? t('goldenHead') : t('deathHead');
  const headAt = f < g ? s(0.3) : f < de ? g : de;
  const accent = f < g ? undefined : f < de ? 'var(--color-up)' : 'var(--color-down)';
  // The spotlight follows the cross being named, and lifts when the camera pulls back.
  const onGolden = fade(f, g + s(0.9)) * (1 - fade(f, de));
  const onDeath = fade(f, de + s(0.9)) * (1 - fade(f, back));
  const spot = onDeath > 0 ? { index: DEATH, value: SMA50[DEATH], radius: 560, strength: onDeath } : { index: GOLDEN, value: SMA50[GOLDEN], radius: 560, strength: onGolden };
  return (
    <AbsoluteFill>
      <CinematicChart
        cam={cam}
        draw={interpolate(f, [s(0.4), Math.max(g - s(0.4), s(1.5))], [0, 1], clamp)}
        legend={{ price: t('price'), sma50: 'SMA 50', sma200: 'SMA 200' }}
        tag={t('synthetic')}
        spotlight={spot}
        markers={[
          { index: GOLDEN, label: t('golden'), color: 'var(--color-up)', opacity: fade(f, g + s(1.2)), pulse: pulse(f, g + s(1.2)) },
          { index: DEATH, label: t('death'), color: 'var(--color-down)', opacity: fade(f, de + s(1.2)), pulse: pulse(f, de + s(1.2)) },
        ]}
      />
      <Headline key={head} kicker={t('famousPair')} at={headAt} accent={accent}>
        {head}
      </Headline>
    </AbsoluteFill>
  );
}

/** The lag, measured on the same chart: the camera carries straight on from the last scene. */
export function LagCinematic() {
  const f = useCurrentFrame();
  const t = useT();
  const missed = useMark('missed', 9);
  const ship = useMark('ship', 17);
  const toHigh = missed + s(2.8);
  const cam = cameraAt(f, [
    { at: 0, cam: WIDE },
    { at: s(0.8), cam: frameBars(LOW - 25, GOLDEN + 30), move: 54 },
    { at: toHigh, cam: frameBars(HIGH - 25, DEATH + 30), move: 54 },
    { at: ship, cam: WIDE, move: 54 },
  ]);
  const fmt = (v: number) => v.toFixed(2);
  // Labels follow the camera: each shows while its part of the chart is in focus (the shading
  // and arrows stay drawn), and the two price changes come back for the summary shot.
  const onMissed = fade(f, missed) * (1 - fade(f, toHigh));
  const onGave = fade(f, toHigh + s(1.2)) * (1 - fade(f, ship));
  const spot = onGave > 0
    ? { index: DEATH, value: (CLOSES[HIGH] + CLOSES[DEATH]) / 2, radius: 600, strength: onGave }
    : { index: GOLDEN, value: (CLOSES[LOW] + CLOSES[GOLDEN]) / 2, radius: 600, strength: onMissed };
  // The ship card gets its own space: the plot shrinks upward to make room, so the card never
  // covers the chart, its arrows or its labels.
  const shipIn = fade(f, ship, s(0.8));
  const plotBottom = interpolate(shipIn, [0, 1], [PLOT.bottom, 620]);
  return (
    <AbsoluteFill>
      <CinematicChart
        cam={cam}
        draw={1}
        plotBottom={plotBottom}
        legend={{ price: t('price'), sma50: 'SMA 50', sma200: 'SMA 200' }}
        tag={t('synthetic')}
        spotlight={spot}
        regions={[
          { from: LOW, to: GOLDEN, color: 'var(--color-up)', opacity: fade(f, s(2)), labelOpacity: 1 - fade(f, toHigh), label: t('waited', { n: GOLDEN - LOW }) },
          { from: HIGH, to: DEATH, color: 'var(--color-down)', opacity: fade(f, toHigh + s(1.0)), labelOpacity: 1 - fade(f, ship), label: t('waitedHigh', { n: DEATH - HIGH }) },
        ]}
        brackets={[
          { index: GOLDEN, from: CLOSES[LOW], to: CLOSES[GOLDEN], color: 'var(--color-up)', opacity: fade(f, missed + s(0.4)), labelOpacity: Math.max(1 - fade(f, toHigh), fade(f, ship + s(0.8))), label: t('missed', { a: fmt(CLOSES[LOW]), b: fmt(CLOSES[GOLDEN]) }) },
          { index: DEATH, from: CLOSES[HIGH], to: CLOSES[DEATH], color: 'var(--color-down)', opacity: fade(f, toHigh + s(1.4)), label: t('gaveBack', { a: fmt(CLOSES[HIGH]), b: fmt(CLOSES[DEATH]) }) },
        ]}
        markers={[
          { index: GOLDEN, label: t('golden'), color: 'var(--color-up)', opacity: 1, pulse: 0 },
          { index: DEATH, label: t('death'), color: 'var(--color-down)', opacity: 1, pulse: 0 },
        ]}
      />
      <Headline kicker={t('lagKicker')}>{t('lagHead')}</Headline>
      {f >= ship && (
        <div style={{ position: 'absolute', left: 120, right: 190, top: plotBottom + BAND_SPACE + 24, opacity: shipIn, borderRadius: 28, border: '2px solid var(--color-line)', background: 'var(--color-surface-1)', padding: '28px 44px' }}>
          <Ship at={ship} />
        </div>
      )}
    </AbsoluteFill>
  );
}

