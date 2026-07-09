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

/** Aurora message bubble system — CRM conversation presentation */
export const AURORA_MESSAGE_BUBBLE_RADIUS = "rounded-[18px]";

export const AURORA_MESSAGE_BUBBLE_PADDING = "px-4 py-2";

export const AURORA_MESSAGE_BUBBLE_MAX_WIDTH = "max-w-[68%]";

export const AURORA_MESSAGE_BUBBLE_INCOMING =
  "bg-muted/35 text-foreground border border-border/10 shadow-none";

export const AURORA_MESSAGE_BUBBLE_OUTGOING =
  "bg-primary text-primary-foreground shadow-none";

export const AURORA_MESSAGE_BUBBLE_TEXT =
  "whitespace-pre-wrap text-sm leading-[1.45]";

export const AURORA_MESSAGE_BUBBLE_TEXT_LINK_INCOMING =
  "[&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline [&_a]:underline-offset-2";

export const AURORA_MESSAGE_BUBBLE_TEXT_LINK_OUTGOING =
  "[&_a]:text-primary-foreground/90 [&_a]:no-underline hover:[&_a]:underline [&_a]:underline-offset-2";

export const AURORA_MESSAGE_BUBBLE_SELECTION = "selection:bg-primary/15";

export const AURORA_MESSAGE_BUBBLE_ENTER =
  "animate-in fade-in slide-in-from-bottom-1 duration-[140ms] ease-out motion-reduce:animate-none";

export const AURORA_MESSAGE_BUBBLE_TIMESTAMP =
  "text-[11px] leading-none tabular-nums opacity-55";

export const AURORA_MESSAGE_BUBBLE_DELIVERY =
  "text-[11px] font-normal leading-none opacity-55";

export const AURORA_MESSAGE_BUBBLE_ATTACHMENT =
  "mt-1.5 overflow-hidden rounded-xl border border-border/10 bg-muted/15 px-3 py-2";

export const AURORA_MESSAGE_GROUP_GAP = "mt-1";

export const AURORA_MESSAGE_SENDER_GAP = "mt-[18px]";

export const AURORA_MESSAGE_AVATAR_SIZE = "h-7 w-7";

export const AURORA_MESSAGE_DATE_SEPARATOR =
  "flex w-full justify-center py-6 first:pt-0";

export const AURORA_MESSAGE_DATE_SEPARATOR_LABEL =
  "text-xs text-muted-foreground/50";

/** Aurora conversation states — feedback, separators, skeleton */
export const AURORA_STATE_FADE =
  "animate-in fade-in duration-150 ease-out motion-reduce:animate-none";

export const AURORA_STATE_FADE_FAST =
  "animate-in fade-in duration-[120ms] ease-out motion-reduce:animate-none";

export const AURORA_STATE_SKELETON = "animate-pulse rounded-md bg-muted/40";

export const AURORA_STATE_STATUS_MUTED =
  "text-[11px] font-normal leading-none opacity-55";

export const AURORA_STATE_STATUS_SENDING =
  "text-[11px] font-normal leading-none text-primary-foreground/55";

export const AURORA_STATE_STATUS_FAILED =
  "text-[11px] font-normal leading-none text-red-500/75 dark:text-red-400/75";

export const AURORA_STATE_TYPING_BUBBLE =
  "inline-flex items-center rounded-[20px] border border-border/10 bg-muted/35 px-4 py-2.5";

export const AURORA_STATE_TYPING_LABEL =
  "mb-1.5 text-[11px] text-muted-foreground/55";

export const AURORA_STATE_UNREAD_SEPARATOR =
  "flex w-full items-center gap-3 py-4";

export const AURORA_STATE_UNREAD_SEPARATOR_LINE =
  "h-px flex-1 bg-primary/20 dark:bg-primary/25";

export const AURORA_STATE_UNREAD_SEPARATOR_LABEL =
  "shrink-0 text-xs uppercase tracking-wide text-primary/55 dark:text-primary/45";

/** Aurora conversation composer 2.0 */
export const AURORA_COMPOSER_HEIGHT = "h-14";

export const AURORA_COMPOSER_MIN_HEIGHT = "min-h-14";

export const AURORA_COMPOSER_RADIUS = "rounded-2xl";

export const AURORA_COMPOSER_PADDING = "px-3";

export const AURORA_COMPOSER_GAP = "gap-1.5";

export const AURORA_COMPOSER_SURFACE =
  "flex h-14 min-h-14 w-full items-center gap-1.5 rounded-2xl border border-border/20 bg-white px-3 shadow-none dark:bg-background";

export const AURORA_COMPOSER_SURFACE_FOCUS =
  "focus-within:border-border/35 focus-within:outline-none focus-within:ring-0";

export const AURORA_COMPOSER_ICON_SIZE = "h-[18px] w-[18px]";

export const AURORA_COMPOSER_ICON_BUTTON =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors duration-150 ease-out hover:bg-muted/30 hover:text-foreground active:bg-muted/40 focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-40";

export const AURORA_COMPOSER_INPUT =
  "w-full resize-none border-0 bg-transparent px-0 text-sm leading-6 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50";

export const AURORA_COMPOSER_AI_PILL =
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border/20 bg-muted/15 px-2.5 text-xs font-medium text-muted-foreground/75 transition-colors duration-150 ease-out hover:border-border/30 hover:bg-muted/25 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-40";

export const AURORA_COMPOSER_SEND_BUTTON =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-none transition-[background-color,opacity] duration-150 ease-out hover:bg-primary/90 active:bg-primary/85 focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-35";

/** Conversation queue — scanning-optimized list */
export const AURORA_QUEUE_WIDTH = "w-[300px] min-w-[300px] max-w-[300px]";

export const AURORA_QUEUE_SEARCH_CLASS =
  "h-10 w-full rounded-full border border-border/15 bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 focus-visible:border-border/25 focus-visible:ring-1 focus-visible:ring-ring/10";

export const AURORA_QUEUE_AI_TOGGLE_SURFACE =
  "rounded-lg border border-border/15 bg-muted/8 px-2.5 py-1.5";

export const AURORA_QUEUE_ITEM_BASE =
  "group relative block rounded-xl px-2.5 py-2";

export const AURORA_QUEUE_ITEM_HOVER = "hover:bg-muted/15";

export const AURORA_QUEUE_ITEM_SELECTED = "bg-muted/20 dark:bg-muted/15";

export const AURORA_QUEUE_FILTER_CHIP =
  "inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[11px] font-medium";

export const AURORA_CONTEXT_SHEET_WIDTH = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
} as const;

export type AuroraContextSheetWidth = keyof typeof AURORA_CONTEXT_SHEET_WIDTH;

/** Aurora context panel — permanent desktop rail */
export const AURORA_CONTEXT_PANEL_WIDTH =
  "w-[360px] min-w-[360px] max-w-[360px]";

export const AURORA_CONTEXT_CARD_CLASS =
  "rounded-2xl border border-border/15 p-5";

export const AURORA_CONTEXT_CARD_STACK_GAP = "gap-4";

export const AURORA_CONTEXT_AI_SUMMARY_CLASS =
  "rounded-2xl border border-border/15 bg-primary/[0.04] p-5 dark:bg-primary/[0.06]";

export const AURORA_CONTEXT_CHIP_CLASS =
  "inline-flex items-center rounded-full bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground";

/** Aurora global top navigation — shared across Desklabs shell */
export const AURORA_NAV_HEIGHT = "h-16";

export const AURORA_NAV_ACTIONS_GAP = "gap-1.5";

export const AURORA_NAV_ICON_BUTTON =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/20 text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted/30 active:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20";

export const AURORA_NAV_ICON_SIZE = "h-[18px] w-[18px]";

export const AURORA_NAV_SEARCH_MAX_WIDTH = "max-w-[300px]";

export const AURORA_NAV_SEARCH_TRIGGER =
  "flex h-10 w-full items-center gap-2.5 rounded-full border border-border/20 bg-background px-3.5 text-sm transition-colors duration-150 ease-out hover:border-border/30 hover:bg-muted/15 focus-visible:outline-none focus-visible:border-border/40 focus-visible:ring-1 focus-visible:ring-ring/15";

export const AURORA_NAV_SEARCH_PLACEHOLDER = "flex-1 text-left text-muted-foreground/55";

export const AURORA_NAV_SEARCH_KBD =
  "rounded-md border border-border/25 bg-muted/15 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/50";

export const AURORA_NAV_CREATE_BUTTON =
  "hidden h-[38px] shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-medium shadow-none transition-[color,box-shadow,background-color] duration-150 ease-out hover:bg-emerald-700 hover:shadow-sm active:bg-emerald-800 md:inline-flex";

export const AURORA_NAV_SWITCHER_TRIGGER =
  "inline-flex h-[38px] items-center gap-2 rounded-xl border border-border/20 text-foreground/80 transition-colors duration-150 ease-out hover:border-border/30 hover:bg-muted/30 active:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20";

export const AURORA_NAV_PROFILE_TRIGGER =
  "inline-flex h-[38px] items-center gap-2 rounded-xl border border-border/20 pl-1.5 pr-2.5 text-foreground/80 transition-colors duration-150 ease-out hover:border-border/30 hover:bg-muted/30 active:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20";

export const AURORA_NAV_BADGE =
  "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-medium leading-none text-primary-foreground";
