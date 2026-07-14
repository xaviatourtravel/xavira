"use client";

import { AURORA_SMART_REPLY_MENU_ITEM, AURORA_SMART_REPLY_POPOVER } from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import type { TranslationOption } from "./types";

type TranslateMenuProps = {
  open: boolean;
  options: TranslationOption[];
  title: string;
  onSelect?: (option: TranslationOption) => void;
  className?: string;
};

export function TranslateMenu({
  open,
  options,
  title,
  onSelect,
  className,
}: TranslateMenuProps) {
  if (!open) {
    return null;
  }

  return (
    <div className={cn(AURORA_SMART_REPLY_POPOVER, "left-auto right-0", className)}>
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
              <span className="text-sm text-foreground">{option.language}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
