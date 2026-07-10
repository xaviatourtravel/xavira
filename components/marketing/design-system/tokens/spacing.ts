/**
 * Spacing tokens — responsive section, container, and grid rhythm.
 * Container width and section padding use CSS classes from marketing-tokens.css.
 */

export const marketingSpacing = {
  /** Section vertical padding — uses CSS clamp rhythm */
  section: {
    className: "marketing-section",
    /** @deprecated Use section.className — kept for backward compatibility */
    mobile: "marketing-section",
    tablet: "",
    desktop: "",
    combined: "marketing-section",
  },
  /** Hero vertical padding (slightly tighter top) */
  hero: {
    combined: "pb-16 pt-14 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20",
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
