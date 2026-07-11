"use client";

import { Sparkles } from "lucide-react";

import {
  AURORA_COPILOT_CARD_STACK,
  AURORA_COPILOT_HELPER,
  AURORA_COPILOT_SECTION,
  AURORA_COPILOT_SECTION_TITLE,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import { AIMemoryCard } from "./ai-memory-card";
import { ConversationSignals } from "./conversation-signals";
import { InsightCard } from "./insight-card";
import { NextActionCard } from "./next-action-card";
import { SuggestedReplyCard } from "./suggested-reply-card";
import type { AICopilotData, AICopilotLabels } from "./types";

type AICopilotPanelProps = {
  data: AICopilotData;
  labels: AICopilotLabels;
  className?: string;
};

export function AICopilotPanel({ data, labels, className }: AICopilotPanelProps) {
  const insight = {
    intent: data.intent,
    confidence: data.confidence,
    leadTemperature: data.leadTemperature,
    leadTemperatureEmoji: data.leadTemperatureEmoji,
    estimatedClosing: data.estimatedClosing,
    summary: data.summary,
  };

  return (
    <section className={cn(AURORA_COPILOT_SECTION, className)}>
      <header>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />
          <h3 className={AURORA_COPILOT_SECTION_TITLE}>{labels.title}</h3>
        </div>
        <p className={cn(AURORA_COPILOT_HELPER, "mt-1")}>{labels.helper}</p>
      </header>

      <div className={AURORA_COPILOT_CARD_STACK}>
        <InsightCard
          insight={insight}
          labels={{
            insightTitle: labels.insightTitle,
            customerIntent: labels.customerIntent,
            confidence: labels.confidence,
            leadTemperature: labels.leadTemperature,
            estimatedClosing: labels.estimatedClosing,
          }}
        />
        <NextActionCard
          actions={data.nextActions}
          labels={{
            nextActionTitle: labels.nextActionTitle,
            recommended: labels.recommended,
          }}
        />
        <SuggestedReplyCard
          reply={data.suggestedReply}
          labels={{
            suggestedReplyTitle: labels.suggestedReplyTitle,
            copy: labels.copy,
            edit: labels.edit,
            regenerate: labels.regenerate,
          }}
        />
        <ConversationSignals
          signals={data.signals}
          labels={{ signalsTitle: labels.signalsTitle }}
        />
        <AIMemoryCard memory={data.memory} labels={{ memoryTitle: labels.memoryTitle }} />
      </div>
    </section>
  );
}
