/**
 * Typography scale for marketing pages.
 * Classes defined in styles/marketing-tokens.css under `.marketing-site`.
 */

export const marketingTypography = {
  display: "marketing-type-display",
  h1: "marketing-type-h1",
  h2: "marketing-type-h2",
  h3: "marketing-type-h3",
  bodyLarge: "marketing-type-body-lg",
  body: "marketing-type-body",
  small: "marketing-type-body",
  metadata: "marketing-type-metadata",
  caption: "marketing-type-caption",
  eyebrow: "marketing-type-eyebrow",
} as const;

export type MarketingTypographyVariant = keyof typeof marketingTypography;
