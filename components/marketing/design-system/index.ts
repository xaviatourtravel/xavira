/**
 * Desklabs Marketing Design System
 *
 * Import from `@/components/marketing/design-system` for all public-facing pages.
 * Do not use these components inside the dashboard app shell.
 */

// Tokens
export {
  marketingTokens,
  marketingColors,
  marketingColorClasses,
  marketingTypography,
  marketingSpacing,
  marketingContainerClass,
  marketingRadius,
  marketingShadow,
  marketingAnimation,
  marketingAnimationRules,
  marketingBreakpoints,
  marketingGrid,
  type MarketingTypographyVariant,
} from "./tokens";

// Typography
export {
  MarketingText,
  MarketingDisplay,
  MarketingH1,
  MarketingH2,
  MarketingH3,
  MarketingBodyLarge,
  MarketingBody,
  MarketingSmall,
  MarketingCaption,
  MarketingMetadata,
  MarketingEyebrow,
} from "./typography";

// Buttons & badges
export { MarketingButton, marketingButtonVariants } from "./button";
export { MarketingBadge, MarketingStatusBadge, marketingBadgeVariants } from "./badge";

// Cards
export {
  MarketingCardBase,
  MarketingPlatformCard,
  MarketingIndustryCard,
  MarketingFeatureCard,
  MarketingStatCard,
  MarketingComparisonCard,
  MarketingFaqCard,
  MarketingCtaCard,
} from "./cards";

// Forms
export {
  MarketingForm,
  MarketingFormField,
  MarketingInput,
  MarketingSelect,
  MarketingTextarea,
  marketingInputClassName,
  marketingSelectClassName,
  marketingTextareaClassName,
} from "./forms";

// Comparison & grid
export {
  MarketingComparisonBlock,
  MarketingComparisonTable,
  type MarketingComparisonTableRow,
} from "./comparison";
export { MarketingGrid, MarketingSplit } from "./grid";

// Icons
export { MarketingIcon, MarketingListMarker } from "./icon";

// Sections & layout
export {
  MarketingSection,
  MarketingContainer,
  MarketingSectionHeader,
  MarketingHeroSection,
  MarketingFeatureGridSection,
  MarketingWorkflowSection,
  MarketingTimelineSection,
  MarketingComparisonSection,
  MarketingMetricsSection,
  MarketingTestimonialsSection,
  MarketingCtaSection,
  MarketingPageShell,
  type MarketingSectionProps,
  type MarketingSectionHeaderProps,
  type MarketingHeroSectionProps,
  type MarketingFeatureGridSectionProps,
  type MarketingWorkflowStep,
  type MarketingTestimonial,
  type MarketingCtaAction,
} from "./sections";

export { MarketingDesignFooter } from "./footer";
