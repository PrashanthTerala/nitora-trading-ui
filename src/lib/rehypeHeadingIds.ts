/**
 * A rehype step for lesson MDX: gives every ## and ### an id at build time, unique within the
 * lesson ("worked-example", then "worked-example-2"), so the on-this-page list and shared links
 * always land on the heading they name -- even in a lesson that repeats a heading.
 *
 * Hand-rolled over the hast tree rather than a dependency: it is a dozen lines.
 */
import type { Root, RootContent } from 'hast';
import { slugify } from './slug.ts';

type Node = Root | RootContent | { type: string; children?: unknown[]; value?: string; tagName?: string; properties?: Record<string, unknown> };

function textOf(node: Node): string {
  if ('value' in node && typeof node.value === 'string' && node.type === 'text') return node.value;
  const kids = 'children' in node && Array.isArray(node.children) ? (node.children as Node[]) : [];
  return kids.map(textOf).join('');
}

/** Ids the lesson page gives its own sections (KeyTakeaways, Quiz). */
const RESERVED = ['key-takeaways', 'quiz'];

export function rehypeHeadingIds() {
  return (tree: Root) => {
    const used = new Set(RESERVED);
    const walk = (node: Node) => {
      if (node.type === 'element' && (node.tagName === 'h2' || node.tagName === 'h3')) {
        const base = slugify(textOf(node)) || 'section';
        let id = base;
        for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
        used.add(id);
        node.properties = { ...(node.properties ?? {}), id };
        return;
      }
      if ('children' in node && Array.isArray(node.children)) (node.children as Node[]).forEach(walk);
    };
    walk(tree);
  };
}
