/**
 * Feature flags, so unfinished work can be merged and shipped dark.
 *
 * VITE_FLAGS is a comma list read at build time. A name turns a flag on; a leading minus
 * turns it off:
 *
 *   VITE_FLAGS=3d npm run build               3D on
 *   VITE_FLAGS=-deck,-commandPalette npm run dev   presentation mode and the palette off
 *
 * Anything not mentioned keeps its default below. Unknown names are ignored, and reported in
 * development so a typo does not silently do nothing.
 */
export const FLAG_DEFAULTS = {
  /** The Ctrl K / Cmd K palette. Built in Phase 1, on by default. */
  commandPalette: true,
  /** Lesson presentation mode. Built in Phase 3, on by default. */
  deck: true,
  /** 3D hero scene and module covers (Phase 4). */
  '3d': false,
  /** The Quantitative Trading track, once it has content. */
  quantTrack: false,
} as const;

export type Flag = keyof typeof FLAG_DEFAULTS;

export interface ParsedFlags {
  flags: Record<Flag, boolean>;
  unknown: string[];
}

/** Pure, so the rules above can be tested without a build. */
export function parseFlags(raw: string | undefined): ParsedFlags {
  const flags: Record<Flag, boolean> = { ...FLAG_DEFAULTS };
  const unknown: string[] = [];
  for (const part of (raw ?? '').split(',')) {
    const item = part.trim();
    if (!item) continue;
    const off = item.startsWith('-');
    const name = off ? item.slice(1) : item;
    if (name in flags) flags[name as Flag] = !off;
    else unknown.push(name);
  }
  return { flags, unknown };
}

const parsed = parseFlags(typeof import.meta.env === 'undefined' ? undefined : (import.meta.env.VITE_FLAGS as string | undefined));
if (parsed.unknown.length && typeof import.meta.env !== 'undefined' && import.meta.env.DEV) {
  console.warn(`VITE_FLAGS: unknown flag(s) ignored: ${parsed.unknown.join(', ')}. Known: ${Object.keys(FLAG_DEFAULTS).join(', ')}.`);
}

export function flag(name: Flag): boolean {
  return parsed.flags[name];
}
