"use client";

import {
  AURORA_BOOKING_CARD,
  AURORA_BOOKING_CARD_BODY,
  AURORA_BOOKING_CARD_HEADER,
  AURORA_BOOKING_CARD_TITLE,
  AURORA_BOOKING_SUMMARY_GRID,
  AURORA_BOOKING_SUMMARY_ITEM,
  AURORA_BOOKING_SUMMARY_LABEL,
  AURORA_BOOKING_SUMMARY_VALUE,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import type { BookingSummaryItem, BookingWorkspaceLabels } from "./types";

type BookingSummaryProps = {
  items: BookingSummaryItem[];
  labels: BookingWorkspaceLabels;
  className?: string;
};

export function BookingSummary({ items, labels, className }: BookingSummaryProps) {
  return (
    <section className={cn(AURORA_BOOKING_CARD, className)}>
      <header className={AURORA_BOOKING_CARD_HEADER}>
        <h2 className={AURORA_BOOKING_CARD_TITLE}>{labels.bookingSummary}</h2>
      </header>
      <div className={AURORA_BOOKING_CARD_BODY}>
        <div className={AURORA_BOOKING_SUMMARY_GRID}>
          {items.map((item) => (
            <div key={item.key} className={AURORA_BOOKING_SUMMARY_ITEM}>
              <p className={AURORA_BOOKING_SUMMARY_LABEL}>{item.label}</p>
              <p
                className={cn(
                  AURORA_BOOKING_SUMMARY_VALUE,
                  item.highlight && "text-primary",
                )}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
