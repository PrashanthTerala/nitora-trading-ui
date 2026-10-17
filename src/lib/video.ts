/**
 * Lesson videos: the shape of the index (virtual:lesson-videos, see vite.config.ts) and the pure
 * helpers the player uses. Pure, so tools/test-video.mjs can check them without a browser.
 */

/** One language of a lesson video. Files are relative to the set's `base`. */
export interface VideoTrack {
  lang: string;
  video: string;
  captions: string;
  /** Seconds. */
  duration: number;
  /** Each scene's start, in seconds, in this language. Languages run to different lengths. */
  scenes: number[];
  /** The voice credit, shown under the player. */
  credit: string;
}

export interface LessonVideoEntry {
  /** URL prefix of the set's files: the media bucket in production, /media-local/ in development. */
  base: string;
  poster: string;
  tracks: VideoTrack[];
  /** When the set was first published (YYYY-MM-DD). Public entries only; search engines need it. */
  published?: string;
}

/** How each language is offered: its own name, in its own script. */
export const LANGUAGE_NAMES: Record<string, { native: string; english: string }> = {
  en: { native: 'English', english: 'English' },
  te: { native: 'తెలుగు', english: 'Telugu' },
  hi: { native: 'हिन्दी', english: 'Hindi' },
  es: { native: 'Español', english: 'Spanish' },
};

export const fileUrl = (entry: LessonVideoEntry, file: string) => `${entry.base}/${file}`;

/**
 * The same point in the lesson, in another language: the same scene, the same share of the way
 * through it. Second 200 of the English is not second 200 of the Telugu, which runs about a
 * third longer.
 */
export function mapTime(from: VideoTrack, to: VideoTrack, t: number): number {
  const a = from.scenes;
  const b = to.scenes;
  if (!a.length || a.length !== b.length) return Math.min(to.duration, (t / from.duration) * to.duration);
  let k = 0;
  while (k + 1 < a.length && a[k + 1] <= t) k++;
  const aEnd = k + 1 < a.length ? a[k + 1] : from.duration;
  const bEnd = k + 1 < b.length ? b[k + 1] : to.duration;
  const share = aEnd > a[k] ? Math.min(1, Math.max(0, (t - a[k]) / (aEnd - a[k]))) : 0;
  return Math.max(0, Math.min(to.duration, b[k] + share * (bEnd - b[k])));
}

export interface Cue {
  start: number;
  end: number;
  text: string;
}

const stamp = (s: string) => {
  const parts = s.trim().split(':').map(Number);
  return parts.reduce((acc, p) => acc * 60 + p, 0);
};

/** The cues of a WebVTT file (timings and text; settings and styling ignored). */
export function parseVtt(text: string): Cue[] {
  const cues: Cue[] = [];
  for (const block of text.replace(/\r/g, '').split(/\n{2,}/)) {
    const lines = block.split('\n');
    const at = lines.findIndex((l) => l.includes('-->'));
    if (at < 0) continue;
    const [a, b] = lines[at].split('-->');
    const body = lines.slice(at + 1).join(' ').replace(/<[^>]+>/g, '').trim();
    if (body) cues.push({ start: stamp(a), end: stamp(b.trim().split(/\s+/)[0]), text: body });
  }
  return cues;
}

/** 463.9 -> "7:43" */
export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Seconds as an ISO 8601 duration, as schema.org wants it: 456.6 -> "PT7M37S". */
export function isoDuration(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s % 60 || (!h && !m) ? `${s % 60}S` : ''}`;
}

/**
 * schema.org VideoObjects for a lesson's published video, one per language, for the lesson
 * page's structured data. None for a set with no publication date (a local preview).
 */
export function videoObjects(entry: LessonVideoEntry, lesson: { name: string; description: string }) {
  if (!entry.published) return [];
  return entry.tracks.map((t) => ({
    '@type': 'VideoObject',
    name: t.lang === 'en' ? lesson.name : `${lesson.name} (${LANGUAGE_NAMES[t.lang]?.english ?? t.lang})`,
    description: lesson.description,
    thumbnailUrl: [fileUrl(entry, entry.poster)],
    uploadDate: entry.published,
    duration: isoDuration(t.duration),
    contentUrl: fileUrl(entry, t.video),
    encodingFormat: 'video/mp4',
    inLanguage: t.lang,
    isFamilyFriendly: true,
  }));
}

/** Where to pick up: a saved position worth resuming (past the opening, short of the end), or 0. */
export function resumePoint(saved: number | undefined, duration: number): number {
  return saved !== undefined && saved > 15 && saved < duration - 20 ? saved : 0;
}
