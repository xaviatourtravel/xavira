"use client";

import { AURORA_TIMELINE_GROUP_LABEL } from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import { TimelineEventItem } from "./timeline-event-item";
import type { TimelineDateGroup } from "./types";

type TimelineDateGroupProps = {
  group: TimelineDateGroup;
  isFirstGroup: boolean;
  isLastGroup: boolean;
};

export function TimelineDateGroup({
  group,
  isFirstGroup,
  isLastGroup,
}: TimelineDateGroupProps) {
  return (
    <section className={cn(!isFirstGroup && "mt-6")}>
      <h4 className={AURORA_TIMELINE_GROUP_LABEL}>{group.label}</h4>
      <ol className="m-0 flex flex-col p-0">
        {group.events.map((event, index) => {
          const isLastInGroup = index === group.events.length - 1;
          const showLine = !isLastInGroup || !isLastGroup;

          return (
            <TimelineEventItem
              key={event.id}
              event={event}
              groupId={group.id}
              showLine={showLine}
            />
          );
        })}
      </ol>
    </section>
  );
}
