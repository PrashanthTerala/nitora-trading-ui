/**
 * "Moving Average Crossovers" (m05-indicators/03-ma-crossovers), cinematic version (directive V3):
 * all 14 scenes of the v2 script and narration, rebuilt on CinematicChart (candles, a camera,
 * no overlapping layers, a spotlight on the point under discussion). Scenes and technology:
 *
 *   title       CinematicIntro       GSAP kinetic type (@remotion/gsap) over the chart, defocused
 *   average     Average              the worked example (6+8+7+9+10 = 40, ÷5 = 8), kept from v2
 *   race        RaceCinematic        runners overtaking as the real 50/200 SMAs cross below
 *   buckets     Buckets              the bucket picture, kept from v2
 *   signchange  SignChangeCinematic  the lesson's numbers on a number line crossing zero
 *   golden      GoldenCinematic      the camera finds each cross as it is named
 *   lag         LagCinematic         the same camera, measuring the waiting and the price paid
 *   tradeoff    TradeOffCinematic    9/21 EMA vs 50/200 SMA on the same candles, crosses counted
 *   uses        UsesCinematic        entry and exit, bias filter, trend health on one chart
 *   whipsaw     WhipsawCinematic     every buy-the-bull-cross round trip on a range, measured
 *   structure   StructureCinematic   breakout and retest, then the veto on a range
 *   takeaways   TakeawaysCinematic   the recap, each point lit as it is said
 *   quiz        QuizCinematic        the lesson's question, then the answer on the chart
 *   end         EndCinematic         the call to practise and the disclaimer
 *
 * On-screen text is English in every language, by the owner's decision (2026-10-16); the
 * narration and captions are localized. Remotion owns the timeline.
 */
import { LessonVideo, type Scene, type Timing } from './kit';
import { Average, Buckets } from './ma-crossovers/explainers';
import { CinematicIntro, GoldenCinematic, LagCinematic } from './cinematic/scenes';
import { EndCinematic, QuizCinematic, RaceCinematic, SignChangeCinematic, StructureCinematic, TakeawaysCinematic, TradeOffCinematic, UsesCinematic, WhipsawCinematic } from './cinematic/scenes2';
import { narration } from '../narration/ma-crossovers';
import script from '../narration/ma-crossovers.json';

type SceneId = keyof (typeof narration)['en'];
export const TIMING: Timing = script.timing;
export const LANGS = Object.keys(narration) as (keyof typeof narration)[];

/** Scene bases (seconds): the script's, except the intro, which is given room for its typography. */
const scenes = script.scenes as Record<string, { base: number }>;
export const BASES: Record<SceneId, number> = Object.fromEntries(Object.keys(scenes).map((id) => [id, id === 'title' ? 7 : scenes[id].base])) as Record<SceneId, number>;

export const SCENES: Scene<SceneId>[] = [
  ['title', BASES.title, () => <CinematicIntro />, { bleed: true }],
  ['average', BASES.average, () => <Average />],
  ['race', BASES.race, () => <RaceCinematic />, { bleed: true }],
  ['buckets', BASES.buckets, () => <Buckets />],
  ['signchange', BASES.signchange, () => <SignChangeCinematic />, { bleed: true }],
  ['golden', BASES.golden, () => <GoldenCinematic />, { bleed: true, fadeOut: false }],
  ['lag', BASES.lag, () => <LagCinematic />, { bleed: true, fadeIn: false }],
  ['tradeoff', BASES.tradeoff, () => <TradeOffCinematic />, { bleed: true }],
  ['uses', BASES.uses, () => <UsesCinematic />, { bleed: true }],
  ['whipsaw', BASES.whipsaw, () => <WhipsawCinematic />, { bleed: true }],
  ['structure', BASES.structure, () => <StructureCinematic />, { bleed: true }],
  ['takeaways', BASES.takeaways, () => <TakeawaysCinematic />, { bleed: true }],
  ['quiz', BASES.quiz, () => <QuizCinematic />, { bleed: true }],
  ['end', BASES.end, () => <EndCinematic />, { bleed: true }],
];

export function MaCrossoversCinematic({ lang }: { lang: string }) {
  return <LessonVideo scenes={SCENES} narration={narration} lang={lang} timing={TIMING} />;
}
