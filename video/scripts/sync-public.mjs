// The videos' public folder (video/public, not committed) holds the site assets they use, copied
// from the site's public/ so the two cannot drift, plus generated media such as Blender frames
// (public/blender/<scene>/<take>/). Run before studio and render; copies only what changed.
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const video = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const from = path.resolve(video, '..', 'public');
const to = path.join(video, 'public');
const ASSETS = ['fonts', 'favicon.svg'];

let copied = 0;
function copy(rel) {
  const src = path.join(from, rel);
  const dst = path.join(to, rel);
  const s = statSync(src);
  if (s.isDirectory()) return readdirSync(src).forEach((f) => copy(path.join(rel, f)));
  try {
    const d = statSync(dst);
    if (d.size === s.size && d.mtimeMs >= s.mtimeMs) return;
  } catch {}
  mkdirSync(path.dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  copied++;
}
ASSETS.forEach(copy);

// Indic fonts for localized on-screen text, from the video package's own @fontsource installs.
for (const [pkg, script] of [['noto-sans-telugu', 'telugu'], ['noto-sans-devanagari', 'devanagari']]) {
  for (const w of [400, 600, 700]) {
    const file = `${pkg}-${script}-${w}-normal.woff2`;
    const src = path.join(video, 'node_modules', '@fontsource', pkg, 'files', file);
    const dst = path.join(to, 'fonts-intl', file);
    mkdirSync(path.dirname(dst), { recursive: true });
    try {
      if (statSync(dst).size === statSync(src).size) continue;
    } catch {}
    copyFileSync(src, dst);
    copied++;
  }
}
console.log(`public/: ${copied} file(s) copied from the site`);
