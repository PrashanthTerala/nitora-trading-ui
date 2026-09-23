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
 * robots.txt always; sitemap.xml when the build knows the site's public address (SITE_URL),
 * because a sitemap may only list absolute URLs. Both come from the curriculum, so a new lesson
 * is in the sitemap without anyone remembering to add it.
 */
function seoFiles(): Plugin {
  return {
    name: 'nitora:seo-files',
    apply: 'build',
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
    seoFiles(),
  ],
  resolve: { alias: { '@': '/src' } },
  build: {
    chunkSizeWarningLimit: 1200,
  },
});
