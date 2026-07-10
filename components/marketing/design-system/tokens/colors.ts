/**
 * Desklabs Marketing Design System — color tokens.
 * Maps to CSS variables defined in styles/marketing-tokens.css under `.marketing-site`.
 */

export const marketingColors = {
  brand: {
    500: "#2d73d5",
    600: "#1f5fbf",
    700: "#164a96",
  },
  aurora: {
    violet: "#6d5dfb",
    cyan: "#4cc9f0",
  },
  primary: {
    DEFAULT: "var(--marketing-primary)",
    hover: "var(--marketing-primary-hover)",
    foreground: "var(--marketing-primary-foreground)",
    muted: "var(--marketing-primary-muted)",
    mutedForeground: "var(--marketing-primary-muted-foreground)",
  },
  neutral: {
    background: "var(--marketing-background)",
    foreground: "var(--marketing-foreground)",
    muted: "var(--marketing-muted)",
    mutedForeground: "var(--marketing-muted-foreground)",
    surface: "var(--marketing-surface)",
    surfaceMuted: "var(--marketing-surface-muted)",
    elevatedSurface: "var(--marketing-elevated-surface)",
  },
  accent: {
    DEFAULT: "var(--marketing-accent)",
    secondary: "var(--marketing-accent-secondary)",
    foreground: "var(--marketing-accent-foreground)",
  },
  border: {
    DEFAULT: "var(--marketing-border-default)",
    subtle: "var(--marketing-border-subtle)",
    strong: "var(--marketing-border-strong)",
    accent: "var(--marketing-border-accent)",
  },
  background: {
    DEFAULT: "var(--marketing-background)",
    muted: "var(--marketing-surface)",
    dark: "#0f172a",
    gradientHero: "var(--marketing-gradient-hero)",
    gradientCard:
      "linear-gradient(to bottom, var(--marketing-background), var(--marketing-surface))",
    gradientAccent:
      "linear-gradient(to bottom, var(--marketing-background), var(--marketing-primary-muted))",
  },
  success: {
    DEFAULT: "var(--marketing-success)",
    background: "var(--marketing-success-background)",
    border: "var(--marketing-success-border)",
  },
  warning: {
    DEFAULT: "var(--marketing-warning)",
    background: "var(--marketing-warning-background)",
    border: "var(--marketing-warning-border)",
  },
  danger: {
    DEFAULT: "var(--marketing-error)",
    background: "var(--marketing-error-background)",
    border: "var(--marketing-error-border)",
  },
} as const;

/** Tailwind class strings mapped to marketing CSS variables */
export const marketingColorClasses = {
  textPrimary: "text-[var(--marketing-foreground)]",
  textBody: "text-[var(--marketing-muted)]",
  textMuted: "text-[var(--marketing-muted-foreground)]",
  textOnDark: "text-white",
  textOnDarkMuted: "text-slate-300",
  textAccent: "text-[var(--marketing-primary)]",
  textAccentHover: "hover:text-[var(--marketing-primary-hover)]",
  bgPage: "bg-[var(--marketing-background)] text-[var(--marketing-foreground)]",
  bgMuted: "bg-[var(--marketing-surface)]",
  bgDark: "bg-slate-950 text-slate-100",
  bgPrimary: "bg-[var(--marketing-primary)] text-[var(--marketing-primary-foreground)]",
  bgPrimaryMuted: "bg-[var(--marketing-primary-muted)] text-[var(--marketing-primary-muted-foreground)]",
  borderDefault: "ring-1 ring-[var(--marketing-border-default)]",
  borderAccent: "ring-1 ring-[var(--marketing-border-accent)]",
  focusRing:
    "marketing-focus-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--marketing-brand-500)] focus-visible:ring-offset-2",
} as const;
