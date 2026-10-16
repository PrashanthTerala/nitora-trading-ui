import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';
import { parseTokens, resolve } from '@/lib/tokens';
import tokensCss from './tokens-source';

/**
 * The site's dark theme as CSS variables, resolved from the site's own tokens.css with the
 * site's own parser, so a video and the site can never disagree about a colour.
 */
const tokens = parseTokens(tokensCss);
export const vars: Record<string, string> = Object.fromEntries(tokens.map((t) => [t.name, resolve(tokens, t.name, 'dark')]));

const FONTS = [
  ['Inter Variable', 'fonts/inter-latin-wght-normal-v5.3.0.woff2', '100 900'],
  ['Geist Variable', 'fonts/geist-latin-wght-normal-v5.3.0.woff2', '100 900'],
  ['JetBrains Mono Variable', 'fonts/jetbrains-mono-latin-wght-normal-v5.3.0.woff2', '100 900'],
  // Telugu and Devanagari for localized on-screen text (Noto Sans, SIL OFL 1.1), copied from
  // @fontsource by scripts/sync-public.mjs. The site fonts are Latin only.
  ['Noto Sans Telugu', 'fonts-intl/noto-sans-telugu-telugu-400-normal.woff2', '400'],
  ['Noto Sans Telugu', 'fonts-intl/noto-sans-telugu-telugu-600-normal.woff2', '600'],
  ['Noto Sans Telugu', 'fonts-intl/noto-sans-telugu-telugu-700-normal.woff2', '700'],
  ['Noto Sans Devanagari', 'fonts-intl/noto-sans-devanagari-devanagari-400-normal.woff2', '400'],
  ['Noto Sans Devanagari', 'fonts-intl/noto-sans-devanagari-devanagari-600-normal.woff2', '600'],
  ['Noto Sans Devanagari', 'fonts-intl/noto-sans-devanagari-devanagari-700-normal.woff2', '700'],
] as const;

/** Every family the browser may need, in order: the site's, then the Indic scripts, per glyph. */
const INDIC = ", 'Noto Sans Telugu', 'Noto Sans Devanagari'";
for (const v of ['--font-sans', '--font-display', '--font-mono']) if (vars[v]) vars[v] = vars[v] + INDIC;

/** Loads the site's self-hosted fonts; no frame renders until they are ready. */
function useFonts() {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(
      FONTS.map(([family, file, weight]) => {
        const face = new FontFace(family, `url(${staticFile(file)}) format('woff2')`, { weight });
        document.fonts.add(face);
        return face.load();
      }),
    ).then(
      () => continueRender(handle),
      () => continueRender(handle),
    );
  }, [handle]);
}

export function Theme({ children }: { children: ReactNode }) {
  useFonts();
  return (
    <div
      className="dark"
      style={{
        ...(vars as CSSProperties),
        position: 'absolute',
        inset: 0,
        background: 'var(--color-bg)',
        color: 'var(--color-ink)',
        fontFamily: 'var(--font-sans)',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
