"use client";

import { Sparkles } from "lucide-react";

import {
  AURORA_SMART_REPLY_SECONDARY_BUTTON,
  AURORA_SMART_REPLY_SUGGESTION,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import type { ComposerSuggestion as ComposerSuggestionData, SmartReplyLabels } from "./types";

type ComposerSuggestionProps = {
  suggestion: ComposerSuggestionData;
  labels: Pick<
    SmartReplyLabels,
    "suggestedReply" | "copy" | "insert" | "regenerate" | "dismiss"
  >;
  onCopy?: () => void;
  onInsert?: () => void;
  onRegenerate?: () => void;
  onDismiss?: () => void;
  className?: string;
};

export function ComposerSuggestion({
  suggestion,
  labels,
  onCopy,
  onInsert,
  onRegenerate,
  onDismiss,
  className,
}: ComposerSuggestionProps) {
  const previewLines = suggestion.preview
    .split(/\n+/)
    .slice(0, 4)
    .join("\n");

  return (
    <article className={cn(AURORA_SMART_REPLY_SUGGESTION, className)}>
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />
        <h4 className="text-sm font-medium text-foreground">{labels.suggestedReply}</h4>
      </div>

      <p className="line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
        {previewLines}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={AURORA_SMART_REPLY_SECONDARY_BUTTON} onClick={onCopy}>
          {labels.copy}
        </button>
        <button type="button" className={AURORA_SMART_REPLY_SECONDARY_BUTTON} onClick={onInsert}>
          {labels.insert}
        </button>
        <button
          type="button"
          className={AURORA_SMART_REPLY_SECONDARY_BUTTON}
          onClick={onRegenerate}
        >
          {labels.regenerate}
        </button>
        <button type="button" className={AURORA_SMART_REPLY_SECONDARY_BUTTON} onClick={onDismiss}>
          {labels.dismiss}
        </button>
      </div>
    </article>
  );
}
