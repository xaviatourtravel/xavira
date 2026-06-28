/** Responsive breakpoints — mirrors Tailwind defaults */

export const marketingBreakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export const marketingGrid = {
  /** Standard feature/card grid */
  cards: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
  /** Two-column split (feature + visual) */
  split: "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
  /** Comparison columns */
  comparison: "grid gap-6 lg:grid-cols-2",
  /** Metrics row */
  metrics: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
  /** Footer columns */
  footer: "grid gap-10 lg:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]",
} as const;
