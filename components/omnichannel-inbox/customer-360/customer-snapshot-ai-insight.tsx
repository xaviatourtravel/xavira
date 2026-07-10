"use client";

import { ArrowRight, Sparkles } from "lucide-react";

import {
  AURORA_SNAPSHOT_AI_BULLET,
  AURORA_SNAPSHOT_AI_SURFACE,
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
      <h5 id="customer-snapshot-ai" className={AURORA_SNAPSHOT_SUBSECTION_TITLE}>
        {labels.aiInsight}
      </h5>
      <div className={cn(AURORA_SNAPSHOT_AI_SURFACE, "mt-2")}>
        <ul className="space-y-1">
          {insight.bullets.map((bullet) => (
            <li key={bullet} className={AURORA_SNAPSHOT_AI_BULLET}>
              <span aria-hidden>· </span>
              {bullet}
            </li>
          ))}
        </ul>
        <button type="button" className={cn(AURORA_SNAPSHOT_LINK_BUTTON, "mt-2")}>
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
          {labels.openCopilot}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </section>
  );
}
