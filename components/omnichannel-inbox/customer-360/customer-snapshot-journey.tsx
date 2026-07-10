"use client";

import {
  AURORA_SNAPSHOT_JOURNEY_CONNECTOR,
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
  completed: "bg-foreground/75",
  current: "bg-primary ring-[3px] ring-primary/15",
  pending: "bg-border/55",
} as const;

export function CustomerSnapshotJourney({ stages, labels }: CustomerSnapshotJourneyProps) {
  return (
    <section aria-labelledby="customer-snapshot-journey">
      <h5 id="customer-snapshot-journey" className={AURORA_SNAPSHOT_SUBSECTION_TITLE}>
        {labels.journey}
      </h5>
      <ol className="mt-2 space-y-0 p-0">
        {stages.map((stage, index) => (
          <li key={stage.id} className={AURORA_SNAPSHOT_JOURNEY_STEP}>
            {index < stages.length - 1 ? (
              <span className={AURORA_SNAPSHOT_JOURNEY_CONNECTOR} aria-hidden />
            ) : null}
            <span
              className={cn(AURORA_SNAPSHOT_JOURNEY_DOT, DOT_CLASS[stage.state])}
              aria-hidden
            />
            <span
              className={cn(
                stage.state === "pending"
                  ? AURORA_SNAPSHOT_JOURNEY_LABEL_PENDING
                  : AURORA_SNAPSHOT_JOURNEY_LABEL,
                stage.state === "current" && "text-foreground/75",
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
