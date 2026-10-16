/**
 * "Harami and Harami Cross" (m02-candlestick-patterns/07-harami-and-harami-cross), cinematic
 * (directive V3): the approved v2 script (docs/video-production/scripts/harami-en-v2.md) on
 * CinematicChart, in English and Telugu. Prices, counts, the trade's numbers and Bulkowski's
 * rates come from ./harami/data.ts, which scripts/check.mjs holds the narration to. Scenes:
 *
 *   title        HaramiIntro           GSAP kinetic type over the figure's small candle appearing
 *   intro        IntroCinematic        the runner's tiny stride, then the pattern itself
 *   rules        RulesCinematic        the exact rules, on the figure's two candles with real prices
 *   bullish      BullishCinematic      day one's big candle, day two growing inside it, the stall
 *   trolley      TrolleyCinematic      the trolley, the shove and the grass (illustration)
 *   bearish      BearishCinematic      the mirror, on the bearish figure
 *   cross        CrossCinematic        the harami cross: a doji inside
 *   valid        ValidCinematic        trends first, then every harami on a range, counted
 *   locations    LocationsCinematic    the three strongest places (illustration)
 *   confirm      ConfirmCinematic      the third candle clears the small high, the middle and the open
 *   trade        TradeCinematic        entry, stop and risk on the figure
 *   trap         TrapCinematic         buying the small candle vs waiting for the third
 *   reliability  ReliabilityCinematic  Bulkowski's published rates against a coin flip, credited
 *   takeaways    TakeawaysCinematic    the recap
 *   quiz         QuizCinematic         the lesson's quiz question 4
 *   end          EndCinematic          the Nitora icon, the call to practise and the disclaimer
 *
 * On-screen text is English in every language, by the owner's decision (2026-10-16).
 */
import { ILLUSTRATION, LessonVideo, SYNTHETIC, type Scene, type Timing } from './kit';
import * as h from './harami/scenes';
import { narration } from '../narration/harami';
import script from '../narration/harami.json';

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
  ['title', BASES.title, () => <h.HaramiIntro />, bleed],
  ['intro', BASES.intro, () => <h.IntroCinematic />, bleed],
  ['rules', BASES.rules, () => <h.RulesCinematic />, synthetic],
  ['bullish', BASES.bullish, () => <h.BullishCinematic />, synthetic],
  ['trolley', BASES.trolley, () => <h.TrolleyCinematic />, illustration],
  ['bearish', BASES.bearish, () => <h.BearishCinematic />, synthetic],
  ['cross', BASES.cross, () => <h.CrossCinematic />, synthetic],
  ['valid', BASES.valid, () => <h.ValidCinematic />, synthetic],
  ['locations', BASES.locations, () => <h.LocationsCinematic />, illustration],
  ['confirm', BASES.confirm, () => <h.ConfirmCinematic />, synthetic],
  ['trade', BASES.trade, () => <h.TradeCinematic />, synthetic],
  ['trap', BASES.trap, () => <h.TrapCinematic />, bleed],
  ['reliability', BASES.reliability, () => <h.ReliabilityCinematic />, bleed],
  ['takeaways', BASES.takeaways, () => <h.TakeawaysCinematic />, bleed],
  ['quiz', BASES.quiz, () => <h.QuizCinematic />, bleed],
  ['end', BASES.end, () => <h.EndCinematic />, bleed],
];

export function HaramiCinematic({ lang }: { lang: string }) {
  return <LessonVideo scenes={SCENES} narration={narration} lang={lang} timing={TIMING} />;
}
