/**
 * "Morning Star and Evening Star" (m02-candlestick-patterns/10-morning-evening-star), cinematic
 * (directive V3): the approved v2 script (docs/video-production/scripts/stars-en-v2.md) on
 * CinematicChart, in English and Telugu. The middle, the third candle's reach, the trade's numbers
 * and Bulkowski's rates and ranks come from ./stars/data.ts, which scripts/check.mjs holds the
 * narration to. Scenes:
 *
 *   title        StarsIntro            GSAP kinetic type over the morning-star figure
 *   intro        IntroCinematic        night, the in-between, day (illustration); the pattern; its mirror
 *   rules        RulesCinematic        the morning star's rules, with a checklist
 *   psychology   PsychologyCinematic   three sessions: selling, a stall, buying
 *   seesaw       SeesawCinematic       the lesson's seesaw (illustration)
 *   evening      EveningCinematic      the mirror, on the evening-star figure
 *   star         StarCinematic         doji, small and medium middles (illustration)
 *   third        ThirdCinematic        the third candle's reach into the first body
 *   valid        ValidCinematic        a trend first; daily gaps vs a five-minute chart
 *   trade        TradeCinematic        entry at the third close, stop below the star
 *   lazy         LazyCinematic         the lazy star (illustration)
 *   reliability  ReliabilityCinematic  Bulkowski's rates and ranks, credited
 *   takeaways    TakeawaysCinematic    the recap
 *   quiz         QuizCinematic         the lesson's quiz question 3
 *   end          EndCinematic          the Nitora icon, the call to practise and the disclaimer
 *
 * On-screen text is English in every language, by the owner's decision (2026-10-16).
 */
import { ILLUSTRATION, LessonVideo, SYNTHETIC, type Scene, type Timing } from './kit';
import * as t from './stars/scenes';
import { narration } from '../narration/stars';
import script from '../narration/stars.json';

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
  ['title', BASES.title, () => <t.StarsIntro />, bleed],
  ['intro', BASES.intro, () => <t.IntroCinematic />, bleed],
  ['rules', BASES.rules, () => <t.RulesCinematic />, synthetic],
  ['psychology', BASES.psychology, () => <t.PsychologyCinematic />, synthetic],
  ['seesaw', BASES.seesaw, () => <t.SeesawCinematic />, illustration],
  ['evening', BASES.evening, () => <t.EveningCinematic />, synthetic],
  ['star', BASES.star, () => <t.StarCinematic />, illustration],
  ['third', BASES.third, () => <t.ThirdCinematic />, synthetic],
  ['valid', BASES.valid, () => <t.ValidCinematic />, bleed],
  ['trade', BASES.trade, () => <t.TradeCinematic />, synthetic],
  ['lazy', BASES.lazy, () => <t.LazyCinematic />, illustration],
  ['reliability', BASES.reliability, () => <t.ReliabilityCinematic />, bleed],
  ['takeaways', BASES.takeaways, () => <t.TakeawaysCinematic />, bleed],
  ['quiz', BASES.quiz, () => <t.QuizCinematic />, bleed],
  ['end', BASES.end, () => <t.EndCinematic />, bleed],
];

export function StarsCinematic({ lang }: { lang: string }) {
  return <LessonVideo scenes={SCENES} narration={narration} lang={lang} timing={TIMING} />;
}
