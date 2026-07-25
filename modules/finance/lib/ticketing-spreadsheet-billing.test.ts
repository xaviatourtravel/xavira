/**
 * FIN-002F / FIN-002G — Desklabs ticketing billing layout contracts.
 *
 * FIN-002G supersedes the spreadsheet-heavy experiment: the approved
 * INV-XAVIA-2026-0015 Desklabs structure is the source of truth.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { PDFDocument } from "pdf-lib";

import { buildTicketingBillingItemDescription } from "@/modules/finance/lib/ticketing-transaction-summary";
import { buildInvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-data";
import { invoiceDocumentTitle } from "@/modules/finance/pdf/invoice-pdf-labels";
import { renderInvoicePdfBuffer } from "@/modules/finance/pdf/invoice-pdf-renderer";
import {
  fixtureInvoicePayments,
  fixtureShortInvoice,
  fixtureTicketingFourSegmentRoundTrip,
  fixtureTicketingGroups,
  fixtureTicketingInvoice,
} from "@/modules/finance/pdf/fixtures/invoice-pdf-fixtures";

const TEMPLATE = path.join(
  process.cwd(),
  "modules/finance/pdf/templates/ticketing.tsx",
);
const PACKAGE_TEMPLATES = [
  "modules/finance/pdf/templates/calm-standard.tsx",
  "modules/finance/pdf/templates/corporate.tsx",
  "modules/finance/pdf/templates/travel-banner.tsx",
  "modules/finance/pdf/templates/editorial-sidebar.tsx",
];

describe("FIN-002F/G Desklabs billing structure", () => {
  const template = readFileSync(TEMPLATE, "utf8");

  it("ticketing billing uses the Desklabs section structure", () => {
    assert.ok(template.includes('data-desklabs-billing="true"'));
    assert.ok(!template.includes('data-spreadsheet-billing="true"'));
    assert.ok(template.includes("CompanyHeader"));
    assert.ok(template.includes("InvoiceIdentity"));
    assert.ok(template.includes("RecipientSection"));
    assert.ok(template.includes("CurrentPaymentRequest"));
    assert.ok(template.includes("TransactionSummary"));
    assert.ok(template.includes("FinancialSummary"));
    assert.ok(template.includes("PaymentInformation"));
  });

  it("keeps a right-aligned financial summary (not spreadsheet-only)", () => {
    assert.ok(template.includes('marginLeft:'));
    assert.ok(
      template.includes('data-financial-summary-style="right-aligned"'),
    );
    assert.ok(template.includes('data-amount-outstanding="strong"'));
  });

  it("current payment request has five columns with Item Tagihan first", () => {
    assert.ok(template.includes('data-payment-request-columns="5"'));
    assert.ok(template.includes("INVOICE_PDF_LABELS.billItemName"));
    assert.ok(template.includes("INVOICE_PDF_LABELS.amountDueNow"));
    assert.ok(template.includes("INVOICE_PDF_LABELS.issueDate"));
    assert.ok(template.includes("INVOICE_PDF_LABELS.dueDate"));
    assert.ok(template.includes("INVOICE_PDF_LABELS.paymentNote"));
  });

  it("transaction summary uses raw itinerary, not spreadsheet item columns", () => {
    assert.ok(template.includes('data-transaction-summary="raw"'));
    assert.ok(!template.includes('data-transaction-details="true"'));
    assert.ok(!template.includes("buildTicketingBillingItemDescription"));
  });

  it("financial summary hides zero-value optional rows", () => {
    assert.ok(template.includes("discountMinor > 0"));
    assert.ok(template.includes("additionalFeesMinor > 0"));
    assert.ok(template.includes('data-optional-zero-rows-hidden="true"'));
  });

  it("payment history has six columns when records exist", async () => {
    assert.ok(template.includes('data-payment-history-columns="6"'));
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
    assert.equal(data.payments[0]!.statusLabel, "Sukses");
  });

  it("payment history hides when empty", async () => {
    const data = await buildInvoicePdfData(fixtureTicketingInvoice(), {
      mode: "issued",
      ticketing: fixtureTicketingGroups(),
      payments: [],
    });
    assert.equal(data.payments.length, 0);
    assert.match(template, /if \(!data\.payments\.length\) return null/);
  });

  it("payment accounts render as labeled rows, not cards", () => {
    assert.ok(template.includes('data-payment-accounts-style="labeled-rows"'));
    assert.ok(template.includes("<PaymentInformation"));
    assert.ok(!template.includes("No. Rek:"));
  });

  it("route summary remains concise", () => {
    const description = buildTicketingBillingItemDescription(
      fixtureTicketingGroups()[0]!,
    );
    assert.match(description, /Ethiopian Airlines/);
    assert.match(description, /Jakarta–Jeddah · Jeddah–Jakarta/);
    assert.ok(!description.includes("ADD"));
  });

  it("every flight segment is omitted from the default billing PDF", () => {
    assert.ok(template.includes('data-optional-itinerary-detail="false"'));
    const defaultPage = template.slice(
      0,
      template.indexOf("{includeItinerary ? ("),
    );
    assert.ok(!defaultPage.includes("<FlightItinerary"));
    assert.ok(defaultPage.includes("<TransactionSummary"));
  });

  it("optional itinerary detail still works", async () => {
    assert.ok(template.includes('data-optional-itinerary-detail="true"'));
    const data = await buildInvoicePdfData(fixtureTicketingInvoice(), {
      mode: "issued",
      ticketing: fixtureTicketingFourSegmentRoundTrip(),
      includeItineraryDetail: true,
    });
    assert.equal(data.documentOptions.includeItineraryDetail, true);
    const buffer = await renderInvoicePdfBuffer(data);
    const document = await PDFDocument.load(buffer);
    assert.ok(document.getPageCount() >= 1);
  });

  it("normal invoice structurally targets one page", async () => {
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

  it("package PDFs remain unchanged", async () => {
    assert.equal(invoiceDocumentTitle("package", "invoice"), "Invoice");
    for (const relative of PACKAGE_TEMPLATES) {
      const source = readFileSync(path.join(process.cwd(), relative), "utf8");
      assert.ok(!source.includes("data-desklabs-billing"));
      assert.ok(!source.includes("data-spreadsheet-billing"));
      assert.ok(!source.includes("Permintaan pembayaran saat ini"));
    }
    const data = await buildInvoicePdfData(fixtureShortInvoice(), {
      mode: "issued",
    });
    assert.equal(data.invoiceType, "package");
    assert.equal(data.ticketing, null);
    const buffer = await renderInvoicePdfBuffer(data);
    const document = await PDFDocument.load(buffer);
    assert.equal(document.getPageCount(), 1);
  });
});
