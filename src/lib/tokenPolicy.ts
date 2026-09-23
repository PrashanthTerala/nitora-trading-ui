/**
 * The contrast bar the design tokens must clear, in both themes.
 *
 * One list, read by tools/lint-tokens.mjs (which fails the build) and by the /__tokens sheet
 * (which shows the result), so what the sheet reports is exactly what the build enforces.
 */
import { contrast } from './color';
import { tokenRgb, type Theme, type Token } from './tokens';

/** WCAG 1.4.3: normal-size text. */
export const TEXT = 4.5;
/** WCAG 1.4.11: control boundaries and meaningful graphics; also large text. */
export const NON_TEXT = 3;

export interface ContrastRule {
  ratio: number;
  why: string;
  /** Token names without the --color- prefix. Every fg is checked against every bg. */
  fg: string[];
  bg: string[];
}

const soft = ['up', 'down', 'warn', 'danger', 'info'] as const;

export const CONTRAST_RULES: ContrastRule[] = [
  { ratio: TEXT, why: 'body text', fg: ['ink', 'ink-soft'], bg: ['bg', 'surface-1', 'surface-2', 'surface-3'] },
  { ratio: TEXT, why: 'captions and meta', fg: ['ink-muted'], bg: ['bg', 'surface-1', 'surface-2'] },
  { ratio: TEXT, why: 'links and accent text', fg: ['accent'], bg: ['bg', 'surface-1', 'surface-2', 'accent-soft'] },
  { ratio: TEXT, why: 'button labels', fg: ['on-accent'], bg: ['accent', 'accent-hover'] },
  { ratio: TEXT, why: 'button labels', fg: ['on-up'], bg: ['up'] },
  { ratio: TEXT, why: 'button labels', fg: ['on-down'], bg: ['down'] },
  { ratio: TEXT, why: 'inverted chips', fg: ['ink-inverse'], bg: ['ink'] },
  { ratio: TEXT, why: 'P&L and price text', fg: ['up', 'down', 'neutral'], bg: ['bg', 'surface-1'] },
  { ratio: TEXT, why: 'status text', fg: ['warn', 'danger', 'info'], bg: ['bg', 'surface-1'] },
  {
    ratio: TEXT,
    why: 'text on a tint',
    fg: ['ink'],
    bg: ['accent-soft', 'up-soft', 'down-soft', 'neutral-soft', 'warn-soft', 'danger-soft', 'info-soft'],
  },
  ...soft.map((s) => ({ ratio: TEXT, why: 'coloured text on its own tint', fg: [s], bg: [`${s}-soft`] })),
  { ratio: NON_TEXT, why: 'input and control borders', fg: ['line-strong'], bg: ['bg', 'surface-1', 'surface-2'] },
  { ratio: NON_TEXT, why: 'focus ring', fg: ['accent-ring'], bg: ['bg', 'surface-1'] },
  { ratio: NON_TEXT, why: 'chart overlays', fg: ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6'], bg: ['bg', 'surface-1'] },
  {
    ratio: NON_TEXT,
    why: 'level identifiers',
    fg: ['level-foundation', 'level-reading', 'level-analysis', 'level-execution', 'level-mastery'],
    bg: ['bg', 'surface-1'],
  },
];

/**
 * Deliberately exempt: decorative hairlines -- card edges, dividers, chart grids -- which WCAG
 * 1.4.11 does not require to reach 3:1. Anything a user must see to operate a control uses
 * line-strong instead, which is checked above.
 */
export const DECORATIVE = ['line-subtle', 'line', 'grid'];

export interface ContrastResult {
  theme: Theme;
  fg: string;
  bg: string;
  ratio: number;
  got: number;
  why: string;
  pass: boolean;
}

/** Every rule, evaluated in both themes on the colours as rendered. */
export function contrastResults(tokens: Token[]): ContrastResult[] {
  const out: ContrastResult[] = [];
  for (const theme of ['light', 'dark'] as const) {
    for (const rule of CONTRAST_RULES) {
      for (const f of rule.fg) {
        for (const b of rule.bg) {
          const bgName = `--color-${b}`;
          const got = contrast(tokenRgb(tokens, `--color-${f}`, theme, bgName), tokenRgb(tokens, bgName, theme));
          out.push({ theme, fg: f, bg: b, ratio: rule.ratio, got, why: rule.why, pass: got >= rule.ratio });
        }
      }
    }
  }
  return out;
}
