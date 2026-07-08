/**
 * Aurora Workspace Shell design tokens.
 * @see docs/design/Aurora-Blueprint.md
 */

export const AURORA_SHEET_RADIUS = "rounded-[20px]";

export const AURORA_MOTION = {
  hover: "duration-[120ms]",
  panel: "duration-[220ms]",
  sheet: "duration-[260ms]",
  /** Smooth spring-like ease without elastic bounce */
  spring: "ease-[cubic-bezier(0.22,1,0.36,1)]",
  respectMotion: "motion-reduce:transition-none motion-reduce:animate-none",
} as const;

export const AURORA_SHELL_CLASS =
  "flex min-h-0 flex-1 flex-col bg-background text-foreground";

export const AURORA_CONTENT_LANE_CLASS =
  "mx-auto w-full max-w-[1160px] min-w-0";

export const AURORA_HEADER_CLASS =
  "shrink-0 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80";

export const AURORA_FLAT_SURFACE_CLASS = "bg-background";

/** Centered conversation reading lane — target 680–760px */
export const AURORA_READING_LANE_CLASS =
  "mx-auto w-full max-w-[720px] min-w-0 px-4 sm:px-5";

/** Message bubble corner radius per Aurora Visual DNA */
export const AURORA_BUBBLE_RADIUS = "rounded-[24px]";

export const AURORA_CONTEXT_SHEET_WIDTH = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
} as const;

export type AuroraContextSheetWidth = keyof typeof AURORA_CONTEXT_SHEET_WIDTH;
