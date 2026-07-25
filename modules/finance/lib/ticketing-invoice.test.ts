import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { buildInvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-data";
import { renderInvoicePdfBuffer } from "@/modules/finance/pdf/invoice-pdf-renderer";
import { invoiceDocumentTitle } from "@/modules/finance/pdf/invoice-pdf-labels";
import {
  createInvoiceDraftSchema,
} from "@/modules/finance/schemas/invoices";
import {
  createTicketingDraftSchema,
} from "@/modules/finance/schemas/ticketing";
import {
  fixtureShortInvoice,
  fixtureTicketingGroups,
  fixtureTicketingInvoice,
} from "@/modules/finance/pdf/fixtures/invoice-pdf-fixtures";
import type { InvoiceTicketGroupRecord } from "@/modules/finance/types/ticketing";

const UUID_A = "44444444-4444-4444-4444-444444444444";

function baseTicketingPayload(overrides: Record<string, unknown> = {}) {
  return {
    recipientSource: "manual",
    manualRecipientName: "Budi Santoso",
    documentType: "invoice",
    ticketGroup: {
      pnrCode: "ABC123",
      passengerCount: 2,
      tripType: "round_trip",
      segments: [
        {
          direction: "outbound",
          segmentOrder: 0,
          airlineCode: "ET",
          flightNumber: "629",
          departureAirport: "CGK",
          arrivalAirport: "ADD",
        },
      ],
    },
    pricing: { pricePerPassengerMinor: 14_300_000 },
    ...overrides,
  };
}

// -------------------------------------------------------------------------
// Invoice & document type model (static / schema guarantees)
// -------------------------------------------------------------------------
describe("FIN-002 invoice & document type", () => {
  it("existing invoices default safely to package", () => {
    const parsed = createInvoiceDraftSchema.parse({
      recipientSource: "manual",
      manualRecipientName: "Budi",
      items: [{ description: "Jasa", quantity: 1, unit: "unit", unitPriceMinor: 100 }],
    });
    assert.equal(parsed.invoiceType, "package");
    assert.equal(parsed.documentType, "invoice");
  });

  it("package draft does not require ticket data", () => {
    assert.doesNotThrow(() =>
      createInvoiceDraftSchema.parse({
        recipientSource: "manual",
        manualRecipientName: "Budi",
        items: [
          { description: "Jasa", quantity: 1, unit: "unit", unitPriceMinor: 100 },
        ],
      }),
    );
  });

  it("maps customer-facing document titles", () => {
    assert.equal(invoiceDocumentTitle("package", "invoice"), "Invoice");
    assert.equal(invoiceDocumentTitle("package", "proforma"), "Proforma Invoice");
    assert.equal(
      invoiceDocumentTitle("ticketing", "invoice"),
      "INVOICE TIKET PESAWAT",
    );
    assert.equal(
      invoiceDocumentTitle("ticketing", "proforma"),
      "PROFORMA INVOICE TIKET PESAWAT",
    );
  });
});

// -------------------------------------------------------------------------
// Ticketing draft validation (schema guarantees)
// -------------------------------------------------------------------------
describe("FIN-002 ticketing validation", () => {
  it("accepts a well-formed ticketing draft", () => {
    assert.doesNotThrow(() =>
      createTicketingDraftSchema.parse(baseTicketingPayload()),
    );
  });

  it("requires a ticket group", () => {
    const payload = baseTicketingPayload();
    delete (payload as Record<string, unknown>).ticketGroup;
    assert.throws(() => createTicketingDraftSchema.parse(payload));
  });

  it("requires at least one flight segment", () => {
    const payload = baseTicketingPayload({
      ticketGroup: {
        pnrCode: "ABC123",
        passengerCount: 2,
        tripType: "one_way",
        segments: [],
      },
    });
    assert.throws(() => createTicketingDraftSchema.parse(payload));
  });

  it("rejects identical departure and arrival airports", () => {
    const payload = baseTicketingPayload({
      ticketGroup: {
        pnrCode: "ABC123",
        passengerCount: 1,
        tripType: "one_way",
        segments: [
          {
            direction: "outbound",
            segmentOrder: 0,
            airlineCode: "ET",
            flightNumber: "629",
            departureAirport: "CGK",
            arrivalAirport: "CGK",
          },
        ],
      },
    });
    assert.throws(() => createTicketingDraftSchema.parse(payload));
  });

  it("requires a positive passenger count", () => {
    const payload = baseTicketingPayload({
      ticketGroup: {
        pnrCode: "ABC123",
        passengerCount: 0,
        tripType: "one_way",
        segments: [
          {
            direction: "outbound",
            segmentOrder: 0,
            airlineCode: "ET",
            flightNumber: "629",
            departureAirport: "CGK",
            arrivalAirport: "ADD",
          },
        ],
      },
    });
    assert.throws(() => createTicketingDraftSchema.parse(payload));
  });

  it("supports linked-customer recipients", () => {
    assert.doesNotThrow(() =>
      createTicketingDraftSchema.parse(
        baseTicketingPayload({
          recipientSource: "linked_customer",
          customerId: UUID_A,
          manualRecipientName: undefined,
        }),
      ),
    );
  });
});

// -------------------------------------------------------------------------
// Ticketing PDF data (derives from persisted rows, not raw GDS)
// -------------------------------------------------------------------------
describe("FIN-002 ticketing PDF data", () => {
  it("package invoices carry no ticketing data and an Invoice title", async () => {
    const data = await buildInvoicePdfData(fixtureShortInvoice(), {
      mode: "issued",
    });
    assert.equal(data.invoiceType, "package");
    assert.equal(data.ticketing, null);
    assert.equal(data.documentTitle, "Invoice");
  });

  it("issued PDF derives ticketing from frozen ticket rows", async () => {
    const groups = fixtureTicketingGroups();
    const data = await buildInvoicePdfData(fixtureTicketingInvoice(), {
      mode: "issued",
      ticketing: groups,
    });
    assert.equal(data.invoiceType, "ticketing");
    assert.equal(data.documentTitle, "INVOICE TIKET PESAWAT");
    assert.ok(data.ticketing);
    assert.equal(data.ticketing!.groups[0]!.pnrCode, "ABC123");
    assert.equal(data.ticketing!.groups[0]!.segments.length, 4);
  });

  it("renders enabled structured payment accounts", async () => {
    const data = await buildInvoicePdfData(fixtureTicketingInvoice(), {
      mode: "issued",
      ticketing: fixtureTicketingGroups(),
    });
    assert.ok(data.company.paymentAccounts.length >= 1);
    assert.equal(data.company.paymentAccounts[0]!.bankName, "BCA");
  });

  it("proforma ticketing renders a proforma title", async () => {
    const data = await buildInvoicePdfData(
      fixtureTicketingInvoice({ documentType: "proforma" }),
      { mode: "draft", ticketing: fixtureTicketingGroups() },
    );
    assert.equal(data.documentTitle, "PROFORMA INVOICE TIKET PESAWAT");
  });
});

// -------------------------------------------------------------------------
// Ticketing PDF render (structure / multipage safety)
// -------------------------------------------------------------------------
describe("FIN-002 ticketing PDF render", () => {
  it("renders a valid PDF for the four-segment sample", async () => {
    const data = await buildInvoicePdfData(fixtureTicketingInvoice(), {
      mode: "issued",
      ticketing: fixtureTicketingGroups(),
    });
    const buffer = await renderInvoicePdfBuffer(data);
    assert.ok(buffer.length > 1000);
    assert.equal(buffer.subarray(0, 4).toString("ascii"), "%PDF");
  });

  it("stays multipage-safe with 12+ segments", async () => {
    const many: InvoiceTicketGroupRecord[] = fixtureTicketingGroups();
    const template = many[0]!.segments[0]!;
    many[0]!.segments = Array.from({ length: 12 }, (_, i) => ({
      ...template,
      id: `77777777-7777-7777-7777-${String(i).padStart(12, "0")}`,
      segmentOrder: i,
      direction: i % 2 === 0 ? "outbound" : "return",
    }));
    const data = await buildInvoicePdfData(fixtureTicketingInvoice(), {
      mode: "issued",
      ticketing: many,
    });
    const buffer = await renderInvoicePdfBuffer(data);
    assert.ok(buffer.length > 1000);
    assert.equal(buffer.subarray(0, 4).toString("ascii"), "%PDF");
  });
});

// -------------------------------------------------------------------------
// Static source guarantees where no live Postgres harness exists
// -------------------------------------------------------------------------
describe("FIN-002 static guarantees", () => {
  it("customer PDF may render persisted raw itinerary in Ringkasan Transaksi", () => {
    const ticketing = readFileSync(
      path.join(process.cwd(), "modules/finance/pdf/templates/ticketing.tsx"),
      "utf8",
    );
    assert.ok(ticketing.includes("buildTicketingRawTransactionBlock"));
    assert.ok(ticketing.includes('data-transaction-summary="raw"'));
    assert.ok(ticketing.includes('data-raw-itinerary="true"'));
    // Optional parsed itinerary component must still not print rawSegment.
    const itinerary = readFileSync(
      path.join(
        process.cwd(),
        "modules/finance/pdf/shared/flight-itinerary.tsx",
      ),
      "utf8",
    );
    assert.ok(!/\brawSegment\b/.test(itinerary));
    assert.ok(!/\brawItinerary\b/.test(itinerary));
  });

  it("migration enforces tenant security and immutability at the DB level", () => {
    const sql = readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20260717000000_invoice_ticketing.sql",
      ),
      "utf8",
    );
    // RLS enabled on both child tables
    assert.match(sql, /invoice_ticket_groups\s+ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /invoice_flight_segments\s+ENABLE ROW LEVEL SECURITY/);
    // Cross-organization reference guards
    assert.match(sql, /validate_ticket_group_refs/);
    assert.match(sql, /validate_flight_segment_refs/);
    // Immutability after issue
    assert.match(sql, /prevent_issued_ticket_group_edit/);
    assert.match(sql, /prevent_issued_flight_segment_edit/);
    // Issue-time validation of ticketing invoices
    assert.match(sql, /validate_ticketing_invoice_on_issue/);
    // invoice_type / document_type columns
    assert.match(sql, /invoice_type/);
    assert.match(sql, /document_type/);
  });
});
