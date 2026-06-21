import { BookingsFilters } from "@/components/bookings/bookings-filters";
import { BookingsList, type BookingListRow } from "@/components/bookings/bookings-list";
import { requireProfile } from "@/lib/auth/session";
import { BOOKING_PAYMENT_STATUSES } from "@/lib/bookings/payment-status";
import { createClient } from "@/utils/supabase/server";

type BookingRow = {
  id: string;
  lead_id: string | null;
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

function isPaymentStatusFilter(value: string) {
  return BOOKING_PAYMENT_STATUSES.includes(
    value as (typeof BOOKING_PAYMENT_STATUSES)[number],
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
      "id, lead_id, booking_code, customer_name, package_name, departure_date, total_pax, total_amount, payment_status, booking_status, created_at",
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
  const bookingIds = rows.map((booking) => booking.id);
  const paymentsByBookingId = new Map<string, number>();

  if (bookingIds.length > 0) {
    const { data: paymentRows, error: paymentsError } = await supabase
      .from("booking_payments")
      .select("booking_id, amount")
      .in("booking_id", bookingIds);

    if (paymentsError) {
      throw new Error("Gagal memuat data pembayaran booking.");
    }

    for (const payment of paymentRows ?? []) {
      const currentTotal = paymentsByBookingId.get(payment.booking_id) ?? 0;
      paymentsByBookingId.set(
        payment.booking_id,
        currentTotal + Number(payment.amount ?? 0),
      );
    }
  }

  const returnTo = buildReturnPath(
    search,
    paymentStatusFilter,
    bookingStatusFilter,
  );

  const listRows: BookingListRow[] = rows.map((booking) => {
    const amountPaid = paymentsByBookingId.get(booking.id) ?? 0;
    const outstandingBalance = Number(booking.total_amount) - amountPaid;

    return {
      id: booking.id,
      leadId: booking.lead_id,
      bookingCode: booking.booking_code || "-",
      customerName: booking.customer_name,
      packageName: booking.package_name || "-",
      departureDateLabel: booking.departure_date
        ? formatDate(booking.departure_date)
        : "-",
      totalPax: booking.total_pax,
      totalAmountLabel: formatCurrency(Number(booking.total_amount)),
      paymentStatus: booking.payment_status,
      outstandingLabel: formatCurrency(outstandingBalance),
      bookingStatusLabel: formatLabel(booking.booking_status),
      createdAtLabel: formatDateTime(booking.created_at),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bookings</h1>
        <p className="text-sm text-muted-foreground">
          Daftar booking customer di Desklabs.
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
        <BookingsList rows={listRows} returnTo={returnTo} />
      )}
    </div>
  );
}
