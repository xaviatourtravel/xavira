/**
 * FIN-002G — Final ticketing invoice layout polish.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { PDFDocument } from "pdf-lib";

import { buildInvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-data";
import {
  INVOICE_PDF_LABELS,
  invoiceDocumentTitle,
} from "@/modules/finance/pdf/invoice-pdf-labels";
import { renderInvoicePdfBuffer } from "@/modules/finance/pdf/invoice-pdf-renderer";
import {
  fixtureShortInvoice,
  fixtureTicketingFourSegmentRoundTrip,
  fixtureTicketingInvoice,
} from "@/modules/finance/pdf/fixtures/invoice-pdf-fixtures";

const TEMPLATE = path.join(
  process.cwd(),
  "modules/finance/pdf/templates/ticketing.tsx",
);
const LABELS = path.join(
  process.cwd(),
  "modules/finance/pdf/invoice-pdf-labels.ts",
);

describe("FIN-002G payment-request Item Tagihan column", () => {
  const template = readFileSync(TEMPLATE, "utf8");
  const labels = readFileSync(LABELS, "utf8");

  it("Kode Pembayaran no longer renders", () => {
    assert.ok(!template.includes("Kode Pembayaran"));
    assert.ok(!template.includes("Kode pembayaran"));
    assert.ok(!labels.includes('"Kode Pembayaran"'));
  });

  it("payment table first column is Item Tagihan", () => {
    assert.equal(INVOICE_PDF_LABELS.billItemName, "Item Tagihan");
    assert.ok(template.includes("INVOICE_PDF_LABELS.billItemName"));
    assert.ok(template.includes('data-payment-request-item="true"'));
  });

  it("item value comes from authoritative invoice items", () => {
    assert.ok(template.includes("resolveTicketingBillItemName"));
    assert.ok(template.includes("primaryBillItemName"));
  });

  it("invoice number is not repeated inside the payment table", () => {
    const block = template.slice(
      template.indexOf("function CurrentPaymentRequest"),
      template.indexOf("function HeaderCell"),
    );
    assert.ok(!block.includes("data.invoiceNumber"));
    assert.ok(!block.includes('?? "DRAFT"'));
    assert.ok(block.includes("primaryBillItemName(data)"));
  });

  it("payment table still has five columns", () => {
    assert.ok(template.includes('data-payment-request-columns="5"'));
  });
});

describe("FIN-002G layout polish contracts", () => {
  const template = readFileSync(TEMPLATE, "utf8");

  it("recipient empty fields are hidden", () => {
    assert.ok(template.includes("recipient.address?.trim()"));
    assert.ok(template.includes("recipient.taxId?.trim()"));
    assert.match(
      template,
      /contactDistinct[\s\S]*?name\.toLowerCase\(\) !== company\.toLowerCase\(\)/,
    );
    assert.ok(template.includes('data-recipient-section="true"'));
  });

  it("Ringkasan Transaksi shows PNR with raw itinerary (not duplicated as payment column)", () => {
    assert.ok(template.includes('data-transaction-summary="raw"'));
    assert.ok(template.includes('data-summary-line="pnr"'));
    assert.ok(!template.includes('data-payment-request-pnr="true"'));
  });

  it("financial rows align and optional zero rows hide correctly", () => {
    assert.ok(template.includes('data-financial-summary-row="true"'));
    assert.ok(template.includes('data-optional-zero-rows-hidden="true"'));
    assert.ok(template.includes("discountMinor > 0"));
    assert.ok(template.includes("additionalFeesMinor > 0"));
    assert.ok(template.includes('data-amount-outstanding="strong"'));
  });

  it("normal invoice remains one page structurally", async () => {
    const data = await buildInvoicePdfData(
      fixtureTicketingInvoice({
        amountPaidMinor: 50_000_000,
        balanceDueMinor: 193_100_000,
        paymentRequestNote: "Pembayaran penuh",
      }),
      {
        mode: "issued",
        ticketing: fixtureTicketingFourSegmentRoundTrip(),
      },
    );
    assert.equal(data.ticketing?.groups[0]?.pnrCode, "ABC123");
    const buffer = await renderInvoicePdfBuffer(data);
    const document = await PDFDocument.load(buffer);
    assert.equal(document.getPageCount(), 1);
  });

  it("package invoices remain unchanged", async () => {
    assert.equal(invoiceDocumentTitle("package", "invoice"), "Invoice");
    const data = await buildInvoicePdfData(fixtureShortInvoice(), {
      mode: "issued",
    });
    assert.equal(data.invoiceType, "package");
    assert.equal(data.ticketing, null);
  });

  it("preserves the approved Desklabs section order", () => {
    const order = [
      "CompanyHeader",
      "InvoiceIdentity",
      "RecipientSection",
      "CurrentPaymentRequest",
      "TransactionSummary",
      "FinancialSummary",
      "PaymentInformation",
      "InvoiceDocumentClose",
    ];
    let cursor = -1;
    for (const name of order) {
      const idx = template.indexOf(name, cursor + 1);
      assert.ok(idx > cursor, `expected ${name} after previous section`);
      cursor = idx;
    }
    assert.ok(!template.includes('data-spreadsheet-billing="true"'));
  });
});
