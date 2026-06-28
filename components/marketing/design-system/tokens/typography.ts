/**
 * Typography scale for marketing pages.
 * All sizes use semibold headings with tight tracking for premium SaaS feel.
 */

export const marketingTypography = {
  display:
    "text-[2.75rem] font-semibold leading-[1.1] tracking-tight text-balance text-slate-950 sm:text-5xl lg:text-[3.25rem]",
  h1: "text-[2rem] font-semibold leading-[1.12] tracking-tight text-balance text-slate-950 sm:text-5xl lg:text-[3.1rem]",
  h2: "text-3xl font-semibold tracking-tight text-balance text-slate-950 sm:text-4xl",
  h3: "text-lg font-semibold tracking-tight text-slate-950 sm:text-xl",
  bodyLarge: "text-base leading-relaxed text-slate-600 sm:text-lg",
  body: "text-sm leading-relaxed text-slate-600 sm:text-base",
  small: "text-sm leading-relaxed text-slate-600",
  caption: "text-xs leading-relaxed text-slate-500",
  eyebrow:
    "text-sm font-medium uppercase tracking-[0.18em] text-emerald-700",
} as const;

export type MarketingTypographyVariant = keyof typeof marketingTypography;
