/**
 * Animation rules — use sparingly. Prefer hover lift on cards only.
 */

export const marketingAnimation = {
  /** Subtle entrance — use once per section max */
  fade: "animate-in fade-in duration-500",
  /** Card hover lift — default interactive card motion */
  hoverLift:
    "transition-all duration-200 hover:-translate-y-0.5 hover:ring-emerald-200/80",
  /** Scale on press/hover for buttons (built into button component) */
  hoverScale: "transition-transform duration-150 active:scale-[0.98]",
  /** Gentle bounce for flow arrows only */
  bounceSlow: "animate-bounce [animation-duration:2s]",
  /** Pulse for decorative backgrounds only */
  pulseSlow: "animate-pulse [animation-duration:6s]",
  /** Slide up — optional section entrance */
  slideUp: "animate-in fade-in slide-in-from-bottom-4 duration-500",
  /** Reduced motion override applied via media query in globals */
  respectMotion: "motion-reduce:transition-none motion-reduce:animate-none motion-reduce:hover:translate-y-0",
} as const;

export const marketingAnimationRules = {
  maxAnimatedElementsPerSection: 2,
  preferHoverOverEntrance: true,
  noAutoplayExceptDecorative: true,
} as const;
