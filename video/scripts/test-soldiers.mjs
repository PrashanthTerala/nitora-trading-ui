/**
 * Tests for the soldiers lesson's video data: the detector (src/soldiers/detect.ts) against
 * hand-made candles and the site's own figures, and the numbers the video draws and says
 * (src/soldiers/data.ts).
 *
 *     node scripts/test-soldiers.mjs
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
execFileSync(process.execPath, [path.join(video, 'node_modules', 'esbuild', 'bin', 'esbuild'), path.join(video, 'src', 'soldiers', 'data.ts'), '--bundle', '--platform=node', '--format=esm', `--alias:@=${path.join(site, 'src')}`, `--outfile=${out}`, '--log-level=warning'], { cwd: site, stdio: 'inherit' });
const d = await import(pathToFileURL(out).href);
const { soldiers } = d;

const bar = (o, h, l, c) => ({ o, h, l, c });
const g1 = bar(100, 103.2, 99.8, 103); // body 100..103
const g2 = bar(102, 106.2, 101.8, 106);
const g3 = bar(105, 109.2, 104.8, 109);
const tests = {
  'soldiers: three tall green candles, each opening inside the last body and closing higher': () => assert.deepEqual(soldiers([g1, g2, g3]), [{ index: 2, kind: 'soldiers' }]),
  'an open above the previous body is not a soldier': () => assert.deepEqual(soldiers([g1, bar(103.5, 106.2, 103.3, 106), g3]), []),
  'a close below the previous close is not a soldier': () => assert.deepEqual(soldiers([g1, g2, bar(105, 106, 104.8, 105.8)]), []),
  'a long upper wick is not a soldier': () => assert.deepEqual(soldiers([g1, g2, bar(105, 112, 104.8, 109)]), []),
  'a third body under half the largest is not a soldier': () => assert.deepEqual(soldiers([g1, g2, bar(105, 107.1, 104.8, 106.9)]), []),
  'crows: the mirror': () => assert.deepEqual(soldiers([bar(103, 103.2, 99.8, 100), bar(101, 101.2, 97.8, 98), bar(99, 99.2, 94.8, 95)]), [{ index: 2, kind: 'crows' }]),
  "the site's figures: one each, ending at bar 7": () => {
    assert.deepEqual(soldiers(d.TWS), [{ index: 7, kind: 'soldiers' }]);
    assert.deepEqual(soldiers(d.TBC), [{ index: 7, kind: 'crows' }]);
  },
  'the variations: the advance block and the stalled pattern are not soldiers; identical three crows are crows': () => {
    assert.deepEqual(soldiers(d.ADVANCE_BLOCK), []);
    assert.deepEqual(soldiers(d.DELIBERATION), []);
    assert.deepEqual(soldiers(d.IDENTICAL), [{ index: 7, kind: 'crows' }]);
  },
  'the blow-off: soldiers only at the end of the rally': () => assert.deepEqual(soldiers(d.BLOWOFF), [{ index: 14, kind: 'soldiers' }]),
  'the soldiers, as drawn': () => assert.deepEqual([d.OPEN_2, d.OPEN_3, d.CLOSE_1, d.CLOSE_2, d.CLOSE_3, d.WICK], [102.44, 105.24, 103.14, 105.94, 108.84, 0.3]),
  'the crows, as drawn': () => assert.deepEqual([d.CROW_OPEN, d.CROW_CLOSE], [100.17, 91.57]),
  'the trades: at the third close, and on the pullback': () => assert.deepEqual([d.ENTRY, d.WIDE_STOP, d.WIDE_RISK, d.PULLBACK, d.TIGHT_STOP, d.TIGHT_RISK], [108.84, 99.84, 9, 107.04, 104.94, 2.1]),
  'the pullback candle fills at the middle of the third body and holds above the stop': () => {
    const b = d.PULLBACK_BARS[8];
    assert.ok(b.l <= d.PULLBACK && b.l > d.TIGHT_STOP);
  },
  "Bulkowski's rates and ranks": () => assert.deepEqual([d.BULKOWSKI_SOLDIERS, d.BULKOWSKI_CROWS, d.RANK_SOLDIERS, d.RANK_CROWS, d.PATTERNS, d.ADVANCE_BLOCK_UP, d.DELIBERATION_UP, d.IDENTICAL_CROWS], [82, 78, 32, 3, 103, 64, 77, 79]),
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
