/**
 * Spacing tokens — responsive section, container, and grid rhythm.
 */

export const marketingSpacing = {
  /** Section vertical padding */
  section: {
    mobile: "py-16",
    tablet: "sm:py-24",
    desktop: "lg:py-28",
    combined: "py-16 sm:py-24 lg:py-28",
  },
  /** Hero vertical padding (slightly tighter top) */
  hero: {
    combined: "pb-16 pt-14 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20",
  },
  /** Horizontal page container padding */
  container: {
    mobile: "px-4",
    tablet: "sm:px-6",
    desktop: "lg:px-8",
    combined: "px-4 sm:px-6 lg:px-8",
  },
  /** Max content width */
  maxWidth: {
    page: "max-w-6xl",
    prose: "max-w-3xl",
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

export const marketingContainerClass = [
  "mx-auto w-full",
  marketingSpacing.maxWidth.page,
  marketingSpacing.container.combined,
].join(" ");
