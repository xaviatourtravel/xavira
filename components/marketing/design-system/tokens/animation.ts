/**
 * Animation rules — use sparingly. Prefer hover lift on cards only.
 * Durations align with components/marketing/motion/motion-tokens.ts.
 */

export const marketingAnimation = {
  /** Subtle entrance — use once per section max */
  fade: "animate-in fade-in duration-500",
  /** Card hover lift — calm border accent, no dramatic scale */
  hoverLift:
    "transition-[transform,box-shadow,ring-color] duration-[var(--marketing-duration-fast)] ease-[var(--marketing-ease-standard)] hover:-translate-y-0.5 hover:ring-[var(--marketing-border-accent)]",
  /** Reduced motion override applied via media query in marketing-tokens.css */
  respectMotion:
    "motion-reduce:transition-none motion-reduce:animate-none motion-reduce:hover:translate-y-0",
  /** Gentle bounce for flow arrows only */
  bounceSlow: "animate-bounce [animation-duration:2s]",
  /** Pulse for decorative backgrounds only */
  pulseSlow: "animate-pulse [animation-duration:6s]",
  /** Slide up — optional section entrance */
  slideUp: "animate-in fade-in slide-in-from-bottom-4 duration-500",
} as const;

export const marketingAnimationRules = {
  maxAnimatedElementsPerSection: 2,
  preferHoverOverEntrance: true,
  noAutoplayExceptDecorative: true,
} as const;
