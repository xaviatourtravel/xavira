import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { buildSalesTakeoverSummary } from "@/modules/inbox/lib/build-sales-takeover-summary";

import type { Booking, BookingRow, BookingSnapshot } from "../booking";

export const BOOKING_SNAPSHOT_EMPTY_VALUE = "—";

function formatBudgetIdr(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}

export function mapBookingFromRow(row: BookingRow): Booking {
  return {
    id: row.id,
    code: row.booking_code,
    status: row.booking_status === "cancelled" ? "cancelled" : "confirmed",
    packageName: row.package_name,
    destination: null,
    departureDate: row.departure_date,
    travelerCount: row.total_pax,
    budgetIdr: null,
    paymentStatus: row.payment_status,
  };
}

export function mapBookingSnapshotFromConversation(
  conversation: OmnichannelConversationDetail,
): BookingSnapshot {
  const lead = conversation.leadContext;
  const summary = buildSalesTakeoverSummary({
    leadQualification: conversation.leadQualification,
    conversationMemory: conversation.conversationMemory,
    aiActivityEvents: conversation.aiActivityEvents,
    messages: conversation.messages,
  });

  const hasBookingStatus =
    conversation.status === "waiting_dp" || conversation.status === "closed_won";

  const departure =
    lead?.travelDatePreference?.trim() ||
    summary.departure ||
    summary.tripType ||
    BOOKING_SNAPSHOT_EMPTY_VALUE;

  const destination =
    lead?.packageInterest?.trim() || summary.destination || BOOKING_SNAPSHOT_EMPTY_VALUE;

  const travelers =
    lead?.partySize != null
      ? String(lead.partySize)
      : summary.passengerCount || BOOKING_SNAPSHOT_EMPTY_VALUE;

  const budget =
    lead?.budgetIdr != null
      ? formatBudgetIdr(lead.budgetIdr)
      : summary.budget || BOOKING_SNAPSHOT_EMPTY_VALUE;

  const hasBookingDetails =
    hasBookingStatus ||
    departure !== BOOKING_SNAPSHOT_EMPTY_VALUE ||
    destination !== BOOKING_SNAPSHOT_EMPTY_VALUE ||
    travelers !== BOOKING_SNAPSHOT_EMPTY_VALUE ||
    budget !== BOOKING_SNAPSHOT_EMPTY_VALUE;

  if (!hasBookingDetails) {
    return {
      status: "No Booking Yet",
      departure: BOOKING_SNAPSHOT_EMPTY_VALUE,
      destination: BOOKING_SNAPSHOT_EMPTY_VALUE,
      travelers: BOOKING_SNAPSHOT_EMPTY_VALUE,
      budget: BOOKING_SNAPSHOT_EMPTY_VALUE,
    };
  }

  return {
    status: hasBookingStatus ? conversation.statusLabel : "No Booking Yet",
    departure,
    destination,
    travelers,
    budget,
  };
}

export function isBookingSnapshotEmpty(booking: BookingSnapshot): boolean {
  return (
    booking.status === "No Booking Yet" &&
    booking.departure === BOOKING_SNAPSHOT_EMPTY_VALUE &&
    booking.destination === BOOKING_SNAPSHOT_EMPTY_VALUE &&
    booking.travelers === BOOKING_SNAPSHOT_EMPTY_VALUE &&
    booking.budget === BOOKING_SNAPSHOT_EMPTY_VALUE
  );
}
