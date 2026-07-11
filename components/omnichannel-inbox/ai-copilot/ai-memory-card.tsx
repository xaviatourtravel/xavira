"use client";

import { Sparkles } from "lucide-react";

import {
  AURORA_COPILOT_CARD,
  AURORA_COPILOT_CARD_TITLE,
  AURORA_COPILOT_MEMORY_DOT,
  AURORA_COPILOT_MEMORY_ITEM,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import type { AICopilotLabels, AICopilotMemoryItem } from "./types";

type AIMemoryCardProps = {
  memory: AICopilotMemoryItem[];
  labels: Pick<AICopilotLabels, "memoryTitle">;
  className?: string;
};

export function AIMemoryCard({ memory, labels, className }: AIMemoryCardProps) {
  return (
    <article className={cn(AURORA_COPILOT_CARD, className)}>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />
        <h4 className={AURORA_COPILOT_CARD_TITLE}>{labels.memoryTitle}</h4>
      </div>

      <ul className="flex flex-col gap-2">
        {memory.map((item) => (
          <li key={item.id} className={AURORA_COPILOT_MEMORY_ITEM}>
            <span className={AURORA_COPILOT_MEMORY_DOT} aria-hidden />
            {item.label}
          </li>
        ))}
      </ul>
    </article>
  );
}
