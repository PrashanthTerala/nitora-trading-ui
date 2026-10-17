/**
 * "Three White Soldiers and Three Black Crows" (m02-candlestick-patterns/11-three-soldiers-three-crows),
 * the first lesson in the studio look (approved 2026-10-16): the approved v2 script
 * (docs/video-production/scripts/soldiers-en-v2.md) on CinematicChart, in English and Telugu. The
 * closes, the trades' numbers and Bulkowski's rates and ranks come from ./soldiers/data.ts, which
 * scripts/check.mjs holds the narration to. Scenes (chapters in brackets):
 *
 *   title         SoldiersIntro            the brand opening, then kinetic type over the soldiers
 *   intro         IntroCinematic           one candle, then three building; soldiers and crows
 *   rules         RulesCinematic           [The rules] the checklist, closes drawn in
 *   psychology    PsychologyCinematic      the rules' chart widens (match cut); three days build
 *   staircase     StaircaseCinematic       the lesson's staircase (illustration)
 *   crows         CrowsCinematic           [The mirror] three black crows build
 *   variations    VariationsCinematic      [Reading the quality] advance block, stalled, identical crows (illustration)
 *   valid         ValidCinematic           after a decline; the blow-off (illustration)
 *   confirmation  ConfirmationCinematic    a fourth candle; rising vs shrinking volume (illustration)
 *   trade         TradeCinematic           [Trading it] the wide stop, then the pullback
 *   chase         ChaseCinematic           the trade's chart (match cut): chasing the third candle
 *   reliability   ReliabilityCinematic     [How reliable] Bulkowski's rates and ranks, credited
 *   takeaways     TakeawaysCinematic       the recap
 *   quiz          QuizCinematic            the lesson's quiz question 3
 *   end           EndCinematic             the Nitora icon, the call to practise and the disclaimer
 *
 * On-screen text is English in every language, by the owner's decision (2026-10-16).
 */
import { ILLUSTRATION, LessonVideo, SYNTHETIC, type Scene, type SceneOptions, type Timing } from './kit';
import * as t from './soldiers/scenes';
import { narration } from '../narration/soldiers';
import script from '../narration/soldiers.json';

type SceneId = keyof (typeof narration)['en'];
export { narration };
export const TIMING: Timing = script.timing;
export const LANGS = Object.keys(narration) as (keyof typeof narration)[];

const scenes = script.scenes as Record<string, { base: number; pre?: number }>;
export const BASES: Record<SceneId, number> = Object.fromEntries(Object.keys(scenes).map((id) => [id, scenes[id].base])) as Record<SceneId, number>;

/** Chapter titles, at the scenes that open them; the script's `pre` gives each card its time. */
const CHAPTERS: Partial<Record<SceneId, string>> = { rules: 'The rules', crows: 'The mirror', variations: 'Reading the quality', trade: 'Trading it', reliability: 'How reliable' };
const opt = (id: SceneId, o: SceneOptions = {}): SceneOptions => ({ bleed: true, pre: scenes[id].pre, chapter: CHAPTERS[id], sweep: !!CHAPTERS[id], ...o });

/** Scenes on the site's synthetic figures, and illustrations, get their tag from the kit; scenes that switch draw their own. */
export const SCENES: Scene<SceneId>[] = [
  ['title', BASES.title, () => <t.SoldiersIntro />, opt('title')],
  ['intro', BASES.intro, () => <t.IntroCinematic />, opt('intro', { tag: SYNTHETIC })],
  ['rules', BASES.rules, () => <t.RulesCinematic />, opt('rules', { tag: SYNTHETIC, fadeOut: false })],
  ['psychology', BASES.psychology, () => <t.PsychologyCinematic />, opt('psychology', { tag: SYNTHETIC, fadeIn: false })],
  ['staircase', BASES.staircase, () => <t.StaircaseCinematic />, opt('staircase', { tag: ILLUSTRATION })],
  ['crows', BASES.crows, () => <t.CrowsCinematic />, opt('crows', { tag: SYNTHETIC })],
  ['variations', BASES.variations, () => <t.VariationsCinematic />, opt('variations', { tag: ILLUSTRATION })],
  ['valid', BASES.valid, () => <t.ValidCinematic />, opt('valid')],
  ['confirmation', BASES.confirmation, () => <t.ConfirmationCinematic />, opt('confirmation')],
  ['trade', BASES.trade, () => <t.TradeCinematic />, opt('trade', { fadeOut: false })],
  ['chase', BASES.chase, () => <t.ChaseCinematic />, opt('chase', { fadeIn: false })],
  ['reliability', BASES.reliability, () => <t.ReliabilityCinematic />, opt('reliability')],
  ['takeaways', BASES.takeaways, () => <t.TakeawaysCinematic />, opt('takeaways')],
  ['quiz', BASES.quiz, () => <t.QuizCinematic />, opt('quiz')],
  ['end', BASES.end, () => <t.EndCinematic />, opt('end')],
];

export function SoldiersCinematic({ lang }: { lang: string }) {
  return <LessonVideo scenes={SCENES} narration={narration} lang={lang} timing={TIMING} look="studio" />;
}
