import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import { CURRICULUM, TRACKS } from './src/content/curriculum.ts';
import { buildRobots, buildSitemap, sitePaths, type SitemapVideo } from './src/lib/sitemap.ts';
import { rehypeHeadingIds } from './src/lib/rehypeHeadingIds.ts';
import remarkSlides from './tools/remark-slides.mjs';

/**
 * `virtual:lesson-excerpt`: the home page's "Inside a lesson" showcase, read from a real lesson
 * at build time -- its first figure, its explain-like-I'm-five callout and its first quiz
 * question. The lesson file stays the single source, so the showcase can never drift from what
 * the lesson says, and the home page does not have to load the lesson's MDX to show it.
 */
function lessonExcerpt(): Plugin {
  const id = 'virtual:lesson-excerpt';
  const resolved = `\0${id}`;
  const moduleId = 'm02-candlestick-patterns';
  const lessonId = '06-engulfing';
  const file = fileURLToPath(new URL(`./src/content/modules/${moduleId}/${lessonId}.mdx`, import.meta.url));
  return {
    name: 'nitora:lesson-excerpt',
    resolveId: (source) => (source === id ? resolved : undefined),
    load(loadId) {
      if (loadId !== resolved) return;
      this.addWatchFile(file);
      const src = readFileSync(file, 'utf8');
      const figure = /<PatternFigure name="([^"]+)" caption="([^"]*)"/.exec(src);
      const eli5 = /<Callout type="eli5">\s*([\s\S]*?)\s*<\/Callout>/.exec(src);
      const quiz = /<Quiz questions=\{(\[[\s\S]*?\])\}\s*\/>/.exec(src);
      if (!figure || !eli5 || !quiz) {
        this.error(`lesson-excerpt: ${moduleId}/${lessonId} no longer has a PatternFigure with a caption, an eli5 Callout and a Quiz`);
      }
      // The quiz prop is a JavaScript array literal written by a lesson author in this repo.
      const questions = new Function(`return ${quiz[1]};`)() as { q: string; options: string[]; answer: number; explain?: string }[];
      const excerpt = {
        moduleId,
        lessonId,
        figure: { name: figure[1], caption: figure[2] },
        eli5: eli5[1].replace(/\s+/g, ' '),
        question: questions[0],
        questionCount: questions.length,
      };
      return `export default ${JSON.stringify(excerpt)};`;
    },
  };
}

/**
 * `virtual:content-index`: which lessons show each pattern figure and use each glossary term,
 * read from the MDX at build time. The Trainer links a pattern to the lesson that teaches it,
 * and the Glossary lists every lesson a term appears in, without either loading lesson MDX.
 * Lessons are listed in curriculum order, each once.
 */
function contentIndex(): Plugin {
  const id = 'virtual:content-index';
  const resolved = `\0${id}`;
  return {
    name: 'nitora:content-index',
    resolveId: (source) => (source === id ? resolved : undefined),
    load(loadId) {
      if (loadId !== resolved) return;
      const patterns: Record<string, string[]> = {};
      const terms: Record<string, string[]> = {};
      const add = (map: Record<string, string[]>, key: string, path: string) => {
        const list = (map[key] ??= []);
        if (!list.includes(path)) list.push(path);
      };
      for (const m of CURRICULUM) {
        for (const l of m.lessons) {
          const file = fileURLToPath(new URL(`./src/content/modules/${m.id}/${l.id}.mdx`, import.meta.url));
          this.addWatchFile(file);
          const src = readFileSync(file, 'utf8');
          const path = `/learn/${m.id}/${l.id}`;
          for (const x of src.matchAll(/<PatternFigure\s+name="([^"]+)"/g)) add(patterns, x[1], path);
          for (const x of src.matchAll(/<Term\s+id="([^"]+)"/g)) add(terms, x[1], path);
        }
      }
      return `export default ${JSON.stringify({ patterns, terms })};`;
    },
  };
}

/** The published lesson videos (src/content/videos.json, never the local index), keyed by lesson path, for the sitemap. */
function sitemapVideos(): Record<string, SitemapVideo[]> {
  const index = JSON.parse(readFileSync(fileURLToPath(new URL('./src/content/videos.json', import.meta.url)), 'utf8')) as Record<string, import('./src/lib/video.ts').LessonVideoEntry>;
  const names: Record<string, string> = { te: 'Telugu', hi: 'Hindi', es: 'Spanish' };
  const out: Record<string, SitemapVideo[]> = {};
  for (const [key, entry] of Object.entries(index)) {
    const [moduleId, lessonId] = key.split('/');
    const lesson = CURRICULUM.find((m) => m.id === moduleId)?.lessons.find((l) => l.id === lessonId);
    if (!lesson || !entry.published) continue;
    out[`/learn/${moduleId}/${lessonId}`] = entry.tracks.map((t) => ({
      thumbnail: `${entry.base}/${entry.poster}`,
      title: t.lang === 'en' ? lesson.title : `${lesson.title} (${names[t.lang] ?? t.lang})`,
      description: lesson.summary,
      content: `${entry.base}/${t.video}`,
      duration: t.duration,
      published: entry.published as string,
    }));
  }
  return out;
}

/**
 * robots.txt always; sitemap.xml and an absolute link-preview image when the build knows the
 * site's public address (SITE_URL), because both need absolute URLs. Both come from the curriculum, so a new lesson
 * is in the sitemap without anyone remembering to add it.
 */
function seoFiles(): Plugin {
  return {
    name: 'nitora:seo-files',
    apply: 'build',
    // Open Graph wants an absolute image URL; the page's own address is only known here.
    transformIndexHtml(html) {
      const origin = process.env.SITE_URL?.trim().replace(/\/+$/, '');
      return origin ? html.replace('content="/art/og/default.jpg"', `content="${origin}/art/og/default.jpg"`) : html;
    },
    generateBundle() {
      const origin = process.env.SITE_URL?.trim() || undefined;
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: buildRobots(origin) });
      if (origin) this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemap(origin, sitePaths(CURRICULUM, TRACKS), sitemapVideos()) });
      else this.info('SITE_URL is not set, so no sitemap.xml was written (it needs absolute URLs).');
    },
  };
}

/**
 * `virtual:lesson-videos`: which lessons have a video, and where its files are.
 *
 * A public build reads only src/content/videos.json, which the upload tool writes for sets that
 * are approved and uploaded to the media bucket. The development server, and a build made with
 * VIDEO_LOCAL=1 for a local preview, also read src/content/videos.local.json (gitignored, from
 * video/scripts/video_index.py --local), and serve its files under /media-local/ straight from
 * video/out/publish/, with byte ranges so seeking works. A public build never sees either.
 */
function lessonVideos(): Plugin {
  const id = 'virtual:lesson-videos';
  const resolved = `\0${id}`;
  const published = fileURLToPath(new URL('./src/content/videos.json', import.meta.url));
  const local = fileURLToPath(new URL('./src/content/videos.local.json', import.meta.url));
  const publishDir = fileURLToPath(new URL('./video/out/publish/', import.meta.url));
  const types: Record<string, string> = { mp4: 'video/mp4', vtt: 'text/vtt; charset=utf-8', jpg: 'image/jpeg', json: 'application/json' };
  let useLocal = false;
  const serveLocal = (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, next: () => void) => {
    if (!useLocal || !req.url?.startsWith('/media-local/')) return next();
    const rel = decodeURIComponent(req.url.slice('/media-local/'.length).split('?')[0]);
    const file = resolve(publishDir, rel);
    // Only files under out/publish/, never a path that climbs out of it.
    if (!file.startsWith(resolve(publishDir)) || !existsSync(file) || !statSync(file).isFile()) {
      res.statusCode = 404;
      return res.end();
    }
    const size = statSync(file).size;
    res.setHeader('Content-Type', types[file.split('.').pop() ?? ''] ?? 'application/octet-stream');
    res.setHeader('Accept-Ranges', 'bytes');
    const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '');
    if (range) {
      const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
      res.statusCode = 206;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
      res.setHeader('Content-Length', String(end - start + 1));
      return createReadStream(file, { start, end }).pipe(res);
    }
    res.setHeader('Content-Length', String(size));
    createReadStream(file).pipe(res);
  };
  return {
    name: 'nitora:lesson-videos',
    configResolved(config) {
      useLocal = config.command === 'serve' || process.env.VIDEO_LOCAL === '1';
    },
    resolveId: (source) => (source === id ? resolved : undefined),
    load(loadId) {
      if (loadId !== resolved) return;
      this.addWatchFile(published);
      const index = JSON.parse(readFileSync(published, 'utf8'));
      if (useLocal && existsSync(local)) {
        this.addWatchFile(local);
        // Published entries win: they are the files the public site really uses.
        return `export default ${JSON.stringify({ ...JSON.parse(readFileSync(local, 'utf8')), ...index })};`;
      }
      return `export default ${JSON.stringify(index)};`;
    },
    configureServer(server) {
      server.middlewares.use(serveLocal);
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveLocal);
    },
  };
}

export default defineConfig({
  plugins: [
    { enforce: 'pre', ...mdx({ remarkPlugins: [remarkGfm, remarkSlides], rehypePlugins: [rehypeHeadingIds], providerImportSource: '@mdx-js/react' }) },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwindcss(),
    lessonExcerpt(),
    contentIndex(),
    seoFiles(),
    lessonVideos(),
  ],
  resolve: { alias: { '@': '/src' } },
  // video/ is the video project (its renders, a Chrome profile, gigabytes of media): the site
  // imports nothing from it, and watching it crashes the dev server on a locked render file.
  server: { watch: { ignored: ['**/video/**'] } },
  build: {
    chunkSizeWarningLimit: 1200,
  },
});
