/**
 * Validates every teaching figure preset. A figure with an out-of-range annotation
 * index renders silently wrong (the label just does not appear), and a bar with
 * high < close renders an impossible candle, so both are caught here rather than by eye.
 *
 * Run: node tools/test-figures.mjs
 */
import { execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = mkdtempSync(join(tmpdir(), 'tl-fig-'));
const shim = join(out, 'shim.ts');
writeFileSync(
  shim,
  `
import { FIGURES, regimeSeries } from '@/content/figures';
export { FIGURES, regimeSeries };
`,
);
const bundle = join(out, 'bundle.mjs');
execSync(`npx esbuild "${shim}" --bundle --format=esm --platform=node --outfile="${bundle}" --alias:@=./src --log-level=error`, { cwd: root, stdio: 'inherit' });
const { FIGURES, regimeSeries } = await import(pathToFileURL(bundle).href);

let pass = 0;
const problems = [];
const note = (name, msg) => problems.push(`${name}: ${msg}`);

for (const [name, fig] of Object.entries(FIGURES)) {
  const bars = fig.bars;
  let ok = true;
  if (!Array.isArray(bars) || bars.length === 0) {
    note(name, 'has no bars');
    continue;
  }
  bars.forEach((b, i) => {
    for (const k of ['o', 'h', 'l', 'c']) {
      if (!Number.isFinite(b[k])) {
        note(name, `bar ${i} has a non-finite ${k}`);
        ok = false;
      }
    }
    if (b.h < Math.max(b.o, b.c) - 1e-9) {
      note(name, `bar ${i} high ${b.h} is below max(open,close) ${Math.max(b.o, b.c)}`);
      ok = false;
    }
    if (b.l > Math.min(b.o, b.c) + 1e-9) {
      note(name, `bar ${i} low ${b.l} is above min(open,close) ${Math.min(b.o, b.c)}`);
      ok = false;
    }
    if (b.l <= 0) {
      note(name, `bar ${i} has a non-positive low`);
      ok = false;
    }
  });

  const n = bars.length;
  const inRange = (i) => Number.isInteger(i) && i >= 0 && i < n;
  for (const a of fig.annotations ?? []) {
    switch (a.type) {
      case 'label':
      case 'arrow':
        if (!inRange(a.index)) {
          note(name, `${a.type} index ${a.index} is outside 0..${n - 1} (it will not render)`);
          ok = false;
        }
        break;
      case 'zone':
      case 'bracket':
      case 'highlight':
        if (!inRange(a.from) || !inRange(a.to)) {
          note(name, `${a.type} spans ${a.from}..${a.to}, outside 0..${n - 1}`);
          ok = false;
        } else if (a.from > a.to) {
          note(name, `${a.type} has from ${a.from} greater than to ${a.to}`);
          ok = false;
        }
        break;
      case 'hline':
        if (!Number.isFinite(a.price)) {
          note(name, 'hline has a non-finite price');
          ok = false;
        }
        if (a.from !== undefined && !inRange(a.from)) {
          note(name, `hline from ${a.from} is outside 0..${n - 1}`);
          ok = false;
        }
        if (a.to !== undefined && !inRange(a.to)) {
          note(name, `hline to ${a.to} is outside 0..${n - 1}`);
          ok = false;
        }
        break;
      case 'line':
        for (const [i, p] of [a.from, a.to]) {
          if (!inRange(i)) {
            note(name, `line endpoint index ${i} is outside 0..${n - 1}`);
            ok = false;
          }
          if (!Number.isFinite(p)) {
            note(name, 'line endpoint has a non-finite price');
            ok = false;
          }
        }
        break;
      default:
        note(name, `unknown annotation type ${a.type}`);
        ok = false;
    }
  }
  if (fig.fadeBefore !== undefined && !inRange(fig.fadeBefore)) {
    note(name, `fadeBefore ${fig.fadeBefore} is outside 0..${n - 1}`);
    ok = false;
  }
  if (ok) pass++;
}

// the regime series used by indicator figures must also be well formed
for (const r of ['trend-up', 'trend-down', 'range', 'reversal', 'volatile', 'crash', 'intraday']) {
  const s = regimeSeries(r);
  let ok = s.length > 0;
  for (const [i, b] of s.entries()) {
    if (b.h < Math.max(b.o, b.c) - 1e-9 || b.l > Math.min(b.o, b.c) + 1e-9 || !(b.l > 0)) {
      note(`regime:${r}`, `bar ${i} is not a valid candle`);
      ok = false;
      break;
    }
  }
  if (ok) pass++;
}

const total = Object.keys(FIGURES).length + 7;
console.log(`\n${pass}/${total} figures valid\n`);
if (problems.length) {
  console.log('PROBLEMS:');
  for (const p of problems) console.log('  ' + p);
  console.log();
}
rmSync(out, { recursive: true, force: true });
process.exit(problems.length ? 1 : 0);
