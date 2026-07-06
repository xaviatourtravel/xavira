import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type InspectorBadgeState =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

export type InspectorBadgeSize = "xs" | "sm";

const STATE_STYLES: Record<InspectorBadgeState, string> = {
  default:
    "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300 dark:ring-sky-500/30",
  success:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-500/30",
  warning:
    "bg-amber-500/10 text-amber-800 ring-amber-500/20 dark:text-amber-300 dark:ring-amber-500/30",
  danger:
    "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300 dark:ring-rose-500/30",
  neutral:
    "bg-muted/60 text-foreground ring-border/60 dark:bg-muted/40 dark:ring-border/40",
};

const SIZE_STYLES: Record<InspectorBadgeSize, string> = {
  xs: "px-1.5 py-px text-[10px] leading-tight",
  sm: "px-2 py-0.5 text-xs",
};

/** @deprecated Use `state` — legacy tone alias for inbox migration */
export type InspectorBadgeTone = "neutral" | "info" | "success" | "warning" | "violet" | "danger";

const TONE_TO_STATE: Record<InspectorBadgeTone, InspectorBadgeState> = {
  neutral: "neutral",
  info: "default",
  success: "success",
  warning: "warning",
  violet: "default",
  danger: "danger",
};

export function InspectorBadge({
  children,
  state = "neutral",
  size = "sm",
  tone,
  className,
}: {
  children: ReactNode;
  state?: InspectorBadgeState;
  size?: InspectorBadgeSize;
  /** @deprecated Prefer `state` */
  tone?: InspectorBadgeTone;
  className?: string;
}) {
  const resolvedState = tone ? TONE_TO_STATE[tone] : state;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset",
        STATE_STYLES[resolvedState],
        SIZE_STYLES[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
