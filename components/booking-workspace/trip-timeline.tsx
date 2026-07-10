"use client";

import {
  AURORA_BOOKING_CARD,
  AURORA_BOOKING_CARD_BODY,
  AURORA_BOOKING_CARD_HEADER,
  AURORA_BOOKING_CARD_TITLE,
  AURORA_BOOKING_TRIP_DATE,
  AURORA_BOOKING_TRIP_DOT,
  AURORA_BOOKING_TRIP_DOT_COMPLETED,
  AURORA_BOOKING_TRIP_DOT_CURRENT,
  AURORA_BOOKING_TRIP_DOT_PENDING,
  AURORA_BOOKING_TRIP_LABEL,
  AURORA_BOOKING_TRIP_LINE,
  AURORA_BOOKING_TRIP_STEP,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import type { BookingWorkspaceLabels, TripStepState, TripTimelineStep } from "./types";

type TripTimelineProps = {
  steps: TripTimelineStep[];
  labels: BookingWorkspaceLabels;
  className?: string;
};

const DOT_CLASS: Record<TripStepState, string> = {
  completed: AURORA_BOOKING_TRIP_DOT_COMPLETED,
  current: AURORA_BOOKING_TRIP_DOT_CURRENT,
  pending: AURORA_BOOKING_TRIP_DOT_PENDING,
};

export function TripTimeline({ steps, labels, className }: TripTimelineProps) {
  return (
    <section className={cn(AURORA_BOOKING_CARD, className)}>
      <header className={AURORA_BOOKING_CARD_HEADER}>
        <h2 className={AURORA_BOOKING_CARD_TITLE}>{labels.tripTimeline}</h2>
      </header>
      <div className={AURORA_BOOKING_CARD_BODY}>
        <ol className="m-0 flex flex-col p-0">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;

            return (
              <li key={step.id} className={AURORA_BOOKING_TRIP_STEP}>
                {!isLast ? <span className={AURORA_BOOKING_TRIP_LINE} aria-hidden /> : null}
                <span
                  className={cn(AURORA_BOOKING_TRIP_DOT, DOT_CLASS[step.state])}
                  aria-hidden
                />
                <div className="min-w-0 pb-1">
                  <p
                    className={cn(
                      AURORA_BOOKING_TRIP_LABEL,
                      step.state === "pending" && "text-muted-foreground/70",
                    )}
                  >
                    {step.label}
                  </p>
                  {step.dateLabel ? (
                    <p className={AURORA_BOOKING_TRIP_DATE}>{step.dateLabel}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
