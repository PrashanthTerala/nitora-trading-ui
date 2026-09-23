/**
 * Keeps the design tokens a contract rather than a suggestion. Part of `npm run check`.
 *
 *   node tools/lint-tokens.mjs              check everything, exit 1 on any failure
 *   node tools/lint-tokens.mjs --write-doc  regenerate docs/tokens.md from tokens.css
 *
 * 1. Raw colours. No hex, rgb(), hsl(), oklch() or similar literal in src/ outside the
 *    files allowed to hold them: the tokens themselves, the colour maths, and the two
 *    renderers that must hand concrete colours to canvas or SVG (plus future 3D scenes).
 * 2. Tailwind palette classes (bg-red-500, text-white) are raw colours by another name. The
 *    ones that predate the tokens are recorded below per file; a file may only go down.
 * 3. Contrast. Every pair below reaches its bar in BOTH themes, measured with WCAG 2.x
 *    relative luminance on the colours as rendered (translucent ones composited first).
 * 4. Gamut. Every colour token is displayable in sRGB, so the maths above is what shows.
 * 5. docs/tokens.md is generated from tokens.css and must match it.
 */
import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => relative(root, p).replaceAll('\\', '/');

// Bundle the TypeScript colour and token modules for Node, as tools/test-engine.mjs does.
const tmp = mkdtempSync(join(tmpdir(), 'lint-tokens-'));
writeFileSync(join(tmp, 'shim.ts'), "export * from '@/lib/color';\nexport * from '@/lib/tokens';\nexport * from '@/lib/tokenPolicy';\n");
execSync(`npx esbuild "${join(tmp, 'shim.ts')}" --bundle --format=esm --platform=node --outfile="${join(tmp, 'b.mjs')}" --alias:@=./src --log-level=error`, { cwd: root });
const T = await import(pathToFileURL(join(tmp, 'b.mjs')).href);
rmSync(tmp, { recursive: true, force: true });

const css = readFileSync(join(root, 'src/styles/tokens.css'), 'utf8');
const tokens = T.parseTokens(css);
const failures = [];
const fail = (msg) => failures.push(msg);

// ---------------------------------------------------------------- 1. raw colour literals
const LITERAL_ALLOWED = [
  'src/styles/tokens.css', // the tokens themselves
  'src/lib/color.ts', // parses and formats colours
  'src/components/figures/CandleSvg.tsx', // SVG renderer
  'src/components/sim/TradingChart.tsx', // canvas renderer: lightweight-charts needs concrete colours
  'src/components/three/', // 3D scenes (Phase 4)
];
// A hex colour only where a value can start (quote, colon, paren, comma, space), so MDX
// headings and "#anchor" links are not mistaken for one. A colour function only with CSS
// argument syntax -- numbers separated by spaces, or by commas for the legacy rgb()/hsl()
// forms -- so a helper that happens to be called lab() or lch() is not flagged.
const LITERAL =
  /(?:^|['"`:(,\s])(#[0-9a-fA-F]{8}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})(?![\w-])|\b(rgba?|hsla?)\(\s*-?[\d.]+%?\s*[,\s]\s*-?[\d.]+|\b(hwb|oklch|oklab|lch|lab)\(\s*-?[\d.]+%?\s+-?[\d.]+/g;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|css|mdx)$/.test(name)) out.push(p);
  }
  return out;
}
const sources = walk(join(root, 'src'));
let literalCount = 0;
for (const file of sources) {
  const r = rel(file);
  if (LITERAL_ALLOWED.some((a) => r === a || (a.endsWith('/') && r.startsWith(a)))) continue;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const m of line.matchAll(LITERAL)) {
        literalCount++;
        fail(`raw colour ${(m[1] ?? (m[2] ?? m[3]) + '(').trim()} in ${r}:${i + 1} -- use a token from src/styles/tokens.css`);
      }
    });
}

// ---------------------------------------------------------------- 2. palette classes, ratcheted
// Tailwind's palette classes always carry a shade (text-neutral-500), except white and black.
// Requiring the shade matters: `text-neutral` is this project's own market token, and must
// not be mistaken for Tailwind's grey family of the same name.
const PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|outline|decoration|shadow|divide|placeholder|caret)-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})(?:\/\d+)?\b/g;
// Counted on 2026-09-22, when the tokens were introduced. Lower these as components move to
// tokens; never raise them. The callouts move in Phase 2, the buttons in Phase 1.
const PALETTE_BASELINE = {
  'src/components/sim/OrderTicket.tsx': 1,
};
const paletteCounts = {};
for (const file of sources) {
  // tokens.css defines variables, not classes; its comments may name a class to forbid it.
  if (rel(file) === 'src/styles/tokens.css') continue;
  const n = (readFileSync(file, 'utf8').match(PALETTE) ?? []).length;
  if (n) paletteCounts[rel(file)] = n;
}
for (const [file, n] of Object.entries(paletteCounts)) {
  const allowed = PALETTE_BASELINE[file] ?? 0;
  if (n > allowed) fail(`${n} Tailwind palette class(es) in ${file}, ${allowed} allowed -- use token utilities (bg-accent, text-ink-soft, ...)`);
}
const paletteTotal = Object.values(paletteCounts).reduce((a, b) => a + b, 0);
const paletteLowered = Object.entries(PALETTE_BASELINE).filter(([f, n]) => (paletteCounts[f] ?? 0) < n);

// ---------------------------------------------------------------- 3. contrast
// The rules live in src/lib/tokenPolicy.ts, shared with the /__tokens sheet, so the sheet shows
// exactly what this check enforces.
const c = (name) => `--color-${name}`;
const results = T.contrastResults(tokens);
for (const r of results) if (!r.pass) fail(`${r.theme}: ${r.fg} on ${r.bg} is ${r.got.toFixed(2)}:1, needs ${r.ratio}:1 (${r.why})`);
const worst = { light: results.filter((r) => r.theme === 'light'), dark: results.filter((r) => r.theme === 'dark') };

// ---------------------------------------------------------------- 4. gamut and distinctness
const colorTokens = tokens.filter(T.isColorToken).filter((t) => !/^var\(/.test(t.light));
for (const theme of ['light', 'dark']) {
  for (const t of colorTokens) {
    const v = T.resolve(tokens, t.name, theme);
    const p = T.parseOklch(v);
    if (!p) fail(`${theme}: ${t.name} is not oklch(): ${v}`);
    else if (!T.inSrgbGamut(p)) fail(`${theme}: ${t.name} ${v} is outside sRGB and will be clipped -- lower its chroma`);
  }
  // Chart overlays must be told apart from each other; danger must never read as a loss.
  const lab = (n) => {
    const { l, c: ch, h } = T.parseOklch(T.resolve(tokens, c(n), theme));
    return [l, ch * Math.cos((h * Math.PI) / 180), ch * Math.sin((h * Math.PI) / 180)];
  };
  const dE = (a, b) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));
  const charts = [1, 2, 3, 4, 5, 6].map((i) => `chart-${i}`);
  for (let i = 0; i < charts.length; i++)
    for (let j = i + 1; j < charts.length; j++)
      if (dE(charts[i], charts[j]) < 0.08) fail(`${theme}: ${charts[i]} and ${charts[j]} are too close to tell apart (dE ${dE(charts[i], charts[j]).toFixed(3)})`);
  if (dE('danger', 'down') < 0.08) fail(`${theme}: danger is too close to down (dE ${dE('danger', 'down').toFixed(3)}) -- a warning must not read as a losing trade`);
}

// ---------------------------------------------------------------- 5. docs/tokens.md
function renderDoc() {
  const rows = [];
  let group = null;
  for (const t of tokens) {
    if (t.group !== group) {
      group = t.group;
      rows.push('', `## ${group.charAt(0).toUpperCase() + group.slice(1)}`, '', '| Token | Light | Dark | Use |', '|---|---|---|---|');
    }
    const extra = Object.entries(t.extras).map(([k, v]) => `${k} ${v}`).join(', ');
    const light = t.light + (extra ? ` (${extra})` : '');
    const dark = t.dark === t.light ? 'same' : t.dark;
    rows.push(`| \`${t.name}\` | \`${light}\` | ${dark === 'same' ? 'same' : '`' + dark + '`'} | ${t.doc} |`);
  }
  return [
    '# Design tokens',
    '',
    'Generated from `src/styles/tokens.css` by `npm run tokens:doc`. Do not edit by hand: change',
    'the CSS and regenerate. `npm run check` fails when this file is out of date.',
    '',
    'Colours are OKLCH. Every colour token passes the contrast bar set in `tools/lint-tokens.mjs`',
    'in both themes: 4.5:1 for text, 3:1 for control borders, chart overlays and identifiers.',
    '`line-subtle`, `line` and `grid` are decorative hairlines and are exempt, per WCAG 1.4.11.',
    '',
    'Durations fall to 0ms under `prefers-reduced-motion: reduce`.',
    ...rows,
    '',
  ].join('\n');
}
const docPath = join(root, 'docs/tokens.md');
const doc = renderDoc();
if (process.argv.includes('--write-doc')) {
  writeFileSync(docPath, doc);
  console.log(`wrote ${rel(docPath)} (${tokens.length} tokens)`);
} else {
  let current = '';
  try {
    current = readFileSync(docPath, 'utf8').replaceAll('\r\n', '\n');
  } catch {
    // missing counts as stale
  }
  if (current !== doc) fail('docs/tokens.md is out of date -- run `npm run tokens:doc`');
}

// ---------------------------------------------------------------- report
const tightest = (theme) =>
  worst[theme]
    .map((w) => ({ ...w, margin: w.got / w.ratio }))
    .sort((a, b) => a.margin - b.margin)
    .slice(0, 3)
    .map((w) => `${w.fg} on ${w.bg} ${w.got.toFixed(2)}:1`)
    .join(', ');
console.log(`tokens: ${tokens.length} (${colorTokens.length} colours), ${worst.light.length} contrast pairs x 2 themes`);
console.log(`  tightest light: ${tightest('light')}`);
console.log(`  tightest dark:  ${tightest('dark')}`);
console.log(`  raw colour literals outside the allowlist: ${literalCount}`);
console.log(`  Tailwind palette classes: ${paletteTotal} remaining in ${Object.keys(paletteCounts).length} file(s) (ratchet: may only go down)`);
if (paletteLowered.length) console.log(`  note: ${paletteLowered.map(([f]) => f).join(', ')} now below baseline -- lower PALETTE_BASELINE to lock it in`);
if (failures.length) {
  console.log(`\n${failures.length} problem(s):`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log('design tokens OK');
