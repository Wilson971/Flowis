/**
 * FLOWZ Design System Builder — Color Utilities
 *
 * HSL-based color manipulation helpers used by the Theme Builder
 * to generate palettes, convert formats, and derive color scales.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HslColor {
  h: number; // 0–360
  s: number; // 0–100
  l: number; // 0–100
}

export interface RgbColor {
  r: number; // 0–255
  g: number; // 0–255
  b: number; // 0–255
}

// ---------------------------------------------------------------------------
// hexToHsl
// ---------------------------------------------------------------------------

/**
 * Convert a hex color string (#rrggbb or #rgb) to HSL components.
 * Returns { h: 0–360, s: 0–100, l: 0–100 }.
 */
export function hexToHsl(hex: string): HslColor {
  const { r, g, b } = hexToRgb(hex);

  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    if (max === rn) {
      h = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      h = (bn - rn) / delta + 2;
    } else {
      h = (rn - gn) / delta + 4;
    }

    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// ---------------------------------------------------------------------------
// hslToHex
// ---------------------------------------------------------------------------

/**
 * Convert HSL components to a hex color string (#rrggbb).
 * @param h  Hue        0–360
 * @param s  Saturation 0–100
 * @param l  Lightness  0–100
 */
export function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;

  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ---------------------------------------------------------------------------
// hexToRgb
// ---------------------------------------------------------------------------

/**
 * Convert a hex color string (#rrggbb or #rgb) to RGB components.
 * Returns { r: 0–255, g: 0–255, b: 0–255 }.
 * Throws if the hex string is invalid.
 */
export function hexToRgb(hex: string): RgbColor {
  let normalized = hex.trim().replace(/^#/, "");

  // Expand shorthand #rgb → #rrggbb
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((c) => c + c)
      .join("");
  }

  if (normalized.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

// ---------------------------------------------------------------------------
// generateColorScale
// ---------------------------------------------------------------------------

/**
 * Generate an 11-stop color scale from a base hex color.
 *
 * The scale mirrors the Tailwind / Radix convention:
 *   50  → very light tint  (lightness ~97%)
 *   100 → light tint       (~93%)
 *   200 →                  (~87%)
 *   300 →                  (~78%)
 *   400 →                  (~66%)
 *   500 → base-ish         (~55%)
 *   600 →                  (~45%)
 *   700 →                  (~36%)
 *   800 →                  (~27%)
 *   900 →                  (~18%)
 *   950 → very dark shade  (~12%)
 *
 * Saturation is gently boosted for lighter stops and slightly reduced for
 * darker stops to keep the scale perceptually consistent.
 *
 * @returns Record<string, string> — keys are "50" | "100" | … | "950",
 *          values are hex color strings.
 */
export function generateColorScale(
  baseHex: string
): Record<string, string> {
  const { h, s } = hexToHsl(baseHex);

  /**
   * Each entry: [scaleKey, targetLightness, saturationMultiplier]
   * saturationMultiplier keeps vivid mid-tones while preventing washed-out
   * lights and muddy darks.
   */
  const stops: Array<[string, number, number]> = [
    ["50",  97, 0.25],
    ["100", 93, 0.35],
    ["200", 87, 0.50],
    ["300", 78, 0.65],
    ["400", 66, 0.80],
    ["500", 55, 0.95],
    ["600", 45, 1.00],
    ["700", 36, 0.95],
    ["800", 27, 0.85],
    ["900", 18, 0.75],
    ["950", 12, 0.65],
  ];

  const scale: Record<string, string> = {};

  for (const [key, targetL, sMult] of stops) {
    const adjustedS = Math.min(100, Math.round(s * sMult));
    scale[key] = hslToHex(h, adjustedS, targetL);
  }

  return scale;
}
