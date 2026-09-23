/**
 * Reads src/styles/tokens.css into a table of tokens with both themes' values.
 *
 * One parser, three readers: the /__tokens sheet, tools/lint-tokens.mjs (contrast, gamut,
 * the generated docs/tokens.md), and anything later that needs a token as a concrete colour
 * -- canvas code cannot use var(), so the simulator chart will resolve tokens through here.
 */
import { oklchToRgb, over, parseOklch, type Rgb } from './color';

export interface Token {
  name: string; // e.g. --color-bg
  group: string; // section heading from tokens.css, e.g. "surfaces"
  doc: string; // the declaration's trailing comment
  light: string;
  dark: string;
  /** Sub-properties folded in from --name--line-height and friends, for the type scale. */
  extras: Record<string, string>;
}

export type Theme = 'light' | 'dark';

function block(css: string, opener: RegExp): string {
  const m = opener.exec(css);
  if (!m) return '';
  const start = m.index + m[0].length;
  const end = css.indexOf('}', start);
  return end < 0 ? '' : css.slice(start, end);
}

const DECL = /^\s*(--[\w-]+)\s*:\s*(.+?);\s*(?:\/\*\s*(.*?)\s*\*\/)?\s*$/;
const GROUP = /^\s*\/\*\s*-+\s*(.+?)\s*-+\s*\*\/\s*$/;

function declarations(body: string): { name: string; value: string; doc: string; group: string }[] {
  const out = [];
  let group = '';
  for (const line of body.split('\n')) {
    const g = GROUP.exec(line);
    if (g) {
      group = g[1];
      continue;
    }
    const d = DECL.exec(line);
    if (d) out.push({ name: d[1], value: d[2].trim(), doc: d[3] ?? '', group });
  }
  return out;
}

/** Parse tokens.css. Light values come from @theme and :root; dark ones from .dark. */
export function parseTokens(css: string): Token[] {
  const theme = declarations(block(css, /@theme\s*\{/));
  const root = declarations(block(css, /(?:^|\n)\s*:root\s*\{/));
  // Strip comments before reading .dark: its values carry no docs, and a comment spanning
  // lines would otherwise hide the declarations after it.
  const darkBody = block(css, /(?:^|\n)\s*\.dark\s*\{/).replace(/\/\*[\s\S]*?\*\//g, '');
  const dark = new Map(declarations(darkBody).map((d) => [d.name, d.value]));

  const tokens: Token[] = [];
  const byName = new Map<string, Token>();
  for (const d of [...theme, ...root]) {
    const sub = /^(--[\w-]+?)--([\w-]+)$/.exec(d.name);
    if (sub && byName.has(sub[1])) {
      byName.get(sub[1])!.extras[sub[2]] = d.value;
      continue;
    }
    const t: Token = { name: d.name, group: d.group || 'motion', doc: d.doc, light: d.value, dark: dark.get(d.name) ?? d.value, extras: {} };
    tokens.push(t);
    byName.set(t.name, t);
  }
  return tokens;
}

/** Follow var(--x) references to a literal value in one theme. */
export function resolve(tokens: Token[], name: string, theme: Theme, depth = 0): string {
  const t = tokens.find((x) => x.name === name);
  if (!t) throw new Error(`unknown token ${name}`);
  const value = theme === 'light' ? t.light : t.dark;
  const ref = /^var\((--[\w-]+)\)$/.exec(value);
  if (ref && depth < 8) return resolve(tokens, ref[1], theme, depth + 1);
  return value;
}

export function isColorToken(t: Token): boolean {
  return t.name.startsWith('--color-');
}

/**
 * A colour token as the screen shows it. Translucent colours are composited over `backdrop`
 * (by default the page background), since their contrast depends on what is behind them.
 */
export function tokenRgb(tokens: Token[], name: string, theme: Theme, backdrop = '--color-bg'): Rgb {
  const parsed = parseOklch(resolve(tokens, name, theme));
  if (!parsed) throw new Error(`${name} is not an oklch() colour in the ${theme} theme`);
  const rgb = oklchToRgb(parsed);
  if (rgb.alpha >= 1 || name === backdrop) return rgb;
  return over(rgb, tokenRgb(tokens, backdrop, theme));
}
