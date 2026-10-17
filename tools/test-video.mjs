/**
 * The lesson-video helpers (src/lib/video.ts) and the public video index (src/content/videos.json).
 * Run: node tools/test-video.mjs
 *
 * The index is what a public build ships, so it is held to the rules the player relies on: every
 * file under the media domain (never the development-only /media-local/), every lesson a real
 * lesson, every language complete, scene starts in order and inside the video.
 */
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = mkdtempSync(join(tmpdir(), 'tl-video-'));
writeFileSync(join(out, 'shim.ts'), "export * from '@/lib/video';\nexport { ALL_LESSONS } from '@/content/curriculum';\n");
execSync(`npx esbuild "${join(out, 'shim.ts')}" --bundle --format=esm --platform=node --outfile="${join(out, 'b.mjs')}" --alias:@=./src --log-level=error`, { cwd: root, stdio: 'inherit' });
const V = await import(pathToFileURL(join(out, 'b.mjs')).href);
rmSync(out, { recursive: true, force: true });

const MEDIA = 'https://media.nitoratrading.com/';
const en = { lang: 'en', duration: 100, scenes: [0, 10, 50], video: 'a.en.mp4', captions: 'a.en.vtt', credit: 'Voice: x.' };
const te = { lang: 'te', duration: 150, scenes: [0, 20, 80], video: 'a.te.mp4', captions: 'a.te.vtt', credit: 'Voice: y.' };

const tests = {
  'mapTime: the same share of the same scene': () => {
    assert.equal(V.mapTime(en, te, 30), 50); // halfway through scene 2 (10..50) -> halfway through 20..80
    assert.equal(V.mapTime(en, te, 75), 115); // halfway through the last scene (50..100) -> 80..150
    assert.equal(V.mapTime(te, en, 50), 30);
  },
  'mapTime: the start and the end map to the start and the end': () => {
    assert.equal(V.mapTime(en, te, 0), 0);
    assert.equal(V.mapTime(en, te, 100), 150);
  },
  'mapTime: without matching scenes, the same share of the whole': () => assert.equal(V.mapTime({ ...en, scenes: [] }, te, 50), 75),
  'parseVtt: timings and text, tags and settings dropped': () => {
    const vtt = 'WEBVTT\n\n1\n00:00:01.500 --> 00:00:04.000 align:start\nHello <b>there</b>.\n\n2\n00:01:02.000 --> 00:01:05.250\nTwo\nlines.\n';
    assert.deepEqual(V.parseVtt(vtt), [
      { start: 1.5, end: 4, text: 'Hello there.' },
      { start: 62, end: 65.25, text: 'Two lines.' },
    ]);
  },
  'parseVtt: Windows line endings': () => assert.equal(V.parseVtt('WEBVTT\r\n\r\n00:00:00.000 --> 00:00:01.000\r\nHi\r\n').length, 1),
  'formatTime: minutes and seconds': () => {
    assert.equal(V.formatTime(463.9), '7:43');
    assert.equal(V.formatTime(5), '0:05');
    assert.equal(V.formatTime(-3), '0:00');
  },
  'resumePoint: only past the opening and short of the end': () => {
    assert.equal(V.resumePoint(undefined, 400), 0);
    assert.equal(V.resumePoint(10, 400), 0);
    assert.equal(V.resumePoint(200, 400), 200);
    assert.equal(V.resumePoint(390, 400), 0);
  },
  'isoDuration: hours, minutes and seconds': () => {
    assert.equal(V.isoDuration(456.6), 'PT7M37S');
    assert.equal(V.isoDuration(3725), 'PT1H2M5S');
    assert.equal(V.isoDuration(120), 'PT2M');
    assert.equal(V.isoDuration(0), 'PT0S');
  },
  'videoObjects: one per language, only once published': () => {
    const entry = { base: 'https://media.nitoratrading.com/m/l', poster: 'poster.1.jpg', tracks: [en, te] };
    assert.deepEqual(V.videoObjects(entry, { name: 'L', description: 'D' }), []);
    const objs = V.videoObjects({ ...entry, published: '2026-10-17' }, { name: 'L', description: 'D' });
    assert.equal(objs.length, 2);
    assert.equal(objs[0].contentUrl, 'https://media.nitoratrading.com/m/l/a.en.mp4');
    assert.equal(objs[1].name, 'L (Telugu)');
    assert.equal(objs[0].uploadDate, '2026-10-17');
    assert.equal(objs[0].duration, 'PT1M40S');
  },
  'every language has a name in its own script': () => {
    for (const lang of ['en', 'te', 'hi', 'es']) assert.ok(V.LANGUAGE_NAMES[lang]?.native);
  },
  'the public index: media domain only, real lessons, complete languages': () => {
    const index = JSON.parse(readFileSync(join(root, 'src/content/videos.json'), 'utf8'));
    const lessons = new Set(V.ALL_LESSONS.map((l) => `${l.moduleId}/${l.id}`));
    for (const [key, entry] of Object.entries(index)) {
      assert.ok(lessons.has(key), `${key}: not a lesson`);
      assert.ok(entry.base.startsWith(MEDIA), `${key}: base ${entry.base} is not under ${MEDIA}`);
      assert.ok(entry.poster && entry.tracks.length > 0, `${key}: no poster or no languages`);
      assert.match(entry.published ?? '', /^\d{4}-\d{2}-\d{2}$/, `${key}: no publication date`);
      for (const t of entry.tracks) {
        for (const k of ['lang', 'video', 'captions', 'credit']) assert.ok(t[k], `${key}/${t.lang}: no ${k}`);
        assert.ok(t.duration > 0, `${key}/${t.lang}: no duration`);
        assert.ok(t.scenes.every((s, i) => s >= 0 && s < t.duration && (i === 0 || s > t.scenes[i - 1])), `${key}/${t.lang}: scene starts out of order`);
      }
    }
  },
};

let failed = 0;
for (const [name, fn] of Object.entries(tests)) {
  try {
    fn();
    console.log(`ok    ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL  ${name}\n      ${e.message}`);
  }
}
console.log(`${Object.keys(tests).length - failed}/${Object.keys(tests).length} passed`);
process.exit(failed ? 1 : 0);
