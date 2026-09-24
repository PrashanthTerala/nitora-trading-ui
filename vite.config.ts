import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import { CURRICULUM, TRACKS } from './src/content/curriculum.ts';
import { buildRobots, buildSitemap, sitePaths } from './src/lib/sitemap.ts';
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
      if (origin) this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemap(origin, sitePaths(CURRICULUM, TRACKS)) });
      else this.info('SITE_URL is not set, so no sitemap.xml was written (it needs absolute URLs).');
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
  ],
  resolve: { alias: { '@': '/src' } },
  build: {
    chunkSizeWarningLimit: 1200,
  },
});
