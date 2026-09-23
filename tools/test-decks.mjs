/**
 * Builds every lesson's presentation deck, exactly as the site does, and checks it.
 * Run: node tools/test-decks.mjs [--verbose]
 *
 * Each lesson is compiled with the same MDX pipeline as vite.config.ts, with remark-slides
 * reporting the deck it built. For every lesson:
 *   - the module exports `slides`;
 *   - the deck has at least 3 slides, opens on the title slide and ends on the closing slide;
 *   - no slide is empty;
 *   - every quiz question has its own slide, in order, and the takeaways their summary slide;
 *   - every figure, callout and widget is on a slide;
 *   - no prose is lost or duplicated: the words on the prose slides are exactly the words of
 *     the lesson's prose.
 * Plus a hand-made <Deck> fixture, which must replace the automatic deck and leave the page.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';
import remarkSlides, { wordsOf, WORDS_PER_SLIDE } from './remark-slides.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');
const modulesDir = join(root, 'src/content/modules');

const PROSE_KINDS = new Set(['title', 'intro', 'section', 'table']);
const errors = [];
let lessons = 0;
let slidesTotal = 0;
let longest = { words: 0, where: '' };
let longestTable = { words: 0, where: '' };

async function build(source) {
  let deck;
  const code = String(await compile(source, { remarkPlugins: [remarkGfm, [remarkSlides, { onDeck: (d) => (deck = d) }]], providerImportSource: '@mdx-js/react' }));
  return { deck, code };
}

/** What the lesson itself contains, counted from its source tree rather than from the deck. */
function census(tree) {
  let proseWords = 0;
  let questions = 0;
  let takeaways = 0;
  let blocks = 0;
  for (const n of tree.children) {
    if (n.type === 'mdxJsxFlowElement') {
      if (n.name === 'Quiz') {
        const expr = n.attributes.find((a) => a.name === 'questions')?.value?.data?.estree?.body?.[0]?.expression;
        questions += expr?.elements?.length ?? 0;
      } else if (n.name === 'KeyTakeaways') takeaways++;
      else blocks++;
    } else if (!(n.type === 'heading' && n.depth === 2) && n.type !== 'thematicBreak' && n.type !== 'mdxjsEsm') {
      proseWords += wordsOf(n);
    }
  }
  return { proseWords, questions, takeaways, blocks };
}

for (const mod of readdirSync(modulesDir).sort()) {
  for (const file of readdirSync(join(modulesDir, mod)).filter((f) => f.endsWith('.mdx')).sort()) {
    const rel = `${mod}/${file}`;
    const err = (msg) => errors.push(`${rel}: ${msg}`);
    const source = readFileSync(join(modulesDir, mod, file), 'utf8');
    lessons++;

    // The source tree, before remark-slides rewrites it, for the census.
    let before;
    await compile(source, { remarkPlugins: [remarkGfm, () => (tree) => void (before = structuredClone(tree))] });
    const want = census(before);

    let built;
    try {
      built = await build(source);
    } catch (e) {
      err(`does not compile with remark-slides: ${e.message}`);
      continue;
    }
    const { deck, code } = built;
    const s = deck.slides;
    slidesTotal += s.length;

    if (!/export const slides\s*=/.test(code)) err('the module does not export `slides`');
    if (s.length < 3) err(`deck has ${s.length} slides, needs at least 3`);
    if (s[0]?.kind !== 'title') err(`deck opens on a ${s[0]?.kind} slide, not the title`);
    if (s.at(-1)?.kind !== 'closing') err(`deck ends on a ${s.at(-1)?.kind} slide, not the closing slide`);

    s.forEach((slide, i) => {
      const words = slide.nodes.reduce((a, n) => a + wordsOf(n), 0);
      const where = `slide ${i + 1} (${slide.kind}${slide.title ? `: ${slide.title}` : ''})`;
      if (['intro', 'section', 'table'].includes(slide.kind) && words === 0) err(`${where} is empty`);
      if (['figure', 'callout', 'widget', 'summary', 'question'].includes(slide.kind) && slide.nodes.length === 0) err(`${where} is empty`);
      if (slide.kind === 'question' && slide.nodes[0]?.name !== 'Quiz') err(`${where} has no quiz`);
      if (slide.kind === 'summary' && slide.nodes[0]?.name !== 'KeyTakeaways') err(`${where} has no takeaways`);
      if (slide.kind === 'table') {
        if (words > longestTable.words) longestTable = { words, where: `${rel} ${where}` };
      } else if (PROSE_KINDS.has(slide.kind) && words > longest.words) longest = { words, where: `${rel} ${where}` };
    });

    // Every quiz question, once each, numbered 1..n.
    const q = s.filter((x) => x.kind === 'question');
    if (q.length !== want.questions) err(`${want.questions} quiz questions but ${q.length} question slides`);
    if (!q.every((x, i) => x.part === i + 1 && x.parts === q.length)) err('question slides are not numbered 1..n');
    if (s.filter((x) => x.kind === 'summary').length !== want.takeaways) err('the takeaways do not have exactly one summary slide');
    const onSlides = s.filter((x) => ['figure', 'callout', 'widget'].includes(x.kind)).length;
    if (onSlides !== want.blocks) err(`${want.blocks} figures, callouts and widgets but ${onSlides} on slides`);

    // Nothing lost in the splitting, nothing said twice.
    const deckWords = s.filter((x) => PROSE_KINDS.has(x.kind)).reduce((a, x) => a + x.nodes.reduce((b, n) => b + wordsOf(n), 0), 0);
    if (deckWords !== want.proseWords) err(`the lesson has ${want.proseWords} words of prose but its slides have ${deckWords}`);

    if (verbose) console.log(`${rel.padEnd(62)} ${String(s.length).padStart(3)} slides`);
  }
}

// ---------------------------------------------------------------- a hand-made deck
{
  const fixture = [
    'A hook paragraph for the page.',
    '',
    '## A section',
    '',
    'Read-mode prose.',
    '',
    '<Deck>',
    '<Slide title="First">',
    '',
    'Slide one says this.',
    '',
    '<SlideNotes>',
    '',
    'Only the presenter sees this.',
    '',
    '</SlideNotes>',
    '</Slide>',
    '<Slide title="Second">',
    '',
    'Slide two says that.',
    '',
    '</Slide>',
    '</Deck>',
    '',
  ].join('\n');
  const { deck, code } = await build(fixture);
  const fail = (msg) => errors.push(`hand-made deck fixture: ${msg}`);
  if (deck.mode !== 'manual') fail(`mode is ${deck.mode}, not manual`);
  if (deck.slides.map((x) => x.kind).join() !== 'manual,manual,closing') fail(`slides are ${deck.slides.map((x) => x.kind).join()}`);
  if (deck.slides[0].title !== 'First' || deck.slides[1].title !== 'Second') fail('slide titles were not kept');
  // The <Deck> leaves the page: its text is compiled once, into the slides, not also into the page.
  const copies = code.split('Slide one says this').length - 1;
  if (copies !== 1) fail(`the slide text is compiled ${copies} times; the <Deck> should leave the page`);
  if (!code.includes('A hook paragraph for the page.')) fail('the page lost its own content');
}

console.log(`\nDecks: ${lessons} lessons, ${slidesTotal} slides, ${(slidesTotal / lessons).toFixed(1)} per lesson on average.`);
console.log(`Longest text slide: ${longest.words} words (target about ${WORDS_PER_SLIDE}; one paragraph or list is split only past 135), ${longest.where}`);
console.log(`Longest table slide: ${longestTable.words} words, ${longestTable.where}`);
if (errors.length) {
  console.log(`\nERRORS (${errors.length}):`);
  for (const e of errors) console.log('  ' + e);
  process.exit(1);
}
console.log('Every deck builds, and every slide, question and word is accounted for.');
