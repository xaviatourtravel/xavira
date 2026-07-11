/**
 * Marketing motion tokens — semantic timing, easing, and movement (WEB-004 / WEB-004.1).
 */

export const marketingMotionDurations = {
  instant: 120,
  fast: 200,
  normal: 420,
  reveal: 420,
  slow: 520,
  scene: 720,
  hero: 900,
} as const;

export const marketingMotionStagger = {
  compact: 45,
  standard: 70,
  scene: 90,
  featured: 100,
} as const;

export const marketingMotionDistance = {
  micro: 6,
  normal: 18,
  scene: 22,
  sceneHorizontal: 18,
} as const;

export const marketingMotionBlur = {
  reveal: 5,
} as const;

/** Framer Motion cubic-bezier tuples */
export const marketingMotionEasing = {
  standard: [0.22, 1, 0.36, 1] as const,
  emphasized: [0.16, 1, 0.3, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
};

export const marketingMotionViewport = {
  /** Default section reveal — triggers before center */
  amount: 0.15,
  /** Large sections (platform, workflow, dark modules) */
  amountLarge: 0.12,
  /** Compact sections (FAQ, trust, pricing header) */
  amountSmall: 0.18,
  /** Product scene choreography */
  amountScene: 0.12,
  once: true,
  /** Trigger slightly before element enters viewport */
  margin: "0px 0px -72px 0px",
  marginLarge: "0px 0px -10% 0px",
  marginScene: "0px 0px -8% 0px",
} as const;

export type MotionViewportPreset = "default" | "large" | "small" | "scene";

/** CSS custom property names (defined in styles/marketing-tokens.css) */
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
  stagger: marketingMotionStagger,
  distance: marketingMotionDistance,
  blur: marketingMotionBlur,
  easing: marketingMotionEasing,
  viewport: marketingMotionViewport,
  cssVars: marketingMotionCssVars,
} as const;
