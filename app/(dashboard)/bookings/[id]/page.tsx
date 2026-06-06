import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  BookingParticipantsSection,
  type BookingParticipantItem,
} from "@/components/bookings/booking-participants-section";
import {
  BookingPaymentSummary,
  BookingPaymentsSection,
  type BookingPaymentItem,
} from "@/components/bookings/booking-payments-section";
import { PaymentStatusBadge } from "@/components/bookings/payment-status-badge";
import { requireProfile } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

type BookingDetail = {
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

function BookingActions({
  bookingId,
  leadId,
}: {
  bookingId: string;
  leadId: string | null;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/bookings"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Kembali
      </Link>

      {leadId && (
        <Link
          href={`/leads/${leadId}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Lihat Lead
        </Link>
      )}

      <Link
        href={`/bookings/${bookingId}/edit`}
        className={cn(buttonVariants({ size: "sm" }))}
      >
        Edit Booking
      </Link>
    </div>
  );
}

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const [
    { data: booking, error },
    { data: participants, error: participantsError },
    { data: payments, error: paymentsError },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, lead_id, booking_code, customer_name, package_name, departure_date, total_pax, total_amount, payment_status, booking_status, created_at",
      )
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .maybeSingle(),
    supabase
      .from("booking_participants")
      .select(
        "id, full_name, phone, passport_number, address, emergency_contact, notes",
      )
      .eq("booking_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("booking_payments")
      .select("id, payment_type, amount, payment_date, notes")
      .eq("booking_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (error || participantsError || paymentsError) {
    throw new Error("Gagal memuat detail booking.");
  }

  if (!booking) {
    notFound();
  }

  const detail = booking as BookingDetail;
  const participantRows = (participants ?? []) as BookingParticipantItem[];
  const paymentRows = (payments ?? []) as BookingPaymentItem[];
  const bookingTotalAmount = Number(detail.total_amount);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Booking Detail</h1>
        <p className="text-sm text-muted-foreground">
          {detail.booking_code || detail.id}
        </p>
      </div>

      {query?.success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {decodeURIComponent(query.success)}
        </div>
      )}

      {query?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(query.error)}
        </div>
      )}

      <div className="lg:hidden">
        <BookingActions bookingId={detail.id} leadId={detail.lead_id} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <div className="rounded-lg border p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Booking Info</h2>
              <p className="text-sm text-muted-foreground">
                Informasi utama booking customer.
              </p>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Customer Name</dt>
                <dd className="text-sm font-medium">{detail.customer_name}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Package Name</dt>
                <dd className="text-sm font-medium">
                  {detail.package_name || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  Departure Date
                </dt>
                <dd className="text-sm font-medium">
                  {detail.departure_date
                    ? formatDate(detail.departure_date)
                    : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Total Pax</dt>
                <dd className="text-sm font-medium">{detail.total_pax}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Total Amount</dt>
                <dd className="text-sm font-medium">
                  {formatCurrency(bookingTotalAmount)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Payment Status</dt>
                <dd className="text-sm font-medium">
                  <PaymentStatusBadge status={detail.payment_status} />
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Booking Status</dt>
                <dd className="text-sm font-medium capitalize">
                  {formatLabel(detail.booking_status)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Created At</dt>
                <dd className="text-sm font-medium">
                  {formatDateTime(detail.created_at)}
                </dd>
              </div>
            </dl>
          </div>

          <BookingParticipantsSection
            bookingId={detail.id}
            participants={participantRows}
          />
        </div>

        <div className="space-y-6">
          <div className="hidden lg:block">
            <BookingActions bookingId={detail.id} leadId={detail.lead_id} />
          </div>

          <BookingPaymentSummary
            bookingTotalAmount={bookingTotalAmount}
            payments={paymentRows}
          />

          <BookingPaymentsSection
            bookingId={detail.id}
            payments={paymentRows}
          />
        </div>
      </div>
    </div>
  );
}
