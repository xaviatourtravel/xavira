/** Border radius tokens for marketing UI — aligned with CSS variables */

export const marketingRadius = {
  sm: "rounded-[var(--marketing-radius-sm)]",
  md: "rounded-[var(--marketing-radius-md)]",
  lg: "rounded-[var(--marketing-radius-lg)]",
  xl: "rounded-[var(--marketing-radius-xl)]",
  full: "rounded-[var(--marketing-radius-pill)]",
  icon: "rounded-[var(--marketing-radius-md)]",
  button: "rounded-[var(--marketing-radius-sm)]",
} as const;

export const marketingShadow = {
  card: "shadow-sm",
  cardHover: "shadow-md",
  elevated: "shadow-[var(--marketing-shadow-soft)]",
  hero: "shadow-[var(--marketing-shadow-float)]",
} as const;
