/**
 * "The Abandoned Baby and Doji Stars" (m02-candlestick-patterns/13-abandoned-baby-and-stars), in the
 * studio look: the approved v2 script (docs/video-production/scripts/gapped-stars-en-v2.md) on
 * CinematicChart, in English and Telugu. The doji's gaps, the trade's numbers and Bulkowski's rates,
 * ranks and counts come from ./gapped/data.ts, which scripts/check.mjs holds the narration to.
 * Scenes (chapters in brackets):
 *
 *   title        GappedIntro           the brand opening, then kinetic type over the figure
 *   intro        IntroCinematic        a gap; the three patterns; the count (293 in 4.7 million)
 *   dojistar     DojiStarCinematic     [Doji stars] the rules; stronger in theory; the mirror
 *   ice          IceCinematic          the lesson's car on ice (illustration)
 *   baby         BabyCinematic         [The abandoned baby] the two gaps, shaded; the bearish mirror
 *   psychology   PsychologyCinematic   panic, nothing, a jump back; the trapped sellers
 *   valid        ValidCinematic        [Where they work] overnight gaps vs a 24-hour chart
 *   trade        TradeCinematic        [Trading them] entry at the third close, stop under the doji
 *   gapfill      GapFillCinematic      a gap that filled (illustration)
 *   reliability  ReliabilityCinematic  [How reliable] Bulkowski's rates beside the plain stars
 *   takeaways    TakeawaysCinematic    the recap
 *   quiz         QuizCinematic         the lesson's quiz question 4
 *   end          EndCinematic          the Nitora icon, the call to practise and the disclaimer
 *
 * On-screen text is English in every language, by the owner's decision (2026-10-16).
 */
import { ILLUSTRATION, LessonVideo, SYNTHETIC, type Scene, type SceneOptions, type Timing } from './kit';
import * as t from './gapped/scenes';
import { narration } from '../narration/gapped';
import script from '../narration/gapped.json';

type SceneId = keyof (typeof narration)['en'];
export { narration };
export const TIMING: Timing = script.timing;
export const LANGS = Object.keys(narration) as (keyof typeof narration)[];

const scenes = script.scenes as Record<string, { base: number; pre?: number }>;
export const BASES: Record<SceneId, number> = Object.fromEntries(Object.keys(scenes).map((id) => [id, scenes[id].base])) as Record<SceneId, number>;

/** Chapter titles, at the scenes that open them; the script's `pre` gives each card its time. */
const CHAPTERS: Partial<Record<SceneId, string>> = { dojistar: 'Doji stars', baby: 'The abandoned baby', valid: 'Where they work', trade: 'Trading them', reliability: 'How reliable' };
const opt = (id: SceneId, o: SceneOptions = {}): SceneOptions => ({ bleed: true, pre: scenes[id].pre, chapter: CHAPTERS[id], sweep: !!CHAPTERS[id], ...o });

/** Scenes that switch between synthetic data and illustration draw their own tags. */
export const SCENES: Scene<SceneId>[] = [
  ['title', BASES.title, () => <t.GappedIntro />, opt('title')],
  ['intro', BASES.intro, () => <t.IntroCinematic />, opt('intro')],
  ['dojistar', BASES.dojistar, () => <t.DojiStarCinematic />, opt('dojistar')],
  ['ice', BASES.ice, () => <t.IceCinematic />, opt('ice', { tag: ILLUSTRATION })],
  ['baby', BASES.baby, () => <t.BabyCinematic />, opt('baby', { tag: SYNTHETIC })],
  ['psychology', BASES.psychology, () => <t.PsychologyCinematic />, opt('psychology', { tag: SYNTHETIC })],
  ['valid', BASES.valid, () => <t.ValidCinematic />, opt('valid')],
  ['trade', BASES.trade, () => <t.TradeCinematic />, opt('trade', { tag: SYNTHETIC })],
  ['gapfill', BASES.gapfill, () => <t.GapFillCinematic />, opt('gapfill', { tag: ILLUSTRATION })],
  ['reliability', BASES.reliability, () => <t.ReliabilityCinematic />, opt('reliability')],
  ['takeaways', BASES.takeaways, () => <t.TakeawaysCinematic />, opt('takeaways')],
  ['quiz', BASES.quiz, () => <t.QuizCinematic />, opt('quiz')],
  ['end', BASES.end, () => <t.EndCinematic />, opt('end')],
];

export function GappedCinematic({ lang }: { lang: string }) {
  return <LessonVideo scenes={SCENES} narration={narration} lang={lang} timing={TIMING} look="studio" />;
}
