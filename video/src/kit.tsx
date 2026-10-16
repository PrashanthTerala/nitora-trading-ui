/**
 * What every lesson video shares: per-language timing, the scene frame, and the house style.
 *
 * Timing is per language. A scene lasts as long as its narration in the language being rendered
 * (plus a short lead-in and pause), never less than its designed length, and its animations
 * stretch by the same factor (see usePace), so each language gets a video paced for its own
 * voice instead of the longest one's.
 */
import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Theme } from './theme';

export const FPS = 30;
export const s = (seconds: number) => Math.round(seconds * FPS);

/** One scene: its id (matching the narration), its designed length in seconds, and what it draws. */
/**
 * One scene: its id (matching the narration), its designed length in seconds, what it draws,
 * and options: `fadeIn` / `fadeOut` false for a scene that continues straight from or into its
 * neighbour (one camera move across a cut), `bleed` true to draw edge to edge (no page padding),
 * `tag` a disclaimer for the whole scene ("Synthetic data, for teaching", "Illustration"), drawn by CornerTag.
 */
export type SceneOptions = { fadeIn?: boolean; fadeOut?: boolean; bleed?: boolean; tag?: string };
export type Scene<Id extends string> = [Id, number, () => ReactNode, SceneOptions?];

/**
 * The language of the on-screen text. English unless a video opts in with `textLang`; every
 * current video keeps English on-screen text, by the owner's decision (2026-10-16).
 */
const LangContext = createContext('en');
export const useLang = () => useContext(LangContext);
/** A video's narration, as scripts/narrate.py generates it: per language, per scene. */
export type Narration<Id extends string> = Record<string, Record<Id, { src: string; seconds: number; marks?: Record<string, number> }>>;

/**
 * Narration starts `lead` seconds into its scene, and the scene holds `tail` seconds after it
 * ends. A video's script can set both (its "timing"); scripts/package.py reads the same values
 * to time the captions, so the two always agree.
 */
export type Timing = { lead: number; tail: number };
const DEFAULT_TIMING: Timing = { lead: 0.5, tail: 0.9 };

export function timeline<Id extends string>(scenes: Scene<Id>[], narration: Narration<Id>, lang: string, timing: Timing = DEFAULT_TIMING) {
  return scenes.map(([id, base, render, options]) => {
    const seconds = Math.max(base, timing.lead + narration[lang][id].seconds + timing.tail);
    return { id, frames: s(seconds), stretch: seconds / base, render, options: options ?? {}, marks: narration[lang][id].marks ?? {}, seconds: narration[lang][id].seconds };
  });
}

export function duration<Id extends string>(scenes: Scene<Id>[], narration: Narration<Id>, lang: string, timing: Timing = DEFAULT_TIMING) {
  return timeline(scenes, narration, lang, timing).reduce((n, x) => n + x.frames, 0);
}

/** Converts a scene's designed timings (in seconds) to frames, stretched to its real length. */
const PaceContext = createContext(1);
export function usePace() {
  const stretch = useContext(PaceContext);
  return (seconds: number) => Math.round(seconds * stretch * FPS);
}

/**
 * The frame of a timing mark in this scene's narration (<mark name> in the script): the moment
 * the voice starts the sentence after it, in whichever language is rendering. Falls back to a
 * designed time (seconds, stretched) when a language has no such mark.
 */
const MarksContext = createContext<{ marks: Record<string, number>; lead: number; seconds: number }>({ marks: {}, lead: 0, seconds: 0 });
export function useMark(name: string, fallback: number) {
  const { marks, lead } = useContext(MarksContext);
  const p = usePace();
  return name in marks ? s(lead + marks[name]) : p(fallback);
}

/**
 * The frame `fraction` of the way through this scene's narration (0 = the voice starts, 1 = it
 * ends), for a moment between marks, in whichever language is rendering. Approximate: sentences
 * take about the same share of a scene in every language.
 */
export function useSpeechAt() {
  const { lead, seconds } = useContext(MarksContext);
  return (fraction: number) => s(lead + fraction * seconds);
}

export function LessonVideo<Id extends string>({ scenes, narration, lang, timing = DEFAULT_TIMING, textLang = 'en' }: { scenes: Scene<Id>[]; narration: Narration<Id>; lang: string; timing?: Timing; textLang?: string }) {
  let from = 0;
  const LEAD = timing.lead;
  return (
    <Theme>
      <Backdrop />
      {timeline(scenes, narration, lang, timing).map(({ id, frames, stretch, render, options, marks, seconds }) => {
        const seq = (
          <Sequence key={id} name={id} from={from} durationInFrames={frames}>
            <PaceContext.Provider value={stretch}>
              <MarksContext.Provider value={{ marks, lead: LEAD, seconds }}>
                <LangContext.Provider value={textLang}>
                  <SceneFade length={frames} options={options}>{render()}</SceneFade>
                </LangContext.Provider>
              </MarksContext.Provider>
            </PaceContext.Provider>
            <Sequence from={s(LEAD)} name={`${id} narration`}>
              <Audio src={narration[lang][id].src} />
            </Sequence>
          </Sequence>
        );
        from += frames;
        return seq;
      })}
      <Progress />
    </Theme>
  );
}

/** The page colour with a faint accent glow, as on the site's hero. */
function Backdrop() {
  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(60% 55% at 78% 30%, color-mix(in oklch, var(--color-accent) 16%, transparent), transparent 70%), var(--color-bg)',
      }}
    />
  );
}

/** Each scene fades in over 12 frames and out over the last 10. */
function SceneFade({ length, options, children }: { length: number; options: SceneOptions; children: ReactNode }) {
  const f = useCurrentFrame();
  const fadeIn = options.fadeIn === false ? 1 : interpolate(f, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = options.fadeOut === false ? 1 : interpolate(f, [length - 10, length], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      <AbsoluteFill style={{ padding: options.bleed ? 0 : '96px 140px' }}>{children}</AbsoluteFill>
      {options.tag && <CornerTag label={options.tag} />}
    </AbsoluteFill>
  );
}

export const SYNTHETIC = 'Synthetic data, for teaching';
export const ILLUSTRATION = 'Illustration';

/**
 * Every disclaimer-style tag ("Synthetic data, for teaching", "Illustration") goes here, and only
 * here: the frame's top-right corner, above the headline, outside every scene's content; never in
 * a chart's label band, a footer line or beside a headline. A scene whose tag changes part-way
 * (synthetic chart, then an illustration) draws CornerTags itself, crossfading by `opacity`.
 */
export function CornerTag({ label, opacity = 1 }: { label: string; opacity?: number }) {
  return (
    <div style={{ position: 'absolute', top: 22, right: 40, opacity, fontSize: 22, letterSpacing: '0.04em', color: 'var(--color-ink-soft)', border: '2px solid var(--color-line)', borderRadius: 18, padding: '4px 16px', background: 'var(--color-bg)' }}>
      {label}
    </div>
  );
}

/** A thin bar along the bottom showing how far through the video we are. */
function Progress() {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end' }}>
      <div style={{ height: 6, width: `${(f / durationInFrames) * 100}%`, background: 'var(--color-accent)', opacity: 0.85 }} />
    </AbsoluteFill>
  );
}

/** Text that rises into place at `at` frames into its scene. */
export function Rise({ at = 0, children, style }: { at?: number; children: ReactNode; style?: CSSProperties }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - at, fps, config: { damping: 200 } });
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 24}px)`, ...style }}>{children}</div>;
}

export const kicker: CSSProperties = { fontSize: 30, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent)' };
export const h1: CSSProperties = { fontFamily: 'var(--font-display)', fontSize: 92, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em', margin: 0 };
export const h2: CSSProperties = { fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 650, lineHeight: 1.1, letterSpacing: '-0.015em', margin: 0 };
export const body: CSSProperties = { fontSize: 40, lineHeight: 1.45, color: 'var(--color-ink-soft)', margin: 0 };

export function Brand() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <Img src={staticFile('favicon.svg')} style={{ width: 48, height: 48 }} />
      <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-ink)' }}>
        Nitora <span style={{ fontWeight: 400, color: 'var(--color-ink-soft)' }}>Trading Academy</span>
      </span>
    </div>
  );
}

export function TitleCard({ module, title }: { module: string; title: ReactNode }) {
  return (
    <AbsoluteFill style={{ padding: '120px 140px', justifyContent: 'space-between' }}>
      <Rise>
        <Brand />
      </Rise>
      <div>
        <Rise at={8} style={kicker}>
          {module}
        </Rise>
        <Rise at={16}>
          <h1 style={{ ...h1, fontSize: 120, marginTop: 24 }}>{title}</h1>
        </Rise>
      </div>
      <div />
    </AbsoluteFill>
  );
}

/** A numbered list that builds one item at a time. */
export function Takeaways({ items, gap = 1.8 }: { items: string[]; gap?: number }) {
  const p = usePace();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 34, justifyContent: 'center', height: '100%' }}>
      <Rise style={kicker}>Key takeaways</Rise>
      {items.map((t, i) => (
        <Rise key={t} at={p(0.8 + i * gap)} style={{ display: 'flex', gap: 32, alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 34, color: 'var(--color-accent)' }}>{String(i + 1).padStart(2, '0')}</span>
          <span style={{ ...body, color: 'var(--color-ink)', fontSize: 44 }}>{t}</span>
        </Rise>
      ))}
    </div>
  );
}

/** The lesson's warning, as its own scene. */
export function Danger({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <Rise style={{ borderLeft: '10px solid var(--color-danger)', background: 'var(--color-danger-soft)', borderRadius: 28, padding: '56px 64px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <span style={{ ...kicker, color: 'var(--color-danger)' }}>{label}</span>
      <h2 style={h2}>{title}</h2>
      <div style={{ ...body, color: 'var(--color-ink)' }}>{children}</div>
    </Rise>
  );
}

export function EndCard({ action, link }: { action: string; link: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 40, height: '100%', textAlign: 'center' }}>
      <Rise>
        <Brand />
      </Rise>
      <Rise at={8}>
        <h2 style={h2}>{action}</h2>
      </Rise>
      <Rise at={16} style={{ fontFamily: 'var(--font-mono)', fontSize: 44, color: 'var(--color-accent)' }}>
        {link}
      </Rise>
      <Rise at={30} style={{ fontSize: 32, color: 'var(--color-ink-soft)' }}>
        An educational tool. Charts use synthetic data. Nothing here is financial advice.
      </Rise>
    </div>
  );
}
