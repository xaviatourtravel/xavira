/**
 * Desklabs brand palette — extracted from official logo SVG assets.
 * Use semantic CSS variables (--primary, etc.) in product UI; these hex
 * values are for documentation and the design-system showcase.
 */
export const brandPalette = {
  primary: {
    label: "Primary Blue",
    hex: "#032E6B",
    description: "Logo wordmark, primary buttons, links, focus ring",
  },
  secondary: {
    label: "Navy",
    hex: "#082253",
    description: "Secondary surfaces, headings, dark-mode backgrounds",
  },
  accent: {
    label: "Accent Blue",
    hex: "#366AD9",
    description: "Highlights, gradients, interactive accents",
  },
  accentLight: {
    label: "Sky Accent",
    hex: "#2FC8EB",
    description: "Icon gradient highlight from brand mark",
  },
  success: {
    label: "Success",
    hex: "#059669",
    description: "Success states, WhatsApp channel, confirmations",
  },
  warning: {
    label: "Warning",
    hex: "#F59E0B",
    description: "Pending, attention needed",
  },
  danger: {
    label: "Danger",
    hex: "#DC2626",
    description: "Errors, overdue, destructive actions",
  },
  neutral: {
    label: "Slate Neutral",
    hex: "#64748B",
    description: "Borders, muted text, internal status",
  },
} as const;

export const brandLogoRules = {
  minHeightFull: 28,
  minHeightIcon: 24,
  clearSpace: "Setengah tinggi logo di semua sisi",
  doNotStretch: true,
  doNotRecolor: true,
  useComponent: "BrandLogo",
} as const;
