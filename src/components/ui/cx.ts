/**
 * Class-name helpers for the UI kit: a joiner, and a small typed variant builder in the
 * spirit of class-variance-authority, hand-rolled because it is twenty lines.
 *
 * Class strings stay literal in the variant tables, which is what lets Tailwind's scanner
 * find them; never build a class name from pieces at runtime.
 */
export type ClassValue = string | false | null | undefined;

export function cx(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(' ');
}

type VariantTable = Record<string, Record<string, string>>;
export type VariantProps<T extends VariantTable> = { [K in keyof T]?: keyof T[K] };

export function variants<T extends VariantTable>(base: string, table: T, defaults: { [K in keyof T]: keyof T[K] }) {
  return (props: VariantProps<T> = {}, extra?: ClassValue): string =>
    cx(
      base,
      ...(Object.keys(table) as (keyof T)[]).map((k) => table[k][(props[k] ?? defaults[k]) as string]),
      extra,
    );
}
