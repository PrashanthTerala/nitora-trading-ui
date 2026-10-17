/**
 * Tests for the gapped-stars lesson's video data: the detector (src/gapped/detect.ts) against
 * hand-made candles and the site's own figures, and the numbers the video draws and says
 * (src/gapped/data.ts).
 *
 *     node scripts/test-gapped.mjs
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
execFileSync(process.execPath, [path.join(video, 'node_modules', 'esbuild', 'bin', 'esbuild'), path.join(video, 'src', 'gapped', 'data.ts'), '--bundle', '--platform=node', '--format=esm', `--alias:@=${path.join(site, 'src')}`, `--outfile=${out}`, '--log-level=warning'], { cwd: site, stdio: 'inherit' });
const d = await import(pathToFileURL(out).href);
const { gappedStars: find } = d;

const bar = (o, h, l, c) => ({ o, h, l, c });
const red = bar(104, 104.3, 99.7, 100); // body 100..104, low 99.7, middle 102
const green = bar(100, 104.3, 99.7, 104);
const tests = {
  'morning doji star: big red, a doji below its body, a green close past the middle': () => assert.deepEqual(find([red, bar(99.2, 99.9, 98.4, 99.25), bar(99.6, 103.3, 99.4, 103)]), [{ index: 2, kind: 'morning-doji' }]),
  'a small body that is not a doji is not a doji star': () => assert.deepEqual(find([red, bar(99, 99.9, 98.4, 99.5), bar(99.6, 103.3, 99.4, 103)]), []),
  'a third close short of the middle is not a doji star': () => assert.deepEqual(find([red, bar(99.2, 99.9, 98.4, 99.25), bar(99.6, 101.8, 99.4, 101.5)]), []),
  'abandoned baby: the doji high below both neighbours\' lows': () => assert.deepEqual(find([red, bar(98.9, 99.4, 98.2, 98.95), bar(99.8, 103.3, 99.6, 103)]), [{ index: 2, kind: 'baby-bull' }]),
  'a wick touching a neighbour makes it a doji star, not a baby': () => assert.deepEqual(find([red, bar(98.9, 99.8, 98.2, 98.95), bar(99.8, 103.3, 99.6, 103)]), [{ index: 2, kind: 'morning-doji' }]),
  'the bearish mirrors': () => {
    assert.deepEqual(find([green, bar(104.8, 105.6, 104.1, 104.85), bar(104.4, 104.6, 100.7, 101)]), [{ index: 2, kind: 'evening-doji' }]);
    assert.deepEqual(find([green, bar(105, 105.6, 104.6, 105.05), bar(104.4, 104.5, 100.7, 101)]), [{ index: 2, kind: 'baby-bear' }]);
  },
  "the site's figures: one each, ending at bar 8": () => {
    assert.deepEqual(find(d.MDS), [{ index: 8, kind: 'morning-doji' }]);
    assert.deepEqual(find(d.ABB), [{ index: 8, kind: 'baby-bull' }]);
    assert.deepEqual(find(d.ABS), [{ index: 8, kind: 'baby-bear' }]);
  },
  'the illustrations: the evening doji star counts; the 24-hour version has no gapped star': () => {
    assert.deepEqual(find(d.EDS), [{ index: 8, kind: 'evening-doji' }]);
    assert.deepEqual(find(d.NO_GAP), []);
  },
  'the gap that filled: the fourth candle trades back through the doji and the stop': () => {
    const b = d.FILLED[9];
    assert.ok(b.l < d.BABY_HIGH && b.l < d.STOP);
  },
  'the morning doji star, as drawn': () => assert.deepEqual([d.MDS_MID, d.MDS_THIRD_CLOSE], [100.33, 102.58]),
  'the abandoned babies, as drawn': () => {
    assert.deepEqual([d.BABY_HIGH, d.BABY_LOW, d.FIRST_LOW, d.THIRD_LOW], [98.26, 96.86, 98.96, 99.26]);
    assert.deepEqual([d.BEAR_BABY_LOW, d.BEAR_FIRST_HIGH, d.BEAR_THIRD_HIGH], [103.09, 102.49, 102.19]);
  },
  'the trade': () => assert.deepEqual([d.ENTRY, d.STOP, d.RISK], [103.46, 96.86, 6.6]),
  "Bulkowski's rates, ranks and counts": () => assert.deepEqual([d.MORNING_DOJI, d.EVENING_DOJI, d.BABY_BULL, d.BABY_BEAR, d.MORNING_STAR, d.EVENING_STAR, d.MORNING_DOJI_SAMPLES, d.BABY_SAMPLES, d.CANDLES_MILLIONS, d.RANK_BABY_BEAR, d.PATTERNS], [76, 71, 70, 69, 78, 72, 932, 293, 4.7, 64, 103]),
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
