"use client";

import { forwardRef, type ReactNode } from "react";

import {
  AURORA_CONVERSATION_ACTION_MENU_ITEM,
  AURORA_CONVERSATION_ACTION_MENU_ITEM_ICON,
  AURORA_CONVERSATION_ACTION_MENU_ITEM_SHORTCUT,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

type ConversationActionMenuItemProps = {
  icon: ReactNode;
  label: string;
  shortcut?: string;
  destructive?: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  tabIndex?: number;
};

export const ConversationActionMenuItem = forwardRef<
  HTMLButtonElement,
  ConversationActionMenuItemProps
>(function ConversationActionMenuItem(
  {
    icon,
    label,
    shortcut,
    destructive = false,
    disabled = false,
    onSelect,
    onKeyDown,
    tabIndex = -1,
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      tabIndex={tabIndex}
      disabled={disabled}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        AURORA_CONVERSATION_ACTION_MENU_ITEM,
        destructive ? "text-red-600 hover:bg-red-500/10 focus-visible:bg-red-500/10" : "text-foreground",
      )}
    >
      <span
        className={cn(
          AURORA_CONVERSATION_ACTION_MENU_ITEM_ICON,
          destructive && "text-red-500",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {shortcut ? (
        <span className={AURORA_CONVERSATION_ACTION_MENU_ITEM_SHORTCUT}>{shortcut}</span>
      ) : null}
    </button>
  );
});
