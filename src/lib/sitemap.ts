/**
 * sitemap.xml and robots.txt, built from the curriculum at build time (see seoFiles() in
 * vite.config.ts). Pure functions with no browser or Vite imports, so the build and the tests
 * can both call them.
 */
// Relative, not '@/': vite.config.ts imports this file, and the config has no path alias.
import type { ModuleMeta, Track } from '../content/curriculum.ts';

/** Every public page: the site's rooms, each track, module and lesson. Dev-only pages are left out. */
export function sitePaths(curriculum: ModuleMeta[], tracks: Track[]): string[] {
  const rooms = ['/', '/learn', '/simulator', '/trainer', '/journal', '/glossary', '/guide'];
  return [
    ...rooms,
    ...tracks.map((t) => `/learn/t/${t.id}`),
    ...curriculum.flatMap((m) => [`/learn/${m.id}`, ...m.lessons.map((l) => `/learn/${m.id}/${l.id}`)]),
  ];
}

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** A page's video, for the sitemap's video extension (https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps). */
export interface SitemapVideo {
  thumbnail: string;
  title: string;
  description: string;
  content: string;
  /** Seconds. */
  duration: number;
  /** YYYY-MM-DD. */
  published: string;
}

export function buildSitemap(origin: string, paths: string[], videos: Record<string, SitemapVideo[]> = {}): string {
  const base = origin.replace(/\/+$/, '');
  const video = (v: SitemapVideo) =>
    `\n    <video:video><video:thumbnail_loc>${escapeXml(v.thumbnail)}</video:thumbnail_loc><video:title>${escapeXml(v.title)}</video:title><video:description>${escapeXml(v.description)}</video:description><video:content_loc>${escapeXml(v.content)}</video:content_loc><video:duration>${Math.round(v.duration)}</video:duration><video:publication_date>${escapeXml(v.published)}</video:publication_date><video:family_friendly>yes</video:family_friendly></video:video>`;
  const urls = paths.map((p) => `  <url><loc>${escapeXml(base + p)}</loc>${(videos[p] ?? []).map(video).join('')}${videos[p]?.length ? '\n  ' : ''}</url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${urls}\n</urlset>\n`;
}

/** Everything may be crawled except the development pages; the sitemap is named when known. */
export function buildRobots(origin?: string): string {
  const lines = ['User-agent: *', 'Allow: /', 'Disallow: /__'];
  if (origin) lines.push('', `Sitemap: ${origin.replace(/\/+$/, '')}/sitemap.xml`);
  return `${lines.join('\n')}\n`;
}
