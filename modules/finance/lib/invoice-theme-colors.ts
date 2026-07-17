const HEX_RE = /^#[0-9A-F]{6}$/;

const FALLBACK_PRIMARY = "#0F172A";
const FALLBACK_SECONDARY = "#64748B";
const FALLBACK_ACCENT = "#0EA5E9";

export function isValidHexColor(value: string | null | undefined): boolean {
  if (!value) return false;
  return HEX_RE.test(value.trim().toUpperCase());
}

export function normalizeHexColor(
  value: string | null | undefined,
  fallback = FALLBACK_PRIMARY,
): string {
  if (!value) return fallback;
  let raw = value.trim().toUpperCase();
  if (/^[0-9A-F]{6}$/.test(raw)) {
    raw = `#${raw}`;
  }
  if (!HEX_RE.test(raw)) {
    throw new Error("Color must be #RRGGBB");
  }
  // Reject anything that looks like css functions / urls via caller schema;
  // this helper only accepts hex after normalize.
  return raw;
}

export function tryNormalizeHexColor(
  value: string | null | undefined,
  fallback: string,
): string {
  try {
    return normalizeHexColor(value, fallback);
  } catch {
    return normalizeHexColor(fallback, FALLBACK_PRIMARY);
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHexColor(hex);
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

/** Relative luminance (sRGB). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Dark text on light brand colors; white on dark. */
export function getReadableForeground(backgroundHex: string): string {
  const lum = relativeLuminance(backgroundHex);
  return lum > 0.45 ? "#0F172A" : "#FFFFFF";
}

export function getSafeInvoiceTheme(input: {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
}): {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  primaryForeground: string;
  accentForeground: string;
} {
  const primaryColor = tryNormalizeHexColor(
    input.primaryColor,
    FALLBACK_PRIMARY,
  );
  const secondaryColor = tryNormalizeHexColor(
    input.secondaryColor,
    FALLBACK_SECONDARY,
  );
  const accentColor = tryNormalizeHexColor(input.accentColor, FALLBACK_ACCENT);
  return {
    primaryColor,
    secondaryColor,
    accentColor,
    primaryForeground: getReadableForeground(primaryColor),
    accentForeground: getReadableForeground(accentColor),
  };
}

export const INVOICE_THEME_FALLBACKS = {
  primaryColor: FALLBACK_PRIMARY,
  secondaryColor: FALLBACK_SECONDARY,
  accentColor: FALLBACK_ACCENT,
} as const;
