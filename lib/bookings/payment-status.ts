export type BookingPaymentStatus =
  | "unpaid"
  | "dp_paid"
  | "fully_paid"
  | "overpaid";

export const BOOKING_PAYMENT_STATUSES: BookingPaymentStatus[] = [
  "unpaid",
  "dp_paid",
  "fully_paid",
  "overpaid",
];

const LEGACY_STATUS_MAP: Record<string, BookingPaymentStatus> = {
  pending: "unpaid",
  partial_paid: "dp_paid",
  paid: "fully_paid",
};

export function normalizeBookingPaymentStatus(
  status: string,
): BookingPaymentStatus {
  if (BOOKING_PAYMENT_STATUSES.includes(status as BookingPaymentStatus)) {
    return status as BookingPaymentStatus;
  }

  return LEGACY_STATUS_MAP[status] ?? "unpaid";
}

export function calculateBookingPaymentStatus(
  totalAmount: number,
  totalPayments: number,
): BookingPaymentStatus {
  if (totalPayments === 0) {
    return "unpaid";
  }

  if (totalPayments > totalAmount) {
    return "overpaid";
  }

  if (totalPayments >= totalAmount) {
    return "fully_paid";
  }

  return "dp_paid";
}

export function isBookingPaymentSettled(status: string) {
  const normalized = normalizeBookingPaymentStatus(status);
  return normalized === "fully_paid" || normalized === "overpaid";
}

export function formatPaymentStatusLabel(status: string) {
  const normalized = normalizeBookingPaymentStatus(status);
  const labels: Record<BookingPaymentStatus, string> = {
    unpaid: "New",
    dp_paid: "Partial",
    fully_paid: "Paid",
    overpaid: "Overpaid",
  };

  return labels[normalized] ?? status.replace(/_/g, " ");
}
