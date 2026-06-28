export { marketingColors, marketingColorClasses } from "./colors";
export { marketingTypography, type MarketingTypographyVariant } from "./typography";
export { marketingSpacing, marketingContainerClass } from "./spacing";
export { marketingRadius, marketingShadow } from "./radius";
export { marketingAnimation, marketingAnimationRules } from "./animation";
export { marketingBreakpoints, marketingGrid } from "./grid";

import { marketingColors } from "./colors";
import { marketingTypography } from "./typography";
import { marketingSpacing, marketingContainerClass } from "./spacing";
import { marketingRadius, marketingShadow } from "./radius";
import { marketingAnimation, marketingAnimationRules } from "./animation";
import { marketingBreakpoints, marketingGrid } from "./grid";

/** Aggregated design tokens for documentation and programmatic access */
export const marketingTokens = {
  colors: marketingColors,
  typography: marketingTypography,
  spacing: marketingSpacing,
  container: marketingContainerClass,
  radius: marketingRadius,
  shadow: marketingShadow,
  animation: marketingAnimation,
  animationRules: marketingAnimationRules,
  breakpoints: marketingBreakpoints,
  grid: marketingGrid,
} as const;
