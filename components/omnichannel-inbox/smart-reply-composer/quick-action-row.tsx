"use client";

import {
  AURORA_SMART_REPLY_QUICK_ACTION,
  AURORA_SMART_REPLY_QUICK_ACTIONS_ROW,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import type { QuickAction } from "./types";

type QuickActionRowProps = {
  actions: QuickAction[];
  onAction?: (actionId: string) => void;
  className?: string;
};

export function QuickActionRow({ actions, onAction, className }: QuickActionRowProps) {
  return (
    <div className={cn(AURORA_SMART_REPLY_QUICK_ACTIONS_ROW, className)} role="toolbar">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          className={AURORA_SMART_REPLY_QUICK_ACTION}
          onClick={() => onAction?.(action.id)}
        >
          {action.emoji ? <span aria-hidden>{action.emoji}</span> : null}
          {action.label}
        </button>
      ))}
    </div>
  );
}
