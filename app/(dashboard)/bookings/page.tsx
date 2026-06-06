import Link from "next/link";

import { BookingsFilters } from "@/components/bookings/bookings-filters";
import { BookingRowActions } from "@/components/bookings/booking-row-actions";
import { PaymentStatusBadge } from "@/components/bookings/payment-status-badge";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

type BookingRow = {
  id: string;
  booking_code: string | null;
  customer_name: string;
  package_name: string | null;
  departure_date: string | null;
  total_pax: number;
  total_amount: number;
  payment_status: string;
  booking_status: string;
  created_at: string;
};

const PAYMENT_STATUS_FILTERS = ["pending", "partial_paid", "paid"] as const;
const BOOKING_STATUS_FILTERS = [
  "new",
  "confirmed",
  "cancelled",
  "completed",
] as const;

type BookingsPageProps = {
  searchParams: Promise<{
    q?: string;
    payment_status?: string;
    booking_status?: string;
    success?: string;
    error?: string;
  }>;
};

function buildReturnPath(
  search: string,
  paymentStatusFilter: string,
  bookingStatusFilter: string,
) {
  const params = new URLSearchParams();

  if (search) {
    params.set("q", search);
  }

  if (paymentStatusFilter) {
    params.set("payment_status", paymentStatusFilter);
  }

  if (bookingStatusFilter) {
    params.set("booking_status", bookingStatusFilter);
  }

  const query = params.toString();
  return query ? `/bookings?${query}` : "/bookings";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function isPaymentStatusFilter(
  value: string,
): value is (typeof PAYMENT_STATUS_FILTERS)[number] {
  return PAYMENT_STATUS_FILTERS.includes(
    value as (typeof PAYMENT_STATUS_FILTERS)[number],
  );
}

function isBookingStatusFilter(
  value: string,
): value is (typeof BOOKING_STATUS_FILTERS)[number] {
  return BOOKING_STATUS_FILTERS.includes(
    value as (typeof BOOKING_STATUS_FILTERS)[number],
  );
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const params = await searchParams;

  const search = params.q?.trim() ?? "";
  const paymentStatusFilter = params.payment_status?.trim() ?? "";
  const bookingStatusFilter = params.booking_status?.trim() ?? "";
  const hasFilters =
    search.length > 0 ||
    paymentStatusFilter.length > 0 ||
    bookingStatusFilter.length > 0;

  let query = supabase
    .from("bookings")
    .select(
      "id, booking_code, customer_name, package_name, departure_date, total_pax, total_amount, payment_status, booking_status, created_at",
    )
    .eq("organization_id", profile.organization_id);

  if (search) {
    query = query.or(
      `booking_code.ilike.%${search}%,customer_name.ilike.%${search}%,package_name.ilike.%${search}%`,
    );
  }

  if (paymentStatusFilter && isPaymentStatusFilter(paymentStatusFilter)) {
    query = query.eq("payment_status", paymentStatusFilter);
  }

  if (bookingStatusFilter && isBookingStatusFilter(bookingStatusFilter)) {
    query = query.eq("booking_status", bookingStatusFilter);
  }

  const { data: bookings, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    throw new Error("Gagal memuat data booking.");
  }

  const rows = (bookings ?? []) as BookingRow[];
  const returnTo = buildReturnPath(
    search,
    paymentStatusFilter,
    bookingStatusFilter,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bookings</h1>
        <p className="text-sm text-muted-foreground">
          Daftar booking customer Xavia.
        </p>
      </div>

      {params.success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {decodeURIComponent(params.success)}
        </div>
      )}

      {params.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <BookingsFilters
        search={search}
        paymentStatus={paymentStatusFilter}
        bookingStatus={bookingStatusFilter}
      />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="text-lg font-medium">
            {hasFilters ? "Booking tidak ditemukan" : "Belum ada booking"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {hasFilters
              ? "Coba ubah kata kunci atau filter pencarian."
              : "Booking customer akan muncul di sini."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
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
                      {booking.booking_code || "-"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {booking.customer_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{booking.package_name || "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {booking.departure_date
                      ? formatDate(booking.departure_date)
                      : "-"}
                  </td>
                  <td className="px-4 py-3">{booking.total_pax}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatCurrency(Number(booking.total_amount))}
                  </td>
                  <td className="px-4 py-3">
                    <PaymentStatusBadge status={booking.payment_status} />
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {formatLabel(booking.booking_status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatDateTime(booking.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <BookingRowActions
                      bookingId={booking.id}
                      returnTo={returnTo}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
