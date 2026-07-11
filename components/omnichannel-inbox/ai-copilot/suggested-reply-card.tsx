"use client";

import { MessageSquare } from "lucide-react";

import {
  AURORA_COPILOT_ACTION_BUTTON,
  AURORA_COPILOT_CARD,
  AURORA_COPILOT_CARD_TITLE,
  AURORA_COPILOT_REPLY_BLOCK,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import type { AICopilotLabels } from "./types";

type SuggestedReplyCardProps = {
  reply: string;
  labels: Pick<AICopilotLabels, "suggestedReplyTitle" | "copy" | "edit" | "regenerate">;
  className?: string;
};

export function SuggestedReplyCard({ reply, labels, className }: SuggestedReplyCardProps) {
  return (
    <article className={cn(AURORA_COPILOT_CARD, className)}>
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />
        <h4 className={AURORA_COPILOT_CARD_TITLE}>{labels.suggestedReplyTitle}</h4>
      </div>

      <div className={AURORA_COPILOT_REPLY_BLOCK}>{reply}</div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={AURORA_COPILOT_ACTION_BUTTON}>
          {labels.copy}
        </button>
        <button type="button" className={AURORA_COPILOT_ACTION_BUTTON}>
          {labels.edit}
        </button>
        <button type="button" className={AURORA_COPILOT_ACTION_BUTTON}>
          {labels.regenerate}
        </button>
      </div>
    </article>
  );
}
