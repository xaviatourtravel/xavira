/**
 * Marketing motion tokens — semantic timing and easing (WEB-004 preparation).
 * Values mirror docs/website/11_design_tokens.json and 04_Motion_and_Interaction_Spec.md.
 */

export const marketingMotionDurations = {
  instant: 80,
  fast: 140,
  normal: 240,
  slow: 500,
  reveal: 500,
  hero: 800,
  stagger: 75,
} as const;

export const marketingMotionEasing = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  emphasized: "cubic-bezier(0.16, 1, 0.3, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
} as const;

/** CSS custom property names (defined in styles/marketing-tokens.css under .marketing-site) */
export const marketingMotionCssVars = {
  instant: "--marketing-duration-instant",
  fast: "--marketing-duration-fast",
  normal: "--marketing-duration-normal",
  slow: "--marketing-duration-slow",
  reveal: "--marketing-duration-reveal",
  hero: "--marketing-duration-hero",
  stagger: "--marketing-duration-stagger",
  easeStandard: "--marketing-ease-standard",
  easeEmphasized: "--marketing-ease-emphasized",
  easeExit: "--marketing-ease-exit",
} as const;

export const marketingMotionTokens = {
  durations: marketingMotionDurations,
  easing: marketingMotionEasing,
  cssVars: marketingMotionCssVars,
} as const;
