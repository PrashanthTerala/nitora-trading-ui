/**
 * Page screenshots for design review, and pixel diffs between two sets of them.
 *
 *   node tools/screenshots.mjs capture <dir>               lossless PNGs, full page (for diffing)
 *   node tools/screenshots.mjs docs <dir>                  WebP of the first screen, for docs/screenshots
 *   node tools/screenshots.mjs diff <beforeDir> <afterDir> [<diffOutDir>]
 *
 * Every page is taken at 390 px and 1440 px wide, in the dark and the light theme, from a
 * fresh browser profile, so no stored progress or simulator state leaks between runs.
 * Needs the dev server running (npm run dev) -- or set BASE_URL.
 *
 * Drives a locally installed Edge or Chrome through playwright-core, so no browser
 * download is needed. The diff runs in the browser's own canvas, so no image library is.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';

export const PAGES = [
  ['home', '/'],
  ['learn', '/learn'],
  ['module', '/learn/m02-candlestick-patterns'],
  ['track', '/learn/t/trading-foundations'],
  ['lesson', '/learn/m02-candlestick-patterns/06-engulfing'],
  ['deck-title', '/learn/m02-candlestick-patterns/06-engulfing?slide=1'],
  ['deck-figure', '/learn/m02-candlestick-patterns/06-engulfing?slide=5'],
  ['deck-summary', '/learn/m02-candlestick-patterns/06-engulfing?slide=20'],
  ['deck-question', '/learn/m02-candlestick-patterns/06-engulfing?slide=21'],
  ['simulator', '/simulator'],
  ['trainer', '/trainer'],
  ['journal', '/journal'],
  ['glossary', '/glossary'],
  ['guide', '/guide'],
  ['not-found', '/this-page-does-not-exist'],
  ['tokens', '/__tokens'],
  ['mdx', '/__mdx'],
];
const WIDTHS = [
  [390, 844],
  [1440, 900],
];
const THEMES = ['dark', 'light'];
// Tall pages are cut here: past it a full-page capture stops being reviewable anyway, and
// Chromium starts refusing to allocate the surface.
const MAX_HEIGHT = 9000;

async function launch() {
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel });
    } catch {
      // try the next installed browser
    }
  }
  throw new Error('Neither Edge nor Chrome could be launched.');
}

async function shoot(browser, path, width, height, theme) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  // The theme is read from storage before first paint, so it has to be in place before load.
  await context.addInitScript((t) => localStorage.setItem('nitora-theme', t), theme);
  const page = await context.newPage();
  try {
    const res = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500); // charts, lazy chunks, idle-time work and count-ups settle
    const scroll = await page.evaluate(() => document.documentElement.scrollHeight);
    return { status: res?.status() ?? 0, page, context, fullHeight: Math.min(scroll, MAX_HEIGHT) };
  } catch (e) {
    await context.close();
    throw e;
  }
}

async function capture(dir, mode) {
  mkdirSync(dir, { recursive: true });
  const browser = await launch();
  let n = 0;
  try {
    for (const [name, path] of PAGES) {
      for (const [w, h] of WIDTHS) {
        for (const theme of THEMES) {
          let shot;
          try {
            shot = await shoot(browser, path, w, h, theme);
          } catch (e) {
            console.log(`  skip ${name} ${w} ${theme}: ${e.message.split('\n')[0]}`);
            continue;
          }
          const { page, context, fullHeight } = shot;
          const base = `${name}-${w}-${theme}`;
          if (mode === 'docs') {
            const png = await page.screenshot({ animations: 'disabled' });
            // WebP keeps the committed screenshots small. Encoded by the browser's canvas.
            const webp = await page.evaluate(async (b64) => {
              const img = new Image();
              img.src = 'data:image/png;base64,' + b64;
              await img.decode();
              const c = document.createElement('canvas');
              c.width = img.width;
              c.height = img.height;
              c.getContext('2d').drawImage(img, 0, 0);
              return c.toDataURL('image/webp', 0.82).split(',')[1];
            }, png.toString('base64'));
            writeFileSync(join(dir, base + '.webp'), Buffer.from(webp, 'base64'));
          } else {
            const png = await page.screenshot({
              animations: 'disabled',
              fullPage: true,
              clip: { x: 0, y: 0, width: w, height: fullHeight },
            });
            writeFileSync(join(dir, base + '.png'), png);
          }
          n++;
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
  console.log(`${n} screenshot(s) written to ${dir}`);
}

async function diff(beforeDir, afterDir, outDir) {
  if (outDir) mkdirSync(outDir, { recursive: true });
  const browser = await launch();
  const page = await browser.newPage();
  const rows = [];
  try {
    for (const file of readdirSync(beforeDir).filter((f) => f.endsWith('.png')).sort()) {
      const after = join(afterDir, file);
      if (!existsSync(after)) {
        rows.push([file, 'missing after']);
        continue;
      }
      const result = await page.evaluate(
        async ([a, b, wantImage]) => {
          const load = async (b64) => {
            const img = new Image();
            img.src = 'data:image/png;base64,' + b64;
            await img.decode();
            const c = document.createElement('canvas');
            c.width = img.width;
            c.height = img.height;
            const g = c.getContext('2d', { willReadFrequently: true });
            g.drawImage(img, 0, 0);
            return { w: img.width, h: img.height, data: g.getImageData(0, 0, img.width, img.height).data, c };
          };
          const A = await load(a);
          const B = await load(b);
          const w = Math.min(A.w, B.w);
          const h = Math.min(A.h, B.h);
          // A pixel "changed" when any channel moved by more than 24 of 255: enough to ignore
          // antialiasing jitter and to count a real colour shift.
          let changed = 0;
          let sum = 0;
          const out = wantImage ? new ImageData(w, h) : null;
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const ia = (y * A.w + x) * 4;
              const ib = (y * B.w + x) * 4;
              const d = Math.max(
                Math.abs(A.data[ia] - B.data[ib]),
                Math.abs(A.data[ia + 1] - B.data[ib + 1]),
                Math.abs(A.data[ia + 2] - B.data[ib + 2]),
              );
              sum += d;
              if (d > 24) changed++;
              if (out) {
                const io = (y * w + x) * 4;
                const grey = (B.data[ib] + B.data[ib + 1] + B.data[ib + 2]) / 3;
                out.data[io] = d > 24 ? 255 : grey * 0.35;
                out.data[io + 1] = d > 24 ? 40 : grey * 0.35;
                out.data[io + 2] = d > 24 ? 90 : grey * 0.35;
                out.data[io + 3] = 255;
              }
            }
          }
          let image = null;
          if (out) {
            const c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            c.getContext('2d').putImageData(out, 0, 0);
            image = c.toDataURL('image/png').split(',')[1];
          }
          return { changedPct: (changed / (w * h)) * 100, meanDelta: sum / (w * h), sizeA: [A.w, A.h], sizeB: [B.w, B.h], image };
        },
        [readFileSync(join(beforeDir, file)).toString('base64'), readFileSync(after).toString('base64'), Boolean(outDir)],
      );
      if (outDir && result.image) writeFileSync(join(outDir, file), Buffer.from(result.image, 'base64'));
      const size = result.sizeA.join('x') === result.sizeB.join('x') ? '' : ` size ${result.sizeA.join('x')} -> ${result.sizeB.join('x')}`;
      rows.push([file, `${result.changedPct.toFixed(2).padStart(6)}% px changed, mean delta ${result.meanDelta.toFixed(2)}${size}`]);
    }
  } finally {
    await browser.close();
  }
  for (const [f, r] of rows) console.log(`  ${f.padEnd(34)} ${r}`);
}

const [cmd, a, b, c] = process.argv.slice(2);
if (cmd === 'capture' && a) await capture(a, 'png');
else if (cmd === 'docs' && a) await capture(a, 'docs');
else if (cmd === 'diff' && a && b) await diff(a, b, c);
else {
  console.log('usage: screenshots.mjs capture <dir> | docs <dir> | diff <before> <after> [<diffOut>]');
  process.exit(1);
}
