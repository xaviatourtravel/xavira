"use client";

import {
  AURORA_BOOKING_WORKSPACE_CONTENT,
  AURORA_BOOKING_WORKSPACE_ROOT,
  AURORA_BOOKING_WORKSPACE_SCROLL,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import { BookingActivity } from "./booking-activity";
import { BookingHeader } from "./booking-header";
import { BookingNotes } from "./booking-notes";
import { BookingSummary } from "./booking-summary";
import { DocumentsCard } from "./documents-card";
import { PassengerTable } from "./passenger-table";
import { PaymentCard } from "./payment-card";
import { TripTimeline } from "./trip-timeline";
import type { BookingWorkspaceData, BookingWorkspaceLabels } from "./types";

type BookingWorkspaceProps = {
  data: BookingWorkspaceData;
  labels: BookingWorkspaceLabels;
  className?: string;
};

export function BookingWorkspace({ data, labels, className }: BookingWorkspaceProps) {
  return (
    <div className={cn(AURORA_BOOKING_WORKSPACE_ROOT, className)}>
      <BookingHeader data={data.header} labels={labels} />

      <div className={AURORA_BOOKING_WORKSPACE_SCROLL}>
        <div className={AURORA_BOOKING_WORKSPACE_CONTENT}>
          <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-3">
              <BookingSummary items={data.summary} labels={labels} />
            </div>
            <div className="lg:col-span-5">
              <PassengerTable passengers={data.passengers} labels={labels} />
            </div>
            <div className="lg:col-span-4">
              <TripTimeline steps={data.tripTimeline} labels={labels} />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <PaymentCard payment={data.payment} labels={labels} />
            <DocumentsCard documents={data.documents} labels={labels} />
            <BookingNotes notes={data.notes} labels={labels} />
          </div>

          <BookingActivity events={data.activity} labels={labels} />
        </div>
      </div>
    </div>
  );
}
