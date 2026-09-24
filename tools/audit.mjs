/**
 * The release checks that need a real browser. Run against a production build:
 *
 *   npm run build && npx vite preview --port 4173      (in another terminal)
 *   node tools/audit.mjs a11y          axe-core on every route and state, both themes, 390 and 1440 px
 *   node tools/audit.mjs responsive    no horizontal page scroll at 360, 768, 1024, 1440 and 1920 px
 *   node tools/audit.mjs keyboard      Tab through every route: each stop visible, with a focus indicator
 *   node tools/audit.mjs motion        with reduced motion: nothing moves but opacity, and no 3D mounts
 *   node tools/audit.mjs lighthouse    desktop Lighthouse on Home, Learn, a lesson and the Simulator
 *   node tools/audit.mjs all
 *
 * Each pass prints what it found and exits 1 if anything is over its bar, so it can gate a
 * release. BASE_URL overrides the address (default http://localhost:4173).
 *
 * Drives a locally installed Edge or Chrome through playwright-core; axe-core is injected into
 * the page from node_modules, and Lighthouse launches its own Chrome, so nothing is downloaded.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const LESSON = '/learn/m02-candlestick-patterns/06-engulfing';
/** Every route a visitor can reach, plus the states that put new UI on screen. */
const ROUTES = [
  ['home', '/'],
  ['learn', '/learn'],
  ['track', '/learn/t/trading-foundations'],
  ['module', '/learn/m02-candlestick-patterns'],
  ['lesson', LESSON],
  ['lesson-calculators', '/learn/m07-risk-management/02-the-one-percent-rule'],
  ['deck', `${LESSON}?slide=5`],
  ['deck-question', `${LESSON}?slide=21`],
  ['simulator', '/simulator'],
  ['trainer', '/trainer'],
  ['journal', '/journal'],
  ['glossary', '/glossary'],
  ['glossary-panel', '/glossary#spread'],
  ['guide', '/guide'],
  ['not-found', '/this-page-does-not-exist'],
];

/** States reached by doing something on a route, each an [id, path, action] triple. */
const STATES = [
  ['palette', '/', async (p) => (await p.keyboard.press('Control+KeyK'), p.waitForSelector('[role="dialog"]'))],
  ['trainer-round', '/trainer', async (p) => (await p.getByRole('button', { name: /Name the pattern/ }).click(), await p.keyboard.press('1'))],
  ['trainer-next', '/trainer', async (p) => (await p.getByRole('button', { name: /Next candles/ }).click(), await p.keyboard.press('ArrowUp'))],
  ['sim-keys', '/simulator', async (p) => p.keyboard.press('Shift+Slash')],
  ['journal-trades', '/simulator', tradeThenJournal],
];

/** Place and close a few simulator trades, then open the journal with one trade expanded. */
async function tradeThenJournal(p) {
  // Trade at desktop width, where the ticket is on screen, then look at the journal at the
  // width under test.
  const size = p.viewportSize();
  await p.setViewportSize({ width: 1440, height: 900 });
  for (let i = 0; i < 3; i++) {
    await p.getByRole('radio', { name: i === 1 ? 'Sell' : 'Buy' }).first().click();
    await p.getByRole('button', { name: '1% risk' }).first().click();
    await p.getByRole('button', { name: /^(Buy|Sell) \d+/ }).first().click();
    for (let k = 0; k < 5; k++) await p.keyboard.press('ArrowRight');
    const close = p.getByRole('button', { name: 'Close', exact: true });
    if (await close.count()) await close.first().click();
  }
  await p.setViewportSize(size);
  await p.getByRole('link', { name: 'Journal' }).first().click();
  await p.getByRole('button', { name: 'Show details for this trade' }).first().click();
}

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

async function open(browser, path, { width = 1440, height = 900, theme = 'dark', reducedMotion = 'no-preference' } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: theme, reducedMotion });
  // The site keeps its own theme choice; set it before the first paint.
  await ctx.addInitScript((t) => localStorage.setItem('nitora-theme', t), theme);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  return { page, ctx, errors };
}

function* targets() {
  for (const [id, path] of ROUTES) yield [id, path, null];
  for (const [id, path, act] of STATES) yield [id, path, act];
}

// ---------------------------------------------------------------- axe-core
async function a11y(browser) {
  let serious = 0;
  const minor = new Map();
  for (const theme of ['dark', 'light']) {
    for (const width of [390, 1440]) {
      for (const [id, path, act] of targets()) {
        const { page, ctx, errors } = await open(browser, path, { width, theme });
        if (act) {
          await act(page);
          await page.waitForTimeout(500);
        }
        await page.addScriptTag({ content: AXE });
        const res = await page.evaluate(async () => {
          // eslint-disable-next-line no-undef
          const r = await axe.run(document, { resultTypes: ['violations'] });
          return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' :: ' + n.failureSummary?.split('\n')[1]?.trim()) }));
        });
        for (const v of res) {
          if (v.impact === 'serious' || v.impact === 'critical') {
            serious++;
            console.log(`  ✗ ${id} ${width}px ${theme}: [${v.impact}] ${v.id} — ${v.help}\n      ${v.nodes.join('\n      ')}`);
          } else minor.set(`${v.id} (${v.impact})`, new Set([...(minor.get(`${v.id} (${v.impact})`) ?? []), id]));
        }
        for (const e of errors) console.log(`  ! ${id} ${width}px ${theme}: console error: ${e}`);
        await ctx.close();
      }
    }
  }
  const n = (ROUTES.length + STATES.length) * 4;
  console.log(`a11y: ${n} page states checked, ${serious} serious or critical violation(s)`);
  if (minor.size) {
    console.log('  minor or moderate, for the record:');
    for (const [k, ids] of minor) console.log(`    ${k} on ${[...ids].join(', ')}`);
  }
  return serious === 0;
}

// ---------------------------------------------------------------- widths
async function responsive(browser) {
  let bad = 0;
  for (const width of [360, 768, 1024, 1440, 1920]) {
    for (const [id, path, act] of targets()) {
      const { page, ctx } = await open(browser, path, { width, height: 900 });
      if (act) {
        await act(page);
        await page.waitForTimeout(400);
      }
      const over = await page.evaluate(() => {
        const sw = document.documentElement.scrollWidth - window.innerWidth;
        if (sw <= 0) return null;
        const culprit = [...document.querySelectorAll('body *')].find((e) => {
          const r = e.getBoundingClientRect();
          if (r.right <= window.innerWidth + 1) return false;
          // Children of an element that scrolls on its own are not page overflow.
          for (let a = e.parentElement; a; a = a.parentElement) if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(a).overflowX)) return false;
          return true;
        });
        return { sw, culprit: culprit ? `${culprit.tagName.toLowerCase()}.${String(culprit.className).slice(0, 60)}` : '?' };
      });
      if (over) {
        bad++;
        console.log(`  ✗ ${id} at ${width}px scrolls sideways by ${over.sw}px (${over.culprit})`);
      }
      await ctx.close();
    }
  }
  console.log(`responsive: ${(ROUTES.length + STATES.length) * 5} page states checked, ${bad} with horizontal scroll`);
  return bad === 0;
}

// ---------------------------------------------------------------- keyboard
async function keyboard(browser) {
  let bad = 0;
  let stops = 0;
  for (const width of [390, 1440]) {
    for (const [id, path] of ROUTES) {
      const { page, ctx } = await open(browser, path, { width });
      const seen = new Set();
      for (let i = 0; i < 80; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(160); // past the fast transition a focus style may fade in on
        const info = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return { body: true };
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 1) || (cs.boxShadow && cs.boxShadow !== 'none');
          const label = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40);
          const key = el.tagName + '|' + label + '|' + Math.round(r.left) + ',' + Math.round(r.top + scrollY);
          // Covered: what is drawn at the element's centre is neither it nor inside it (content
          // left focusable underneath an overlay, say).
          const cx = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1);
          const cy = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
          const hit = document.elementFromPoint(cx, cy);
          const covered = !!hit && hit !== el && !el.contains(hit) && !hit.contains(el);
          return { key, label, tag: el.tagName.toLowerCase(), ring, covered, visible: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.opacity !== '0' };
        });
        if (info.body) break;
        if (seen.has(info.key)) break; // wrapped round: the whole page has been visited
        seen.add(info.key);
        stops++;
        if (!info.visible || !info.ring || info.covered) {
          bad++;
          const why = !info.visible ? 'is focused while invisible' : info.covered ? 'is focused underneath something else' : 'shows no focus indicator';
          console.log(`  ✗ ${id} ${width}px: ${info.tag} "${info.label}" ${why}`);
        }
      }
      await ctx.close();
    }
  }
  console.log(`keyboard: ${stops} tab stops checked across ${ROUTES.length} routes at 390 and 1440 px, ${bad} problem(s)`);
  return bad === 0;
}

// ---------------------------------------------------------------- reduced motion
async function motion(browser) {
  let bad = 0;
  for (const [id, path, act] of targets()) {
    const { page, ctx } = await open(browser, path, { reducedMotion: 'reduce' });
    // Watch every animation that starts, including ones that finish before we could look.
    await page.evaluate(() => {
      window.__moved = [];
      const note = (a) => {
        const kf = a.effect?.getKeyframes?.() ?? [];
        const props = [...new Set(kf.flatMap((k) => Object.keys(k)).filter((k) => !['offset', 'computedOffset', 'easing', 'composite'].includes(k)))];
        const dur = Number(a.effect?.getComputedTiming?.().duration ?? 0);
        if (dur > 0 && props.some((p) => p !== 'opacity')) window.__moved.push(`${a.animationName ?? a.constructor.name}: ${props.join(',')} ${Math.round(dur)}ms on ${a.effect?.target?.className?.toString().slice(0, 50) ?? '?'}`);
      };
      document.getAnimations().forEach(note);
      document.addEventListener('animationstart', () => document.getAnimations().forEach(note), true);
      document.addEventListener('transitionrun', () => document.getAnimations().forEach(note), true);
    });
    if (act) await act(page);
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(700);
    // A canvas that refuses a 2D context already holds a WebGL one: a live 3D scene.
    const res = await page.evaluate(() => ({ moved: [...new Set(window.__moved)], webgl: [...document.querySelectorAll('canvas')].some((c) => c.getContext('2d') === null) }));
    for (const m of res.moved) {
      bad++;
      console.log(`  ✗ ${id}: moves under reduced motion: ${m}`);
    }
    if (res.webgl) {
      bad++;
      console.log(`  ✗ ${id}: a 3D scene mounted under reduced motion`);
    }
    await ctx.close();
  }
  console.log(`motion: ${ROUTES.length + STATES.length} page states checked with reduced motion, ${bad} problem(s)`);
  return bad === 0;
}

// ---------------------------------------------------------------- lighthouse
async function lighthouse() {
  const { default: lh } = await import('lighthouse');
  const { default: desktop } = await import('lighthouse/core/config/desktop-config.js');
  const chromeLauncher = await import('chrome-launcher');
  const pages = [
    ['Home', '/'],
    ['Learn', '/learn'],
    ['Lesson', LESSON],
    ['Simulator', '/simulator'],
  ];
  const RUNS = 3;
  const rows = [];
  let ok = true;
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-first-run'] });
  try {
    for (const [name, path] of pages) {
      const perf = [];
      let a11yScore = 0;
      let bp = 0;
      let seo = 0;
      let metrics = {};
      for (let i = 0; i < RUNS; i++) {
        const r = await lh(BASE + path, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] }, desktop);
        const c = r.lhr.categories;
        perf.push(Math.round(c.performance.score * 100));
        a11yScore = Math.round(c.accessibility.score * 100);
        bp = Math.round(c['best-practices'].score * 100);
        seo = Math.round(c.seo.score * 100);
        const a = r.lhr.audits;
        metrics = { FCP: a['first-contentful-paint'].displayValue, LCP: a['largest-contentful-paint'].displayValue, TBT: a['total-blocking-time'].displayValue, CLS: a['cumulative-layout-shift'].displayValue };
        if (i === RUNS - 1) {
          mkdirSync(join(root, 'docs/lighthouse'), { recursive: true });
          writeFileSync(join(root, 'docs/lighthouse', `${name.toLowerCase()}.json`), JSON.stringify({ url: path, categories: Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.round(v.score * 100)])), metrics, failing: Object.values(a).filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode === 'binary').map((x) => x.id) }, null, 2));
        }
      }
      const median = perf.sort((x, y) => x - y)[Math.floor(RUNS / 2)];
      if (median < 90 || a11yScore < 95) ok = false;
      rows.push({ name, median, perf, a11yScore, bp, seo, metrics });
    }
  } finally {
    try {
      await chrome.kill();
    } catch {
      // On Windows the profile folder can still be locked when chrome-launcher removes it;
      // the runs are done, and a leftover temp folder is harmless.
    }
  }
  console.log('lighthouse (desktop, median of 3):');
  for (const r of rows) console.log(`  ${r.name.padEnd(10)} performance ${String(r.median).padStart(3)} (${r.perf.join('/')})  accessibility ${r.a11yScore}  best practices ${r.bp}  SEO ${r.seo}   ${Object.entries(r.metrics).map(([k, v]) => `${k} ${v}`).join('  ')}`);
  console.log(ok ? '  every route meets performance >= 90 and accessibility >= 95' : '  ✗ below the bar: performance >= 90 and accessibility >= 95');
  return ok;
}

// ---------------------------------------------------------------- main
const which = process.argv[2] ?? 'all';
const passes = { a11y, responsive, keyboard, motion, lighthouse };
if (which !== 'all' && !passes[which]) {
  console.error(`unknown pass "${which}"; one of ${Object.keys(passes).join(', ')}, all`);
  process.exit(2);
}
const browser = which === 'lighthouse' ? null : await launch();
let pass = true;
try {
  for (const [name, fn] of Object.entries(passes)) {
    if (which !== 'all' && which !== name) continue;
    pass = (await fn(browser)) && pass;
  }
} finally {
  await browser?.close();
}
process.exit(pass ? 0 : 1);
