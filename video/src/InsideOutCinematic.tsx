/**
 * "Three Inside and Three Outside" (m02-candlestick-patterns/12-three-inside-outside), in the studio
 * look: the approved v2 script (docs/video-production/scripts/inside-outside-en-v2.md) on
 * CinematicChart, in English and Telugu. The third candles' tests, the trades' numbers, what
 * confirmation costs and Bulkowski's rates come from ./insideout/data.ts, which scripts/check.mjs
 * holds the narration to. Scenes (chapters in brackets):
 *
 *   title        InsideOutIntro          the brand opening, then kinetic type over the figure
 *   intro        IntroCinematic          a harami and an engulfing, each completed; all four
 *   insideup     InsideUpCinematic       [Three inside] the rules, the first open drawn, the story
 *   trolley      TrolleyCinematic        the lesson's trolley (illustration)
 *   insidedown   InsideDownCinematic     the mirror
 *   outsideup    OutsideUpCinematic      [Three outside] the engulfing, the second close drawn
 *   outsidedown  OutsideDownCinematic    the mirror
 *   third        ThirdCinematic          [The third candle] the rules table; the harder test
 *   valid        ValidCinematic          a prior trend; "watch" vs "the watch is over"
 *   trade        TradeCinematic          [Trading them] inside up and outside up, entry, stop, risk
 *   cost         CostCinematic           what confirmation costs
 *   reliability  ReliabilityCinematic    [How reliable] base vs confirmed, Bulkowski, credited
 *   takeaways    TakeawaysCinematic      the recap
 *   quiz         QuizCinematic           the lesson's quiz question 3
 *   end          EndCinematic            the Nitora icon, the call to practise and the disclaimer
 *
 * On-screen text is English in every language, by the owner's decision (2026-10-16).
 */
import { ILLUSTRATION, LessonVideo, SYNTHETIC, type Scene, type SceneOptions, type Timing } from './kit';
import * as t from './insideout/scenes';
import { narration } from '../narration/insideout';
import script from '../narration/insideout.json';

type SceneId = keyof (typeof narration)['en'];
export { narration };
export const TIMING: Timing = script.timing;
export const LANGS = Object.keys(narration) as (keyof typeof narration)[];

const scenes = script.scenes as Record<string, { base: number; pre?: number }>;
export const BASES: Record<SceneId, number> = Object.fromEntries(Object.keys(scenes).map((id) => [id, scenes[id].base])) as Record<SceneId, number>;

/** Chapter titles, at the scenes that open them; the script's `pre` gives each card its time. */
const CHAPTERS: Partial<Record<SceneId, string>> = { insideup: 'Three inside', outsideup: 'Three outside', third: 'The third candle', trade: 'Trading them', reliability: 'How reliable' };
const opt = (id: SceneId, o: SceneOptions = {}): SceneOptions => ({ bleed: true, pre: scenes[id].pre, chapter: CHAPTERS[id], sweep: !!CHAPTERS[id], ...o });

export const SCENES: Scene<SceneId>[] = [
  ['title', BASES.title, () => <t.InsideOutIntro />, opt('title')],
  ['intro', BASES.intro, () => <t.IntroCinematic />, opt('intro', { tag: SYNTHETIC })],
  ['insideup', BASES.insideup, () => <t.InsideUpCinematic />, opt('insideup', { tag: SYNTHETIC })],
  ['trolley', BASES.trolley, () => <t.TrolleyCinematic />, opt('trolley', { tag: ILLUSTRATION })],
  ['insidedown', BASES.insidedown, () => <t.InsideDownCinematic />, opt('insidedown', { tag: SYNTHETIC })],
  ['outsideup', BASES.outsideup, () => <t.OutsideUpCinematic />, opt('outsideup', { tag: SYNTHETIC })],
  ['outsidedown', BASES.outsidedown, () => <t.OutsideDownCinematic />, opt('outsidedown', { tag: SYNTHETIC })],
  ['third', BASES.third, () => <t.ThirdCinematic />, opt('third')],
  ['valid', BASES.valid, () => <t.ValidCinematic />, opt('valid', { tag: SYNTHETIC })],
  ['trade', BASES.trade, () => <t.TradeCinematic />, opt('trade', { tag: SYNTHETIC })],
  ['cost', BASES.cost, () => <t.CostCinematic />, opt('cost', { tag: SYNTHETIC })],
  ['reliability', BASES.reliability, () => <t.ReliabilityCinematic />, opt('reliability')],
  ['takeaways', BASES.takeaways, () => <t.TakeawaysCinematic />, opt('takeaways')],
  ['quiz', BASES.quiz, () => <t.QuizCinematic />, opt('quiz')],
  ['end', BASES.end, () => <t.EndCinematic />, opt('end')],
];

export function InsideOutCinematic({ lang }: { lang: string }) {
  return <LessonVideo scenes={SCENES} narration={narration} lang={lang} timing={TIMING} look="studio" />;
}
