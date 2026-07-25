/**
 * Raw ticketing transaction content for the customer PDF (FIN-002H).
 *
 * The finance team wants persisted GDS/raw itinerary text on the invoice —
 * not parsed city/route summaries. The parser remains for internal segments.
 */

import type { InvoicePdfItem } from "@/modules/finance/pdf/invoice-pdf-types";
import type { InvoiceTicketGroupRecord } from "@/modules/finance/types/ticketing";

export type TicketingRawTransactionBlock = {
  pnrCode: string;
  /** Exact persisted raw itinerary text (line breaks preserved). */
  rawItinerary: string;
  /** Raw lines in original order — content is not rewritten. */
  itineraryLines: string[];
};

/**
 * Resolve the customer-facing payment-request item name from authoritative
 * invoice items. Prefers a "Tiket Pesawat …" line; never uses invoice number,
 * PNR, or payment code.
 */
export function resolveTicketingBillItemName(params: {
  items: ReadonlyArray<Pick<InvoicePdfItem, "description">>;
  fallback?: string | null;
}): string {
  const ticketLine =
    params.items.find((item) =>
      /^tiket\s+pesawat/i.test(item.description.trim()),
    ) ?? params.items[0];
  const description = ticketLine?.description?.trim();
  if (description) return description;
  const fallback = params.fallback?.trim();
  return fallback && fallback.length > 0 ? fallback : "Tiket Pesawat";
}

/**
 * Build the Ringkasan Transaksi raw block from persisted ticket-group data.
 * Does not invent descriptor lines, dates, cities, or airline names.
 */
export function buildTicketingRawTransactionBlock(
  group: InvoiceTicketGroupRecord,
): TicketingRawTransactionBlock {
  const pnrCode = group.pnrCode?.trim() ?? "";
  const rawItinerary = group.rawItinerary ?? "";
  // Normalize only newline style so Windows/Unix pastes render consistently;
  // do not trim, reorder, or rewrite line content.
  const normalized = rawItinerary.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const itineraryLines = normalized.length > 0 ? normalized.split("\n") : [];

  return {
    pnrCode,
    rawItinerary: normalized,
    itineraryLines,
  };
}
