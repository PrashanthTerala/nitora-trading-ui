/**
 * "Piercing Line and Dark Cloud Cover" (m02-candlestick-patterns/08-piercing-dark-cloud), cinematic
 * (directive V3): the approved v2 script (docs/video-production/scripts/piercing-en-v2.md) on
 * CinematicChart, in English and Telugu. Prices, the middle, the reach, the trade's numbers and
 * Bulkowski's rates come from ./piercing/data.ts, which scripts/check.mjs holds the narration to.
 * Scenes:
 *
 *   title        PiercingIntro          GSAP kinetic type over the figure's second candle growing
 *   intro        IntroCinematic         the tug of war (illustration), then the halfway rule on the figure
 *   rules        RulesCinematic         the four rules on the figure, with a checklist
 *   psychology   PsychologyCinematic    day one, day two's gap and climb, who is losing
 *   snowball     SnowballCinematic      the lesson's snowball fight (illustration)
 *   darkcloud    DarkCloudCinematic     the mirror, on the bearish figure
 *   scale        ScaleCinematic         one body, five depths, five names; the thrusting test result
 *   valid        ValidCinematic         a trend first; the gap in stocks vs 24-hour markets
 *   confirm      ConfirmCinematic       the third candle closes above the first open
 *   trade        TradeCinematic         entry, stop and risk on the figure
 *   measure      MeasureCinematic       open, close, middle and the second close, measured
 *   reliability  ReliabilityCinematic   Bulkowski's rates beside the engulfing cousins, credited
 *   takeaways    TakeawaysCinematic     the recap
 *   quiz         QuizCinematic          the lesson's quiz question 1
 *   end          EndCinematic           the Nitora icon, the call to practise and the disclaimer
 *
 * On-screen text is English in every language, by the owner's decision (2026-10-16).
 */
import { ILLUSTRATION, LessonVideo, SYNTHETIC, type Scene, type Timing } from './kit';
import * as p from './piercing/scenes';
import { narration } from '../narration/piercing';
import script from '../narration/piercing.json';

type SceneId = keyof (typeof narration)['en'];
export { narration };
export const TIMING: Timing = script.timing;
export const LANGS = Object.keys(narration) as (keyof typeof narration)[];

const scenes = script.scenes as Record<string, { base: number }>;
export const BASES: Record<SceneId, number> = Object.fromEntries(Object.keys(scenes).map((id) => [id, scenes[id].base])) as Record<SceneId, number>;

/** Scenes on the site's synthetic figures, and scenes that are illustrations: the kit draws their tag in the corner. */
const bleed = { bleed: true };
const synthetic = { bleed: true, tag: SYNTHETIC };
const illustration = { bleed: true, tag: ILLUSTRATION };
export const SCENES: Scene<SceneId>[] = [
  ['title', BASES.title, () => <p.PiercingIntro />, bleed],
  ['intro', BASES.intro, () => <p.IntroCinematic />, bleed],
  ['rules', BASES.rules, () => <p.RulesCinematic />, synthetic],
  ['psychology', BASES.psychology, () => <p.PsychologyCinematic />, synthetic],
  ['snowball', BASES.snowball, () => <p.SnowballCinematic />, illustration],
  ['darkcloud', BASES.darkcloud, () => <p.DarkCloudCinematic />, synthetic],
  ['scale', BASES.scale, () => <p.ScaleCinematic />, illustration],
  ['valid', BASES.valid, () => <p.ValidCinematic />, bleed],
  ['confirm', BASES.confirm, () => <p.ConfirmCinematic />, synthetic],
  ['trade', BASES.trade, () => <p.TradeCinematic />, synthetic],
  ['measure', BASES.measure, () => <p.MeasureCinematic />, synthetic],
  ['reliability', BASES.reliability, () => <p.ReliabilityCinematic />, bleed],
  ['takeaways', BASES.takeaways, () => <p.TakeawaysCinematic />, bleed],
  ['quiz', BASES.quiz, () => <p.QuizCinematic />, bleed],
  ['end', BASES.end, () => <p.EndCinematic />, bleed],
];

export function PiercingCinematic({ lang }: { lang: string }) {
  return <LessonVideo scenes={SCENES} narration={narration} lang={lang} timing={TIMING} />;
}
