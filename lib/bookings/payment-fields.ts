export const BOOKING_PAYMENT_METHODS = [
  "bank_transfer",
  "cash",
  "credit_card",
  "other",
] as const;

export type BookingPaymentMethod = (typeof BOOKING_PAYMENT_METHODS)[number];

export const BOOKING_PAYMENT_TYPES = [
  "down_payment",
  "installment",
  "final_payment",
] as const;

export type BookingPaymentType = (typeof BOOKING_PAYMENT_TYPES)[number];

const LEGACY_PAYMENT_TYPE_MAP: Record<string, BookingPaymentType> = {
  dp: "down_payment",
  final: "final_payment",
};

export function normalizeBookingPaymentType(value: string): BookingPaymentType | null {
  const normalized = LEGACY_PAYMENT_TYPE_MAP[value] ?? value;

  if (BOOKING_PAYMENT_TYPES.includes(normalized as BookingPaymentType)) {
    return normalized as BookingPaymentType;
  }

  return null;
}

export function formatPaymentTypeLabel(value: string) {
  const labels: Record<string, string> = {
    down_payment: "Down Payment",
    dp: "Down Payment",
    installment: "Installment",
    final_payment: "Final Payment",
    final: "Final Payment",
  };

  return labels[value] ?? value.replace(/_/g, " ");
}

export function formatPaymentMethodLabel(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const labels: Record<string, string> = {
    bank_transfer: "Bank Transfer",
    cash: "Cash",
    credit_card: "Credit Card",
    other: "Other",
  };

  return labels[value] ?? value.replace(/_/g, " ");
}
