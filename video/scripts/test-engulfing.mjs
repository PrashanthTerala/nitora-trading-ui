/**
 * Tests for the engulfing lesson's video data: the detector (src/engulfing/detect.ts) against
 * hand-made pairs and the site's own figures, and the numbers the video draws and says
 * (src/engulfing/data.ts).
 *
 *     node scripts/test-engulfing.mjs
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
execFileSync(process.execPath, [path.join(video, 'node_modules', 'esbuild', 'bin', 'esbuild'), path.join(video, 'src', 'engulfing', 'data.ts'), '--bundle', '--platform=node', '--format=esm', `--alias:@=${path.join(site, 'src')}`, `--outfile=${out}`, '--log-level=warning'], { cwd: site, stdio: 'inherit' });
const d = await import(pathToFileURL(out).href);
const { engulfings, coveredBodies } = d;

const bar = (o, h, l, c) => ({ o, h, l, c });
const tests = {
  'bullish pair': () => assert.deepEqual(engulfings([bar(101, 101.5, 99, 99.5), bar(99.2, 102.5, 99, 102)]), [{ index: 1, direction: 'bullish' }]),
  'bearish pair': () => assert.deepEqual(engulfings([bar(99.5, 101, 99, 100.5), bar(100.8, 101, 98, 98.6)]), [{ index: 1, direction: 'bearish' }]),
  'same colour is not engulfing': () => assert.deepEqual(engulfings([bar(100, 101, 99.5, 100.5), bar(99.8, 102, 99.5, 101.8)]), []),
  'a body that does not cover is not engulfing': () => assert.deepEqual(engulfings([bar(101, 101.5, 99, 99.5), bar(99.8, 102.5, 99.6, 102)]), []),
  'only bodies count, not wicks': () => assert.deepEqual(engulfings([bar(101, 104, 96, 99.5), bar(99.2, 102, 99, 101.5)]), [{ index: 1, direction: 'bullish' }]),
  'equal bodies do not count': () => assert.deepEqual(engulfings([bar(101, 101.5, 99, 100), bar(100, 101.5, 99.5, 101)]), []),
  'a doji is neither colour': () => assert.deepEqual(engulfings([bar(100, 100.5, 99.5, 100), bar(99.5, 101, 99, 100.8)]), []),
  "the site's bullish figure: one engulfing, at bar 7": () => assert.deepEqual(engulfings(d.BULL).filter((e) => e.index <= 7), [{ index: 7, direction: 'bullish' }]),
  "the site's bearish figure: one engulfing, at bar 7": () => assert.deepEqual(engulfings(d.BEAR).filter((e) => e.index <= 7), [{ index: 7, direction: 'bearish' }]),
  'the range: seven engulfings, at the bars the video outlines': () => assert.deepEqual(d.RANGE_ENGULFINGS.map((e) => e.index), [1, 8, 26, 35, 44, 71, 80]),
  'every illustration ends in a bullish engulfing at bar 7': () => assert.equal(d.ILLUSTRATIONS_VALID, true),
  'the count panel covers four bodies': () => {
    assert.equal(d.COUNT_COVERED, 4);
    assert.equal(coveredBodies(d.BULL, 7), 2); // the figure's engulfing body also covers bar 5's
  },
  'the trade: entry, stop and risk as drawn and said': () => {
    assert.equal(d.BULL_ENTRY, 105.22);
    assert.equal(d.BULL_STOP, 98.52);
    assert.equal(d.BULL_RISK, 6.7);
    assert.ok(d.BULL_ENTRY > d.BULL_ENGULF_HIGH, 'the confirmation closes above the engulfing high');
  },
  'the trap: the giant candle is three times the average range': () => {
    const g = d.TRAP_GIANT[7];
    assert.equal(Math.round((g.h - g.l) * 100) / 100, d.GIANT_RANGE);
    assert.equal(d.GIANT_RANGE, Math.round(d.AVG_RANGE * 3 * 100) / 100);
    assert.ok(d.GIANT_RISK > d.NORMAL_RISK);
  },
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
