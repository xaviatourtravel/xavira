"use client";

import { ArrowRight } from "lucide-react";

import { ClientOnlyRelativeTime } from "@/components/omnichannel-inbox/client-only-relative-time";
import {
  AURORA_SNAPSHOT_ACTIVITY_ROW,
  AURORA_SNAPSHOT_ACTIVITY_TIME,
  AURORA_SNAPSHOT_ACTIVITY_TITLE,
  AURORA_SNAPSHOT_LINK_BUTTON,
  AURORA_SNAPSHOT_SUBSECTION_TITLE,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import type { CustomerSnapshotActivityEvent, CustomerSnapshotLabels } from "./types";

type CustomerSnapshotRecentActivityProps = {
  events: CustomerSnapshotActivityEvent[];
  labels: CustomerSnapshotLabels;
};

export function CustomerSnapshotRecentActivity({
  events,
  labels,
}: CustomerSnapshotRecentActivityProps) {
  return (
    <section aria-labelledby="customer-snapshot-activity">
      <h5 id="customer-snapshot-activity" className={AURORA_SNAPSHOT_SUBSECTION_TITLE}>
        {labels.recentActivity}
      </h5>
      <ol className="mt-2 space-y-0 p-0">
        {events.map((event) => (
          <li key={event.id} className={AURORA_SNAPSHOT_ACTIVITY_ROW}>
            <p className={AURORA_SNAPSHOT_ACTIVITY_TITLE}>{event.title}</p>
            <ClientOnlyRelativeTime
              date={event.timestamp}
              className={AURORA_SNAPSHOT_ACTIVITY_TIME}
              emptyLabel="—"
            />
          </li>
        ))}
      </ol>
      <button type="button" className={cn(AURORA_SNAPSHOT_LINK_BUTTON, "mt-2")}>
        {labels.viewFullTimeline}
        <ArrowRight className="h-3 w-3" aria-hidden />
      </button>
    </section>
  );
}
