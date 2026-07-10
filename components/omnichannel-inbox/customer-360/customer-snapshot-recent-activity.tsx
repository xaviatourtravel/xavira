"use client";

import { ArrowRight } from "lucide-react";

import { ClientOnlyRelativeTime } from "@/components/omnichannel-inbox/client-only-relative-time";
import {
  AURORA_SNAPSHOT_ACTIVITY_LIST,
  AURORA_SNAPSHOT_ACTIVITY_NODE,
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
      <ol className={AURORA_SNAPSHOT_ACTIVITY_LIST}>
        {events.map((event) => (
          <li key={event.id} className={AURORA_SNAPSHOT_ACTIVITY_ROW}>
            <span className={AURORA_SNAPSHOT_ACTIVITY_NODE} aria-hidden />
            <div className="flex items-start justify-between gap-2">
              <p className={AURORA_SNAPSHOT_ACTIVITY_TITLE}>{event.title}</p>
              <ClientOnlyRelativeTime
                date={event.timestamp}
                className={AURORA_SNAPSHOT_ACTIVITY_TIME}
                emptyLabel="—"
              />
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className={cn(AURORA_SNAPSHOT_LINK_BUTTON, "mt-3")}>
        {labels.viewFullTimeline}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </button>
    </section>
  );
}
