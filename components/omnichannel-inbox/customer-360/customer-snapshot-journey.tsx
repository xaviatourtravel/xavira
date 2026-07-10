"use client";

import {
  AURORA_SNAPSHOT_JOURNEY_DOT,
  AURORA_SNAPSHOT_JOURNEY_LABEL,
  AURORA_SNAPSHOT_JOURNEY_LABEL_PENDING,
  AURORA_SNAPSHOT_JOURNEY_STEP,
  AURORA_SNAPSHOT_SUBSECTION_TITLE,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import type { CustomerSnapshotJourneyStage, CustomerSnapshotLabels } from "./types";

type CustomerSnapshotJourneyProps = {
  stages: CustomerSnapshotJourneyStage[];
  labels: CustomerSnapshotLabels;
};

const DOT_CLASS = {
  completed: "bg-foreground/70",
  current: "bg-primary ring-2 ring-primary/20",
  pending: "bg-border/50",
} as const;

export function CustomerSnapshotJourney({ stages, labels }: CustomerSnapshotJourneyProps) {
  return (
    <section aria-labelledby="customer-snapshot-journey">
      <h5 id="customer-snapshot-journey" className={AURORA_SNAPSHOT_SUBSECTION_TITLE}>
        {labels.journey}
      </h5>
      <ol className="mt-1.5 space-y-0 p-0">
        {stages.map((stage) => (
          <li key={stage.id} className={AURORA_SNAPSHOT_JOURNEY_STEP}>
            <span
              className={cn(AURORA_SNAPSHOT_JOURNEY_DOT, DOT_CLASS[stage.state])}
              aria-hidden
            />
            <span
              className={cn(
                stage.state === "pending"
                  ? AURORA_SNAPSHOT_JOURNEY_LABEL_PENDING
                  : AURORA_SNAPSHOT_JOURNEY_LABEL,
                stage.state === "current" && "text-primary",
              )}
            >
              {stage.label}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
