"use client";

import { TimelineDateGroup } from "./timeline-date-group";
import { TimelineEmptyState } from "./timeline-empty-state";
import { groupTimelineEvents } from "./mock-timeline-events";
import type { TimelineEvent, TimelineLabels } from "./types";

type CustomerTimelineFeedProps = {
  events: TimelineEvent[];
  labels: TimelineLabels;
  className?: string;
};

export function CustomerTimelineFeed({
  events,
  labels,
  className,
}: CustomerTimelineFeedProps) {
  const groups = groupTimelineEvents(events, labels);

  if (groups.length === 0) {
    return <TimelineEmptyState className={className} />;
  }

  return (
    <div className={className}>
      {groups.map((group, index) => (
        <TimelineDateGroup
          key={group.id}
          group={group}
          isFirstGroup={index === 0}
          isLastGroup={index === groups.length - 1}
        />
      ))}
    </div>
  );
}
