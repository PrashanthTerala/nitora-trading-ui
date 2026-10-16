/**
 * Checks a video's narration script against the lesson it teaches, before anything is spoken
 * or rendered:
 *
 *   - the lesson file still has the sha256 the script was written from (so a lesson edit
 *     forces the script to be re-read, in every language);
 *   - every scene cites lesson lines that exist;
 *   - every language has every scene, and nothing extra;
 *   - every number the script says it takes from the chart equals what the engine computes.
 *
 *     node scripts/check.mjs ma-crossovers
 *
 * Exits non-zero on any failure.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const video = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.resolve(video, '..');
const name = process.argv[2] ?? 'ma-crossovers';
const spec = JSON.parse(readFileSync(path.join(video, 'narration', `${name}.json`), 'utf8'));
const problems = [];

// The lesson is unchanged since the script was written.
const lessonPath = path.join(site, spec.source.file);
const lesson = readFileSync(lessonPath);
const sha = createHash('sha256').update(lesson).digest('hex');
if (sha !== spec.source.sha256) problems.push(`${spec.source.file} changed since the script was written (now ${sha.slice(0, 12)}…, script has ${spec.source.sha256.slice(0, 12)}…): re-read it and update every language`);

// Every cited line exists, in the lesson or in the other lesson a scene names as its source.
for (const [id, meta] of Object.entries(spec.scenes)) {
  if (meta.lines.startsWith('curriculum.ts')) continue;
  const file = meta.source ? path.join(site, meta.source) : lessonPath;
  if (!existsSync(file)) {
    problems.push(`${id}: source ${meta.source} does not exist`);
    continue;
  }
  const lineCount = readFileSync(file, 'utf8').split('\n').length;
  for (const n of meta.lines.match(/\d+/g) ?? []) {
    if (Number(n) < 1 || Number(n) > lineCount) problems.push(`${id}: cites line ${n} of ${meta.source ?? spec.source.file}, which has ${lineCount}`);
  }
}

// Every language carries exactly the timing marks its scene declares, in order, so the
// visuals can sync to each language's own voice.
for (const [lang, script] of Object.entries(spec.languages)) {
  for (const [id, meta] of Object.entries(spec.scenes)) {
    const marks = [...(script.scenes[id] ?? '').matchAll(/<mark ([^>]+)>/g)].map((m) => m[1].trim());
    const want = meta.marks ?? [];
    if (marks.join(',') !== want.join(',')) problems.push(`${lang} ${id}: marks [${marks}], the scene declares [${want}]`);
  }
}

// Every language covers exactly the script's scenes.
const ids = Object.keys(spec.scenes);
for (const [lang, script] of Object.entries(spec.languages)) {
  const have = Object.keys(script.scenes);
  for (const id of ids) if (!have.includes(id)) problems.push(`${lang}: missing scene ${id}`);
  for (const id of have) if (!ids.includes(id)) problems.push(`${lang}: scene ${id} is not in the script`);
}

// Spoken chart numbers match the engine.
const claims = Object.entries(spec.scenes).flatMap(([id, meta]) => Object.entries(meta.computed ?? {}).map(([key, value]) => ({ id, key, value })));
const dataFile = path.join(video, 'src', name, 'data.ts');
if (claims.length && existsSync(dataFile)) {
  const out = path.join(mkdtempSync(path.join(tmpdir(), 'video-check-')), 'data.mjs');
  execFileSync(process.execPath, [path.join(video, 'node_modules', 'esbuild', 'bin', 'esbuild'), dataFile, '--bundle', '--platform=node', '--format=esm', `--alias:@=${path.join(site, 'src')}`, `--outfile=${out}`, '--log-level=warning'], { cwd: site, stdio: 'inherit' });
  const data = await import(pathToFileURL(out).href);
  for (const { id, key, value } of claims) {
    if (!(key in data)) problems.push(`${id}: ${key} is not exported by src/${name}/data.ts`);
    else if (data[key] !== value) problems.push(`${id}: the script says ${key} = ${value}, the engine computes ${data[key]}`);
  }
} else if (claims.length) {
  problems.push(`scenes cite computed numbers but src/${name}/data.ts does not exist`);
}

if (problems.length) {
  console.error(`${name}: ${problems.length} problem(s)`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`${name}: ok (lesson ${sha.slice(0, 12)}…, ${ids.length} scenes, ${Object.keys(spec.languages).join(', ')}, ${claims.length} computed number(s) match)`);
