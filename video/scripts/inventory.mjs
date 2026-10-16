/**
 * Builds the video curriculum inventory from the site's authoritative sources:
 *
 *   ../src/content/curriculum.ts          every module and lesson, in order (the source of truth)
 *   ../src/content/modules/<m>/<l>.mdx    each lesson's text
 *   ../src/content/glossary.ts            term names for the <Term> ids a lesson uses
 *
 * and writes
 *
 *   manifests/curriculum.json                       machine-readable, one record per lesson
 *   ../docs/video-production/CURRICULUM_INVENTORY.md  the same, for people
 *
 *   node scripts/inventory.mjs
 *
 * Everything recorded is read from those files. The few fields that are judgements rather than
 * facts (complexity, duration estimate, visual treatment) are computed by stated rules below and
 * carry an `estimate` or `proposed` label; none is presented as measured.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const video = join(here, '..');
const site = join(video, '..');
const rel = (p) => relative(site, p).replaceAll('\\', '/');
const SITE_URL = 'https://nitoratrading.com';

// ---------------------------------------------------------------- load the TypeScript sources
const tmp = mkdtempSync(join(tmpdir(), 'nitora-inventory-'));
const entry = join(tmp, 'entry.ts');
writeFileSync(entry, `export { CURRICULUM, TRACKS, LEVELS } from '@/content/curriculum';\nexport { GLOSSARY } from '@/content/glossary';\n`);
const out = join(tmp, 'bundle.mjs');
execFileSync(process.execPath, [join(video, 'node_modules/esbuild/bin/esbuild'), entry, '--bundle', '--format=esm', '--platform=node', `--outfile=${out}`, '--alias:@=./src', '--log-level=error'], { cwd: site });
const { CURRICULUM, TRACKS, LEVELS, GLOSSARY } = await import(pathToFileURL(out).href);
rmSync(tmp, { recursive: true, force: true });
const glossary = new Map(GLOSSARY.map((g) => [g.id, g.term]));

// ---------------------------------------------------------------- read each lesson
const words = (s) => (s.match(/[A-Za-z0-9][A-Za-z0-9'’.%$-]*/g) ?? []).length;
const uniq = (xs) => [...new Set(xs)];
const all = (src, re, group = 1) => [...src.matchAll(re)].map((m) => m[group]);

function readLesson(mod, lesson) {
  const file = join(site, 'src/content/modules', mod.id, `${lesson.id}.mdx`);
  let src;
  try {
    src = readFileSync(file, 'utf8');
  } catch {
    return { blocked: `source file missing: ${rel(file)}` };
  }
  const prose = src
    .replace(/<Quiz[\s\S]*?\/>/g, '')
    .replace(/<[A-Z][\s\S]*?>/g, ' ')
    .replace(/<\/[A-Z][A-Za-z]*>/g, ' ');
  const takeaways = (/<KeyTakeaways>([\s\S]*?)<\/KeyTakeaways>/.exec(src)?.[1] ?? '')
    .split('\n')
    .map((l) => l.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean);
  const quizBlock = /<Quiz questions=\{(\[[\s\S]*?\])\}\s*\/>/.exec(src)?.[1];
  let quiz = [];
  if (quizBlock) {
    try {
      // A JavaScript array literal written by a lesson author in this repository.
      quiz = new Function(`return ${quizBlock};`)();
    } catch {
      quiz = null;
    }
  }
  const callouts = all(src, /<Callout type="([a-z0-9]+)"(?:\s+title="([^"]*)")?/g, 0).map((m) => {
    const [, type, title] = /type="([a-z0-9]+)"(?:\s+title="([^"]*)")?/.exec(m);
    return { type, title: title ?? null };
  });
  const calloutCount = (type) => callouts.filter((c) => c.type === type).length;
  const termIds = uniq(all(src, /<Term\s+id="([^"]+)"/g));
  return {
    file: rel(file),
    sha256: createHash('sha256').update(src).digest('hex'),
    words: words(prose),
    headings: all(src, /^##\s+(.+)$/gm),
    keyTakeaways: takeaways,
    terms: termIds.map((id) => ({ id, term: glossary.get(id) ?? null })),
    figures: {
      pattern: all(src, /<PatternFigure\s+name="([^"]+)"/g),
      candle: all(src, /<CandleFigure\s+(?:preset|name)="([^"]+)"/g),
      indicator: all(src, /<IndicatorFigure\s+indicator="([^"]+)"/g),
      chartTypes: (src.match(/<ChartTypesFigure/g) ?? []).length,
      series: (src.match(/<SeriesFigure/g) ?? []).length,
    },
    calculators: uniq(all(src, /<(PositionSizer|ExpectancyCalc|RecoveryTable|StreakSimulator)\b/g)),
    calculations: callouts.filter((c) => c.type === 'math').map((c) => c.title ?? '(untitled)'),
    warnings: callouts.filter((c) => c.type === 'danger' || c.type === 'warning').map((c) => c.title ?? '(untitled)'),
    analogies: calloutCount('eli5'),
    tables: (src.match(/^\|.*\|\s*$\n^\|[\s:|-]+\|\s*$/gm) ?? []).length,
    quiz: quiz === null ? { questions: null, parseError: true } : { questions: quiz.length, items: quiz.map((q) => q.q) },
    tryIt: all(src, /<TryIt\s+to="([^"]+)"/g),
    links: uniq(all(src, /\]\((\/learn\/[^)#]+)\)/g)),
  };
}

// ---------------------------------------------------------------- stated rules for the judgement fields
/** Proposed visual treatment, by what the lesson contains first and its module second. */
function treatment(mod, l) {
  if (l.calculators.length || l.calculations.length >= 2) return 'step-by-step calculation with animated formula builder';
  if (l.figures.indicator.length) return 'animated price chart with computed indicator overlays';
  if (l.figures.pattern.length || l.figures.candle.length) return 'animated candlestick construction and pattern reveal';
  const byModule = {
    'm00-what-is-a-market': 'explainer diagrams and process flows',
    'm06-orders-and-execution': 'order book and bid/ask animation',
    'm07-risk-management': 'account, stop and position-size breakdown',
    'm08-trading-psychology': 'decision diagrams and hypothetical journal timelines',
    'm10-fundamentals-and-macro': 'explainer diagrams and event timelines',
    'm11-derivatives-and-other-markets': 'payoff diagrams and instrument comparisons',
  };
  return byModule[mod.id] ?? 'explainer diagrams with chart callouts';
}

/** Complexity 1-5 from size and technical density. A rule of thumb, not a measurement. */
function complexity(l) {
  let c = l.words > 1800 ? 3 : l.words > 1300 ? 2 : 1;
  if (l.calculations.length) c += 1;
  if (l.figures.indicator.length || l.calculators.length) c += 1;
  return Math.min(5, c);
}

/**
 * Video length estimate: a narration script of 30-40% of the lesson's prose, spoken at 140 words
 * a minute in English, plus about 20 s of titles and transitions. The real length is set by the
 * recorded narration; other languages run longer (Telugu ran ~25% longer than English in the
 * engulfing prototype).
 */
function duration(l) {
  const lo = (l.words * 0.3) / 140 + 0.33;
  const hi = (l.words * 0.4) / 140 + 0.33;
  return { minutesLow: +lo.toFixed(1), minutesHigh: +hi.toFixed(1), basis: '30-40% of lesson prose at 140 wpm + 20 s; estimate' };
}

// ---------------------------------------------------------------- assemble
const lessons = [];
for (const mod of CURRICULUM) {
  for (const lesson of mod.lessons) {
    const read = readLesson(mod, lesson);
    const base = {
      lessonKey: `${mod.id}/${lesson.id}`,
      moduleId: mod.id,
      moduleNumber: mod.number,
      moduleTitle: mod.title,
      level: mod.level,
      track: mod.track,
      lessonId: lesson.id,
      title: lesson.title,
      summary: lesson.summary,
      readingMinutes: lesson.minutes,
      kind: lesson.kind ?? 'reading',
      prerequisites: lesson.prerequisites ?? [],
      tags: lesson.tags ?? [],
      url: `${SITE_URL}/learn/${mod.id}/${lesson.id}`,
    };
    if (read.blocked) {
      lessons.push({ ...base, status: 'blocked', blockedReason: read.blocked });
      continue;
    }
    lessons.push({
      ...base,
      source: { file: read.file, sha256: read.sha256, words: read.words },
      outline: read.headings,
      objectivesFromKeyTakeaways: read.keyTakeaways,
      terms: read.terms,
      figures: read.figures,
      calculators: read.calculators,
      calculations: read.calculations,
      riskWarnings: read.warnings,
      analogies: read.analogies,
      tables: read.tables,
      quiz: read.quiz,
      practice: read.tryIt,
      linksToLessons: read.links,
      dataClassification: 'SYNTHETIC_EDUCATIONAL',
      complexityEstimate: complexity(read),
      videoDurationEstimate: duration(read),
      proposedVisualTreatment: treatment(mod, read),
      production: {
        status: base.lessonKey === 'm02-candlestick-patterns/06-engulfing' ? 'prototype-only' : base.lessonKey === 'm05-indicators/03-ma-crossovers' ? 'pilot-en-awaiting-review' : 'not-started',
        note: base.lessonKey === 'm02-candlestick-patterns/06-engulfing' ? 'Technical prototype (video/src/Engulfing.tsx). Built before this directive; does not meet its pilot standard.' : null,
      },
    });
  }
}

const summary = {
  generatedFrom: ['src/content/curriculum.ts', 'src/content/glossary.ts', 'src/content/modules/**/*.mdx'],
  tracks: TRACKS.map((t) => t.id),
  modules: CURRICULUM.length,
  lessons: lessons.length,
  blocked: lessons.filter((l) => l.status === 'blocked').length,
  lessonWords: lessons.reduce((n, l) => n + (l.source?.words ?? 0), 0),
  quizQuestions: lessons.reduce((n, l) => n + (l.quiz?.questions ?? 0), 0),
  withCalculations: lessons.filter((l) => l.calculations?.length).length,
  withIndicatorFigures: lessons.filter((l) => l.figures?.indicator.length).length,
  withRiskWarnings: lessons.filter((l) => l.riskWarnings?.length).length,
  estimatedVideoMinutesEnglish: [
    +lessons.reduce((n, l) => n + (l.videoDurationEstimate?.minutesLow ?? 0), 0).toFixed(0),
    +lessons.reduce((n, l) => n + (l.videoDurationEstimate?.minutesHigh ?? 0), 0).toFixed(0),
  ],
};

mkdirSync(join(video, 'manifests'), { recursive: true });
writeFileSync(join(video, 'manifests/curriculum.json'), JSON.stringify({ schema: 'nitora.video.curriculum/1', summary, lessons }, null, 2) + '\n');

// ---------------------------------------------------------------- the Markdown view
const md = [];
md.push('# Curriculum inventory for video production', '');
md.push('Generated by `video/scripts/inventory.mjs` from the site\'s authoritative sources. Do not edit by hand:');
md.push('change the sources and re-run it. The machine-readable version, with every field per lesson, is');
md.push('`video/manifests/curriculum.json`.', '');
md.push('## Sources inspected', '');
md.push('- `src/content/curriculum.ts`: the declared order of every module and lesson (the site\'s single source of truth).');
md.push('- `src/content/modules/<module>/<lesson>.mdx`: each lesson\'s text, read in full; its SHA-256 is recorded so a');
md.push('  video can be traced to the exact text it was made from.');
md.push('- `src/content/glossary.ts`: names for the glossary terms each lesson marks with `<Term>`.', '');
md.push('## Summary', '');
md.push('| | |', '|---|---|');
md.push(`| Tracks | ${summary.tracks.join(', ')} |`);
md.push(`| Modules | ${summary.modules} |`);
md.push(`| Lessons | ${summary.lessons} (${summary.blocked} blocked) |`);
md.push(`| Lesson prose | ${summary.lessonWords.toLocaleString('en-US')} words |`);
md.push(`| Quiz questions | ${summary.quizQuestions} |`);
md.push(`| Lessons with worked calculations | ${summary.withCalculations} |`);
md.push(`| Lessons with indicator figures | ${summary.withIndicatorFigures} |`);
md.push(`| Lessons with risk warnings | ${summary.withRiskWarnings} |`);
md.push(`| Estimated English video, all lessons | ${summary.estimatedVideoMinutesEnglish[0]}–${summary.estimatedVideoMinutesEnglish[1]} minutes (estimate) |`);
md.push('');
md.push('All figures in the lessons are drawn from deterministic presets or the site\'s synthetic market, so every');
md.push('chart example is classed `SYNTHETIC_EDUCATIONAL`. No lesson contains historical market data.', '');
md.push('**Field notes.** *Objectives* are the lesson\'s own Key Takeaways, verbatim; the lessons do not declare');
md.push('separate learning objectives. *Complexity* (1–5), *duration* and *visual treatment* are estimates from the');
md.push('rules in the generator, for planning only. Reading minutes are the curriculum\'s own figure.', '');
for (const mod of CURRICULUM) {
  const ls = lessons.filter((l) => l.moduleId === mod.id);
  md.push(`## Module ${mod.number}: ${mod.title}`, '');
  md.push(`\`${mod.id}\` · level: ${LEVELS[mod.level].label} · ${ls.length} lessons`, '');
  md.push('| # | Lesson | Words | Calc | Figures | Warnings | Quiz | Complexity | Est. video | Proposed treatment |');
  md.push('|---|---|---:|---:|---|---:|---:|---:|---|---|');
  ls.forEach((l, i) => {
    if (l.status === 'blocked') {
      md.push(`| ${i + 1} | ${l.title} (\`${l.lessonId}\`) | — | — | — | — | — | — | — | **BLOCKED**: ${l.blockedReason} |`);
      return;
    }
    const figs = [
      l.figures.pattern.length && `${l.figures.pattern.length} pattern`,
      l.figures.candle.length && `${l.figures.candle.length} candle`,
      l.figures.indicator.length && `${l.figures.indicator.length} indicator`,
      l.figures.chartTypes && 'chart types',
      l.calculators.length && l.calculators.join(', '),
    ].filter(Boolean).join('; ') || '—';
    const pilot = l.lessonKey === 'm05-indicators/03-ma-crossovers' ? ' **(pilot: English draft, awaiting review)**' : '';
    const proto = l.production.status === 'prototype-only' ? ' *(prototype exists)*' : '';
    md.push(`| ${i + 1} | [${l.title}](${l.url}) \`${l.lessonId}\`${pilot}${proto} | ${l.source.words} | ${l.calculations.length} | ${figs} | ${l.riskWarnings.length} | ${l.quiz.questions ?? 'parse error'} | ${l.complexityEstimate} | ${l.videoDurationEstimate.minutesLow}–${l.videoDurationEstimate.minutesHigh} min | ${l.proposedVisualTreatment} |`);
  });
  md.push('');
}
mkdirSync(join(site, 'docs/video-production'), { recursive: true });
writeFileSync(join(site, 'docs/video-production/CURRICULUM_INVENTORY.md'), md.join('\n') + '\n');
console.log(JSON.stringify(summary, null, 2));
