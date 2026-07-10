"use client";

import { ArrowRight, Sparkles } from "lucide-react";

import {
  AURORA_SNAPSHOT_AI_BULLET,
  AURORA_SNAPSHOT_AI_CARD,
  AURORA_SNAPSHOT_LINK_BUTTON,
  AURORA_SNAPSHOT_SUBSECTION_TITLE,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import type { CustomerSnapshotAiInsight, CustomerSnapshotLabels } from "./types";

type CustomerSnapshotAiInsightProps = {
  insight: CustomerSnapshotAiInsight;
  labels: CustomerSnapshotLabels;
};

export function CustomerSnapshotAiInsightSection({
  insight,
  labels,
}: CustomerSnapshotAiInsightProps) {
  return (
    <section aria-labelledby="customer-snapshot-ai">
      <h5 id="customer-snapshot-ai" className={cn(AURORA_SNAPSHOT_SUBSECTION_TITLE, "mb-1")}>
        {labels.aiInsight}
      </h5>
      <div className={AURORA_SNAPSHOT_AI_CARD}>
        <ul className="space-y-1">
          {insight.bullets.map((bullet) => (
            <li key={bullet} className={AURORA_SNAPSHOT_AI_BULLET}>
              <span aria-hidden>· </span>
              {bullet}
            </li>
          ))}
        </ul>
        <button type="button" className={cn(AURORA_SNAPSHOT_LINK_BUTTON, "mt-1.5")}>
          <Sparkles className="h-3 w-3" aria-hidden />
          {labels.openCopilot}
          <ArrowRight className="h-3 w-3" aria-hidden />
        </button>
      </div>
    </section>
  );
}
