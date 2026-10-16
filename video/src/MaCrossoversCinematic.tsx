/**
 * Cinematic upgrade, proof of concept (directive V3): the first four scenes of the
 * "Moving Average Crossovers" lesson (m05-indicators/03-ma-crossovers), with the same
 * narration, timing marks and captions as the v2 video, rebuilt with:
 *
 *   title    CinematicIntro   GSAP kinetic type (@remotion/gsap) over the lesson's chart, defocused
 *   average  Average          the v2 worked example (6+8+7+9+10 = 40, ÷5 = 8)
 *   golden   GoldenCinematic  a camera that finds each cross as the narration names it
 *   lag      LagCinematic     the same camera, no cut, measuring the waiting and the price paid
 *
 * On-screen text is English in every language, by the owner's decision (2026-10-16); the
 * narration and captions are localized. (Localized labels exist in cinematic/strings.ts and can
 * be switched on per video with LessonVideo's textLang, but are not used.) Remotion owns the timeline.
 */
import { LessonVideo, type Scene, type Timing } from './kit';
import { Average } from './ma-crossovers/explainers';
import { CinematicIntro, GoldenCinematic, LagCinematic } from './cinematic/scenes';
import { narration } from '../narration/ma-crossovers';
import script from '../narration/ma-crossovers.json';

type SceneId = keyof (typeof narration)['en'];
export const TIMING: Timing = script.timing;
export const LANGS = Object.keys(narration) as (keyof typeof narration)[];

/** Scene bases (seconds) for this cut; the intro is given room for its typography. */
export const BASES: Partial<Record<SceneId, number>> = { title: 7, average: 30, golden: 18, lag: 26 };

export const SCENES: Scene<SceneId>[] = [
  ['title', BASES.title!, () => <CinematicIntro />, { bleed: true }],
  ['average', BASES.average!, () => <Average />],
  ['golden', BASES.golden!, () => <GoldenCinematic />, { bleed: true, fadeOut: false }],
  ['lag', BASES.lag!, () => <LagCinematic />, { bleed: true, fadeIn: false }],
];

export function MaCrossoversCinematic({ lang }: { lang: string }) {
  return <LessonVideo scenes={SCENES} narration={narration} lang={lang} timing={TIMING} />;
}
