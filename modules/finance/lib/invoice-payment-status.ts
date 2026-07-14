import type {
  InvoiceLifecycleStatus,
  InvoicePaymentStatus,
} from "@/modules/finance/types/invoices";

/** Persisted payment state only — never store overdue. */
export type InvoiceBasePaymentStatus = "unpaid" | "partially_paid" | "paid";

export type EffectiveInvoicePaymentStatus =
  | InvoiceBasePaymentStatus
  | "overdue";

/**
 * Derive display/payment status at read time so overdue stays correct as
 * calendar dates advance without rewriting the invoice row.
 */
export function deriveEffectivePaymentStatus(input: {
  lifecycleStatus: InvoiceLifecycleStatus | string;
  paymentStatus: InvoicePaymentStatus | string;
  balanceDueMinor: number;
  dueDate: string | null;
  /** Workspace-local calendar date YYYY-MM-DD (defaults to Asia/Jakarta today). */
  today?: string;
}): EffectiveInvoicePaymentStatus {
  if (input.lifecycleStatus === "void") {
    return normalizeBasePaymentStatus(input.paymentStatus);
  }

  const base = normalizeBasePaymentStatus(input.paymentStatus);

  if (
    (input.lifecycleStatus === "issued" || input.lifecycleStatus === "sent") &&
    input.balanceDueMinor > 0 &&
    input.dueDate
  ) {
    const today = input.today ?? workspaceTodayJakarta();
    if (input.dueDate < today) {
      return "overdue";
    }
  }

  return base;
}

export function normalizeBasePaymentStatus(
  status: string,
): InvoiceBasePaymentStatus {
  if (status === "partially_paid" || status === "paid" || status === "unpaid") {
    return status;
  }
  // Legacy/stored "overdue" (if any) maps to unpaid until refreshed by amount.
  if (status === "overdue") {
    return "unpaid";
  }
  return "unpaid";
}

export function workspaceTodayJakarta(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
