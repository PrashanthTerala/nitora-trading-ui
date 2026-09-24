import { Color } from 'three';
import { cssColor } from '@/lib/cssColor';
import type { Level } from '@/content/curriculum';

/**
 * The scene colours, read from the design tokens at mount time (so a scene follows the theme),
 * as three.js colours. WebGL cannot read CSS variables, which is why this folder may hold
 * concrete colours at all; the only ones written here are the two lights'.
 */
export interface ScenePalette {
  dark: boolean;
  up: Color;
  down: Color;
  accent: Color;
  level: Color;
  ink: Color;
  line: Color;
  bg: Color;
  surface: Color;
  /** One cool key light and a warm rim, as the brief asks. */
  key: Color;
  rim: Color;
}

export function readPalette(level: Level | 'accent' = 'accent'): ScenePalette {
  const c = (token: string) => new Color(cssColor(token));
  const dark = document.documentElement.classList.contains('dark');
  return {
    dark,
    up: c('--color-up'),
    down: c('--color-down'),
    accent: c('--color-accent'),
    level: level === 'accent' ? c('--color-accent') : c(`--color-level-${level}`),
    ink: c('--color-ink'),
    line: c('--color-line-strong'),
    bg: c('--color-bg'),
    surface: c('--color-surface-2'),
    key: new Color('#dce8ff'),
    rim: new Color('#ffc58f'),
  };
}
