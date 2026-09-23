import { oklchToRgb, parseOklch, rgbToHex } from './color';

/**
 * A colour token's current value as a hex string, for canvas renderers (lightweight-charts)
 * that cannot read CSS variables or parse oklch(). Read it again after the theme changes.
 */
export function cssColor(token: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const oklch = parseOklch(v);
  return oklch ? rgbToHex(oklchToRgb(oklch)) : v;
}
