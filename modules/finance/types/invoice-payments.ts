/**
 * Invoice payment ledger types (FIN-002D).
 * Successful rows are the authority for amount_paid / balance after issue.
 */

export const INVOICE_PAYMENT_STATUSES = [
  "pending",
  "successful",
  "failed",
  "reversed",
] as const;

export type InvoicePaymentStatus = (typeof INVOICE_PAYMENT_STATUSES)[number];

export type InvoicePaymentRecord = {
  id: string;
  organizationId: string;
  invoiceId: string;
  paymentCode: string;
  amountMinor: number;
  paidAt: string;
  paymentMethod: string | null;
  bankName: string | null;
  accountNumberMasked: string | null;
  status: InvoicePaymentStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Sum only successful payments — failed/reversed/pending never contribute. */
export function sumSuccessfulInvoicePayments(
  payments: ReadonlyArray<Pick<InvoicePaymentRecord, "amountMinor" | "status">>,
): number {
  return payments.reduce((total, payment) => {
    if (payment.status !== "successful") return total;
    if (!Number.isInteger(payment.amountMinor) || payment.amountMinor <= 0) {
      return total;
    }
    return total + payment.amountMinor;
  }, 0);
}

/** Customer-facing Indonesian payment-request labels (FIN-002F). */
export const PAYMENT_REQUEST_LABELS_ID = {
  fullPayment: "Pembayaran penuh",
  downPayment: "Uang muka",
  installment: "Cicilan",
  remainingBalance: "Pelunasan",
  settled: "Lunas",
} as const;

const ENGLISH_PAYMENT_REQUEST_NOTES: Record<string, string> = {
  "full payment": PAYMENT_REQUEST_LABELS_ID.fullPayment,
  "pembayaran penuh": PAYMENT_REQUEST_LABELS_ID.fullPayment,
  dp: PAYMENT_REQUEST_LABELS_ID.downPayment,
  "down payment": PAYMENT_REQUEST_LABELS_ID.downPayment,
  "uang muka": PAYMENT_REQUEST_LABELS_ID.downPayment,
  installment: PAYMENT_REQUEST_LABELS_ID.installment,
  cicilan: PAYMENT_REQUEST_LABELS_ID.installment,
  "remaining balance": PAYMENT_REQUEST_LABELS_ID.remainingBalance,
  "sisa pembayaran": PAYMENT_REQUEST_LABELS_ID.remainingBalance,
  pelunasan: PAYMENT_REQUEST_LABELS_ID.remainingBalance,
};

/**
 * Localize known internal/English payment-request values to Indonesian.
 * Custom free-text notes pass through unchanged.
 */
export function localizePaymentRequestNote(value: string): string {
  return ENGLISH_PAYMENT_REQUEST_NOTES[value.trim().toLowerCase()] ?? value.trim();
}

/**
 * Derive a customer-facing payment-request label when none is stored.
 * Always Indonesian — raw enum/English values are never exposed.
 * Does not change totals — presentation only.
 */
export function derivePaymentRequestNote(params: {
  paymentRequestNote?: string | null;
  totalMinor: number;
  amountPaidMinor: number;
  balanceDueMinor: number;
}): string {
  const explicit = params.paymentRequestNote?.trim();
  if (explicit) return localizePaymentRequestNote(explicit);
  if (params.balanceDueMinor <= 0) return PAYMENT_REQUEST_LABELS_ID.settled;
  if (params.amountPaidMinor <= 0) return PAYMENT_REQUEST_LABELS_ID.fullPayment;
  return PAYMENT_REQUEST_LABELS_ID.remainingBalance;
}
