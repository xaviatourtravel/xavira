"use client";

import {
  ArrowRightLeft,
  CreditCard,
  FileUp,
  MessageSquare,
  RefreshCw,
  UserCheck,
} from "lucide-react";

import {
  AURORA_BOOKING_ACTIVITY_GROUP_LABEL,
  AURORA_BOOKING_ACTIVITY_ITEM,
  AURORA_BOOKING_CARD,
  AURORA_BOOKING_CARD_BODY,
  AURORA_BOOKING_CARD_HEADER,
  AURORA_BOOKING_CARD_TITLE,
  AURORA_TIMELINE_ICON_NODE,
  AURORA_TIMELINE_LINE,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import { formatActivityTime, groupBookingActivity } from "./mock-booking-workspace";
import type { BookingActivityEvent, BookingActivityType, BookingWorkspaceLabels } from "./types";

type BookingActivityProps = {
  events: BookingActivityEvent[];
  labels: BookingWorkspaceLabels;
  className?: string;
};

const ACTIVITY_ICONS: Record<BookingActivityType, typeof CreditCard> = {
  payment: CreditCard,
  status_change: RefreshCw,
  assignment: UserCheck,
  document: FileUp,
  note: MessageSquare,
  system: ArrowRightLeft,
};

function BookingActivityItem({
  event,
  showLine,
}: {
  event: BookingActivityEvent;
  showLine: boolean;
}) {
  const Icon = ACTIVITY_ICONS[event.type];

  return (
    <li className={AURORA_BOOKING_ACTIVITY_ITEM}>
      <div className="relative flex shrink-0 flex-col items-center">
        <span className={cn(AURORA_TIMELINE_ICON_NODE, "z-[1]")}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        {showLine ? (
          <span
            className={cn("absolute top-8 bottom-0 w-px", AURORA_TIMELINE_LINE)}
            aria-hidden
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 pb-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium leading-snug text-foreground">{event.title}</p>
          <time
            className="shrink-0 text-xs tabular-nums text-muted-foreground/70"
            dateTime={event.timestamp}
          >
            {formatActivityTime(event.timestamp)}
          </time>
        </div>
        {event.description ? (
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            {event.description}
          </p>
        ) : null}
        {event.actor ? (
          <p className="mt-1.5 text-xs text-muted-foreground/65">{event.actor}</p>
        ) : null}
      </div>
    </li>
  );
}

export function BookingActivity({ events, labels, className }: BookingActivityProps) {
  const groups = groupBookingActivity(events, labels);

  return (
    <section className={cn(AURORA_BOOKING_CARD, className)}>
      <header className={AURORA_BOOKING_CARD_HEADER}>
        <h2 className={AURORA_BOOKING_CARD_TITLE}>{labels.activityFeed}</h2>
      </header>
      <div className={AURORA_BOOKING_CARD_BODY}>
        {groups.map((group, groupIndex) => (
          <section key={group.id} className={cn(groupIndex > 0 && "mt-6")}>
            <h3 className={AURORA_BOOKING_ACTIVITY_GROUP_LABEL}>{group.label}</h3>
            <ol className="m-0 flex flex-col p-0">
              {group.events.map((event, eventIndex) => {
                const isLastInGroup = eventIndex === group.events.length - 1;
                const isLastGroup = groupIndex === groups.length - 1;
                const showLine = !isLastInGroup || !isLastGroup;

                return (
                  <BookingActivityItem
                    key={event.id}
                    event={event}
                    showLine={showLine}
                  />
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </section>
  );
}
