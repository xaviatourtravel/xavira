import {
  assertNonNegativeInteger,
  assertNonNegativeMinor,
  multiplyQuantityPrice,
} from "@/modules/finance/lib/invoice-money";
import type { InvoiceBasePaymentStatus } from "@/modules/finance/lib/invoice-payment-status";

export type InvoiceLineInput = {
  quantity: number;
  unitPriceMinor: number;
  discountMinor?: number;
};

export type InvoiceCalculatorInput = {
  items: InvoiceLineInput[];
  discountMinor?: number;
  taxRateBps?: number;
  taxMinor?: number;
  additionalFeesMinor?: number;
  amountPaidMinor?: number;
};

export type InvoiceLineResult = {
  quantity: number;
  unitPriceMinor: number;
  discountMinor: number;
  lineTotalMinor: number;
};

export type InvoiceCalculatorResult = {
  lines: InvoiceLineResult[];
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  taxRateBps: number;
  additionalFeesMinor: number;
  totalMinor: number;
  amountPaidMinor: number;
  balanceDueMinor: number;
  /** Persisted base payment status — never overdue. */
  paymentStatus: InvoiceBasePaymentStatus;
};

function sumSafe(values: number[]): number {
  let total = 0;
  for (const value of values) {
    total += value;
    if (!Number.isSafeInteger(total)) {
      throw new Error("amount exceeds safe integer range");
    }
  }
  return total;
}

function deriveBasePaymentStatus(
  totalMinor: number,
  amountPaidMinor: number,
  balanceDueMinor: number,
): InvoiceBasePaymentStatus {
  if (amountPaidMinor > totalMinor) {
    throw new Error("overpayment is not allowed");
  }
  if (totalMinor === 0 && amountPaidMinor === 0) {
    return "paid";
  }
  if (amountPaidMinor === 0) {
    return "unpaid";
  }
  if (balanceDueMinor === 0) {
    return "paid";
  }
  return "partially_paid";
}

/**
 * Server-authoritative invoice totals in integer minor units.
 * Never trust browser-calculated totals. Does not persist overdue.
 */
export function calculateInvoiceTotals(
  input: InvoiceCalculatorInput,
): InvoiceCalculatorResult {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error("at least one line item is required");
  }

  const lines: InvoiceLineResult[] = input.items.map((item) => {
    const discountMinor = assertNonNegativeMinor(
      item.discountMinor ?? 0,
      "line discount",
    );
    const gross = multiplyQuantityPrice(item.quantity, item.unitPriceMinor);
    if (discountMinor > gross) {
      throw new Error("line discount cannot exceed line gross");
    }
    const lineTotalMinor = gross - discountMinor;
    return {
      quantity: item.quantity,
      unitPriceMinor: item.unitPriceMinor,
      discountMinor,
      lineTotalMinor,
    };
  });

  const subtotalMinor = sumSafe(lines.map((line) => line.lineTotalMinor));
  const discountMinor = assertNonNegativeMinor(
    input.discountMinor ?? 0,
    "invoice discount",
  );
  if (discountMinor > subtotalMinor) {
    throw new Error("invoice discount cannot exceed subtotal");
  }

  const taxableBase = subtotalMinor - discountMinor;
  const taxRateBps = assertNonNegativeInteger(
    input.taxRateBps ?? 0,
    "tax rate bps",
  );

  let taxMinor: number;
  if (input.taxMinor !== undefined) {
    taxMinor = assertNonNegativeMinor(input.taxMinor, "tax");
  } else if (taxRateBps === 0) {
    taxMinor = 0;
  } else {
    taxMinor = Math.round((taxableBase * taxRateBps) / 10_000);
    assertNonNegativeMinor(taxMinor, "tax");
  }

  const additionalFeesMinor = assertNonNegativeMinor(
    input.additionalFeesMinor ?? 0,
    "additional fees",
  );

  const totalMinor = sumSafe([taxableBase, taxMinor, additionalFeesMinor]);

  const amountPaidMinor = assertNonNegativeMinor(
    input.amountPaidMinor ?? 0,
    "amount paid",
  );
  if (amountPaidMinor > totalMinor) {
    throw new Error("overpayment is not allowed");
  }

  const balanceDueMinor = totalMinor - amountPaidMinor;
  const paymentStatus = deriveBasePaymentStatus(
    totalMinor,
    amountPaidMinor,
    balanceDueMinor,
  );

  return {
    lines,
    subtotalMinor,
    discountMinor,
    taxMinor,
    taxRateBps,
    additionalFeesMinor,
    totalMinor,
    amountPaidMinor,
    balanceDueMinor,
    paymentStatus,
  };
}
