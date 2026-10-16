/**
 * "Bullish and Bearish Engulfing" (m02-candlestick-patterns/06-engulfing), cinematic (directive
 * V3): the approved v2 script (docs/video-production/scripts/engulfing-en-v2.md) on CinematicChart.
 * Every chart is candles; prices, counts and the trade's numbers come from ./engulfing/data.ts,
 * which scripts/check.mjs holds the narration to. Scenes:
 *
 *   title        EngulfingIntro        GSAP kinetic type over the figure's engulfing candle growing
 *   intro        IntroCinematic        the playground argument, then both versions side by side
 *   rules        RulesCinematic        the exact rules, on the figure's two candles with real prices
 *   bullish      BullishCinematic      day one, then day two growing from its open; control flips
 *   wave         WaveCinematic         the sandcastle and the wave (illustration)
 *   bearish      BearishCinematic      the mirror, on the bearish figure
 *   valid        ValidCinematic        trends first, then every engulfing on a range, counted
 *   locations    LocationsCinematic    the best places, four illustrated panels
 *   confirm      ConfirmCinematic      the third candle, volume, timeframe
 *   trade        TradeCinematic        entry, stop and risk on the figure
 *   trap         TrapCinematic         the giant engulfing candle, stops compared (illustration)
 *   reliability  ReliabilityCinematic  Bulkowski's published rates, credited, and the warnings
 *   takeaways    TakeawaysCinematic    the recap
 *   quiz         QuizCinematic         the lesson's quiz question 2
 *   end          EndCinematic          the call to practise and the disclaimer
 *
 * On-screen text is English in every language, by the owner's decision (2026-10-16).
 */
import { ILLUSTRATION, LessonVideo, SYNTHETIC, type Scene, type Timing } from './kit';
import * as e from './engulfing/scenes';
import { narration } from '../narration/engulfing';
import script from '../narration/engulfing.json';

type SceneId = keyof (typeof narration)['en'];
export { narration };
export const TIMING: Timing = script.timing;
export const LANGS = Object.keys(narration) as (keyof typeof narration)[];

/** Scene bases (seconds): the script's (the title's 5 s give its typography room). */
const scenes = script.scenes as Record<string, { base: number }>;
export const BASES: Record<SceneId, number> = Object.fromEntries(Object.keys(scenes).map((id) => [id, scenes[id].base])) as Record<SceneId, number>;

const bleed = { bleed: true };
/** Scenes on the site's synthetic figures, and scenes that are illustrations: the kit draws their tag in the corner. */
const synthetic = { bleed: true, tag: SYNTHETIC };
const illustration = { bleed: true, tag: ILLUSTRATION };
export const SCENES: Scene<SceneId>[] = [
  ['title', BASES.title, () => <e.EngulfingIntro />, bleed],
  ['intro', BASES.intro, () => <e.IntroCinematic />, bleed],
  ['rules', BASES.rules, () => <e.RulesCinematic />, synthetic],
  ['bullish', BASES.bullish, () => <e.BullishCinematic />, synthetic],
  ['wave', BASES.wave, () => <e.WaveCinematic />, illustration],
  ['bearish', BASES.bearish, () => <e.BearishCinematic />, synthetic],
  ['valid', BASES.valid, () => <e.ValidCinematic />, synthetic],
  ['locations', BASES.locations, () => <e.LocationsCinematic />, illustration],
  ['confirm', BASES.confirm, () => <e.ConfirmCinematic />, bleed],
  ['trade', BASES.trade, () => <e.TradeCinematic />, synthetic],
  ['trap', BASES.trap, () => <e.TrapCinematic />, bleed],
  ['reliability', BASES.reliability, () => <e.ReliabilityCinematic />, bleed],
  ['takeaways', BASES.takeaways, () => <e.TakeawaysCinematic />, bleed],
  ['quiz', BASES.quiz, () => <e.QuizCinematic />, bleed],
  ['end', BASES.end, () => <e.EndCinematic />, bleed],
];

export function EngulfingCinematic({ lang }: { lang: string }) {
  return <LessonVideo scenes={SCENES} narration={narration} lang={lang} timing={TIMING} />;
}
