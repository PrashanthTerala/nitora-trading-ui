/**
 * Tests for the three inside/outside lesson's video data: the detector (src/insideout/detect.ts)
 * against hand-made candles and the site's own figures, and the numbers the video draws and says
 * (src/insideout/data.ts).
 *
 *     node scripts/test-insideout.mjs
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
execFileSync(process.execPath, [path.join(video, 'node_modules', 'esbuild', 'bin', 'esbuild'), path.join(video, 'src', 'insideout', 'data.ts'), '--bundle', '--platform=node', '--format=esm', `--alias:@=${path.join(site, 'src')}`, `--outfile=${out}`, '--log-level=warning'], { cwd: site, stdio: 'inherit' });
const d = await import(pathToFileURL(out).href);
const { threeInsideOutside: find } = d;

const bar = (o, h, l, c) => ({ o, h, l, c });
const bigRed = bar(104, 104.2, 99.8, 100); // body 100..104
const bigGreen = bar(100, 104.2, 99.8, 104);
const tests = {
  'three inside up: big red, small inside, green close above the first open': () => assert.deepEqual(find([bigRed, bar(101, 102.2, 100.8, 102), bar(102, 105, 101.8, 104.6)]), [{ index: 2, kind: 'inside-up' }]),
  "a third close above candle two's close but below the first open: only Bulkowski's looser rule": () => {
    const bars = [bigRed, bar(101, 102.2, 100.8, 102), bar(102, 103.2, 101.8, 103)];
    assert.deepEqual(find(bars), []);
    assert.deepEqual(find(bars, true), [{ index: 2, kind: 'inside-up' }]);
  },
  'three inside down: the mirror': () => assert.deepEqual(find([bigGreen, bar(103, 103.2, 101.8, 102), bar(102, 102.2, 98.8, 99.4)]), [{ index: 2, kind: 'inside-down' }]),
  'a second body poking out of the first is not a harami': () => assert.deepEqual(find([bigRed, bar(101, 104.6, 100.8, 104.5), bar(104.4, 106, 104, 105.8)]), []),
  'three outside up: small red, engulfing green, a higher close': () => assert.deepEqual(find([bar(101, 101.2, 99.8, 100), bar(99.8, 102.2, 99.6, 102), bar(102, 103.2, 101.8, 103)]), [{ index: 2, kind: 'outside-up' }]),
  'three outside down: the mirror': () => assert.deepEqual(find([bar(100, 101.2, 99.8, 101), bar(101.2, 101.4, 98.8, 99), bar(99, 99.2, 97.8, 98)]), [{ index: 2, kind: 'outside-down' }]),
  'an engulfing with no higher close is not three outside up': () => assert.deepEqual(find([bar(101, 101.2, 99.8, 100), bar(99.8, 102.2, 99.6, 102), bar(102, 102.2, 100.8, 101)]), []),
  "the site's figures: one each, ending at bar 8": () => {
    assert.deepEqual(find(d.TIU), [{ index: 8, kind: 'inside-up' }]);
    assert.deepEqual(find(d.TID), [{ index: 8, kind: 'inside-down' }]);
    assert.deepEqual(find(d.TOU), [{ index: 8, kind: 'outside-up' }]);
    assert.deepEqual(find(d.TOD), [{ index: 8, kind: 'outside-down' }]);
  },
  'the looser third: Bulkowski counts it, the lesson does not': () => {
    assert.deepEqual(find(d.LOOSE_THIRD), []);
    assert.deepEqual(find(d.LOOSE_THIRD, true), [{ index: 8, kind: 'inside-up' }]);
  },
  'the third candles, as drawn': () => assert.deepEqual([d.TIU_FIRST_OPEN, d.TIU_THIRD_CLOSE, d.TID_FIRST_OPEN, d.TID_THIRD_CLOSE, d.TOU_SECOND_CLOSE, d.TOU_THIRD_CLOSE, d.TOD_SECOND_CLOSE, d.TOD_THIRD_CLOSE], [102.3, 103.6, 98.93, 98.13, 102.67, 105.27, 97.27, 94.47]),
  'the trades': () => assert.deepEqual([d.IN_ENTRY, d.IN_STOP, d.IN_RISK, d.OUT_ENTRY, d.OUT_STOP, d.OUT_RISK], [103.6, 96.8, 6.8, 105.27, 97.97, 7.3]),
  'what confirmation costs': () => assert.deepEqual([d.EARLY, d.COST], [100.4, 3.2]),
  "Bulkowski's rates": () => assert.deepEqual([d.HARAMI_BULL, d.TIU_PCT, d.HARAMI_BEAR, d.TID_PCT, d.ENGULF_BULL, d.TOU_PCT, d.ENGULF_BEAR, d.TOD_PCT], [53, 65, 47, 60, 63, 75, 79, 69]),
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
