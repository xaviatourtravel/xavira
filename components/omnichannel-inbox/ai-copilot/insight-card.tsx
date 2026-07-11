"use client";

import { Brain } from "lucide-react";

import {
  AURORA_COPILOT_BODY,
  AURORA_COPILOT_CARD,
  AURORA_COPILOT_CARD_TITLE,
  AURORA_COPILOT_METRIC_LABEL,
  AURORA_COPILOT_METRIC_VALUE,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import type { AICopilotInsight, AICopilotLabels } from "./types";

type InsightCardProps = {
  insight: AICopilotInsight;
  labels: Pick<
    AICopilotLabels,
    | "insightTitle"
    | "customerIntent"
    | "confidence"
    | "leadTemperature"
    | "estimatedClosing"
  >;
  className?: string;
};

export function InsightCard({ insight, labels, className }: InsightCardProps) {
  const temperatureLabel = insight.leadTemperatureEmoji
    ? `${insight.leadTemperatureEmoji} ${insight.leadTemperature}`
    : insight.leadTemperature;

  return (
    <article className={cn(AURORA_COPILOT_CARD, className)}>
      <div className="mb-4 flex items-center gap-2">
        <Brain className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />
        <h4 className={AURORA_COPILOT_CARD_TITLE}>{labels.insightTitle}</h4>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
        <div>
          <dt className={AURORA_COPILOT_METRIC_LABEL}>{labels.customerIntent}</dt>
          <dd className={cn(AURORA_COPILOT_METRIC_VALUE, "mt-1")}>{insight.intent}</dd>
        </div>
        <div>
          <dt className={AURORA_COPILOT_METRIC_LABEL}>{labels.confidence}</dt>
          <dd className={cn(AURORA_COPILOT_METRIC_VALUE, "mt-1 tabular-nums")}>
            {insight.confidence}%
          </dd>
        </div>
        <div>
          <dt className={AURORA_COPILOT_METRIC_LABEL}>{labels.leadTemperature}</dt>
          <dd className={cn(AURORA_COPILOT_METRIC_VALUE, "mt-1")}>{temperatureLabel}</dd>
        </div>
        <div>
          <dt className={AURORA_COPILOT_METRIC_LABEL}>{labels.estimatedClosing}</dt>
          <dd className={cn(AURORA_COPILOT_METRIC_VALUE, "mt-1")}>
            {insight.estimatedClosing}
          </dd>
        </div>
      </dl>

      {insight.summary ? (
        <p className={cn(AURORA_COPILOT_BODY, "mt-4 text-muted-foreground")}>
          {insight.summary}
        </p>
      ) : null}
    </article>
  );
}
