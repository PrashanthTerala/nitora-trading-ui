/**
 * Writes what a Blender scene needs, from the same sources the Remotion video uses, so a 3D
 * shot and a 2D chart can never disagree about a number or a colour:
 *
 *   build/brand.json           the site's dark-theme colours (tokens.css, resolved by the
 *                              site's own parser), as CSS and as linear RGB for Blender
 *   build/ma-crossovers.json   the pilot's synthetic series and every value computed from it
 *                              by the site's indicator engine (src/ma-crossovers/data.ts)
 *
 * Bundled and run by scripts/scene-data.mjs; not imported by the videos.
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseTokens, resolve } from '@/lib/tokens';
import * as d from '../src/ma-crossovers/data';

const video = process.argv[2];
const site = path.resolve(video, '..');
const out = path.join(video, 'build');
mkdirSync(out, { recursive: true });

/** oklch(L C h [/ a]) to linear sRGB, by Björn Ottosson's OKLab matrices. */
function oklchToLinear(css: string): [number, number, number, number] {
  const m = css.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+))?\s*\)/);
  if (!m) throw new Error(`not an oklch colour: ${css}`);
  const [L, C, h, alpha] = [Number(m[1]), Number(m[2]), (Number(m[3]) * Math.PI) / 180, m[4] === undefined ? 1 : Number(m[4])];
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  return [
    clamp(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s),
    clamp(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s),
    clamp(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s),
    alpha,
  ];
}

const tokens = parseTokens(readFileSync(path.join(site, 'src/styles/tokens.css'), 'utf8'));
const names = ['bg', 'surface-1', 'line', 'ink', 'ink-soft', 'ink-muted', 'accent', 'up', 'down', 'chart-1', 'chart-2', 'chart-3'];
const brand = Object.fromEntries(
  names.map((n) => {
    const css = resolve(tokens, `--color-${n}`, 'dark');
    return [n, { css, linear: oklchToLinear(css) }];
  }),
);
writeFileSync(path.join(out, 'brand.json'), JSON.stringify(brand, null, 2));

const view = (values: number[]) => values.slice(d.VIEW_FROM).map((v) => (Number.isFinite(v) ? Math.round(v * 1e4) / 1e4 : null));
writeFileSync(
  path.join(out, 'ma-crossovers.json'),
  JSON.stringify(
    {
      note: 'Synthetic, for teaching. From src/ma-crossovers/data.ts; indices are relative to the shown window.',
      viewFrom: d.VIEW_FROM,
      closes: view(d.BARS.map((b) => b.c)),
      sma50: view(d.SMA50),
      sma200: view(d.SMA200),
      golden: d.GOLDEN - d.VIEW_FROM,
      death: d.DEATH - d.VIEW_FROM,
      low: d.LOW - d.VIEW_FROM,
      high: d.HIGH - d.VIEW_FROM,
    },
    null,
    1,
  ),
);
console.log(`wrote build/brand.json (${names.length} colours) and build/ma-crossovers.json (${d.BARS.length - d.VIEW_FROM} bars)`);
