/**
 * UI strings, through one helper. English only for now; the point is the seam.
 *
 * Interface text -- navigation, buttons, headings, empty states -- lives in ./en.ts and is
 * read with t('home.hero.title'). Lesson content does not: it is MDX, and is translated, if
 * ever, as content. Keys are type-checked, so a typo or a removed string fails `tsc`, not the
 * page.
 *
 *   t('learn.progress', { done: 3, total: 128 })        "{done} of {total} lessons complete"
 *   t('learn.lessonCount', { count: 1 })                 picks `one` or `other` by plural rule
 */
import { en } from './en';

export type Plural = { one: string; other: string };
type Message = string | Plural;
type Tree = { [key: string]: Message | Tree };

/** Every dotted path to a message, e.g. "home.hero.title". */
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends Message ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaves<typeof en>;
export type Vars = Record<string, string | number>;

const plurals = new Intl.PluralRules('en');

/** Look a key up in a message tree and fill {placeholders}. Exported for tests. */
export function translate(messages: Tree, key: string, vars?: Vars): string {
  let node: Message | Tree | undefined = messages;
  for (const part of key.split('.')) node = typeof node === 'object' && node && !('one' in node) ? (node as Tree)[part] : undefined;
  let text: string;
  if (typeof node === 'string') text = node;
  else if (node && typeof node === 'object' && 'one' in node && 'other' in node) {
    const n = Number(vars?.count ?? 0);
    text = plurals.select(n) === 'one' ? (node as Plural).one : (node as Plural).other;
  } else {
    // A key the type system allowed but the table lacks. Visible rather than blank, so it
    // is noticed; tsc catches this before it can happen in normal use.
    return key;
  }
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (vars && name in vars ? String(vars[name]) : whole));
}

export function t(key: MessageKey, vars?: Vars): string {
  return translate(en as unknown as Tree, key, vars);
}
