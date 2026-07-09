"use client";

import { Sparkles } from "lucide-react";

import { AURORA_QUEUE_AI_TOGGLE_SURFACE } from "@/components/workspace/aurora-tokens";
import { useInboxAiWorkspace } from "@/modules/inbox/context/inbox-ai-workspace-context";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { cn } from "@/lib/utils";

export function InboxGlobalAiChatToggle() {
  const { ti } = useInboxTranslation();
  const {
    aiChatEnabled,
    canManageGlobalAi,
    isGlobalTogglePending,
    setAiChatEnabled,
  } = useInboxAiWorkspace();

  return (
    <div className={AURORA_QUEUE_AI_TOGGLE_SURFACE}>
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <Sparkles className="h-3 w-3 shrink-0 text-muted-foreground/50" />
          <span className="truncate text-[11px] font-normal text-muted-foreground">
            {ti("globalAutoReplyLabel")}
          </span>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={aiChatEnabled}
          aria-label={ti("globalAutoReplyLabel")}
          disabled={!canManageGlobalAi || isGlobalTogglePending}
          onClick={() => setAiChatEnabled(!aiChatEnabled)}
          className={cn(
            "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60",
            aiChatEnabled ? "bg-primary/80" : "bg-muted-foreground/25",
          )}
        >
          <span
            className={cn(
              "inline-block h-3 w-3 rounded-full bg-background",
              aiChatEnabled ? "translate-x-[14px]" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      <p className="mt-1 truncate text-[10px] leading-snug text-muted-foreground/50">
        {aiChatEnabled ? ti("globalAutoReplyOnDesc") : ti("globalAutoReplyOffDesc")}
      </p>
    </div>
  );
}
