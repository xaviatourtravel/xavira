"use client";

import {
  AURORA_SMART_REPLY_MENU,
  AURORA_SMART_REPLY_MENU_ITEM,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import { resolveSmartReplyIcon } from "./smart-reply-icons";
import type { SlashCommand } from "./types";

type SlashCommandMenuProps = {
  commands: SlashCommand[];
  onSelect?: (command: SlashCommand) => void;
  className?: string;
};

export function SlashCommandMenu({ commands, onSelect, className }: SlashCommandMenuProps) {
  return (
    <div
      role="listbox"
      aria-label="Composer commands"
      className={cn(AURORA_SMART_REPLY_MENU, className)}
    >
      <ul className="max-h-[280px] overflow-y-auto py-1">
        {commands.map((command) => {
          const Icon = resolveSmartReplyIcon(command.icon);

          return (
            <li key={command.id}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                className={AURORA_SMART_REPLY_MENU_ITEM}
                onClick={() => onSelect?.(command)}
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/15 bg-background text-muted-foreground/75">
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {command.title}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground/60">
                      {command.command}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {command.description}
                  </span>
                </span>
                {command.keyboardHint ? (
                  <span className="mt-0.5 shrink-0 rounded border border-border/15 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60">
                    {command.keyboardHint}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
