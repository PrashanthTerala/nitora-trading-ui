/**
 * Tests for the piercing-line lesson's video data: the detector (src/piercing/detect.ts) against
 * hand-made pairs and the site's own figures, and the numbers the video draws and says
 * (src/piercing/data.ts).
 *
 *     node scripts/test-piercing.mjs
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
execFileSync(process.execPath, [path.join(video, 'node_modules', 'esbuild', 'bin', 'esbuild'), path.join(video, 'src', 'piercing', 'data.ts'), '--bundle', '--platform=node', '--format=esm', `--alias:@=${path.join(site, 'src')}`, `--outfile=${out}`, '--log-level=warning'], { cwd: site, stdio: 'inherit' });
const d = await import(pathToFileURL(out).href);
const { piercings, reach } = d;

const bar = (o, h, l, c) => ({ o, h, l, c });
const red = bar(104, 104.2, 99.8, 100); // body 100..104, middle 102
const tests = {
  'piercing: gap below the low, close past the middle, below the open': () => assert.deepEqual(piercings([red, bar(99.5, 103.2, 99.4, 103)]), [{ index: 1, kind: 'piercing' }]),
  'a close short of the middle is not a piercing line (thrusting)': () => assert.deepEqual(piercings([red, bar(99.5, 102, 99.4, 101.8)]), []),
  'a close above the first open is an engulfing, not a piercing line': () => assert.deepEqual(piercings([red, bar(99.5, 104.6, 99.4, 104.4)]), []),
  'no gap below the low fails the classic rule': () => assert.deepEqual(piercings([red, bar(100, 103.2, 99.9, 103)]), []),
  'the relaxed rule accepts an open at the prior close': () => assert.deepEqual(piercings([red, bar(100, 103.2, 99.9, 103)], true), [{ index: 1, kind: 'piercing' }]),
  'dark cloud: gap above the high, close below the middle, above the open': () => assert.deepEqual(piercings([bar(100, 104.2, 99.8, 104), bar(104.5, 104.6, 100.8, 101)]), [{ index: 1, kind: 'dark-cloud' }]),
  "the site's piercing figure: one piercing line, at bar 7": () => assert.deepEqual(piercings(d.PIERCE), [{ index: 7, kind: 'piercing' }]),
  "the site's dark cloud figure: one dark cloud cover, at bar 7": () => assert.deepEqual(piercings(d.DARK), [{ index: 7, kind: 'dark-cloud' }]),
  "the site's thrusting figure is not a piercing line": () => assert.deepEqual(piercings(d.THRUST), []),
  'the measured numbers, as drawn and said': () => {
    assert.deepEqual([d.FIRST_OPEN, d.FIRST_CLOSE, d.FIRST_LOW, d.SECOND_OPEN, d.SECOND_CLOSE, d.PIERCE_MID, d.PIERCE_REACH], [103.24, 98.24, 98.04, 97.14, 101.54, 100.74, 66]);
    assert.equal(reach(red, bar(99.5, 103.2, 99.4, 103)), 75);
  },
  'the dark cloud numbers, as drawn': () => assert.deepEqual([d.DARK_FIRST_HIGH, d.DARK_SECOND_OPEN, d.DARK_SECOND_CLOSE, d.DARK_MID], [102.43, 103.23, 99.03, 99.63]),
  'confirmation and the trade': () => {
    assert.ok(d.CONFIRM_CLOSE > d.FIRST_OPEN);
    assert.deepEqual([d.PIERCE_ENTRY, d.PIERCE_STOP, d.PIERCE_RISK], [103.84, 96.84, 7]);
  },
  'the scale: only the piercing candle is a piercing line, in order of depth': () => {
    assert.deepEqual(d.SCALE.map((sc) => piercings([...sc.pair]).length), [0, 0, 0, 1, 0]);
    const closes = d.SCALE.map((sc) => sc.pair[1].c);
    assert.deepEqual([...closes].sort((a, b) => a - b), closes);
  },
  'the 24-hour version needs the relaxed rule': () => {
    assert.deepEqual(piercings(d.NO_GAP), []);
    assert.deepEqual(piercings(d.NO_GAP, true), [{ index: 7, kind: 'piercing' }]);
  },
  "Bulkowski's rates": () => assert.deepEqual([d.BULKOWSKI_PIERCING, d.BULKOWSKI_DARK_CLOUD, d.BULKOWSKI_BULL_ENGULF, d.BULKOWSKI_BEAR_ENGULF, d.BULKOWSKI_THRUSTING_REVERSAL], [64, 60, 63, 79, 57]),
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
