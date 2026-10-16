/**
 * Remotion configuration for the lesson videos.
 *
 * The videos reuse the site's own code rather than copies of it: `@/` resolves to ../src as it
 * does in the site (so CandleSvg and the pattern data are the same), and the design tokens are
 * read from ../src/styles/tokens.css when the video is bundled. The public directory is
 * video/public: the site assets the videos use (copied by scripts/sync-public.mjs before every
 * studio or render run) plus generated media such as Blender frames.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Config } from '@remotion/cli/config';

const site = path.resolve(process.cwd(), '..');

Config.setPublicDir(path.join(process.cwd(), 'public'));
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);

Config.overrideWebpackConfig((config) => {
  const tokensCss = readFileSync(path.join(site, 'src/styles/tokens.css'), 'utf8');
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: { ...(config.resolve?.alias ?? {}), '@': path.join(site, 'src') },
    },
    module: {
      ...config.module,
      rules: [
        ...(config.module?.rules ?? []),
        // The tokens file, as a string for src/theme.ts to parse with the site's own parser.
        {
          test: /tokens-source\.ts$/,
          use: [{ loader: path.join(process.cwd(), 'tokens-loader.cjs'), options: { css: tokensCss } }],
        },
      ],
    },
  };
});
