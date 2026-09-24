/**
 * Validates every lesson MDX file against the contract in docs/CONTENT-GUIDE.md.
 * Run: node tools/lint-content.mjs [--verbose]
 *
 * Checks: file exists for every curriculum lesson, no H1, required components,
 * only registered components, unique heading anchors, valid figure names, word count
 * in range, quiz structure, and MDX hazards.
 */
import { readFileSync, existsSync, readdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');

const src = (p) => readFileSync(join(root, p), 'utf8');

// --- load the curriculum itself ---
// Bundled with esbuild and imported, as tools/test-engine.mjs does, rather than matched with
// regular expressions: the schema now carries tracks and optional lesson fields, and
// prerequisites can only be checked against the real data.
const tmp = mkdtempSync(join(tmpdir(), 'lint-content-'));
// The component registry's names and the heading slug come along: both are plain modules.
writeFileSync(join(tmp, 'shim.ts'), "export * from '@/content/curriculum';\nexport { MDX_GROUPS, PLANNED_COMPONENTS } from '@/components/mdx/names';\nexport { slugify } from '@/lib/slug';\n");
execSync(`npx esbuild "${join(tmp, 'shim.ts')}" --bundle --format=esm --platform=node --outfile="${join(tmp, 'c.mjs')}" --alias:@=./src --log-level=error`, { cwd: root });
const C = await import(pathToFileURL(join(tmp, 'c.mjs')).href);
rmSync(tmp, { recursive: true, force: true });
const modules = C.CURRICULUM;

const errors = [];
const warnings = [];
const missing = [];

// --- curriculum schema: tracks, levels, ids, optional lesson fields, prerequisites ---
{
  const KINDS = new Set(['reading', 'interactive', 'lab']);
  const DECKS = new Set(['auto', 'manual', 'none']);
  const cerr = (msg) => errors.push(`curriculum: ${msg}`);
  const trackIds = new Set(C.TRACKS.map((t) => t.id));
  for (const t of C.TRACKS) {
    for (const lv of t.levels) if (!C.LEVELS[lv]) cerr(`track ${t.id} lists unknown level "${lv}"`);
    if (!modules.some((m) => m.track === t.id)) cerr(`track ${t.id} has no modules`);
  }
  // Module ids are the route (/learn/:moduleId), so they must be unique across every track.
  const seenModules = new Set();
  const keys = new Set();
  for (const m of modules) {
    if (seenModules.has(m.id)) cerr(`module id ${m.id} is used twice`);
    seenModules.add(m.id);
    if (!trackIds.has(m.track)) cerr(`${m.id} belongs to unknown track "${m.track}"`);
    else if (!C.TRACKS.find((t) => t.id === m.track).levels.includes(m.level)) cerr(`${m.id} has level "${m.level}", which its track ${m.track} does not list`);
    const seenLessons = new Set();
    for (const l of m.lessons) {
      if (seenLessons.has(l.id)) cerr(`lesson id ${m.id}/${l.id} is used twice`);
      seenLessons.add(l.id);
      keys.add(`${m.id}/${l.id}`);
      if (l.kind !== undefined && !KINDS.has(l.kind)) cerr(`${m.id}/${l.id} has unknown kind "${l.kind}"`);
      if (l.deck !== undefined && !DECKS.has(l.deck)) cerr(`${m.id}/${l.id} has unknown deck mode "${l.deck}"`);
      if (l.tags !== undefined && !(Array.isArray(l.tags) && l.tags.every((t) => typeof t === 'string' && t.trim()))) cerr(`${m.id}/${l.id} has tags that are not non-empty strings`);
    }
  }
  // Prerequisites: each must name a real lesson, never the lesson itself, and never loop.
  const prereqs = new Map();
  for (const m of modules)
    for (const l of m.lessons) {
      const key = `${m.id}/${l.id}`;
      const list = l.prerequisites ?? [];
      prereqs.set(key, list);
      for (const p of list) {
        if (p === key) cerr(`${key} lists itself as a prerequisite`);
        else if (!keys.has(p)) cerr(`${key} has prerequisite "${p}", which is not a lesson (use "moduleId/lessonId")`);
      }
    }
  const state = new Map(); // 1 = visiting, 2 = done
  const visit = (key, path) => {
    if (state.get(key) === 2) return;
    if (state.get(key) === 1) {
      cerr(`prerequisite cycle: ${[...path.slice(path.indexOf(key)), key].join(' -> ')}`);
      return;
    }
    state.set(key, 1);
    for (const p of prereqs.get(key) ?? []) if (keys.has(p) && p !== key) visit(p, [...path, key]);
    state.set(key, 2);
  };
  for (const key of keys) visit(key, []);
}

// --- collect valid figure names ---
const figSrc = src('src/content/figures/candlePatterns.ts') + src('src/content/figures/chartPatterns.ts');
const figureNames = new Set([...figSrc.matchAll(/^\s{2}'([a-z0-9-]+)': \{$/gm)].map((m) => m[1]));
const INDICATORS = new Set(['sma', 'ema', 'sma-vs-ema', 'crossover', 'rsi', 'macd', 'stochastic', 'bollinger', 'atr', 'vwap', 'obv', 'adx', 'fibonacci', 'pivots', 'divergence', 'overload', 'clean']);
const REGIMES = new Set(['trend-up', 'trend-down', 'range', 'reversal', 'volatile', 'crash', 'intraday']);
// Every component a lesson may use, from the registry's own name list (src/components/mdx/names.ts).
const REGISTERED = new Set(Object.values(C.MDX_GROUPS).flat());
const PLANNED = new Set(C.PLANNED_COMPONENTS);
// Ids the lesson page gives its own sections; a heading with the same slug would collide.
const RESERVED_IDS = new Set(['key-takeaways', 'quiz']);
const CALLOUTS = new Set(['tip', 'warning', 'danger', 'info', 'story', 'math', 'eli5']);
/** Modules that teach shapes, where every lesson must carry at least one figure. */
const VISUAL_MODULES = new Set(['m01-reading-price', 'm02-candlestick-patterns', 'm03-market-structure', 'm04-chart-patterns', 'm05-indicators']);

// --- glossary ids ---
let glossaryIds = new Set();
try {
  glossaryIds = new Set([...src('src/content/glossary.ts').matchAll(/\{ id: '([^']+)'/g)].map((m) => m[1]));
} catch {
  /* optional */
}

let totalWords = 0;
let present = 0;

// Module artwork: every file a module's `art` names must exist (tools/render-art.mjs writes the
// images, src/assets/glyphs holds the glyphs). A module without art is allowed -- it shows a
// placeholder cover -- but is worth knowing about.
for (const mod of modules) {
  if (!mod.art) {
    warnings.push(`curriculum: ${mod.id} has no art yet (run tools/render-art.mjs once its scene exists)`);
    continue;
  }
  for (const key of ['dark', 'light', 'darkSmall', 'lightSmall', 'og']) {
    const path = mod.art[key];
    if (path && !existsSync(join(root, 'public', path))) errors.push(`curriculum: ${mod.id} art.${key} names ${path}, which does not exist in public/`);
  }
  if (mod.art.glyph && !existsSync(join(root, 'src/assets/glyphs', `${mod.art.glyph}.svg`))) errors.push(`curriculum: ${mod.id} names glyph "${mod.art.glyph}", but src/assets/glyphs/${mod.art.glyph}.svg does not exist`);
}

for (const mod of modules) {
  for (const lesson of mod.lessons) {
    const rel = `src/content/modules/${mod.id}/${lesson.id}.mdx`;
    if (!existsSync(join(root, rel))) {
      missing.push(rel);
      continue;
    }
    present++;
    const text = src(rel);
    const err = (msg) => errors.push(`${rel}: ${msg}`);
    const warn = (msg) => warnings.push(`${rel}: ${msg}`);

    // Strip code fences and component tags for prose checks. Attribute content is
    // matched with [^<>]* so a non-self-closing tag cannot swallow the rest of the file.
    const prose = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/<Quiz[^<>]*\/>/g, '')
      .replace(/<\/?[A-Z]\w*[^<>]*>/g, '');

    const words = prose.split(/\s+/).filter(Boolean).length;
    totalWords += words;

    // structure
    if (/^# /m.test(text)) err('has an H1 (the page shell renders the title)');
    if (!/^## /m.test(text)) err('has no ## section headings');
    if (!/<KeyTakeaways>/.test(text)) err('missing <KeyTakeaways>');
    if (!/<Quiz\s/.test(text)) err('missing <Quiz>');
    if (!/<Callout type="eli5"/.test(text)) warn('no eli5 callout');

    // Only registered components. MDX would otherwise fail on the page, at read time, with
    // "Expected component X to be defined" -- the linter says so at build time instead.
    const code = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
    for (const name of new Set([...code.matchAll(/<([A-Z][A-Za-z0-9]*)/g)].map((m) => m[1]))) {
      if (REGISTERED.has(name)) continue;
      if (PLANNED.has(name)) err(`uses <${name}>, which is planned for the quant track but not built yet`);
      else err(`uses <${name}>, which is not a registered component (see src/components/mdx/names.ts)`);
    }

    // Headings become anchors (#slug); the build numbers repeats (-2, -3), but a heading that
    // takes a section id the lesson page itself uses would still collide.
    for (const m of code.matchAll(/^#{2,3} +(.+?)\s*$/gm)) {
      const plain = m[1].replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/<[^>]*>/g, '').replace(/[*_`]/g, '');
      const slug = C.slugify(plain);
      if (RESERVED_IDS.has(slug)) err(`heading "${m[1]}" would take the id "${slug}", which the lesson page uses for its own section`);
    }

    // A hand-made deck and the curriculum must agree, so `deck: "manual"` always means one exists.
    const handMade = /^<Deck>/m.test(code);
    if (handMade && lesson.deck !== 'manual') err('has a hand-made <Deck>; set deck: "manual" on the lesson in curriculum.ts');
    if (!handMade && lesson.deck === 'manual') err('is marked deck: "manual" in curriculum.ts but has no <Deck>');

    // callout types
    for (const m of text.matchAll(/<Callout\s+type="([^"]+)"/g)) if (!CALLOUTS.has(m[1])) err(`unknown callout type "${m[1]}"`);

    // figure names
    for (const m of text.matchAll(/<PatternFigure[^>]*\sname="([^"]+)"/g)) if (!figureNames.has(m[1])) err(`unknown figure name "${m[1]}"`);
    for (const m of text.matchAll(/<IndicatorFigure[^>]*\sindicator="([^"]+)"/g)) if (!INDICATORS.has(m[1])) err(`unknown indicator "${m[1]}"`);
    for (const m of text.matchAll(/<(?:IndicatorFigure|ChartTypesFigure)[^>]*\sregime="([^"]+)"/g)) if (!REGIMES.has(m[1])) err(`unknown regime "${m[1]}"`);
    for (const m of text.matchAll(/<Term\s+id="([^"]+)"/g)) if (glossaryIds.size && !glossaryIds.has(m[1])) warn(`Term id "${m[1]}" is not in the glossary`);

    // internal links must resolve
    for (const m of text.matchAll(/\]\((\/learn\/[a-z0-9-]+\/[a-z0-9-]+)\)/g)) {
      const [, path] = m;
      const [, , modId, lessonId] = path.split('/');
      const target = modules.find((x) => x.id === modId)?.lessons.some((l) => l.id === lessonId);
      if (!target) err(`broken lesson link ${path}`);
    }
    for (const m of text.matchAll(/<TryIt[^>]*\sto="([^"]+)"/g)) {
      if (!['/simulator', '/trainer', '/journal', '/glossary', '/learn'].includes(m[1]) && !m[1].startsWith('/learn/')) err(`TryIt points at unknown route ${m[1]}`);
    }

    // The guide requires a figure in any lesson about candles, patterns, structure or
    // indicators. Those modules teach shapes, and a shape lesson with no picture is a
    // wall of adjectives. Two slipped through before this was enforced.
    if (VISUAL_MODULES.has(mod.id) && !/<(PatternFigure|CandleFigure|IndicatorFigure|ChartTypesFigure)\b/.test(text)) {
      err('is in a visual module but has no figure');
    }

    // <Compare> renders a two-column grid and expects exactly two markdown lists as
    // children. With one list, or with the blank lines missing, every bullet lands in
    // the left column under the wrong heading and the figure reads as nonsense.
    for (const m of text.matchAll(/<Compare[^>]*>([\s\S]*?)<\/Compare>/g)) {
      const blocks = m[1].trim().split(/\n\s*\n/).filter((b) => b.trim());
      const lists = blocks.filter((b) => /^\s*[-*]\s/.test(b));
      if (lists.length !== 2) err(`<Compare> has ${lists.length} markdown lists, needs exactly 2 (one per column)`);
    }

    // quiz structure
    const quizMatch = text.match(/<Quiz\s+questions=\{(\[[\s\S]*?\])\}\s*\/>/);
    if (!quizMatch) {
      if (/<Quiz/.test(text)) err('quiz present but questions prop could not be parsed');
    } else {
      try {
        // eslint-disable-next-line no-new-func
        const qs = new Function(`return ${quizMatch[1]}`)();
        if (!Array.isArray(qs) || qs.length < 3) err(`quiz has ${Array.isArray(qs) ? qs.length : '?'} questions (want 4 to 6)`);
        qs.forEach((q, i) => {
          if (!q.q) err(`quiz q${i + 1} missing question text`);
          if (!Array.isArray(q.options) || q.options.length < 2) err(`quiz q${i + 1} needs at least 2 options`);
          if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= (q.options?.length ?? 0)) err(`quiz q${i + 1} answer index ${q.answer} is out of range`);
        });
      } catch (e) {
        err(`quiz is not valid JavaScript: ${e.message}`);
      }
    }

    // MDX hazards in prose
    const proseLines = prose.split('\n');
    proseLines.forEach((line, i) => {
      if (/^\s{0,3}(\||>|#|-|\d+\.)/.test(line)) return; // tables, quotes, lists are fine
      const bare = line.match(/(?<![\w"'`=])<(?![A-Za-z/!])|(?<![\w"'`/=])>(?![\s\w])/);
      if (bare && !line.includes('&lt;') && !line.includes('&gt;')) warn(`line ${i + 1}: possible bare angle bracket: ${line.trim().slice(0, 70)}`);
    });

    // word count vs target
    const target = lesson.minutes * 150;
    if (words < target * 0.45) warn(`short: ${words} words for a ${lesson.minutes} min lesson (target ~${target})`);
    if (words > target * 2.6) warn(`long: ${words} words for a ${lesson.minutes} min lesson (target ~${target})`);
  }
}

// orphan files not in the curriculum
for (const dir of readdirSync(join(root, 'src/content/modules'), { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const mod = modules.find((m) => m.id === dir.name);
  if (!mod) {
    errors.push(`orphan module directory: ${dir.name}`);
    continue;
  }
  for (const f of readdirSync(join(root, 'src/content/modules', dir.name))) {
    if (!f.endsWith('.mdx')) continue;
    if (!mod.lessons.some((l) => `${l.id}.mdx` === f)) errors.push(`orphan lesson file not in curriculum: ${dir.name}/${f}`);
  }
}

const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);
console.log(`\nLessons: ${present}/${totalLessons} present · ${totalWords.toLocaleString()} words · ${figureNames.size} figures · ${glossaryIds.size} glossary terms\n`);

if (missing.length) {
  console.log(`MISSING (${missing.length}):`);
  for (const m of missing) console.log('  ' + m);
  console.log();
}
if (errors.length) {
  console.log(`ERRORS (${errors.length}):`);
  for (const e of errors) console.log('  ' + e);
  console.log();
}
if (warnings.length) {
  console.log(`WARNINGS (${warnings.length}):`);
  const show = verbose ? warnings : warnings.slice(0, 40);
  for (const w of show) console.log('  ' + w);
  if (!verbose && warnings.length > show.length) console.log(`  … and ${warnings.length - show.length} more (--verbose)`);
  console.log();
}
if (!missing.length && !errors.length) console.log('All lessons present and structurally valid.\n');

process.exit(errors.length || missing.length ? 1 : 0);
