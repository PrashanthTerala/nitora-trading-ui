/**
 * Proof of concept: a Blender shot handing over to the exact 2D chart, in one Remotion timeline.
 *
 * 0-5 s    blender/render.py's data_landscape: the pilot's synthetic series in 3D, the camera
 *          settling on the golden cross, with the lesson's question over it.
 * 4.3-5 s  crossfade.
 * 5-8 s    the existing 2D chart (MaCrossovers.tsx), the same data from the same engine.
 *
 * Silent, and a preview: the Blender frames are 960x540 previews, scaled up. Not a lesson
 * video; it tests the integration (frame accuracy, colour match, readability over 3D).
 */
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { h2, kicker, Rise } from './kit';
import { Theme } from './theme';
import { CROSS_ARROWS, LONG_LABEL, LONG_OVERLAYS, RevealChart, VIEW } from './MaCrossovers';

export const HYBRID_FRAMES = 240;
const BLENDER_FRAMES = 150;
const FADE = 20;

/**
 * Plays a Blender PNG sequence from public/<dir>/0001.png..., one image per video frame, so it
 * stays frame-accurate whatever the render speed; holds the last image after the sequence ends.
 */
export function BlenderSequence({ dir, frames }: { dir: string; frames: number }) {
  const f = useCurrentFrame();
  const n = Math.min(f + 1, frames);
  return <Img src={staticFile(`${dir}/${String(n).padStart(4, '0')}.png`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
}

export function HybridIntro() {
  const f = useCurrentFrame();
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
  const blenderOpacity = interpolate(f, [BLENDER_FRAMES - FADE, BLENDER_FRAMES], [1, 0], clamp);
  // The question leaves before the crossfade, so two headings never overlap.
  const questionOpacity = interpolate(f, [BLENDER_FRAMES - FADE - 18, BLENDER_FRAMES - FADE], [1, 0], clamp);
  return (
    <Theme>
      <AbsoluteFill style={{ background: 'var(--color-bg)' }} />
      <Sequence from={BLENDER_FRAMES - FADE} name="2D chart">
        <AbsoluteFill style={{ padding: '96px 140px', display: 'flex', flexDirection: 'column', gap: 28 }}>
          <Rise at={FADE} style={kicker}>The famous pair</Rise>
          <Rise at={FADE + 6}><h2 style={{ ...h2, fontSize: 52 }}>
            <span style={{ color: 'var(--color-up)' }}>Golden cross:</span> the <span style={{ color: 'var(--color-chart-2)' }}>50-day SMA</span> crosses above the{' '}
            <span style={{ color: 'var(--color-chart-1)' }}>200-day</span>.
          </h2></Rise>
          <RevealChart bars={VIEW} overlays={LONG_OVERLAYS} mode="line" width={900} height={250} label={LONG_LABEL} from={0} to={0.01} notesAt={1.2} annotations={CROSS_ARROWS} />
        </AbsoluteFill>
      </Sequence>
      <Sequence durationInFrames={BLENDER_FRAMES} name="Blender: data landscape">
        <AbsoluteFill style={{ opacity: blenderOpacity }}>
          <BlenderSequence dir="blender/data-landscape/preview" frames={BLENDER_FRAMES} />
          {/* A scrim under the text keeps it readable over any 3D frame. */}
          <AbsoluteFill style={{ opacity: questionOpacity, background: 'linear-gradient(180deg, color-mix(in oklch, var(--color-bg) 92%, transparent) 0%, color-mix(in oklch, var(--color-bg) 70%, transparent) 32%, transparent 55%)' }} />
          <AbsoluteFill style={{ padding: '96px 140px', gap: 24, opacity: questionOpacity }}>
            <Rise at={10} style={kicker}>
              Module 5 · Indicators · Lesson 3
            </Rise>
            <Rise at={22}>
              <h2 style={{ ...h2, fontSize: 72, maxWidth: 1400 }}>What happens when a shorter moving average crosses above a longer one?</h2>
            </Rise>
          </AbsoluteFill>
          <AbsoluteFill style={{ justifyContent: 'flex-end', padding: '0 140px 72px' }}>
            <span style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-mono)', fontSize: 30, color: 'var(--color-ink)', background: 'color-mix(in oklch, var(--color-bg) 85%, transparent)', border: '2px solid var(--color-line)', borderRadius: 999, padding: '8px 22px' }}>
              Synthetic data, for teaching
            </span>
          </AbsoluteFill>
        </AbsoluteFill>
      </Sequence>
    </Theme>
  );
}
