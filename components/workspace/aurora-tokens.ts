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

/** Compact workspace header rhythm — shared across all modules */
export const AURORA_WORKSPACE_HEADER_PADDING = "px-4 py-2 md:px-5 md:py-2.5";

export const AURORA_WORKSPACE_HEADER_TITLE =
  "truncate text-lg font-semibold tracking-tight text-foreground md:text-xl";

export const AURORA_WORKSPACE_HEADER_KPI =
  "mt-0.5 truncate text-xs leading-snug tabular-nums";

export const AURORA_WORKSPACE_HEADER_SEARCH_MAX = "max-w-[280px]";

export const AURORA_WORKSPACE_HEADER_CONTROL =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[14px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export const AURORA_FLAT_SURFACE_CLASS = "bg-background";

/** Centered conversation reading lane — target 720–760px */
export const AURORA_READING_LANE_CLASS =
  "mx-auto w-full max-w-[740px] min-w-0 px-4 sm:px-5";

/** Message bubble corner radius per Aurora Visual DNA */
export const AURORA_BUBBLE_RADIUS = "rounded-[20px]";

/** Aurora conversation composer */
export const AURORA_COMPOSER_SURFACE =
  "flex h-[54px] min-h-[52px] w-full items-center gap-2 rounded-[26px] border border-border/20 bg-white px-4 dark:bg-background";

export const AURORA_COMPOSER_ICON_BUTTON =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-muted/25 hover:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40";

export const AURORA_COMPOSER_SEND_BUTTON =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35";

/** Conversation queue — scanning-optimized list */
export const AURORA_QUEUE_WIDTH = "w-[300px] min-w-[300px] max-w-[300px]";

export const AURORA_QUEUE_ITEM_BASE =
  "group relative block rounded-[14px] px-2.5 py-2 transition-colors duration-[120ms] motion-reduce:transition-none";

export const AURORA_QUEUE_ITEM_HOVER = "hover:bg-muted/35 dark:hover:bg-muted/20";

export const AURORA_QUEUE_ITEM_SELECTED =
  "bg-muted/45 ring-1 ring-inset ring-border/25 dark:bg-muted/25";

export const AURORA_QUEUE_FILTER_CHIP =
  "inline-flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-medium transition-colors duration-[120ms] motion-reduce:transition-none";

export const AURORA_CONTEXT_SHEET_WIDTH = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
} as const;

export type AuroraContextSheetWidth = keyof typeof AURORA_CONTEXT_SHEET_WIDTH;
