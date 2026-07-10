"use client";

import {
  AURORA_SNAPSHOT_ROW,
  AURORA_SNAPSHOT_ROW_LABEL,
  AURORA_SNAPSHOT_ROW_VALUE,
  AURORA_SNAPSHOT_SUBSECTION_TITLE,
} from "@/components/workspace/aurora-tokens";
import type { BookingSnapshot } from "@/lib/domain/booking";

import type { CustomerSnapshotLabels } from "./types";

type CustomerSnapshotBookingProps = {
  booking: BookingSnapshot;
  labels: CustomerSnapshotLabels;
};

export function CustomerSnapshotBooking({ booking, labels }: CustomerSnapshotBookingProps) {
  const rows = [
    { label: labels.destination, value: booking.destination },
    { label: labels.travelers, value: booking.travelers },
    { label: labels.departure, value: booking.departure },
    { label: labels.budget, value: booking.budget },
  ];

  return (
    <section aria-labelledby="customer-snapshot-booking">
      <h5 id="customer-snapshot-booking" className={AURORA_SNAPSHOT_SUBSECTION_TITLE}>
        {labels.bookingSummary}
      </h5>
      <dl className="mt-2 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className={AURORA_SNAPSHOT_ROW}>
            <dt className={AURORA_SNAPSHOT_ROW_LABEL}>{row.label}</dt>
            <dd className={AURORA_SNAPSHOT_ROW_VALUE}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
