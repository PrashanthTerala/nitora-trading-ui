import { Composition } from 'remotion';
import * as engulfing from './Engulfing';
import * as crossovers from './MaCrossovers';
import { duration, FPS } from './kit';
import { HYBRID_FRAMES, HybridIntro } from './HybridIntro';
import * as cinematic from './MaCrossoversCinematic';

/**
 * Every lesson video, one composition per language, each as long as its own narration needs.
 * Render with: npm run render -- ma-crossovers-en out/ma-crossovers-en.mp4
 */
export function RemotionRoot() {
  return (
    <>
      {engulfing.LANGS.map((lang) => (
        <Composition key={`engulfing-${lang}`} id={`engulfing-${lang}`} component={engulfing.Engulfing} defaultProps={{ lang }} durationInFrames={duration(engulfing.SCENES, engulfing.narration, lang)} fps={FPS} width={1920} height={1080} />
      ))}
      {crossovers.LANGS.map((lang) => (
        <Composition key={`ma-crossovers-${lang}`} id={`ma-crossovers-${lang}`} component={crossovers.MaCrossovers} defaultProps={{ lang }} durationInFrames={duration(crossovers.SCENES, crossovers.narration, lang, crossovers.TIMING)} fps={FPS} width={1920} height={1080} />
      ))}
      {/* Cinematic upgrade proof of concept (directive V3): four scenes, four languages. */}
      {cinematic.LANGS.map((lang) => (
        <Composition key={`ma-crossovers-cinematic-${lang}`} id={`ma-crossovers-cinematic-${lang}`} component={cinematic.MaCrossoversCinematic} defaultProps={{ lang }} durationInFrames={duration(cinematic.SCENES, crossovers.narration, lang, cinematic.TIMING)} fps={FPS} width={1920} height={1080} />
      ))}
      {/* Proof of concept: Blender shot into the 2D chart (see HybridIntro.tsx). */}
      <Composition id="poc-hybrid-intro" component={HybridIntro} durationInFrames={HYBRID_FRAMES} fps={FPS} width={1920} height={1080} />
    </>
  );
}
