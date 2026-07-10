"use client";

import Link from "next/link";
import { ArrowLeft, MoreHorizontal } from "lucide-react";

import { DesklabsAvatar } from "@/components/ui/desklabs-avatar";
import {
  AURORA_BOOKING_GHOST_BUTTON,
  AURORA_BOOKING_HEADER,
  AURORA_BOOKING_HEADER_ACTIONS,
  AURORA_BOOKING_HEADER_INNER,
  AURORA_BOOKING_HEADER_META,
  AURORA_BOOKING_HEADER_TITLE,
  AURORA_BOOKING_PRIMARY_BUTTON,
  AURORA_BOOKING_SECONDARY_BUTTON,
  AURORA_BOOKING_STATUS_BADGE,
  AURORA_BOOKING_STATUS_CANCELLED,
  AURORA_BOOKING_STATUS_COMPLETED,
  AURORA_BOOKING_STATUS_CONFIRMED,
  AURORA_BOOKING_STATUS_IN_PROGRESS,
  AURORA_BOOKING_STATUS_PENDING,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import { getBookingStatusLabel } from "./mock-booking-workspace";
import type { BookingHeaderData, BookingWorkspaceLabels, BookingWorkspaceStatus } from "./types";

type BookingHeaderProps = {
  data: BookingHeaderData;
  labels: BookingWorkspaceLabels;
  className?: string;
};

const STATUS_CLASS: Record<BookingWorkspaceStatus, string> = {
  draft: AURORA_BOOKING_STATUS_PENDING,
  pending_payment: AURORA_BOOKING_STATUS_PENDING,
  confirmed: AURORA_BOOKING_STATUS_CONFIRMED,
  in_progress: AURORA_BOOKING_STATUS_IN_PROGRESS,
  completed: AURORA_BOOKING_STATUS_COMPLETED,
  cancelled: AURORA_BOOKING_STATUS_CANCELLED,
};

export function BookingHeader({ data, labels, className }: BookingHeaderProps) {
  return (
    <header className={cn(AURORA_BOOKING_HEADER, className)}>
      <div className={AURORA_BOOKING_HEADER_INNER}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href="/bookings"
              className={cn(AURORA_BOOKING_GHOST_BUTTON, "h-8 w-8 px-0")}
              aria-label={labels.back}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={AURORA_BOOKING_HEADER_TITLE}>{data.bookingCode}</h1>
                <span
                  className={cn(
                    AURORA_BOOKING_STATUS_BADGE,
                    STATUS_CLASS[data.status],
                  )}
                >
                  {getBookingStatusLabel(data.status)}
                </span>
              </div>
              <div className={AURORA_BOOKING_HEADER_META}>
                <span>{data.destination}</span>
                <span aria-hidden>·</span>
                <span>
                  {data.departureDate} – {data.returnDate}
                </span>
                <span aria-hidden>·</span>
                <span>
                  {data.travelers} {labels.travelers}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <DesklabsAvatar name={data.assignedStaff.name} size="sm" />
            <div className="min-w-0 text-xs">
              <p className="font-medium text-foreground">{data.assignedStaff.name}</p>
              <p className="text-muted-foreground/70">
                {labels.assignedStaff} · {data.assignedStaff.role}
              </p>
            </div>
          </div>
        </div>

        <div className={AURORA_BOOKING_HEADER_ACTIONS}>
          <button type="button" className={AURORA_BOOKING_PRIMARY_BUTTON}>
            {labels.generateInvoice}
          </button>
          <button type="button" className={AURORA_BOOKING_SECONDARY_BUTTON}>
            {labels.more}
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
