"use client";

import { AURORA_SMART_REPLY_MENU_ITEM, AURORA_SMART_REPLY_POPOVER } from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import type { RewriteOption } from "./types";

type RewriteMenuProps = {
  open: boolean;
  options: RewriteOption[];
  title: string;
  onSelect?: (option: RewriteOption) => void;
  className?: string;
};

export function RewriteMenu({
  open,
  options,
  title,
  onSelect,
  className,
}: RewriteMenuProps) {
  if (!open) {
    return null;
  }

  return (
    <div className={cn(AURORA_SMART_REPLY_POPOVER, className)}>
      <p className="border-b border-border/15 px-3 py-2 text-xs font-medium text-muted-foreground">
        {title}
      </p>
      <ul className="py-1">
        {options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              className={cn(AURORA_SMART_REPLY_MENU_ITEM, "items-center py-2")}
              onClick={() => onSelect?.(option)}
            >
              <span className="text-sm text-foreground">{option.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
