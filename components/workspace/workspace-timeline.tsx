import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { WorkspaceEmptyState } from "./workspace-empty-state";
import {
  getWorkspaceTimelineDotClass,
  getWorkspaceTimelineToneClass,
  workspaceCardClass,
} from "./styles";
import type { WorkspaceTimelineEvent } from "./types";

type WorkspaceTimelineProps = {
  events: WorkspaceTimelineEvent[];
  title?: string;
  description?: string;
  emptyMessage?: string;
  className?: string;
  headerAction?: ReactNode;
};

function formatTimelineTimestamp(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function TimelineEventItem({ event }: { event: WorkspaceTimelineEvent }) {
  const Icon = event.icon;
  const tone = event.badge?.tone ?? "default";

  return (
    <li className="relative pl-8">
      <span
        aria-hidden
        className={cn(
          "absolute left-[7px] top-2.5 h-2.5 w-2.5 rounded-full ring-4 ring-background",
          getWorkspaceTimelineDotClass(tone),
        )}
      />

      <article className={cn(workspaceCardClass, "p-4")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {event.badge ? (
                <span className={getWorkspaceTimelineToneClass(event.badge.tone)}>
                  {event.badge.label}
                </span>
              ) : null}
              <time
                dateTime={event.timestamp}
                className="text-[11px] text-muted-foreground"
              >
                {formatTimelineTimestamp(event.timestamp)}
              </time>
            </div>

            <div className="flex items-start gap-2">
              {Icon ? (
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              ) : null}
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold leading-snug">{event.title}</p>
                {event.description ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {event.description}
                  </p>
                ) : null}
                {event.meta}
              </div>
            </div>
          </div>
        </div>
      </article>
    </li>
  );
}

export function WorkspaceTimeline({
  events,
  title = "Timeline",
  description,
  emptyMessage = "No activity yet.",
  className,
  headerAction,
}: WorkspaceTimelineProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {headerAction}
      </div>

      {events.length === 0 ? (
        <WorkspaceEmptyState preset="timeline" title={emptyMessage} />
      ) : (
        <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-border/80">
          {events.map((event) => (
            <TimelineEventItem key={event.id} event={event} />
          ))}
        </ol>
      )}
    </section>
  );
}
