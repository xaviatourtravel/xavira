import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

// Builds a theme-aware Tailwind neutral ramp backed by CSS variables so the
// same class (e.g. bg-slate-50) renders light in light mode and dark in dark
// mode. RGB channels keep the `/<alpha>` opacity modifier working.
const RAMP_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
function rampColor(name: string): Record<string, string> {
  return Object.fromEntries(
    RAMP_STEPS.map((step) => [String(step), `rgb(var(--${name}-${step}) / <alpha-value>)`]),
  );
}

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Neutral ramps are theme-aware: light keeps stock Tailwind values,
        // dark remaps via CSS variables so every legacy hardcoded class
        // (e.g. text-slate-900, bg-slate-50, border-gray-200) follows the theme.
        slate: rampColor("slate"),
        gray: rampColor("gray"),
        zinc: rampColor("zinc"),
        neutral: rampColor("neutral"),
        stone: rampColor("stone"),
        // Named semantic surfaces.
        app: "hsl(var(--bg-app) / <alpha-value>)",
        sidebar: "hsl(var(--bg-sidebar) / <alpha-value>)",
        elevated: "hsl(var(--bg-elevated) / <alpha-value>)",
        hover: "hsl(var(--bg-hover) / <alpha-value>)",
        selected: "hsl(var(--bg-selected) / <alpha-value>)",
        "message-in": "hsl(var(--bg-message-in) / <alpha-value>)",
        "message-out": "hsl(var(--bg-message-out) / <alpha-value>)",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--danger-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      // `bg-white` resolves to the card surface (theme-aware) while
      // `text-white` / `border-white` stay literally white for accents on
      // coloured buttons and badges.
      backgroundColor: {
        white: "hsl(var(--bg-card) / <alpha-value>)",
      },
      borderColor: {
        soft: "hsl(var(--border-soft) / <alpha-value>)",
        strong: "hsl(var(--border-strong) / <alpha-value>)",
      },
      textColor: {
        faint: "hsl(var(--text-muted) / <alpha-value>)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
