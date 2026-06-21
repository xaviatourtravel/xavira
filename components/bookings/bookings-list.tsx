"use client";

import Link from "next/link";

import { BookingRowActions } from "@/components/bookings/booking-row-actions";
import { PaymentStatusBadge } from "@/components/bookings/payment-status-badge";

export type BookingListRow = {
  id: string;
  leadId: string | null;
  bookingCode: string;
  customerName: string;
  packageName: string;
  departureDateLabel: string;
  totalPax: number;
  totalAmountLabel: string;
  paymentStatus: string;
  outstandingLabel: string;
  bookingStatusLabel: string;
  createdAtLabel: string;
};

type BookingsListProps = {
  rows: BookingListRow[];
  returnTo: string;
};

export function BookingsList({ rows, returnTo }: BookingsListProps) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((booking) => (
          <article
            key={booking.id}
            className="rounded-2xl border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/bookings/${booking.id}`}
                  className="block truncate text-base font-semibold text-primary hover:underline"
                >
                  {booking.customerName}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {booking.bookingCode}
                </p>
              </div>
              <PaymentStatusBadge status={booking.paymentStatus} />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Package</dt>
                <dd className="font-medium">{booking.packageName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Departure</dt>
                <dd className="font-medium">{booking.departureDateLabel}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Total</dt>
                <dd className="font-medium">{booking.totalAmountLabel}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Outstanding</dt>
                <dd className="font-semibold text-amber-700">
                  {booking.outstandingLabel}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Pax</dt>
                <dd className="font-medium">{booking.totalPax}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Status</dt>
                <dd className="font-medium capitalize">
                  {booking.bookingStatusLabel}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
              <p className="text-xs text-muted-foreground">
                {booking.createdAtLabel}
              </p>
              <BookingRowActions
                bookingId={booking.id}
                leadId={booking.leadId}
                returnTo={returnTo}
              />
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <table className="w-full min-w-[1200px] text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Booking Code</th>
              <th className="px-4 py-3 font-medium">Customer Name</th>
              <th className="px-4 py-3 font-medium">Package Name</th>
              <th className="px-4 py-3 font-medium">Departure Date</th>
              <th className="px-4 py-3 font-medium">Total Pax</th>
              <th className="px-4 py-3 font-medium">Total Amount</th>
              <th className="px-4 py-3 font-medium">Payment Status</th>
              <th className="px-4 py-3 font-medium">Outstanding</th>
              <th className="px-4 py-3 font-medium">Booking Status</th>
              <th className="px-4 py-3 font-medium">Created At</th>
              <th className="px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((booking) => (
              <tr key={booking.id} className="border-b last:border-b-0">
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/bookings/${booking.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {booking.bookingCode}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/bookings/${booking.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {booking.customerName}
                  </Link>
                </td>
                <td className="px-4 py-3">{booking.packageName}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {booking.departureDateLabel}
                </td>
                <td className="px-4 py-3">{booking.totalPax}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {booking.totalAmountLabel}
                </td>
                <td className="px-4 py-3">
                  <PaymentStatusBadge status={booking.paymentStatus} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {booking.outstandingLabel}
                </td>
                <td className="px-4 py-3 capitalize">
                  {booking.bookingStatusLabel}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {booking.createdAtLabel}
                </td>
                <td className="px-4 py-3">
                  <BookingRowActions
                    bookingId={booking.id}
                    leadId={booking.leadId}
                    returnTo={returnTo}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
