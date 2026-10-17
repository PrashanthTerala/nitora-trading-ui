/**
 * Tests for the stars lesson's video data: the detector (src/stars/detect.ts) against hand-made
 * candles and the site's own figures, and the numbers the video draws and says (src/stars/data.ts).
 *
 *     node scripts/test-stars.mjs
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
execFileSync(process.execPath, [path.join(video, 'node_modules', 'esbuild', 'bin', 'esbuild'), path.join(video, 'src', 'stars', 'data.ts'), '--bundle', '--platform=node', '--format=esm', `--alias:@=${path.join(site, 'src')}`, `--outfile=${out}`, '--log-level=warning'], { cwd: site, stdio: 'inherit' });
const d = await import(pathToFileURL(out).href);
const { stars, reach } = d;

const bar = (o, h, l, c) => ({ o, h, l, c });
const red = bar(104, 104.2, 99.8, 100); // body 100..104, middle 102
const tests = {
  'morning star: big red, small star below, green close past the middle': () => assert.deepEqual(stars([red, bar(99.5, 99.8, 98.8, 99.3), bar(99.6, 103.2, 99.4, 103)]), [{ index: 2, kind: 'morning' }]),
  'a third close short of the middle is not a star': () => assert.deepEqual(stars([red, bar(99.5, 99.8, 98.8, 99.3), bar(99.6, 101.8, 99.4, 101.6)]), []),
  'a medium middle body is not a star': () => assert.deepEqual(stars([red, bar(97.9, 100, 97.7, 99.9), bar(99.6, 103.2, 99.4, 103)]), []),
  'a star body inside the first body is not a star': () => assert.deepEqual(stars([red, bar(100.5, 101, 100.2, 100.8), bar(100.6, 103.2, 100.4, 103)]), []),
  'evening star: the mirror': () => assert.deepEqual(stars([bar(100, 104.2, 99.8, 104), bar(104.4, 105, 104.2, 104.7), bar(104.3, 104.5, 100.6, 100.9)]), [{ index: 2, kind: 'evening' }]),
  "the site's figures: one star each, ending at bar 8": () => {
    assert.deepEqual(stars(d.MS), [{ index: 8, kind: 'morning' }]);
    assert.deepEqual(stars(d.ES), [{ index: 8, kind: 'evening' }]);
  },
  'the illustrations: the doji and no-gap stars count, the lazy ones do not': () => {
    assert.deepEqual(stars(d.DOJI_STAR), [{ index: 8, kind: 'morning' }]);
    assert.deepEqual(stars(d.NO_GAP), [{ index: 8, kind: 'morning' }]);
    assert.deepEqual(stars(d.LAZY_STAR), []);
    assert.deepEqual(stars(d.ES_LAZY), []);
  },
  'the morning star, as drawn': () => assert.deepEqual([d.FIRST_OPEN, d.FIRST_CLOSE, d.MID, d.STAR_BOTTOM, d.STAR_TOP, d.STAR_LOW, d.THIRD_CLOSE, d.REACH], [102.3, 97.2, 99.75, 96.3, 96.5, 95.4, 102.2, 98]),
  'the evening star, as drawn': () => assert.deepEqual([d.ES_MID, d.ES_THIRD_CLOSE, d.ES_REACH], [98.71, 96.71, 88]),
  'reach: a close at the first open is 100%': () => assert.equal(reach(red, bar(99.6, 104.2, 99.4, 104)), 100),
  'the trade: entry at the third close, stop at the star low': () => assert.deepEqual([d.ENTRY, d.STOP, d.RISK], [102.2, 95.4, 6.8]),
  "Bulkowski's rates and ranks": () => assert.deepEqual([d.BULKOWSKI_MORNING, d.BULKOWSKI_EVENING, d.RANK_MORNING, d.RANK_EVENING, d.PATTERNS], [78, 72, 12, 4, 103]),
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
