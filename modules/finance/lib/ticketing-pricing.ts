/**
 * Ticketing pricing → invoice item mapping.
 *
 * The existing invoice calculator (`calculateInvoiceTotals`) remains the single
 * authority for money. This helper only shapes ticketing inputs into the
 * standard invoice item + totals model so there is no second source of truth:
 *
 *   passenger_count × price_per_passenger   → line item "Tiket Pesawat …"
 *   service_fee                             → optional line item
 *   taxes_and_fees                          → invoice additionalFeesMinor
 *   discount                                → invoice discountMinor
 */

import { resolveAirportDisplay } from "@/modules/finance/lib/airport-airline-directory";
import { assertNonNegativeMinor } from "@/modules/finance/lib/invoice-money";

export type TicketingPricingInput = {
  passengerCount: number;
  pricePerPassengerMinor: number;
  serviceFeeMinor?: number;
  taxesAndFeesMinor?: number;
  discountMinor?: number;
  routeSummary: string;
};

export type TicketingInvoiceItem = {
  description: string;
  detail: string | null;
  quantity: number;
  unit: string;
  unitPriceMinor: number;
  discountMinor: number;
};

export type TicketingPricingResult = {
  items: TicketingInvoiceItem[];
  totals: {
    discountMinor: number;
    additionalFeesMinor: number;
    taxRateBps: number;
  };
};

/** Build a short route summary like "CGK → ADD → JED → CGK" from airport codes. */
export function buildRouteSummary(
  airportCodes: Array<string | null | undefined>,
): string {
  const path: string[] = [];
  for (const raw of airportCodes) {
    const code = resolveAirportDisplay(raw).code;
    if (!code) continue;
    if (path.length === 0 || path[path.length - 1] !== code) {
      path.push(code);
    }
  }
  return path.join(" → ");
}

/**
 * Map ticketing pricing to invoice items + totals patch. Money stays integer;
 * negative or non-integer values are rejected before they reach the calculator.
 */
export function buildTicketingInvoiceItems(
  input: TicketingPricingInput,
): TicketingPricingResult {
  if (!Number.isInteger(input.passengerCount) || input.passengerCount <= 0) {
    throw new Error("passenger count must be a positive integer");
  }
  const pricePerPassengerMinor = assertNonNegativeMinor(
    input.pricePerPassengerMinor,
    "price per passenger",
  );
  const serviceFeeMinor = assertNonNegativeMinor(
    input.serviceFeeMinor ?? 0,
    "service fee",
  );
  const taxesAndFeesMinor = assertNonNegativeMinor(
    input.taxesAndFeesMinor ?? 0,
    "taxes and fees",
  );
  const discountMinor = assertNonNegativeMinor(
    input.discountMinor ?? 0,
    "discount",
  );

  const routeSummary = input.routeSummary.trim();
  const items: TicketingInvoiceItem[] = [
    {
      description: routeSummary
        ? `Tiket Pesawat ${routeSummary}`
        : "Tiket Pesawat",
      detail: null,
      quantity: input.passengerCount,
      unit: "pax",
      unitPriceMinor: pricePerPassengerMinor,
      discountMinor: 0,
    },
  ];

  if (serviceFeeMinor > 0) {
    items.push({
      description: "Biaya layanan",
      detail: null,
      quantity: 1,
      unit: "item",
      unitPriceMinor: serviceFeeMinor,
      discountMinor: 0,
    });
  }

  return {
    items,
    totals: {
      discountMinor,
      additionalFeesMinor: taxesAndFeesMinor,
      taxRateBps: 0,
    },
  };
}
