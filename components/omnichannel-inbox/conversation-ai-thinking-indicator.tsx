"use client";

import { Sparkles } from "lucide-react";

import {
  AURORA_STATE_FADE,
  AURORA_STATE_TYPING_LABEL,
} from "@/components/workspace/aurora-tokens";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { cn } from "@/lib/utils";

type ConversationAiThinkingIndicatorProps = {
  className?: string;
};

export function ConversationAiThinkingIndicator({
  className,
}: ConversationAiThinkingIndicatorProps) {
  const { ti } = useInboxTranslation();

  return (
    <div
      className={cn(
        "flex w-full justify-end",
        AURORA_STATE_FADE,
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={ti("aiPreparingResponse")}
    >
      <div className="inline-flex max-w-[68%] items-center gap-2 rounded-[20px] border border-border/10 bg-muted/20 px-4 py-2.5 text-muted-foreground/70">
        <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
        <span className={cn(AURORA_STATE_TYPING_LABEL, "mb-0")}>
          {ti("aiPreparingResponse")}
        </span>
      </div>
    </div>
  );
}
