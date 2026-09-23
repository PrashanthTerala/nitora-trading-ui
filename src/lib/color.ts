/**
 * Colour maths for the design tokens: OKLCH <-> sRGB, and WCAG contrast.
 *
 * Tokens are authored in OKLCH because its lightness is perceptual -- two colours at the
 * same L look equally light, which is what makes a surface scale or a chart palette
 * behave. But contrast is defined on sRGB luminance, and canvas-based code (the simulator
 * chart) needs a concrete sRGB colour, so both directions live here.
 *
 * Conversion matrices are Bjorn Ottosson's reference OKLab definitions.
 */

export interface Oklch {
  l: number; // 0..1
  c: number; // chroma, 0..~0.4
  h: number; // hue, degrees
  alpha: number; // 0..1
}

export interface Rgb {
  r: number; // 0..1, gamma-encoded sRGB
  g: number;
  b: number;
  alpha: number;
}

const toLinear = (u: number) => (u <= 0.04045 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4);
const toGamma = (u: number) => (u <= 0.0031308 ? 12.92 * u : 1.055 * u ** (1 / 2.4) - 0.055);

/** OKLCH to gamma-encoded sRGB. Channels may fall outside 0..1 when out of gamut. */
export function oklchToRgbUnclamped({ l, c, h, alpha }: Oklch): Rgb {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lr = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  const lg = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  const lb = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_;
  return { r: toGamma(lr), g: toGamma(lg), b: toGamma(lb), alpha };
}

const clamp01 = (u: number) => Math.min(1, Math.max(0, u));

/** OKLCH to sRGB, clamped into gamut the way a browser displays it. */
export function oklchToRgb(color: Oklch): Rgb {
  const { r, g, b, alpha } = oklchToRgbUnclamped(color);
  return { r: clamp01(r), g: clamp01(g), b: clamp01(b), alpha };
}

/** Whether a colour is displayable in sRGB without clipping (small tolerance for rounding). */
export function inSrgbGamut(color: Oklch, tolerance = 0.002): boolean {
  const { r, g, b } = oklchToRgbUnclamped(color);
  return [r, g, b].every((u) => u >= -tolerance && u <= 1 + tolerance);
}

export function rgbToOklch({ r, g, b, alpha }: Rgb): Oklch {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const C = Math.sqrt(A * A + B * B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { l: L, c: C, h: C < 1e-6 ? 0 : H, alpha };
}

/** Parse `oklch(L C H)` / `oklch(L C H / A)`, with L as a number or a percentage. */
export function parseOklch(text: string): Oklch | null {
  const m = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/i.exec(text.trim());
  if (!m) return null;
  const l = Number(m[1]) / (m[2] ? 100 : 1);
  const alpha = m[5] === undefined ? 1 : Number(m[5]) / (m[6] ? 100 : 1);
  return { l, c: Number(m[3]), h: Number(m[4]), alpha };
}

/** Parse #rgb, #rrggbb or #rrggbbaa. Used for converting the legacy palette and in tests. */
export function parseHex(text: string): Rgb | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(text.trim());
  if (!m) return null;
  let hex = m[1];
  if (hex.length === 3) hex = hex.replace(/./g, (d) => d + d);
  const n = (i: number) => parseInt(hex.slice(i, i + 2), 16) / 255;
  return { r: n(0), g: n(2), b: n(4), alpha: hex.length === 8 ? n(6) : 1 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const h = (u: number) => Math.round(clamp01(u) * 255).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** A concrete `rgb()`/`rgba()` string, for canvas APIs that do not accept oklch(). */
export function rgbToCss({ r, g, b, alpha }: Rgb): string {
  const n = (u: number) => Math.round(clamp01(u) * 255);
  return alpha >= 1 ? `rgb(${n(r)}, ${n(g)}, ${n(b)})` : `rgba(${n(r)}, ${n(g)}, ${n(b)}, ${+alpha.toFixed(3)})`;
}

/**
 * Composite a translucent colour over an opaque one, as the screen would show it.
 *
 * Blended in gamma-encoded space, because that is what browsers do by default. Blending in
 * linear light is closer to what the eye sees, but would compute a contrast the rendered
 * page does not actually have.
 */
export function over(top: Rgb, bottom: Rgb): Rgb {
  const a = top.alpha;
  return {
    r: top.r * a + bottom.r * (1 - a),
    g: top.g * a + bottom.g * (1 - a),
    b: top.b * a + bottom.b * (1 - a),
    alpha: 1,
  };
}

/** WCAG 2.x relative luminance. */
export function luminance({ r, g, b }: Rgb): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG 2.x contrast ratio, 1..21. */
export function contrast(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
