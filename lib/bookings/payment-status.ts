export type BookingPaymentStatus = "pending" | "partial_paid" | "paid";

export function calculateBookingPaymentStatus(
  totalAmount: number,
  totalPayments: number,
): BookingPaymentStatus {
  if (totalPayments === 0) {
    return "pending";
  }

  if (totalPayments >= totalAmount) {
    return "paid";
  }

  return "partial_paid";
}

export function formatPaymentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pending",
    partial_paid: "Partial Paid",
    paid: "Paid",
  };

  return labels[status] ?? status.replace(/_/g, " ");
}
