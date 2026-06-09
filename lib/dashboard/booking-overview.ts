import { createClient } from "@/utils/supabase/server";

export type BookingOverviewMetrics = {
  totalBookings: number;
  totalPax: number;
  paymentReceived: number;
  outstandingBalance: number;
};

export async function loadBookingOverviewMetrics(
  organizationId: string,
): Promise<BookingOverviewMetrics> {
  const supabase = await createClient();

  const [
    { count: totalBookings, data: orgBookings },
    { data: orgBookingPayments },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("total_pax, total_amount", { count: "exact" })
      .eq("organization_id", organizationId),
    supabase
      .from("booking_payments")
      .select("amount, bookings!inner(organization_id)")
      .eq("bookings.organization_id", organizationId),
  ]);

  const totalPax = (orgBookings ?? []).reduce(
    (sum, booking) => sum + (booking.total_pax ?? 0),
    0,
  );
  const totalBookingAmount = (orgBookings ?? []).reduce(
    (sum, booking) => sum + Number(booking.total_amount ?? 0),
    0,
  );
  const paymentReceived = (orgBookingPayments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount ?? 0),
    0,
  );

  return {
    totalBookings: totalBookings ?? 0,
    totalPax,
    paymentReceived,
    outstandingBalance: totalBookingAmount - paymentReceived,
  };
}
