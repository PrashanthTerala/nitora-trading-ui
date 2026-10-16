/**
 * Tests for the harami lesson's video data: the detector (src/harami/detect.ts) against hand-made
 * pairs and the site's own figures, and the numbers the video draws and says (src/harami/data.ts).
 *
 *     node scripts/test-harami.mjs
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const video = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.resolve(video, '..');
const out = path.join(mkdtempSync(path.join(tmpdir(), 'video-test-')), 'data.mjs');
execFileSync(process.execPath, [path.join(video, 'node_modules', 'esbuild', 'bin', 'esbuild'), path.join(video, 'src', 'harami', 'data.ts'), '--bundle', '--platform=node', '--format=esm', `--alias:@=${path.join(site, 'src')}`, `--outfile=${out}`, '--log-level=warning'], { cwd: site, stdio: 'inherit' });
const d = await import(pathToFileURL(out).href);
const { haramis, isDoji } = d;

const bar = (o, h, l, c) => ({ o, h, l, c });
const big = bar(105, 105.5, 99, 99.5); // a long red candle
const tests = {
  'bullish harami: a small body inside a big red one': () => assert.deepEqual(haramis([big, bar(100.5, 101.5, 100, 101)]), [{ index: 1, direction: 'bullish' }]),
  'bearish harami: a small body inside a big green one': () => assert.deepEqual(haramis([bar(99.5, 105.5, 99, 105), bar(104, 104.5, 102.5, 103)]), [{ index: 1, direction: 'bearish' }]),
  'the colour of the small candle does not matter': () => assert.deepEqual(haramis([big, bar(101, 101.5, 100, 100.5)]), [{ index: 1, direction: 'bullish' }]),
  'wicks may poke out of the big body': () => assert.deepEqual(haramis([big, bar(100.5, 106, 98, 101)]), [{ index: 1, direction: 'bullish' }]),
  'a body that pokes out is not a harami': () => assert.deepEqual(haramis([big, bar(100.5, 106, 100, 105.2)]), []),
  'a body of the same size is not a harami': () => assert.deepEqual(haramis([big, bar(99.5, 105.5, 99, 105)]), []),
  'a doji first candle has no direction': () => assert.deepEqual(haramis([bar(100, 101, 99, 100), bar(100, 100.2, 99.8, 100)]), []),
  "the site's bullish figure: one harami, at bar 7": () => assert.deepEqual(haramis(d.BULL), [{ index: 7, direction: 'bullish' }]),
  "the site's bearish figure: one harami, at bar 7": () => assert.deepEqual(haramis(d.BEAR), [{ index: 7, direction: 'bearish' }]),
  "the site's harami cross: the inside candle is a doji": () => {
    assert.deepEqual(haramis(d.CROSS), [{ index: 7, direction: 'bullish' }]);
    assert.equal(isDoji(d.CROSS[7]), true);
    assert.equal(isDoji(d.BULL[7]), false);
  },
  'the range: three haramis, at the bars the video outlines': () => assert.deepEqual(d.RANGE_HARAMIS.map((h) => h.index), [17, 52, 61]),
  'every illustration ends in a bullish harami at bar 7': () => assert.equal(d.ILLUSTRATIONS_VALID, true),
  'confirmation: the third candle clears the small high, the middle and the big open': () => {
    assert.deepEqual([d.BULL_SMALL_HIGH, d.BULL_MID, d.BULL_BIG_OPEN, d.BULL_THIRD_CLOSE], [99.55, 98.85, 101.45, 101.85]);
    assert.equal(d.THREE_INSIDE_UP, true);
  },
  'the trade: entry, stop and risk as drawn and said': () => {
    assert.deepEqual([d.BULL_ENTRY, d.BULL_STOP, d.BULL_RISK], [101.85, 95.95, 5.9]);
    assert.ok(d.BULL_ENTRY > d.BULL_SMALL_HIGH, "the confirmation closes above the harami's high");
  },
  "the trap: the resumed trend goes through the big candle's low": () => {
    assert.equal(d.TRAP_BUY, 99.05);
    assert.ok(d.TRAP_RESUME[8].l < d.BULL_STOP);
  },
  "Bulkowski's rates: reversal = 100 - published continuation": () => assert.deepEqual([d.BULKOWSKI_BULLISH, d.BULKOWSKI_BEARISH, d.BULKOWSKI_CROSS_BULLISH, d.BULKOWSKI_CROSS_BEARISH], [53, 47, 45, 43]),
};

let failed = 0;
for (const [name, run] of Object.entries(tests)) {
  try {
    run();
    console.log(`ok    ${name}`);
  } catch (err) {
    failed++;
    console.log(`FAIL  ${name}\n      ${err.message.split('\n').join('\n      ')}`);
  }
}
console.log(`${Object.keys(tests).length - failed}/${Object.keys(tests).length} passed`);
process.exit(failed ? 1 : 0);
