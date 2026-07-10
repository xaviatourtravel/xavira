/**
 * Spacing tokens — responsive section, container, and grid rhythm.
 * Container width and section padding use CSS classes from marketing-tokens.css.
 */

export const marketingSpacing = {
  /** Section vertical padding — uses CSS clamp rhythm */
  section: {
    className: "marketing-section",
    large: "marketing-section-lg",
    compact: "marketing-section-compact",
    combined: "marketing-section",
  },
  /** Hero section shell */
  hero: {
    className: "marketing-hero-section",
  },
  /** Horizontal page container padding — handled by .marketing-container */
  container: {
    mobile: "",
    tablet: "",
    desktop: "",
    combined: "",
  },
  /** Max content width */
  maxWidth: {
    page: "marketing-container",
    prose: "marketing-prose",
    proseNarrow: "marketing-prose-narrow",
    narrow: "max-w-2xl",
  },
  /** Grid and stack gaps */
  gap: {
    xs: "gap-2",
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
    section: "gap-10 lg:gap-16",
  },
  /** Scroll offset for sticky nav anchor links */
  scrollMargin: "scroll-mt-20 sm:scroll-mt-24",
} as const;

export const marketingContainerClass = "marketing-container";
