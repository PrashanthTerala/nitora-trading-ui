/**
 * Bundle report for a production build: what the home route loads before it can render, and
 * the largest lazy chunks. Fails if the home route's initial JavaScript is over budget.
 *
 *   npm run build && node tools/bundle-report.mjs
 *
 * "Initial" means every script dist/index.html loads or preloads: the entry and its static
 * imports. Sizes are gzip -9, which is close to what a server sends.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 250; // docs/DESIGN.md: home initial JS, gzipped

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const gz = (file) => gzipSync(readFileSync(join(dist, file)), { level: 9 }).length;
const kb = (n) => `${(n / 1024).toFixed(1)} kB`;

const initial = [...new Set([...html.matchAll(/(?:src|href)="\/?(assets\/[^"]+\.js)"/g)].map((m) => m[1]))];
const css = [...new Set([...html.matchAll(/href="\/?(assets\/[^"]+\.css)"/g)].map((m) => m[1]))];
const initialBytes = initial.reduce((sum, f) => sum + gz(f), 0);

console.log('home route, initial (gzip):');
for (const f of initial) console.log(`  ${kb(gz(f)).padStart(9)}  ${f}`);
for (const f of css) console.log(`  ${kb(gz(f)).padStart(9)}  ${f}  (css)`);
console.log(`  ${kb(initialBytes).padStart(9)}  total JS, budget ${BUDGET_KB} kB`);

const lazy = readdirSync(join(dist, 'assets'))
  .filter((f) => f.endsWith('.js') && !initial.includes(`assets/${f}`))
  .map((f) => [gz(`assets/${f}`), f])
  .sort((a, b) => b[0] - a[0]);
console.log(`\nlargest lazy chunks (of ${lazy.length}):`);
for (const [n, f] of lazy.slice(0, 8)) console.log(`  ${kb(n).padStart(9)}  ${f}`);

if (initialBytes > BUDGET_KB * 1024) {
  console.error(`\nhome initial JS ${kb(initialBytes)} is over the ${BUDGET_KB} kB budget`);
  process.exit(1);
}
