/**
 * Renders the site's artwork from its 3D scenes, so production never needs WebGL to show it.
 *
 *   npm run dev                     (in another terminal; or set BASE_URL)
 *   node tools/render-art.mjs        everything
 *   node tools/render-art.mjs --only hero,m02-candlestick-patterns
 *
 * Visits /__art/<id> in a locally installed Edge or Chrome, waits for the scene to draw, and
 * asks the page for the finished image (window.__art.capture), which it composes on a canvas
 * and encodes in the browser -- so no image library is needed here. Writes:
 *
 *   public/art/hero-{dark,light}.webp                 home page poster, 1120x960
 *   public/art/modules/<id>-{dark,light}.webp         module cover, 1200x800
 *   public/art/modules/<id>-{dark,light}-600.webp     the same at 600x400, for cards
 *   public/art/og/<id>.jpg, og/default.jpg            1200x630 link previews (dark theme)
 *   public/art/illustrations/<id>-{dark,light}.webp   empty states and the 404, 960x720 (and -480)
 *
 * The output is committed; run this again only when a scene changes.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const OUT = join(root, 'public/art');
const onlyArg = process.argv.indexOf('--only');
const only = onlyArg > -1 ? new Set(process.argv[onlyArg + 1].split(',')) : null;

const MODULES = [
  'm00-what-is-a-market',
  'm01-reading-price',
  'm02-candlestick-patterns',
  'm03-market-structure',
  'm04-chart-patterns',
  'm05-indicators',
  'm06-orders-and-execution',
  'm07-risk-management',
  'm08-trading-psychology',
  'm09-strategies',
  'm10-fundamentals-and-macro',
  'm11-derivatives-and-other-markets',
  'm12-becoming-consistent',
];

/** Scenes drawn on the page background, for empty states and the 404. */
const ILLUSTRATIONS = ['broken-candle', 'empty-journal'];

async function launch() {
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel });
    } catch {
      // try the next installed browser
    }
  }
  throw new Error('No Edge or Chrome found for playwright-core to drive.');
}

const save = (file, dataUrl) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(`  ${file.replace(root + '\\', '').replace(root + '/', '')}`);
};

async function render(browser, id, { theme, frame, width, height, outputs }) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${BASE}/__art/${id}?theme=${theme}&frame=${frame}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__art?.ready === true, null, { timeout: 30000 });
  await page.waitForTimeout(800); // let transmission and the environment settle
  for (const [file, w, type, quality] of outputs) save(file, await page.evaluate(([w, type, q]) => window.__art.capture(w, type, q), [w, type, quality]));
  if (errors.length) throw new Error(`${id} (${theme}): ${errors.join('; ')}`);
  await page.close();
}

const browser = await launch();
try {
  for (const theme of ['dark', 'light']) {
    if (!only || only.has('hero')) {
      await render(browser, 'hero', { theme, frame: 'hero', width: 1120, height: 960, outputs: [[join(OUT, `hero-${theme}.webp`), 1120, 'image/webp', 0.9]] });
    }
    for (const id of MODULES) {
      if (only && !only.has(id)) continue;
      await render(browser, id, {
        theme,
        frame: 'cover',
        width: 1200,
        height: 800,
        outputs: [
          [join(OUT, 'modules', `${id}-${theme}.webp`), 1200, 'image/webp', 0.86],
          [join(OUT, 'modules', `${id}-${theme}-600.webp`), 600, 'image/webp', 0.86],
        ],
      });
    }
    for (const id of ILLUSTRATIONS) {
      if (only && !only.has(id)) continue;
      await render(browser, id, {
        theme,
        frame: 'hero',
        width: 960,
        height: 720,
        outputs: [
          [join(OUT, 'illustrations', `${id}-${theme}.webp`), 960, 'image/webp', 0.86],
          [join(OUT, 'illustrations', `${id}-${theme}-480.webp`), 480, 'image/webp', 0.86],
        ],
      });
    }
  }
  // Link previews: dark only, as JPEG, which every service that reads Open Graph accepts.
  for (const id of ['hero', ...MODULES]) {
    if (only && !only.has(id)) continue;
    await render(browser, id, { theme: 'dark', frame: 'og', width: 1200, height: 630, outputs: [[join(OUT, 'og', `${id === 'hero' ? 'default' : id}.jpg`), 1200, 'image/jpeg', 0.88]] });
  }
} finally {
  await browser.close();
}
