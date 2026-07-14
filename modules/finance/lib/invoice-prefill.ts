import type { BookingPrefillResult } from "@/modules/finance/types/invoices";

type BookingPrefillSource = {
  id: string;
  lead_id: string | null;
  booking_code: string | null;
  customer_name: string;
  package_name: string | null;
  departure_date: string | null;
  total_pax: number | null;
  total_amount: number | null;
  discount_amount: number | null;
};

/**
 * Prefill draft fields from a verified booking row.
 * Does not invent missing commercial data.
 */
export function buildBookingPrefill(
  booking: BookingPrefillSource,
): BookingPrefillResult {
  const missingFields: string[] = [];

  if (!booking.lead_id) missingFields.push("customer");
  if (!booking.booking_code) missingFields.push("bookingCode");
  if (!booking.package_name) missingFields.push("packageName");
  if (!booking.departure_date) missingFields.push("departureDate");
  if (booking.total_pax == null || booking.total_pax <= 0) {
    missingFields.push("participantCount");
  }
  if (!booking.customer_name?.trim()) missingFields.push("leadTraveller");

  const verifiedTotal =
    booking.total_amount != null && Number.isFinite(Number(booking.total_amount))
      ? Math.round(Number(booking.total_amount))
      : null;

  if (verifiedTotal == null || verifiedTotal < 0) {
    missingFields.push("verifiedTotal");
  }

  const quantity =
    booking.total_pax != null && booking.total_pax > 0 ? booking.total_pax : 1;

  let suggestedItem: BookingPrefillResult["suggestedItem"] = null;
  if (booking.package_name && verifiedTotal != null && verifiedTotal >= 0) {
    // Unit price derived from verified booking total / pax when both exist.
    const unitPriceMinor =
      quantity > 0 ? Math.round(verifiedTotal / quantity) : verifiedTotal;
    suggestedItem = {
      description: booking.package_name,
      detail: booking.booking_code
        ? `Booking ${booking.booking_code}`
        : null,
      quantity,
      unit: "pax",
      unitPriceMinor,
      discountMinor: 0,
    };
  }

  return {
    customerId: booking.lead_id,
    bookingId: booking.id,
    bookingCode: booking.booking_code,
    packageName: booking.package_name,
    departureDate: booking.departure_date,
    participantCount: booking.total_pax,
    leadTraveller: booking.customer_name?.trim() || null,
    suggestedItem,
    verifiedTotalMinor: verifiedTotal != null && verifiedTotal >= 0 ? verifiedTotal : null,
    missingFields,
  };
}
