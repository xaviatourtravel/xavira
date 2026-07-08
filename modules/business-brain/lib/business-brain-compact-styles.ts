import { cn } from "@/lib/utils";

export const BB_COMPACT_INPUT_CLASS = "h-8 min-h-8 py-1 text-sm";

export const BB_COMPACT_SECTION_CLASS =
  "rounded-xl border-border/70 shadow-none [&>div:first-child]:mb-2 [&_h3]:text-sm [&_h3]:font-medium";

export const BB_COMPACT_LIST_ITEM_CLASS =
  "rounded-lg border border-border/70 px-2.5 py-1.5 transition-colors";

export const BB_COMPACT_LIST_SELECTED_CLASS =
  "border-primary bg-primary/5 ring-1 ring-primary/20";

export const BB_COMPACT_LIST_IDLE_CLASS =
  "border-border bg-background hover:border-primary/30 hover:bg-muted/30";

export function bbCompactCardClassName(className?: string) {
  return cn(BB_COMPACT_SECTION_CLASS, className);
}
