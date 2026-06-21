import Link from "next/link";

import type { BookingOverviewMetrics } from "@/lib/dashboard/booking-overview";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

type BookingOverviewSectionProps = {
  metrics: BookingOverviewMetrics;
};

export function BookingOverviewSection({ metrics }: BookingOverviewSectionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold">Booking Overview</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Ringkasan booking dan pembayaran organisasi.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/bookings"
          className="rounded-xl border p-4 transition-colors hover:bg-accent/50"
        >
          <p className="text-sm text-muted-foreground">Total Bookings</p>
          <h2 className="mt-2 text-2xl font-bold">{metrics.totalBookings}</h2>
        </Link>

        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Total Pax</p>
          <h2 className="mt-2 text-2xl font-bold">{metrics.totalPax}</h2>
        </div>

        <Link
          href="/bookings"
          className="rounded-xl border p-4 transition-colors hover:bg-accent/50"
        >
          <p className="text-sm text-muted-foreground">Payment Received</p>
          <h2 className="mt-2 text-2xl font-bold">
            {formatCurrency(metrics.paymentReceived)}
          </h2>
        </Link>

        <Link
          href="/bookings?payment_status=dp_paid"
          className="rounded-xl border p-4 transition-colors hover:bg-accent/50"
        >
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <h2 className="mt-2 text-2xl font-bold">
            {formatCurrency(metrics.outstandingBalance)}
          </h2>
        </Link>
      </div>
    </div>
  );
}
