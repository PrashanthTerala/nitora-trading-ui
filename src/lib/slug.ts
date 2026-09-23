/**
 * URL fragments for headings and figures: "What it looks like: the exact rules" becomes
 * "what-it-looks-like-the-exact-rules". Stable for a given text, so a copied link keeps working
 * for as long as the heading or figure title does.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** The plain text inside React children: strings and numbers, recursively. */
export function textOf(node: unknown): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (typeof node === 'object' && 'props' in node) return textOf((node as { props: { children?: unknown } }).props.children);
  return '';
}
