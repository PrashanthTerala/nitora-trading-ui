import { Composition } from 'remotion';
import * as engulfing from './EngulfingCinematic';
import * as harami from './HaramiCinematic';
import * as piercing from './PiercingCinematic';
import * as tweezers from './TweezersCinematic';
import * as stars from './StarsCinematic';
import * as soldiers from './SoldiersCinematic';
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
        <Composition key={`engulfing-cinematic-${lang}`} id={`engulfing-cinematic-${lang}`} component={engulfing.EngulfingCinematic} defaultProps={{ lang }} durationInFrames={duration(engulfing.SCENES, engulfing.narration, lang, engulfing.TIMING)} fps={FPS} width={1920} height={1080} />
      ))}
      {harami.LANGS.map((lang) => (
        <Composition key={`harami-cinematic-${lang}`} id={`harami-cinematic-${lang}`} component={harami.HaramiCinematic} defaultProps={{ lang }} durationInFrames={duration(harami.SCENES, harami.narration, lang, harami.TIMING)} fps={FPS} width={1920} height={1080} />
      ))}
      {piercing.LANGS.map((lang) => (
        <Composition key={`piercing-cinematic-${lang}`} id={`piercing-cinematic-${lang}`} component={piercing.PiercingCinematic} defaultProps={{ lang }} durationInFrames={duration(piercing.SCENES, piercing.narration, lang, piercing.TIMING)} fps={FPS} width={1920} height={1080} />
      ))}
      {tweezers.LANGS.map((lang) => (
        <Composition key={`tweezers-cinematic-${lang}`} id={`tweezers-cinematic-${lang}`} component={tweezers.TweezersCinematic} defaultProps={{ lang }} durationInFrames={duration(tweezers.SCENES, tweezers.narration, lang, tweezers.TIMING)} fps={FPS} width={1920} height={1080} />
      ))}
      {soldiers.LANGS.map((lang) => (
        <Composition key={`soldiers-cinematic-${lang}`} id={`soldiers-cinematic-${lang}`} component={soldiers.SoldiersCinematic} defaultProps={{ lang }} durationInFrames={duration(soldiers.SCENES, soldiers.narration, lang, soldiers.TIMING)} fps={FPS} width={1920} height={1080} />
      ))}
      {stars.LANGS.map((lang) => (
        <Composition key={`stars-cinematic-${lang}`} id={`stars-cinematic-${lang}`} component={stars.StarsCinematic} defaultProps={{ lang }} durationInFrames={duration(stars.SCENES, stars.narration, lang, stars.TIMING)} fps={FPS} width={1920} height={1080} />
      ))}
      {crossovers.LANGS.map((lang) => (
        <Composition key={`ma-crossovers-${lang}`} id={`ma-crossovers-${lang}`} component={crossovers.MaCrossovers} defaultProps={{ lang }} durationInFrames={duration(crossovers.SCENES, crossovers.narration, lang, crossovers.TIMING)} fps={FPS} width={1920} height={1080} />
      ))}
      {/* Cinematic (directive V3): all 14 scenes, four languages. */}
      {cinematic.LANGS.map((lang) => (
        <Composition key={`ma-crossovers-cinematic-${lang}`} id={`ma-crossovers-cinematic-${lang}`} component={cinematic.MaCrossoversCinematic} defaultProps={{ lang }} durationInFrames={duration(cinematic.SCENES, crossovers.narration, lang, cinematic.TIMING)} fps={FPS} width={1920} height={1080} />
      ))}
      {/* Proof of concept: Blender shot into the 2D chart (see HybridIntro.tsx). */}
      <Composition id="poc-hybrid-intro" component={HybridIntro} durationInFrames={HYBRID_FRAMES} fps={FPS} width={1920} height={1080} />
    </>
  );
}
