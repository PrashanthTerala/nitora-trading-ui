/**
 * Tests for the tweezers lesson's video data: the detectors (src/tweezers/detect.ts) against
 * hand-made pairs and the site's own figures, and the numbers the video draws and says
 * (src/tweezers/data.ts).
 *
 *     node scripts/test-tweezers.mjs
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
execFileSync(process.execPath, [path.join(video, 'node_modules', 'esbuild', 'bin', 'esbuild'), path.join(video, 'src', 'tweezers', 'data.ts'), '--bundle', '--platform=node', '--format=esm', `--alias:@=${path.join(site, 'src')}`, `--outfile=${out}`, '--log-level=warning'], { cwd: site, stdio: 'inherit' });
const d = await import(pathToFileURL(out).href);
const { tweezers, counterattacks } = d;

const bar = (o, h, l, c) => ({ o, h, l, c });
const tests = {
  'tweezer bottom: two lows that match': () => assert.deepEqual(tweezers([bar(102, 102.4, 97, 97.5), bar(97.6, 100, 97, 99.8)]), [{ index: 1, kind: 'bottom' }]),
  'lows within 0.05% of price still match': () => assert.deepEqual(tweezers([bar(102, 102.4, 100, 100.5), bar(100.6, 101.2, 100.04, 101)]), [{ index: 1, kind: 'bottom' }]),
  'lows further apart than 0.05% do not': () => assert.deepEqual(tweezers([bar(102, 102.4, 100, 100.5), bar(100.6, 101.2, 100.1, 101)]), []),
  'tweezer top: two highs that match': () => assert.deepEqual(tweezers([bar(98, 103.5, 97.7, 102.9), bar(102.8, 103.5, 98.4, 98.7)]), [{ index: 1, kind: 'top' }]),
  'bullish counterattack: a gap below the low, a close back at the close': () => assert.deepEqual(counterattacks([bar(103, 103.2, 97.5, 97.8), bar(94.5, 98.2, 94.2, 97.9)]), [{ index: 1, kind: 'bullish' }]),
  'a close well past the first close is not a counterattack (it pierces)': () => assert.deepEqual(counterattacks([bar(103, 103.2, 97.5, 97.8), bar(94.5, 101, 94.2, 100.8)]), []),
  'no gap, no counterattack': () => assert.deepEqual(counterattacks([bar(103, 103.2, 97.5, 97.8), bar(97.7, 98.2, 97.4, 97.9)]), []),
  "the site's figures: one pattern each, at bar 7": () => {
    assert.deepEqual(tweezers(d.TW_BOT).filter((t) => t.index >= 6), [{ index: 7, kind: 'bottom' }]);
    assert.deepEqual(tweezers(d.TW_TOP).filter((t) => t.index >= 6), [{ index: 7, kind: 'top' }]);
    assert.deepEqual(counterattacks(d.CA_BULL), [{ index: 7, kind: 'bullish' }]);
    assert.deepEqual(counterattacks(d.CA_BEAR), [{ index: 7, kind: 'bearish' }]);
  },
  'the range: six matching pairs, at the bars the video outlines': () => assert.deepEqual(d.RANGE_TWEEZERS.map((t) => `${t.index}${t.kind[0]}`), ['21t', '37b', '44t', '62t', '71b', '81b']),
  'the levels and the confirmation, as drawn': () => {
    assert.deepEqual([d.SHARED_LOW, d.SHARED_HIGH, d.PATTERN_HIGH, d.CONFIRM_CLOSE], [95.86, 104.61, 101.76, 102.86]);
    assert.ok(d.CONFIRM_CLOSE > d.PATTERN_HIGH);
  },
  'the trade: a 0.10 buffer below the shared low': () => assert.deepEqual([d.ENTRY, d.STOP, d.RISK], [102.86, 95.76, 7.1]),
  'the counterattack gaps, as drawn': () => assert.deepEqual([d.CA_FIRST_CLOSE, d.CA_GAP, d.CA_CLOSE_DIFF, d.CA_BEAR_FIRST_CLOSE, d.CA_BEAR_GAP], [97.86, 3.3, 0.1, 102.12, 3.2]),
  "Bulkowski's rates": () => assert.deepEqual([d.BULKOWSKI_TW_BOTTOM_CONT, d.BULKOWSKI_TW_TOP_CONT, d.BULKOWSKI_MEETING_BULL, d.BULKOWSKI_MEETING_BEAR], [52, 56, 56, 49]),
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
