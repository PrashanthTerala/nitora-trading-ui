import type { ModuleMeta } from '@/content/curriculum';
import { cx } from '@/components/ui/cx';

// The glyphs are small line drawings (src/assets/glyphs/<module-id>.svg), inlined so they take
// the text colour and cost no request.
const GLYPHS = import.meta.glob('/src/assets/glyphs/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

function markup(id: string): string | null {
  const raw = GLYPHS[`/src/assets/glyphs/${id}.svg`];
  // The files are 64 px; here the size comes from the container.
  return raw ? raw.replace(/ width="64" height="64"/, ' width="100%" height="100%"') : null;
}

/** A module's glyph, in the current text colour. Renders nothing for a module without one. */
export function ModuleGlyph({ module: mod, className }: { module: Pick<ModuleMeta, 'art'>; className?: string }) {
  const svg = mod.art?.glyph ? markup(mod.art.glyph) : null;
  if (!svg) return null;
  return <span aria-hidden className={cx('inline-block shrink-0', className)} dangerouslySetInnerHTML={{ __html: svg }} />;
}
