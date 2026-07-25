/**
 * FIN-002D — Ticketing billing PDF + invoice payment history.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { PDFDocument } from "pdf-lib";

import { buildTicketingTransactionSummary } from "@/modules/finance/lib/ticketing-transaction-summary";
import {
  derivePaymentRequestNote,
  sumSuccessfulInvoicePayments,
} from "@/modules/finance/types/invoice-payments";
import { buildInvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-data";
import { invoiceDocumentTitle } from "@/modules/finance/pdf/invoice-pdf-labels";
import { renderInvoicePdfBuffer } from "@/modules/finance/pdf/invoice-pdf-renderer";
import {
  fixtureInvoicePayments,
  fixtureShortInvoice,
  fixtureTicketingFourSegmentRoundTrip,
  fixtureTicketingGroups,
  fixtureTicketingInvoice,
  fixtureTicketingTwelveSegments,
} from "@/modules/finance/pdf/fixtures/invoice-pdf-fixtures";

const MIGRATION = path.join(
  process.cwd(),
  "supabase/migrations/20260717120000_invoice_payments.sql",
);
const TEMPLATE = path.join(
  process.cwd(),
  "modules/finance/pdf/templates/ticketing.tsx",
);

describe("FIN-002D billing PDF structure", () => {
  const template = readFileSync(TEMPLATE, "utf8");

  it("ticketing PDF uses a raw transaction summary block", async () => {
    const groups = fixtureTicketingGroups();
    const summary = buildTicketingTransactionSummary(groups[0]!);
    assert.equal(summary.airlineLabel, "Ethiopian Airlines");
    assert.equal(summary.routeSummary, "Jakarta–Jeddah · Jeddah–Jakarta");
    assert.match(summary.routeCodes, /CGK/);
    assert.match(summary.routeCodes, /JED/);
    assert.equal(summary.passengerCount, 17);
    assert.equal(summary.pnrCode, "ABC123");
    assert.ok(summary.departureDateLabel);

    const data = await buildInvoicePdfData(fixtureTicketingInvoice(), {
      mode: "issued",
      ticketing: groups,
    });
    assert.ok(template.includes('data-transaction-summary="raw"'));
    assert.ok(template.includes("buildTicketingRawTransactionBlock"));
    assert.ok(template.includes('data-raw-itinerary="true"'));
    assert.equal(data.documentTitle, "INVOICE TIKET PESAWAT");
  });

  it("individual segments do not dominate the default PDF", async () => {
    assert.ok(template.includes('data-optional-itinerary-detail="false"'));
    assert.match(
      template,
      /includeItinerary[\s\S]*?FlightItinerary/,
    );
    const data = await buildInvoicePdfData(fixtureTicketingInvoice(), {
      mode: "issued",
      ticketing: fixtureTicketingFourSegmentRoundTrip(),
    });
    assert.equal(data.documentOptions.includeItineraryDetail, false);
    // Default path must not require rendering every segment as primary content.
    assert.ok(!template.includes('data-flight-segment="card"'));
  });

  it("route summary, PNR, pax, airline, and departure date render", () => {
    const summary = buildTicketingTransactionSummary(
      fixtureTicketingGroups()[0]!,
    );
    assert.ok(summary.routeSummary.length > 0);
    assert.ok(summary.lines.some((line) => line.includes("PNR")));
    assert.ok(summary.lines.some((line) => line.includes("17 pax")));
    assert.ok(summary.lines.some((line) => line.includes("Ethiopian")));
    assert.ok(summary.lines.some((line) => /Keberangkatan/.test(line)));
  });

  it("total invoice, received payments, and balance are distinct", async () => {
    const invoice = fixtureTicketingInvoice({
      amountPaidMinor: 50_000_000,
      balanceDueMinor: 193_100_000,
      paymentStatus: "partially_paid",
      paymentRequestNote: "Pelunasan",
    });
    const data = await buildInvoicePdfData(invoice, {
      mode: "issued",
      ticketing: fixtureTicketingGroups(),
      payments: fixtureInvoicePayments(),
    });
    assert.equal(data.totalMinor, 243_100_000);
    assert.equal(data.amountPaidMinor, 50_000_000);
    assert.equal(data.balanceDueMinor, 193_100_000);
    assert.ok(data.totalMinor > data.amountPaidMinor);
    assert.ok(data.amountPaidMinor > 0);
    assert.ok(data.balanceDueMinor > 0);
    assert.equal(data.paymentRequestNote, "Pelunasan");
    assert.ok(template.includes(INVOICE_PDF_LABELS_TOTAL_BILL_MARKER));
  });

  it("optional itinerary detail can be enabled", async () => {
    const data = await buildInvoicePdfData(fixtureTicketingInvoice(), {
      mode: "issued",
      ticketing: fixtureTicketingGroups(),
      includeItineraryDetail: true,
    });
    assert.equal(data.documentOptions.includeItineraryDetail, true);
    assert.ok(template.includes('data-optional-itinerary-detail="true"'));
  });

  it("default ticketing PDF remains one-page for the standard fixture", async () => {
    const data = await buildInvoicePdfData(
      fixtureTicketingInvoice({
        amountPaidMinor: 50_000_000,
        balanceDueMinor: 193_100_000,
      }),
      {
        mode: "issued",
        ticketing: fixtureTicketingFourSegmentRoundTrip(),
        payments: fixtureInvoicePayments(),
      },
    );
    const buffer = await renderInvoicePdfBuffer(data);
    const document = await PDFDocument.load(buffer);
    assert.equal(document.getPageCount(), 1);
  });

  it("package invoice PDF routing remains unchanged", async () => {
    assert.equal(invoiceDocumentTitle("package", "invoice"), "Invoice");
    const data = await buildInvoicePdfData(fixtureShortInvoice(), {
      mode: "issued",
    });
    assert.equal(data.invoiceType, "package");
    assert.equal(data.ticketing, null);
    const buffer = await renderInvoicePdfBuffer(data);
    const document = await PDFDocument.load(buffer);
    assert.equal(document.getPageCount(), 1);
  });

  it("long itineraries stay multipage-safe when detail is enabled", async () => {
    const data = await buildInvoicePdfData(fixtureTicketingInvoice(), {
      mode: "issued",
      ticketing: fixtureTicketingTwelveSegments(),
      includeItineraryDetail: true,
    });
    const buffer = await renderInvoicePdfBuffer(data);
    const document = await PDFDocument.load(buffer);
    assert.ok(document.getPageCount() >= 1 && document.getPageCount() <= 4);
  });
});

const INVOICE_PDF_LABELS_TOTAL_BILL_MARKER = "amountOutstanding";

describe("FIN-002D payment history model", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("successful payments contribute to received amount", () => {
    const received = sumSuccessfulInvoicePayments([
      { amountMinor: 10_000_000, status: "successful" },
      { amountMinor: 5_000_000, status: "successful" },
      { amountMinor: 2_000_000, status: "failed" },
      { amountMinor: 3_000_000, status: "reversed" },
      { amountMinor: 1_000_000, status: "pending" },
    ]);
    assert.equal(received, 15_000_000);
  });

  it("failed and reversed payments do not contribute", () => {
    assert.equal(
      sumSuccessfulInvoicePayments([
        { amountMinor: 9_000_000, status: "failed" },
        { amountMinor: 8_000_000, status: "reversed" },
      ]),
      0,
    );
  });

  it("payment history hides when empty", async () => {
    const data = await buildInvoicePdfData(fixtureTicketingInvoice(), {
      mode: "issued",
      ticketing: fixtureTicketingGroups(),
      payments: [],
    });
    assert.equal(data.payments.length, 0);
    const template = readFileSync(TEMPLATE, "utf8");
    assert.match(template, /if \(!data\.payments\.length\) return null/);
  });

  it("payment history renders when records exist", async () => {
    const data = await buildInvoicePdfData(
      fixtureTicketingInvoice({
        amountPaidMinor: 50_000_000,
        balanceDueMinor: 193_100_000,
      }),
      {
        mode: "issued",
        ticketing: fixtureTicketingGroups(),
        payments: fixtureInvoicePayments(),
      },
    );
    assert.equal(data.payments.length, 1);
    assert.equal(data.payments[0]!.paymentCode, "PAY-001");
    assert.equal(data.payments[0]!.status, "successful");
    assert.equal(data.payments[0]!.statusLabel, "Sukses");
  });

  it("payment records are organization-scoped at the SQL level", () => {
    assert.match(sql, /organization_id = public\.get_my_organization_id\(\)/);
    assert.match(sql, /invoice_payments_select_member/);
    assert.match(
      sql,
      /Invoice payment organization_id must match parent invoice/,
    );
  });

  it("payment record cannot move to another invoice", () => {
    assert.match(
      sql,
      /Invoice payments cannot be moved between invoices or organizations/,
    );
    assert.match(sql, /prevent_invoice_payment_parent_move/);
  });

  it("server recomputes paid totals from successful payments only", () => {
    assert.match(sql, /recompute_invoice_paid_from_payments/);
    assert.match(sql, /status = 'successful'/);
    assert.match(sql, /Successful payments exceed invoice total/);
    assert.match(sql, /record_invoice_payment/);
  });

  it("derives payment-request labels without changing totals", () => {
    assert.equal(
      derivePaymentRequestNote({
        totalMinor: 100,
        amountPaidMinor: 0,
        balanceDueMinor: 100,
      }),
      "Pembayaran penuh",
    );
    assert.equal(
      derivePaymentRequestNote({
        totalMinor: 100,
        amountPaidMinor: 40,
        balanceDueMinor: 60,
      }),
      "Pelunasan",
    );
    assert.equal(
      derivePaymentRequestNote({
        paymentRequestNote: "DP",
        totalMinor: 100,
        amountPaidMinor: 0,
        balanceDueMinor: 100,
      }),
      "Uang muka",
    );
  });
});
