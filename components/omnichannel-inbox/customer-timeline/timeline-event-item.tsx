"use client";

import {
  AURORA_TIMELINE_ACTOR,
  AURORA_TIMELINE_DESCRIPTION,
  AURORA_TIMELINE_ICON_NODE,
  AURORA_TIMELINE_ITEM,
  AURORA_TIMELINE_LINE,
  AURORA_TIMELINE_MODULE,
  AURORA_TIMELINE_TIME,
  AURORA_TIMELINE_TITLE,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import { getTimelineCategoryIcon } from "./timeline-event-icons";
import { getTimelineEventMeta } from "./timeline-event-mapping";
import { formatTimelineEventTime } from "./timeline-time-format";
import type { TimelineDateGroupId, TimelineEvent } from "./types";

type TimelineEventItemProps = {
  event: TimelineEvent;
  groupId: TimelineDateGroupId;
  showLine: boolean;
};

export function TimelineEventItem({ event, groupId, showLine }: TimelineEventItemProps) {
  const meta = getTimelineEventMeta(event.type);
  const Icon = getTimelineCategoryIcon(meta.category);
  const timeLabel = formatTimelineEventTime(event.timestamp, groupId);
  const actorLabel = event.actor?.name?.trim();

  return (
    <li className={cn(AURORA_TIMELINE_ITEM, "list-none")}>
      <div className="relative flex w-8 shrink-0 flex-col items-center self-stretch">
        {showLine ? (
          <span
            className={cn(
              "absolute left-1/2 top-8 bottom-0 w-px -translate-x-1/2",
              AURORA_TIMELINE_LINE,
            )}
            aria-hidden
          />
        ) : null}
        <span className={AURORA_TIMELINE_ICON_NODE} aria-hidden>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className={AURORA_TIMELINE_TIME}>{timeLabel}</p>
        <p className={cn(AURORA_TIMELINE_TITLE, "mt-1")}>{event.title}</p>
        {event.description ? (
          <p className={AURORA_TIMELINE_DESCRIPTION}>{event.description}</p>
        ) : null}
        <p className={AURORA_TIMELINE_ACTOR}>
          {actorLabel ? (
            <>
              <span>{actorLabel}</span>
              <span className="text-muted-foreground/40" aria-hidden>
                {" "}
                ·{" "}
              </span>
            </>
          ) : null}
          <span className={AURORA_TIMELINE_MODULE}>{meta.moduleLabel}</span>
        </p>
      </div>
    </li>
  );
}
