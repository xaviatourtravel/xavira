/**
 * Document-safe color derivation for invoice PDFs.
 * Never mutates stored workspace branding — presentation only.
 */

import {
  getReadableForeground,
  tryNormalizeHexColor,
} from "@/modules/finance/lib/invoice-theme-colors";

const TEXT = "#0F172A";
const MUTED = "#64748B";
const DIVIDER = "#E2E8F0";
const SURFACE = "#F8FAFC";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = tryNormalizeHexColor(hex, "#0F172A");
  return {
    r: Number.parseInt(n.slice(1, 3), 16),
    g: Number.parseInt(n.slice(3, 5), 16),
    b: Number.parseInt(n.slice(5, 7), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h, s, l };
}

function hslToRgb(
  h: number,
  s: number,
  l: number,
): { r: number; g: number; b: number } {
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: hue2rgb(p, q, h + 1 / 3) * 255,
    g: hue2rgb(p, q, h) * 255,
    b: hue2rgb(p, q, h - 1 / 3) * 255,
  };
}

/** Cap saturation for large document surfaces (avoids neon fills). */
export function getDocumentBrandColor(
  hex: string | null | undefined,
  options?: { maxSaturation?: number; targetLightness?: number },
): string {
  const raw = tryNormalizeHexColor(hex, "#0F172A");
  const { r, g, b } = hexToRgb(raw);
  const hsl = rgbToHsl(r, g, b);
  const maxS = options?.maxSaturation ?? 0.42;
  const s = Math.min(hsl.s, maxS);
  const l =
    options?.targetLightness != null
      ? options.targetLightness
      : Math.min(Math.max(hsl.l, 0.18), 0.42);
  const rgb = hslToRgb(hsl.h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/** Very light tint for panels — print-safe, low saturation. */
export function getDocumentTint(
  hex: string | null | undefined,
  strength = 0.08,
): string {
  const brand = getDocumentBrandColor(hex, {
    maxSaturation: 0.35,
    targetLightness: 0.35,
  });
  const { r, g, b } = hexToRgb(brand);
  const mix = (channel: number) => channel * strength + 255 * (1 - strength);
  return rgbToHex(mix(r), mix(g), mix(b));
}

export function getDocumentTextColor(): string {
  return TEXT;
}

export function getDocumentMutedTextColor(): string {
  return MUTED;
}

export function getDocumentDividerColor(): string {
  return DIVIDER;
}

export function getDocumentSurfaceColor(): string {
  return SURFACE;
}

/** Soft brand for captions / thin accents (not large fills). */
export function getMutedBrandColor(hex: string | null | undefined): string {
  return getDocumentBrandColor(hex, {
    maxSaturation: 0.28,
    targetLightness: 0.38,
  });
}

/**
 * Presentation theme for PDF rendering only.
 * Softens neon brand colors while preserving identity.
 */
export function getDocumentSafePdfTheme(input: {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
}): {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  primaryForeground: string;
  accentForeground: string;
  tint: string;
  divider: string;
  text: string;
  muted: string;
} {
  const primaryColor = getDocumentBrandColor(input.primaryColor, {
    maxSaturation: 0.4,
    targetLightness: 0.28,
  });
  const accentColor = getDocumentBrandColor(input.accentColor ?? input.primaryColor, {
    maxSaturation: 0.38,
    targetLightness: 0.36,
  });
  const secondaryColor = tryNormalizeHexColor(input.secondaryColor, MUTED);
  return {
    primaryColor,
    secondaryColor: secondaryColor === MUTED ? MUTED : getMutedBrandColor(secondaryColor),
    accentColor,
    primaryForeground: getReadableForeground(primaryColor),
    accentForeground: getReadableForeground(accentColor),
    tint: getDocumentTint(primaryColor, 0.07),
    divider: DIVIDER,
    text: TEXT,
    muted: MUTED,
  };
}

/** True when a color would read as neon/high-chroma for large areas. */
export function isHighChromaDocumentColor(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  const { s, l } = rgbToHsl(r, g, b);
  return s > 0.55 && l > 0.35 && l < 0.75;
}
