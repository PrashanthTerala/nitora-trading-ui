/**
 * "Tweezers and Counterattack Lines" (m02-candlestick-patterns/09-tweezers-and-counterattack),
 * cinematic (directive V3): the approved v2 script (docs/video-production/scripts/tweezers-en-v2.md)
 * on CinematicChart, in English and Telugu. Levels, gaps, the range count, the trade's numbers and
 * Bulkowski's rates come from ./tweezers/data.ts, which scripts/check.mjs holds the narration to.
 * Scenes:
 *
 *   title          TweezersIntro           GSAP kinetic type over the tweezer-bottom figure
 *   intro          IntroCinematic          the door (illustration), the tweezer, the counterattack
 *   rules          RulesCinematic          the tweezer bottom's rules, with a checklist
 *   psychology     PsychologyCinematic     two attempts at the same price; the floor becomes support
 *   castle         CastleCinematic         the bouncy castle (illustration)
 *   top            TopCinematic            the mirror: the same high, twice
 *   counterattack  CounterattackCinematic  the gap down, erased back to the first close
 *   compare        CompareCinematic        against the piercing line; the bearish mirror
 *   valid          ValidCinematic          a trend first; every matching pair on a range, counted
 *   confirm        ConfirmCinematic        a close above the pattern's high
 *   trade          TradeCinematic          entry, stop below the shared low, risk
 *   warning        WarningCinematic        the lesson's three questions
 *   reliability    ReliabilityCinematic    Bulkowski's results, credited
 *   takeaways      TakeawaysCinematic      the recap
 *   quiz           QuizCinematic           the lesson's quiz question 3
 *   end            EndCinematic            the Nitora icon, the call to practise and the disclaimer
 *
 * On-screen text is English in every language, by the owner's decision (2026-10-16).
 */
import { ILLUSTRATION, LessonVideo, SYNTHETIC, type Scene, type Timing } from './kit';
import * as t from './tweezers/scenes';
import { narration } from '../narration/tweezers';
import script from '../narration/tweezers.json';

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
  ['title', BASES.title, () => <t.TweezersIntro />, bleed],
  ['intro', BASES.intro, () => <t.IntroCinematic />, bleed],
  ['rules', BASES.rules, () => <t.RulesCinematic />, synthetic],
  ['psychology', BASES.psychology, () => <t.PsychologyCinematic />, synthetic],
  ['castle', BASES.castle, () => <t.CastleCinematic />, illustration],
  ['top', BASES.top, () => <t.TopCinematic />, synthetic],
  ['counterattack', BASES.counterattack, () => <t.CounterattackCinematic />, synthetic],
  ['compare', BASES.compare, () => <t.CompareCinematic />, bleed],
  ['valid', BASES.valid, () => <t.ValidCinematic />, bleed],
  ['confirm', BASES.confirm, () => <t.ConfirmCinematic />, synthetic],
  ['trade', BASES.trade, () => <t.TradeCinematic />, synthetic],
  ['warning', BASES.warning, () => <t.WarningCinematic />, synthetic],
  ['reliability', BASES.reliability, () => <t.ReliabilityCinematic />, bleed],
  ['takeaways', BASES.takeaways, () => <t.TakeawaysCinematic />, bleed],
  ['quiz', BASES.quiz, () => <t.QuizCinematic />, bleed],
  ['end', BASES.end, () => <t.EndCinematic />, bleed],
];

export function TweezersCinematic({ lang }: { lang: string }) {
  return <LessonVideo scenes={SCENES} narration={narration} lang={lang} timing={TIMING} />;
}
