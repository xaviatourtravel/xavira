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
export const AURORA_WORKSPACE_HEADER_PADDING = "px-4 py-2";

export const AURORA_WORKSPACE_HEADER_TITLE =
  "truncate text-xl font-semibold leading-none tracking-tight text-foreground";

export const AURORA_WORKSPACE_HEADER_KPI =
  "mt-1 truncate text-xs leading-5 tabular-nums text-muted-foreground/60";

export const AURORA_WORKSPACE_HEADER_SEARCH_MAX = "max-w-[280px]";

export const AURORA_WORKSPACE_HEADER_CONTROL =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[14px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export const AURORA_FLAT_SURFACE_CLASS = "bg-background";

/** Centered conversation reading lane — target 700–720px */
export const AURORA_READING_LANE_CLASS =
  "mx-auto w-full max-w-[710px] min-w-0 px-4 sm:px-5";

/** Message bubble corner radius per Aurora Visual DNA */
export const AURORA_BUBBLE_RADIUS = "rounded-[20px]";

/** Aurora message bubble system — CRM conversation presentation */
export const AURORA_MESSAGE_BUBBLE_RADIUS = "rounded-[20px]";

export const AURORA_MESSAGE_BUBBLE_PADDING = "px-5 py-2";

export const AURORA_MESSAGE_BUBBLE_MAX_WIDTH = "max-w-[70%]";

export const AURORA_MESSAGE_BUBBLE_INCOMING =
  "bg-muted/35 text-foreground border border-border/10 shadow-none";

export const AURORA_MESSAGE_BUBBLE_OUTGOING =
  "bg-primary text-primary-foreground shadow-none";

export const AURORA_MESSAGE_BUBBLE_TEXT =
  "whitespace-pre-wrap text-sm leading-6";

export const AURORA_MESSAGE_BUBBLE_TEXT_LINK_INCOMING =
  "[&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline [&_a]:underline-offset-2";

export const AURORA_MESSAGE_BUBBLE_TEXT_LINK_OUTGOING =
  "[&_a]:text-primary-foreground/90 [&_a]:no-underline hover:[&_a]:underline [&_a]:underline-offset-2";

export const AURORA_MESSAGE_BUBBLE_SELECTION = "selection:bg-primary/15";

export const AURORA_MESSAGE_BUBBLE_ENTER =
  "animate-in fade-in slide-in-from-bottom-1 duration-[140ms] ease-out motion-reduce:animate-none";

export const AURORA_MESSAGE_BUBBLE_TIMESTAMP =
  "text-[11px] leading-none tabular-nums opacity-50";

export const AURORA_MESSAGE_BUBBLE_DELIVERY =
  "text-[11px] font-normal leading-none opacity-50";

export const AURORA_MESSAGE_BUBBLE_ATTACHMENT =
  "mt-1.5 overflow-hidden rounded-xl border border-border/10 bg-muted/15 px-3 py-2";

export const AURORA_MESSAGE_GROUP_GAP = "mt-1";

export const AURORA_MESSAGE_SENDER_GAP = "mt-4";

export const AURORA_MESSAGE_AVATAR_SIZE = "h-8 w-8";

export const AURORA_MESSAGE_DATE_SEPARATOR =
  "flex w-full justify-center py-4 first:pt-0";

export const AURORA_MESSAGE_DATE_SEPARATOR_LABEL =
  "rounded-full bg-muted/20 px-3 py-1 text-xs leading-5 text-muted-foreground/55";

/** Aurora conversation header — 16px vertical rhythm */
export const AURORA_CONVERSATION_HEADER_HEIGHT = "py-4";

export const AURORA_CONVERSATION_HEADER_BORDER = "border-b border-border/15";

export const AURORA_CONVERSATION_HEADER_FADE =
  "animate-in fade-in duration-100 motion-reduce:animate-none";

export const AURORA_CONVERSATION_HEADER_ICON_BUTTON =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground/75 transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

export const AURORA_CONVERSATION_HEADER_ICON_ACTIVE =
  "bg-muted/30 text-foreground";

export const AURORA_CONVERSATION_HEADER_NAME =
  "truncate text-[15px] font-semibold leading-none tracking-tight text-foreground";

export const AURORA_CONVERSATION_HEADER_CHANNEL =
  "truncate text-xs leading-5 text-muted-foreground/70";

export const AURORA_CONVERSATION_HEADER_SECONDARY_META =
  "truncate text-xs leading-5 text-muted-foreground/55";

/** @deprecated Prefer AURORA_CONVERSATION_HEADER_CHANNEL + SECONDARY_META stacked layout */
export const AURORA_CONVERSATION_HEADER_META =
  "truncate text-xs leading-none text-muted-foreground/65";

export const AURORA_CONVERSATION_HEADER_UNREAD_DOT =
  "ml-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60";

export const AURORA_CONVERSATION_HEADER_SEARCH =
  "h-9 w-full rounded-full border border-border/15 bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 focus-visible:border-border/25 focus-visible:ring-1 focus-visible:ring-ring/10";

export const AURORA_CONVERSATION_HEADER_AI_TOGGLE =
  "inline-flex h-[30px] items-center rounded-full border border-border/20 bg-transparent p-0.5";

export const AURORA_CONVERSATION_HEADER_AI_OPTION =
  "rounded-full px-2.5 text-[11px] font-medium transition-colors duration-150";

export const AURORA_CONVERSATION_HEADER_AI_OPTION_ACTIVE =
  "bg-primary text-primary-foreground";

export const AURORA_CONVERSATION_HEADER_AI_OPTION_INACTIVE =
  "bg-transparent text-muted-foreground hover:text-foreground";

export const AURORA_CONVERSATION_HEADER_TOOLTIP =
  "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-medium leading-none text-background animate-in fade-in duration-100 motion-reduce:animate-none";

export const AURORA_CONVERSATION_ACTIONS_MENU =
  "absolute right-0 top-[calc(100%+6px)] z-30 w-[260px] overflow-hidden rounded-2xl border border-border/20 bg-background py-1.5 animate-in fade-in duration-100 motion-reduce:animate-none";

export const AURORA_CONVERSATION_ACTIONS_MENU_DIVIDER = "my-1.5 h-px bg-border/20";

export const AURORA_CONVERSATION_ACTION_MENU_ITEM =
  "flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:bg-muted/40 disabled:pointer-events-none disabled:opacity-50";

export const AURORA_CONVERSATION_ACTION_MENU_ITEM_ICON =
  "flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground";

export const AURORA_CONVERSATION_ACTION_MENU_ITEM_SHORTCUT =
  "ml-auto shrink-0 text-[10px] font-medium tabular-nums text-muted-foreground/50";

export const AURORA_CONVERSATION_ACTION_MENU_SECTION_LABEL =
  "px-2.5 pb-1 pt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/45";

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

/** Aurora conversation composer — 44px bar, 14px input */
export const AURORA_COMPOSER_HEIGHT = "h-11";

export const AURORA_COMPOSER_MIN_HEIGHT = "min-h-11";

export const AURORA_COMPOSER_RADIUS = "rounded-xl";

export const AURORA_COMPOSER_PADDING = "px-3";

export const AURORA_COMPOSER_GAP = "gap-2";

export const AURORA_COMPOSER_SURFACE =
  "flex h-11 min-h-11 w-full items-center gap-2 rounded-xl border border-border/15 bg-white px-3 shadow-none dark:bg-background";

export const AURORA_COMPOSER_SURFACE_FOCUS =
  "focus-within:border-border/35 focus-within:outline-none focus-within:ring-0";

export const AURORA_COMPOSER_ICON_SIZE = "h-[18px] w-[18px]";

export const AURORA_COMPOSER_ICON_BUTTON =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors duration-150 ease-out hover:bg-muted/30 hover:text-foreground active:bg-muted/40 focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-40";

export const AURORA_COMPOSER_INPUT =
  "w-full resize-none border-0 bg-transparent px-0 text-sm leading-6 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50";

export const AURORA_COMPOSER_AI_PILL =
  "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-border/20 bg-muted/15 px-2.5 text-xs font-medium text-muted-foreground/75 transition-colors duration-150 ease-out hover:border-border/30 hover:bg-muted/25 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-40";

export const AURORA_COMPOSER_AI_PILL_ACTIVE =
  "border-primary/25 bg-primary/[0.06] text-primary";

export const AURORA_COMPOSER_SEND_BUTTON =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-none transition-[background-color,opacity] duration-150 ease-out hover:bg-primary/90 active:bg-primary/85 focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-35";

/** Aurora smart reply composer — contextual intelligence around the input */
export const AURORA_SMART_REPLY_SUGGESTION =
  "rounded-2xl border border-border/15 bg-background p-4";

export const AURORA_SMART_REPLY_SECONDARY_BUTTON =
  "inline-flex h-8 items-center justify-center rounded-[10px] border border-border/20 bg-background px-3 text-xs font-medium text-foreground shadow-none transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

export const AURORA_SMART_REPLY_QUICK_ACTION =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/15 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

export const AURORA_SMART_REPLY_QUICK_ACTIONS_ROW =
  "flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export const AURORA_SMART_REPLY_MENU =
  "absolute bottom-full left-0 right-0 z-40 mb-2 overflow-hidden rounded-2xl border border-border/15 bg-background";

export const AURORA_SMART_REPLY_MENU_ITEM =
  "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:bg-muted/20";

export const AURORA_SMART_REPLY_MODAL_OVERLAY =
  "fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center";

export const AURORA_SMART_REPLY_MODAL =
  "w-full max-w-md overflow-hidden rounded-2xl border border-border/15 bg-background";

export const AURORA_SMART_REPLY_POPOVER =
  "absolute bottom-full left-0 z-40 mb-2 w-56 overflow-hidden rounded-2xl border border-border/15 bg-background";

export const AURORA_SMART_REPLY_SEARCH =
  "h-10 w-full border-0 border-b border-border/15 bg-transparent px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/55 focus-visible:ring-0";

/** App navigation — collapsed icon rail for Communication workspace */
export const AURORA_NAV_RAIL_COLLAPSED_WIDTH =
  "w-[72px] min-w-[72px] max-w-[72px]";

export const AURORA_NAV_RAIL_EXPANDED_WIDTH =
  "w-[248px] min-w-[248px] max-w-[248px]";

/** Inbox flow — queue and channel navigation column */
export const AURORA_INBOX_FLOW_WIDTH =
  "w-[220px] min-w-[220px] max-w-[220px]";

export const AURORA_WORKSPACE_COLUMN_HEADER =
  "flex shrink-0 items-center border-b border-border/15 px-4 py-4";

export const AURORA_INBOX_FLOW_SECTION = "px-3";

export const AURORA_INBOX_FLOW_SECTION_TITLE =
  "mb-2 px-1 text-[13px] font-semibold leading-none text-foreground/80";

export const AURORA_INBOX_FLOW_ITEM =
  "flex h-9 w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-xs leading-5 font-medium text-muted-foreground transition-colors hover:bg-muted/8 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

export const AURORA_INBOX_FLOW_ITEM_SELECTED =
  "flex h-9 w-full items-center justify-between gap-2 rounded-lg border-l-2 border-primary bg-muted/8 pl-2 pr-3 text-left text-xs leading-5 font-medium text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

/** Conversation queue — scanning-optimized list */
export const AURORA_QUEUE_WIDTH = "w-[320px] min-w-[320px] max-w-[320px]";

export const AURORA_QUEUE_SEARCH_CLASS =
  "h-10 w-full rounded-xl border border-border/15 bg-background pl-9 pr-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 focus-visible:border-border/25 focus-visible:ring-1 focus-visible:ring-ring/10";

export const AURORA_QUEUE_AI_TOGGLE_SURFACE =
  "rounded-xl border border-border/15 bg-muted/8 px-3 py-2";

export const AURORA_QUEUE_ITEM_BASE =
  "group relative flex h-[60px] items-center rounded-xl px-3";

export const AURORA_QUEUE_ITEM_HOVER = "hover:bg-muted/8";

export const AURORA_QUEUE_ITEM_SELECTED = "bg-muted/8 dark:bg-muted/8";

export const AURORA_QUEUE_FILTER_CHIP =
  "inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 text-[11px] font-medium leading-5";

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
  "w-[320px] min-w-[320px] max-w-[320px]";

export const AURORA_CONTEXT_CARD_CLASS =
  "rounded-xl border border-border/15 p-4 shadow-none";

export const AURORA_CONTEXT_CARD_STACK_GAP = "gap-3";

export const AURORA_CONTEXT_AI_SUMMARY_CLASS =
  "rounded-2xl border border-border/15 bg-primary/[0.04] p-5 dark:bg-primary/[0.06]";

/** Aurora AI Copilot — interactive sales assistant in context panel */
export const AURORA_COPILOT_SECTION =
  "rounded-2xl border border-border/15 bg-background p-5";

export const AURORA_COPILOT_SECTION_TITLE =
  "text-[15px] font-semibold tracking-tight text-foreground";

export const AURORA_COPILOT_HELPER = "text-xs text-muted-foreground";

export const AURORA_COPILOT_CARD_STACK = "mt-4 flex flex-col gap-4";

export const AURORA_COPILOT_CARD =
  "rounded-2xl border border-border/15 bg-background p-5";

export const AURORA_COPILOT_CARD_TITLE = "text-sm font-medium text-foreground";

export const AURORA_COPILOT_BODY = "text-sm leading-relaxed text-foreground/85";

export const AURORA_COPILOT_METRIC_LABEL = "text-xs text-muted-foreground";

export const AURORA_COPILOT_METRIC_VALUE = "text-sm font-medium text-foreground";

export const AURORA_COPILOT_CHIP =
  "inline-flex items-center gap-1.5 rounded-full border border-border/10 bg-muted/20 px-2.5 py-1 text-xs font-medium text-muted-foreground";

export const AURORA_COPILOT_REPLY_BLOCK =
  "rounded-xl border border-border/15 bg-muted/10 px-4 py-3.5 text-sm leading-relaxed text-foreground/90";

export const AURORA_COPILOT_ACTION_BUTTON =
  "inline-flex h-8 items-center justify-center rounded-[10px] border border-border/20 bg-background px-3 text-xs font-medium text-foreground shadow-none transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

export const AURORA_COPILOT_ACTION_ROW =
  "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/20";

export const AURORA_COPILOT_ACTION_ROW_RECOMMENDED =
  "flex w-full items-start gap-3 rounded-xl border border-border/20 bg-muted/15 px-3 py-3 text-left";

export const AURORA_COPILOT_ACTION_ICON =
  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/15 bg-background text-muted-foreground/75";

export const AURORA_COPILOT_MEMORY_ITEM =
  "relative flex items-center gap-2 text-[11px] text-muted-foreground/70";

export const AURORA_COPILOT_MEMORY_DOT =
  "h-1.5 w-1.5 shrink-0 rounded-full bg-border/50";

export const AURORA_CONTEXT_CHIP_CLASS =
  "inline-flex items-center rounded-full bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground";

/** Aurora internal notes — Notion-style comment cards in context panel */
export const AURORA_INTERNAL_NOTES_CARD =
  "rounded-xl border border-border/15 bg-muted/20 p-3";

export const AURORA_INTERNAL_NOTES_LIST_GAP = "space-y-3";

export const AURORA_INTERNAL_NOTES_ADD_BUTTON =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

export const AURORA_INTERNAL_NOTES_SHEET_WIDTH = "md:w-[420px] md:max-w-[420px]";

export const AURORA_INTERNAL_NOTES_TEXTAREA =
  "min-h-[120px] max-h-[220px] w-full resize-none rounded-xl border border-border/15 bg-background px-3.5 py-3 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 focus-visible:border-border/25 focus-visible:ring-1 focus-visible:ring-ring/10";

/** Aurora customer timeline — intelligent CRM audit feed in context panel */
export const AURORA_TIMELINE_LINE = "bg-border/25";

export const AURORA_TIMELINE_ITEM =
  "group relative flex gap-3 rounded-lg px-2 py-4 transition-colors hover:bg-muted/20";

export const AURORA_TIMELINE_ICON_NODE =
  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/20 bg-background text-muted-foreground/75";

export const AURORA_TIMELINE_GROUP_LABEL =
  "mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/55";

export const AURORA_TIMELINE_TIME = "text-xs tabular-nums text-muted-foreground/70";

export const AURORA_TIMELINE_TITLE = "text-sm font-medium leading-snug text-foreground";

export const AURORA_TIMELINE_DESCRIPTION =
  "mt-1 whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground";

export const AURORA_TIMELINE_ACTOR = "mt-1.5 text-xs text-muted-foreground/65";

export const AURORA_TIMELINE_MODULE = "font-medium text-muted-foreground/55";

/** @deprecated Use AURORA_TIMELINE_ICON_NODE */
export const AURORA_TIMELINE_ICON = AURORA_TIMELINE_ICON_NODE;

/** Aurora customer snapshot — continuous information panel */
export const AURORA_SNAPSHOT_CARD =
  "bg-background";

export const AURORA_SNAPSHOT_SECTION_GAP = "space-y-4";

export const AURORA_SNAPSHOT_SUBSECTION_TITLE =
  "text-[13px] font-semibold leading-none text-foreground/85";

export const AURORA_SNAPSHOT_DIVIDER = "hidden";

export const AURORA_SNAPSHOT_HEADER_NAME =
  "truncate text-[15px] font-semibold leading-none text-foreground";

export const AURORA_SNAPSHOT_HEADER_CHANNEL =
  "truncate text-xs leading-5 text-muted-foreground/70";

export const AURORA_SNAPSHOT_HEADER_META =
  "truncate text-xs leading-5 text-muted-foreground/55";

export const AURORA_SNAPSHOT_LEAD_BADGE =
  "inline-flex items-center rounded-full bg-muted/20 px-2 py-0.5 text-xs leading-5 font-medium text-muted-foreground";

export const AURORA_SNAPSHOT_JOURNEY_STEP =
  "relative flex items-center gap-2 py-1";

export const AURORA_SNAPSHOT_JOURNEY_DOT =
  "relative z-[1] h-3 w-3 shrink-0 rounded-full";

export const AURORA_SNAPSHOT_JOURNEY_CONNECTOR =
  "absolute left-[5px] top-6 bottom-0 w-px bg-border/15";

export const AURORA_SNAPSHOT_JOURNEY_LABEL =
  "text-xs leading-5 font-normal text-muted-foreground/60";

export const AURORA_SNAPSHOT_JOURNEY_LABEL_PENDING =
  "text-xs leading-5 font-normal text-muted-foreground/40";

export const AURORA_SNAPSHOT_ROW = "space-y-1";

export const AURORA_SNAPSHOT_ROW_LABEL = "text-xs leading-5 text-muted-foreground/60";

export const AURORA_SNAPSHOT_ROW_VALUE =
  "truncate text-sm font-medium leading-6 text-foreground";

export const AURORA_SNAPSHOT_AI_SURFACE = "py-0";

export const AURORA_SNAPSHOT_AI_BULLET =
  "text-sm leading-6 text-foreground/70";

export const AURORA_SNAPSHOT_ACTIVITY_LIST =
  "relative mt-2 border-l border-border/15 pl-3";

export const AURORA_SNAPSHOT_ACTIVITY_ROW =
  "relative pb-3 last:pb-0";

export const AURORA_SNAPSHOT_ACTIVITY_NODE =
  "absolute -left-[calc(0.75rem+1px)] top-2 h-1.5 w-1.5 rounded-full bg-border/40";

export const AURORA_SNAPSHOT_ACTIVITY_TITLE =
  "min-w-0 text-sm font-normal leading-6 text-foreground/85";

export const AURORA_SNAPSHOT_ACTIVITY_TIME =
  "shrink-0 text-[11px] leading-none tabular-nums text-muted-foreground/50";

export const AURORA_SNAPSHOT_LINK_BUTTON =
  "inline-flex h-8 items-center gap-1 text-sm font-medium leading-none text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

/** @deprecated Use AURORA_SNAPSHOT_AI_SURFACE */
export const AURORA_SNAPSHOT_AI_CARD = AURORA_SNAPSHOT_AI_SURFACE;

/** Aurora customer 360 — CRM overview in context panel */
export const AURORA_CUSTOMER_360_SECTION_GAP = "space-y-5";

export const AURORA_CUSTOMER_360_SUBSECTION_TITLE =
  "text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50";

export const AURORA_CUSTOMER_360_STAT_GRID = "grid grid-cols-2 gap-2.5";

export const AURORA_CUSTOMER_360_STAT_CARD =
  "rounded-xl border border-border/15 bg-muted/15 px-3 py-2.5";

export const AURORA_CUSTOMER_360_STAT_LABEL = "text-[11px] text-muted-foreground/70";

export const AURORA_CUSTOMER_360_STAT_VALUE =
  "mt-1 text-sm font-semibold tabular-nums text-foreground";

export const AURORA_CUSTOMER_360_TAG =
  "inline-flex items-center rounded-full bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground";

export const AURORA_CUSTOMER_360_LEAD_SCORE =
  "inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary";

export const AURORA_CUSTOMER_360_DEFINITION_LIST = "space-y-2.5";

export const AURORA_CUSTOMER_360_DEFINITION_TERM =
  "text-xs text-muted-foreground/75";

export const AURORA_CUSTOMER_360_DEFINITION_DETAIL =
  "text-right text-sm font-medium text-foreground";

/** Aurora assignment & ownership — reusable across Inbox, CRM, Booking, etc. */
export const AURORA_ASSIGNMENT_SHEET_WIDTH = "md:w-[380px] md:max-w-[380px]";

export const AURORA_ASSIGNMENT_SHEET_SEARCH =
  "h-10 w-full rounded-full border border-border/15 bg-background pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 focus-visible:border-border/25 focus-visible:ring-1 focus-visible:ring-ring/10";

export const AURORA_ASSIGN_OWNER_BUTTON =
  "inline-flex h-8 items-center justify-center rounded-[10px] border border-border/20 bg-background px-3 text-xs font-medium text-foreground shadow-none transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

export const AURORA_ASSIGNMENT_TEAM_ROW =
  "flex h-14 w-full items-center gap-3 rounded-xl px-3 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:bg-muted/30";

export const AURORA_ASSIGNMENT_TEAM_ROW_SELECTED = "bg-muted/20";

export const AURORA_ASSIGNMENT_WORKLOAD_BADGE =
  "shrink-0 text-[11px] tabular-nums text-muted-foreground/70";

export const AURORA_ASSIGNMENT_STATUS_ONLINE = "bg-emerald-500";

export const AURORA_ASSIGNMENT_STATUS_AWAY = "bg-amber-400";

export const AURORA_ASSIGNMENT_STATUS_OFFLINE = "bg-muted-foreground/40";

export const AURORA_ASSIGNMENT_OWNER_CARD =
  "flex items-center gap-3 rounded-xl border border-border/15 bg-muted/10 px-3 py-3";

export const AURORA_ASSIGNMENT_HISTORY_ITEM =
  "relative flex gap-3 pb-4 last:pb-0";

export const AURORA_ASSIGNMENT_HISTORY_DOT =
  "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-border/50 ring-4 ring-background";

export const AURORA_ASSIGNMENT_HISTORY_LINE =
  "absolute left-[3px] top-4 bottom-0 w-px bg-border/20";

export const AURORA_ASSIGNMENT_HISTORY_LABEL =
  "text-sm font-medium text-foreground/90";

export const AURORA_ASSIGNMENT_HISTORY_TIME =
  "mt-0.5 text-xs text-muted-foreground/70";

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

/** Aurora booking workspace — operational center after lead qualification */
export const AURORA_BOOKING_WORKSPACE_ROOT =
  "flex min-h-0 flex-1 flex-col bg-background text-foreground";

export const AURORA_BOOKING_WORKSPACE_SCROLL =
  "flex-1 overflow-y-auto";

export const AURORA_BOOKING_WORKSPACE_CONTENT =
  "mx-auto w-full max-w-[1280px] space-y-6 px-4 py-5 md:px-6 md:py-6";

export const AURORA_BOOKING_HEADER =
  "shrink-0 border-b border-border/15 bg-background";

export const AURORA_BOOKING_HEADER_INNER =
  "mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6";

export const AURORA_BOOKING_HEADER_TITLE =
  "text-lg font-semibold tracking-tight text-foreground md:text-xl";

export const AURORA_BOOKING_HEADER_META =
  "mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground";

export const AURORA_BOOKING_HEADER_ACTIONS =
  "flex shrink-0 flex-wrap items-center gap-2";

export const AURORA_BOOKING_STATUS_BADGE =
  "inline-flex items-center rounded-full border border-border/15 px-2.5 py-0.5 text-[11px] font-medium capitalize";

export const AURORA_BOOKING_STATUS_CONFIRMED =
  "bg-emerald-50 text-emerald-700 border-emerald-200/60";

export const AURORA_BOOKING_STATUS_IN_PROGRESS =
  "bg-sky-50 text-sky-700 border-sky-200/60";

export const AURORA_BOOKING_STATUS_PENDING =
  "bg-amber-50 text-amber-700 border-amber-200/60";

export const AURORA_BOOKING_STATUS_COMPLETED =
  "bg-muted/30 text-muted-foreground";

export const AURORA_BOOKING_STATUS_CANCELLED =
  "bg-rose-50 text-rose-700 border-rose-200/60";

export const AURORA_BOOKING_CARD =
  "rounded-2xl border border-border/15 bg-background";

export const AURORA_BOOKING_CARD_HEADER =
  "border-b border-border/15 px-4 py-3";

export const AURORA_BOOKING_CARD_TITLE =
  "text-sm font-semibold text-foreground";

export const AURORA_BOOKING_CARD_BODY = "p-4";

export const AURORA_BOOKING_SUMMARY_GRID =
  "grid grid-cols-2 gap-2 sm:grid-cols-3";

export const AURORA_BOOKING_SUMMARY_ITEM =
  "rounded-xl border border-border/15 bg-muted/10 px-3 py-2.5";

export const AURORA_BOOKING_SUMMARY_LABEL =
  "text-[11px] text-muted-foreground/70";

export const AURORA_BOOKING_SUMMARY_VALUE =
  "mt-1 text-sm font-medium leading-snug text-foreground";

export const AURORA_BOOKING_TABLE =
  "w-full min-w-[640px] border-collapse text-left text-sm";

export const AURORA_BOOKING_TABLE_HEAD =
  "border-b border-border/15 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60";

export const AURORA_BOOKING_TABLE_ROW =
  "border-b border-border/10 last:border-0 transition-colors hover:bg-muted/15";

export const AURORA_BOOKING_TABLE_CELL = "px-3 py-3 align-middle";

export const AURORA_BOOKING_PASSENGER_STATUS =
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";

export const AURORA_BOOKING_TRIP_STEP =
  "relative flex gap-3 pb-5 last:pb-0";

export const AURORA_BOOKING_TRIP_DOT =
  "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-background";

export const AURORA_BOOKING_TRIP_DOT_COMPLETED = "bg-emerald-500";

export const AURORA_BOOKING_TRIP_DOT_CURRENT = "bg-primary";

export const AURORA_BOOKING_TRIP_DOT_PENDING = "bg-border/40";

export const AURORA_BOOKING_TRIP_LINE =
  "absolute left-[4px] top-5 bottom-0 w-px bg-border/20";

export const AURORA_BOOKING_TRIP_LABEL = "text-sm font-medium text-foreground";

export const AURORA_BOOKING_TRIP_DATE = "mt-0.5 text-xs text-muted-foreground/70";

export const AURORA_BOOKING_PROGRESS_TRACK =
  "h-2 w-full overflow-hidden rounded-full bg-muted/30";

export const AURORA_BOOKING_PROGRESS_FILL =
  "h-full rounded-full bg-primary transition-all";

export const AURORA_BOOKING_PAYMENT_METRIC =
  "rounded-xl border border-border/15 bg-muted/10 px-3 py-2.5";

export const AURORA_BOOKING_DOCUMENT_ROW =
  "flex items-center gap-3 rounded-xl border border-border/15 px-3 py-2.5 transition-colors hover:bg-muted/10";

export const AURORA_BOOKING_DOCUMENT_ICON =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/15 bg-muted/15 text-muted-foreground";

export const AURORA_BOOKING_NOTE_CARD =
  "rounded-xl border border-border/15 bg-muted/10 p-3";

export const AURORA_BOOKING_ACTIVITY_ITEM =
  "relative flex gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/15";

export const AURORA_BOOKING_ACTIVITY_GROUP_LABEL =
  "mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/50";

export const AURORA_BOOKING_PRIMARY_BUTTON =
  "inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-none transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

export const AURORA_BOOKING_SECONDARY_BUTTON =
  "inline-flex h-9 items-center justify-center rounded-xl border border-border/20 bg-background px-4 text-sm font-medium text-foreground shadow-none transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

export const AURORA_BOOKING_GHOST_BUTTON =
  "inline-flex h-9 items-center justify-center rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

export const AURORA_BOOKING_TABLE_ACTION =
  "inline-flex h-7 items-center justify-center rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground";
