/**
 * remark-slides: turns a lesson's MDX into a slide deck at build time.
 *
 * Auto deck (the default):
 *   - the hook (everything before the first ##) becomes the title slide, continued on
 *     "intro" slides if it runs long;
 *   - each ## section becomes prose slides of about 90 words ("...(2/3)" when split), and
 *     each figure, callout, table or widget in it gets a slide of its own, full width;
 *   - <KeyTakeaways> becomes a summary slide, each <Quiz> question its own slide;
 *   - a closing slide ends the deck.
 * Manual deck: if a lesson contains <Deck><Slide title="...">...</Slide></Deck>, those slides
 * are used instead, and the <Deck> is removed from the page itself.
 *
 * Output, in the lesson module:
 *   - the lesson's own content, wrapped in `<LessonBody>`, then `<DeckSource>` holding one
 *     `<Slide>` per slide. The page swaps what each renders: reading, LessonBody is the content
 *     and DeckSource nothing; presenting, the reverse. The slide bodies stay compiled JSX, so
 *     their components resolve through the MDX provider like the rest of the lesson -- an ESM
 *     export could not do that.
 *   - `export const slides = { mode, count, outline }`, the deck's shape as plain data, so the
 *     lesson page knows a deck exists and what is in it without rendering anything.
 *
 * No dependencies: the mdast and estree it builds are small enough to write by hand.
 */

export const WORDS_PER_SLIDE = 90;
/** A single paragraph or list longer than this is split; shorter ones stay whole. */
const SPLIT_OVER = 135;

const FIGURES = new Set(['PatternFigure', 'CandleFigure', 'IndicatorFigure', 'ChartTypesFigure', 'SeriesFigure']);
const CALLOUTS = new Set(['Callout', 'TryIt']);
const PROSE = new Set(['paragraph', 'list', 'blockquote', 'code', 'heading']);

const isJsx = (n, name) => n.type === 'mdxJsxFlowElement' && (name === undefined || n.name === name);

/** Plain text of a node, blocks separated by spaces. */
export function textOf(node) {
  if (node.type === 'text' || node.type === 'inlineCode' || node.type === 'code') return node.value;
  if (!node.children) return '';
  const inline = node.type === 'paragraph' || node.type === 'heading' || node.type === 'link' || node.type === 'strong' || node.type === 'emphasis' || node.type === 'mdxJsxTextElement' || node.type === 'tableCell';
  return node.children.map(textOf).join(inline ? '' : ' ');
}

export const wordsOf = (node) => textOf(node).split(/\s+/).filter(Boolean).length;

const clone = (n) => structuredClone(n);

// ------------------------------------------------------------------ splitting long prose

/** Split a long paragraph at sentence ends inside its text nodes, into ~90-word paragraphs. */
function splitParagraph(p) {
  const sentences = [];
  let current = [];
  for (const child of p.children) {
    if (child.type !== 'text') {
      current.push(child);
      continue;
    }
    const pieces = child.value.split(/(?<=[.!?])\s+(?=[A-Z"“(])/);
    pieces.forEach((piece, i) => {
      current.push({ type: 'text', value: piece });
      if (i < pieces.length - 1) {
        sentences.push(current);
        current = [];
      }
    });
  }
  if (current.length) sentences.push(current);
  const paragraphs = [];
  let buf = [];
  let words = 0;
  for (const s of sentences) {
    const w = wordsOf({ type: 'paragraph', children: s });
    if (buf.length && words + w > WORDS_PER_SLIDE) {
      paragraphs.push(buf);
      buf = [];
      words = 0;
    }
    if (buf.length) buf.push({ type: 'text', value: ' ' });
    buf.push(...s);
    words += w;
  }
  if (buf.length) paragraphs.push(buf);
  return paragraphs.map((children) => ({ type: 'paragraph', children }));
}

/** Split a long list between items, keeping an ordered list's numbering. */
function splitList(list) {
  const out = [];
  let items = [];
  let words = 0;
  let start = list.start ?? 1;
  const flush = () => {
    out.push({ ...list, start: list.ordered ? start : list.start, children: items });
    start += items.length;
    items = [];
    words = 0;
  };
  for (const item of list.children) {
    const w = wordsOf(item);
    if (items.length && words + w > WORDS_PER_SLIDE) flush();
    items.push(item);
    words += w;
  }
  if (items.length) flush();
  return out;
}

/** Prose units, with any over-long paragraph or list broken into slide-sized pieces. */
function expand(nodes) {
  return nodes.flatMap((n) => {
    if (wordsOf(n) <= SPLIT_OVER) return [n];
    if (n.type === 'paragraph') return splitParagraph(n);
    if (n.type === 'list') return splitList(n);
    return [n];
  });
}

/** Pack prose units greedily into chunks of about WORDS_PER_SLIDE. */
function chunk(nodes) {
  const chunks = [];
  let buf = [];
  let words = 0;
  for (const n of expand(nodes)) {
    const w = wordsOf(n);
    // A ### starts a new slide when the current one already has some substance.
    const newTopic = n.type === 'heading' && words >= WORDS_PER_SLIDE / 2;
    if (buf.length && (words + w > WORDS_PER_SLIDE || newTopic)) {
      chunks.push(buf);
      buf = [];
      words = 0;
    }
    buf.push(n);
    words += w;
  }
  // A heading must not end a slide on its own, away from the text it introduces.
  if (buf.length) chunks.push(buf);
  for (let i = 0; i < chunks.length - 1; i++) {
    const last = chunks[i][chunks[i].length - 1];
    if (last.type === 'heading') chunks[i + 1].unshift(chunks[i].pop());
  }
  return chunks.filter((c) => c.length);
}

// ------------------------------------------------------------------ building the deck

function quizQuestionCount(node) {
  const attr = node.attributes?.find((a) => a.name === 'questions');
  const expr = attr?.value?.data?.estree?.body?.[0]?.expression;
  return expr?.type === 'ArrayExpression' ? expr.elements.length : 0;
}

/** The slides for one run of nodes (a ## section, or the hook) in reading order. */
function sectionSlides(nodes, title) {
  const slides = [];
  let prose = [];
  const flush = () => {
    for (const c of chunk(prose)) slides.push({ kind: 'section', title, nodes: c });
    prose = [];
  };
  for (const n of nodes) {
    if (PROSE.has(n.type)) {
      prose.push(n);
      continue;
    }
    if (n.type === 'thematicBreak') continue;
    flush();
    if (n.type === 'table') slides.push({ kind: 'table', title, nodes: [n] });
    else if (isJsx(n, 'KeyTakeaways')) slides.push({ kind: 'summary', title: '', nodes: [n] });
    else if (isJsx(n, 'Quiz')) {
      const count = quizQuestionCount(n);
      for (let q = 0; q < count; q++) slides.push({ kind: 'question', title: '', part: q + 1, parts: count, nodes: [n] });
    } else if (isJsx(n) && FIGURES.has(n.name)) slides.push({ kind: 'figure', title, nodes: [n] });
    else if (isJsx(n, 'TryIt')) slides.push({ kind: 'callout', title: '', nodes: [n] });
    else if (isJsx(n) && CALLOUTS.has(n.name)) slides.push({ kind: 'callout', title, nodes: [n] });
    else if (isJsx(n)) slides.push({ kind: 'widget', title, nodes: [n] });
  }
  flush();
  // Number the prose slides of the section: "(2/3)".
  const prosy = slides.filter((s) => s.kind === 'section');
  if (prosy.length > 1) prosy.forEach((s, i) => Object.assign(s, { part: i + 1, parts: prosy.length }));
  return slides;
}

export function buildDeck(root) {
  const manual = root.children.find((n) => isJsx(n, 'Deck'));
  if (manual) {
    const slides = manual.children
      .filter((n) => isJsx(n, 'Slide'))
      .map((n) => ({ kind: 'manual', title: n.attributes.find((a) => a.name === 'title')?.value ?? '', nodes: n.children }));
    slides.push({ kind: 'closing', title: '', nodes: [] });
    return { mode: 'manual', slides };
  }

  const firstH2 = root.children.findIndex((n) => n.type === 'heading' && n.depth === 2);
  const hook = firstH2 === -1 ? root.children : root.children.slice(0, firstH2);
  const slides = [];

  // The hook: its first prose slide is the title slide; any more are "intro" slides.
  const hookSlides = sectionSlides(hook.filter((n) => n.type !== 'mdxjsEsm'), '');
  const firstProse = hookSlides.findIndex((s) => s.kind === 'section');
  if (firstProse === -1) slides.push({ kind: 'title', title: '', nodes: [] });
  hookSlides.forEach((s, i) => {
    if (s.kind !== 'section') return slides.push(s);
    slides.push({ ...s, kind: i === firstProse ? 'title' : 'intro' });
  });

  if (firstH2 !== -1) {
    let heading = null;
    let body = [];
    const flush = () => heading && slides.push(...sectionSlides(body, textOf(heading)));
    for (const n of root.children.slice(firstH2)) {
      if (n.type === 'heading' && n.depth === 2) {
        flush();
        heading = n;
        body = [];
      } else body.push(n);
    }
    flush();
  }
  slides.push({ kind: 'closing', title: '', nodes: [] });
  return { mode: 'auto', slides };
}

// ------------------------------------------------------------------ writing it into the module

const attr = (name, value) => ({ type: 'mdxJsxAttribute', name, value: String(value) });

/** A JSON-able value as an estree expression, for the `slides` export. */
function literal(v) {
  if (Array.isArray(v)) return { type: 'ArrayExpression', elements: v.map(literal) };
  if (v && typeof v === 'object') {
    return {
      type: 'ObjectExpression',
      properties: Object.entries(v)
        .filter(([, val]) => val !== undefined)
        .map(([k, val]) => ({ type: 'Property', key: { type: 'Identifier', name: k }, value: literal(val), kind: 'init', method: false, shorthand: false, computed: false })),
    };
  }
  return { type: 'Literal', value: v, raw: JSON.stringify(v) };
}

export function outlineOf(deck) {
  return {
    mode: deck.mode,
    count: deck.slides.length,
    outline: deck.slides.map((s) => ({ kind: s.kind, title: s.title, part: s.part, parts: s.parts })),
  };
}

/**
 * The remark plugin. `onDeck(deck, file)` is called with every deck built, for tests.
 * Options: { onDeck?: (deck, file) => void }
 */
export default function remarkSlides(options = {}) {
  return (root, file) => {
    const deck = buildDeck(root);
    options.onDeck?.(deck, file);

    // A manual <Deck> is presentation-only: it leaves the page.
    if (deck.mode === 'manual') root.children = root.children.filter((n) => !isJsx(n, 'Deck'));

    const slideElements = deck.slides.map((s, index) => ({
      type: 'mdxJsxFlowElement',
      name: 'Slide',
      attributes: [
        attr('kind', s.kind),
        attr('index', index),
        ...(s.title ? [attr('title', s.title)] : []),
        ...(s.part ? [attr('part', s.part), attr('parts', s.parts)] : []),
      ],
      children: s.nodes.map(clone),
    }));
    root.children = [
      { type: 'mdxJsxFlowElement', name: 'LessonBody', attributes: [], children: root.children },
      { type: 'mdxJsxFlowElement', name: 'DeckSource', attributes: [attr('mode', deck.mode)], children: slideElements },
    ];

    const meta = outlineOf(deck);
    root.children.unshift({
      type: 'mdxjsEsm',
      value: `export const slides = ${JSON.stringify(meta)}`,
      data: {
        estree: {
          type: 'Program',
          sourceType: 'module',
          body: [
            {
              type: 'ExportNamedDeclaration',
              declaration: {
                type: 'VariableDeclaration',
                kind: 'const',
                declarations: [{ type: 'VariableDeclarator', id: { type: 'Identifier', name: 'slides' }, init: literal(meta) }],
              },
              specifiers: [],
              source: null,
            },
          ],
        },
      },
    });
  };
}
