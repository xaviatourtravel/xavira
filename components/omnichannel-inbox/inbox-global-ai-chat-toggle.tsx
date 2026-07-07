"use client";

import { Sparkles } from "lucide-react";

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
    <div className="rounded-xl border border-border/40 bg-muted/15 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">
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
            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
            aiChatEnabled ? "bg-primary" : "bg-muted-foreground/30",
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-background shadow-sm transition-transform duration-200",
              aiChatEnabled ? "translate-x-[18px]" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
        {aiChatEnabled ? ti("globalAutoReplyOnDesc") : ti("globalAutoReplyOffDesc")}
      </p>
    </div>
  );
}
