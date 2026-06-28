/**
 * Desklabs Marketing Design System — color tokens.
 * WCAG-friendly pairings: body text slate-600+ on white, headings slate-950.
 */

export const marketingColors = {
  primary: {
    DEFAULT: "emerald-700",
    hover: "emerald-800",
    foreground: "white",
    muted: "emerald-50",
    mutedForeground: "emerald-800",
    ring: "emerald-600",
  },
  neutral: {
    50: "slate-50",
    100: "slate-100",
    200: "slate-200",
    300: "slate-300",
    400: "slate-400",
    500: "slate-500",
    600: "slate-600",
    700: "slate-700",
    800: "slate-800",
    900: "slate-900",
    950: "slate-950",
  },
  accent: {
    DEFAULT: "emerald-500",
    hover: "emerald-400",
    foreground: "slate-950",
  },
  border: {
    DEFAULT: "slate-200/70",
    strong: "slate-200",
    accent: "emerald-200/70",
  },
  background: {
    DEFAULT: "white",
    muted: "slate-50/80",
    dark: "slate-950",
    gradientHero:
      "bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_40%),linear-gradient(to_bottom,#ffffff,#f8fafc)]",
    gradientCard: "bg-[linear-gradient(to_bottom,#ffffff,#f8fafc)]",
    gradientAccent: "bg-[linear-gradient(to_bottom,#ffffff,#f0fdf4)]",
  },
  success: {
    DEFAULT: "emerald-700",
    background: "emerald-50",
    border: "emerald-200/70",
  },
  warning: {
    DEFAULT: "amber-700",
    background: "amber-50",
    border: "amber-200/70",
  },
  danger: {
    DEFAULT: "red-700",
    background: "red-50",
    border: "red-200/70",
  },
} as const;

/** Tailwind class strings for common text/background usage */
export const marketingColorClasses = {
  textPrimary: "text-slate-950",
  textBody: "text-slate-600",
  textMuted: "text-slate-500",
  textOnDark: "text-white",
  textOnDarkMuted: "text-slate-300",
  textAccent: "text-emerald-700",
  bgPage: "bg-white text-slate-950",
  bgMuted: "bg-slate-50/80",
  bgDark: "bg-slate-950 text-slate-100",
  borderDefault: "ring-1 ring-slate-200/70",
  borderAccent: "ring-1 ring-emerald-200/70",
  focusRing:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2",
} as const;
