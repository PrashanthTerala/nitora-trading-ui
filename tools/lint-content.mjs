/**
 * Validates every lesson MDX file against the contract in docs/CONTENT-GUIDE.md.
 * Run: node tools/lint-content.mjs [--verbose]
 *
 * Checks: file exists for every curriculum lesson, no H1, required components,
 * valid figure names, word count in range, quiz structure, and MDX hazards.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');

const src = (p) => readFileSync(join(root, p), 'utf8');

// --- parse the curriculum without executing TypeScript ---
const curr = src('src/content/curriculum.ts');
const modules = [];
{
  const modRe = /\{\s*\n\s*id: '([^']+)',\s*\n\s*number: (\d+),\s*\n\s*title: '((?:[^'\\]|\\.)*)'/g;
  let m;
  while ((m = modRe.exec(curr))) {
    const start = m.index;
    const lessonsIdx = curr.indexOf('lessons: [', start);
    const end = curr.indexOf('\n  },', lessonsIdx);
    const block = curr.slice(lessonsIdx, end);
    const lessons = [...block.matchAll(/\{ id: '([^']+)', title: '((?:[^'\\]|\\.)*)'[^}]*?minutes: (\d+)/g)].map((x) => ({
      id: x[1],
      title: x[2],
      minutes: +x[3],
    }));
    modules.push({ id: m[1], number: +m[2], title: m[3], lessons });
  }
}

// --- collect valid figure names ---
const figSrc = src('src/content/figures/candlePatterns.ts') + src('src/content/figures/chartPatterns.ts');
const figureNames = new Set([...figSrc.matchAll(/^\s{2}'([a-z0-9-]+)': \{$/gm)].map((m) => m[1]));
const INDICATORS = new Set(['sma', 'ema', 'sma-vs-ema', 'crossover', 'rsi', 'macd', 'stochastic', 'bollinger', 'atr', 'vwap', 'obv', 'adx', 'fibonacci', 'pivots', 'divergence', 'overload', 'clean']);
const REGIMES = new Set(['trend-up', 'trend-down', 'range', 'reversal', 'volatile', 'crash', 'intraday']);
const CALLOUTS = new Set(['tip', 'warning', 'danger', 'info', 'story', 'math', 'eli5']);

// --- glossary ids ---
let glossaryIds = new Set();
try {
  glossaryIds = new Set([...src('src/content/glossary.ts').matchAll(/\{ id: '([^']+)'/g)].map((m) => m[1]));
} catch {
  /* optional */
}

const errors = [];
const warnings = [];
const missing = [];
let totalWords = 0;
let present = 0;

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
