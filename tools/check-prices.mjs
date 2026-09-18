/**
 * Flags lesson examples that quote a simulator instrument at a price it would never
 * trade at. A reader who opens the simulator after reading "BLUE at $62" and finds it
 * near $90 loses trust in the example, so prices in prose must sit inside the band the
 * generator actually produces.
 *
 * The band is the 5th to 95th percentile of closes sampled across several seeds, widened
 * a little because an example may legitimately describe an unusual moment.
 *
 * Run: node tools/check-prices.mjs [--verbose]
 */
import { readFileSync, readdirSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');

// Derive the bands from the engine itself, so they cannot drift from the generator.
const tmp = mkdtempSync(join(tmpdir(), 'tl-band-'));
writeFileSync(
  join(tmp, 'shim.ts'),
  `
import { Market } from '@/engine/market/feed';
import { SYMBOLS } from '@/engine/market/symbols';
export { Market, SYMBOLS };
`,
);
const bundle = join(tmp, 'b.mjs');
execSync(`npx esbuild "${join(tmp, 'shim.ts')}" --bundle --format=esm --platform=node --outfile="${bundle}" --alias:@=./src --log-level=error`, { cwd: root, stdio: 'inherit' });
const { Market, SYMBOLS } = await import(pathToFileURL(bundle).href);

const N = 80 * 390;
const band = {};
for (const s of SYMBOLS) {
  const all = [];
  for (let k = 0; k < 6; k++) {
    const f = new Market('band-' + k, SYMBOLS).feed(s.symbol);
    f.ensure(N + 5);
    for (let i = 0; i < N; i += 131) all.push(f.series.close.get(i));
  }
  all.sort((a, b) => a - b);
  const lo = all[Math.floor(all.length * 0.05)];
  const hi = all[Math.floor(all.length * 0.95)];
  // widen by 25% each way: an example may describe an unusual but possible moment
  band[s.symbol] = { lo: lo * 0.75, hi: hi * 1.25, base: s.basePrice, decimals: s.decimals };
}
rmSync(tmp, { recursive: true, force: true });

const problems = [];
let checked = 0;
const modulesDir = join(root, 'src/content/modules');

for (const mod of readdirSync(modulesDir, { withFileTypes: true })) {
  if (!mod.isDirectory()) continue;
  for (const file of readdirSync(join(modulesDir, mod.name))) {
    if (!file.endsWith('.mdx')) continue;
    const rel = `src/content/modules/${mod.name}/${file}`;
    const text = readFileSync(join(root, rel), 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      for (const sym of Object.keys(band)) {
        const at = line.indexOf(sym);
        if (at === -1) continue;
        const after = line.slice(at, at + 160);
        /**
         * Only dollar-prefixed numbers are candidates. Bare numbers next to a symbol are
         * almost always a timeframe ("NOVA on the 5m"), an indicator period ("SMA 20") or
         * a bar count, and treating them as prices buries the real findings in noise.
         */
        for (const m of after.matchAll(/\$([0-9][0-9,]*(?:\.[0-9]+)?)/g)) {
          const v = parseFloat(m[1].replace(/,/g, ''));
          if (!Number.isFinite(v)) continue;
          // A dollar figure describing money won or lost is not a price.
          const before = after.slice(Math.max(0, m.index - 30), m.index).toLowerCase();
          if (/(loss|lost|risk|profit|made|gain|worth|account|fee|commission|per share|a share|equity|balance)\b[^.]{0,12}$/.test(before)) continue;
          const b0 = band[sym];
          // A figure far below the band is a distance, not a price: stop offsets, ATR
          // readings and per-share risk all appear in dollars right beside a symbol.
          if (v < b0.lo * 0.2) continue;
          checked++;
          const b = band[sym];
          if (v < b.lo || v > b.hi) {
            problems.push({ rel, line: i + 1, sym, value: v, lo: b.lo, hi: b.hi, text: line.trim().slice(0, 110) });
          }
        }
      }
    });
  }
}

console.log(`\nChecked ${checked} symbol-adjacent numbers across the curriculum.\n`);
if (problems.length === 0) {
  console.log('Every quoted price sits inside the band its instrument actually trades in.\n');
} else {
  console.log(`OUT OF BAND (${problems.length}):`);
  const show = verbose ? problems : problems.slice(0, 30);
  for (const p of show) {
    console.log(`  ${p.rel}:${p.line}  ${p.sym} quoted at ${p.value} (plausible ${p.lo.toFixed(2)} to ${p.hi.toFixed(2)})`);
    console.log(`      ${p.text}`);
  }
  if (!verbose && problems.length > show.length) console.log(`  … and ${problems.length - show.length} more (--verbose)`);
  console.log();
}
process.exit(problems.length ? 1 : 0);
