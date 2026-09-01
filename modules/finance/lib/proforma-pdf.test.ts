import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { buildInvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-data";
import {
  invoicePdfVisibleHeading,
  isFin005ProformaPdf,
  neverHyphenatePdfWord,
  PROFORMA_PDF_HEADING_SIZE,
} from "@/modules/finance/pdf/invoice-pdf-labels";
import {
  buildProformaPdfData,
  officialInvoicePdfTitleUnchanged,
  PROFORMA_PDF_TITLE,
} from "@/modules/finance/pdf/proforma-pdf-data";
import { fixtureShortInvoice } from "@/modules/finance/pdf/fixtures/invoice-pdf-fixtures";
import type { ProformaRecord } from "@/modules/finance/types/proforma";

const PDF_ROOT = path.join(process.cwd(), "modules/finance/pdf");

function readPdf(relative: string): string {
  return readFileSync(path.join(PDF_ROOT, relative), "utf8");
}

function fixtureDraftProforma(
  overrides: Partial<ProformaRecord> = {},
): ProformaRecord {
  const invoice = fixtureShortInvoice();
  return {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    organizationId: invoice.organizationId,
    invoiceType: "package",
    recipientSource: "manual",
    customerId: null,
    bookingId: null,
    manualRecipientName: "Budi Santoso",
    manualRecipientCompany: "PT ABC",
    manualRecipientPhone: "+628121234567",
    manualRecipientEmail: "old@example.com",
    manualRecipientAddress: "Jakarta",
    manualRecipientTaxId: null,
    proformaNumber: "PI-2026-000001",
    lifecycleStatus: "draft",
    currency: "IDR",
    issueDate: "2026-09-01",
    dueDate: "2026-09-15",
    subtotalMinor: invoice.subtotalMinor,
    discountMinor: invoice.discountMinor,
    taxMinor: invoice.taxMinor,
    taxRateBps: invoice.taxRateBps,
    additionalFeesMinor: invoice.additionalFeesMinor,
    totalMinor: invoice.totalMinor,
    templateKey: "corporate",
    templateVersion: 2,
    themeSnapshot: invoice.themeSnapshot,
    companySnapshot: invoice.companySnapshot,
    customerSnapshot: {
      source: "manual",
      customer_id: null,
      name: "Budi Santoso",
      company: "PT ABC",
      phone: "+628121234567",
      email: "old@example.com",
      address: "Jakarta",
      tax_id: null,
    },
    bookingSnapshot: null,
    notes: null,
    paymentInstructions: null,
    terms: null,
    convertedInvoiceId: null,
    convertedInvoiceNumber: null,
    convertedAt: null,
    cancelledAt: null,
    cancelledBy: null,
    cancelReason: null,
    createdBy: null,
    updatedBy: null,
    createdAt: "2026-09-01T01:00:00.000Z",
    updatedAt: "2026-09-01T01:00:00.000Z",
    items: (invoice.items ?? []).map((item) => ({
      ...item,
      proformaId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    })),
    ...overrides,
  };
}

describe("FIN-005C Proforma customer PDF polish", () => {
  it("heading is PROFORMA INVOICE on a single unhyphenated line", async () => {
    const data = await buildProformaPdfData(fixtureDraftProforma());
    assert.equal(data.documentTitle, "PROFORMA INVOICE");
    assert.equal(PROFORMA_PDF_TITLE, "PROFORMA INVOICE");
    assert.equal(invoicePdfVisibleHeading(data), "PROFORMA INVOICE");
    assert.equal(PROFORMA_PDF_HEADING_SIZE, 16);
    assert.equal(PROFORMA_PDF_HEADING_SIZE < 24, true);
    assert.deepEqual(neverHyphenatePdfWord("PROFORMA"), ["PROFORMA"]);
    assert.deepEqual(neverHyphenatePdfWord("INVOICE"), ["INVOICE"]);
    assert.equal(isFin005ProformaPdf(data), true);
    assert.equal(
      isFin005ProformaPdf({ documentType: "proforma", invoiceType: "ticketing" }),
      false,
    );
  });

  it("package templates keep the Proforma title on one line", () => {
    const heading = readPdf("shared/document-heading.tsx");
    assert.match(heading, /wrap=\{!proforma\}/);
    assert.match(heading, /neverHyphenatePdfWord/);
    assert.match(heading, /PROFORMA_PDF_HEADING_SIZE/);
    assert.match(heading, /hyphenationCallback=\{proforma \? neverHyphenatePdfWord/);

    const meta = readPdf("shared/recipient-block.tsx");
    assert.match(meta, /DocumentHeading/);
    assert.match(meta, /width: 196/);

    const calm = readPdf("templates/calm-standard.tsx");
    assert.match(calm, /DocumentHeading/);
    assert.match(calm, /PDF_TYPE\.documentTitle \+ 2/);

    const editorial = readPdf("templates/editorial-sidebar.tsx");
    assert.match(editorial, /DocumentHeading/);

    const travel = readPdf("templates/travel-banner.tsx");
    assert.match(travel, /wrap=\{!isFin005ProformaPdf\(data\)\}/);
    assert.match(travel, /neverHyphenatePdfWord/);
  });

  it("FIN-005 Proforma PDF does not render Draft badge or DRAFT watermark", async () => {
    const data = await buildProformaPdfData(fixtureDraftProforma());
    assert.equal(data.showDraftWatermark, false);
    assert.equal(data.showDocumentStatusBadge, false);
    assert.equal(data.lifecycleStatus, "issued");
    assert.notEqual(data.paymentStatusLabel, "Draft");

    const meta = readPdf("shared/recipient-block.tsx");
    assert.match(meta, /showDocumentStatusBadge === false/);

    const templates = [
      "templates/calm-standard.tsx",
      "templates/corporate.tsx",
      "templates/editorial-sidebar.tsx",
      "templates/travel-banner.tsx",
    ];
    for (const relative of templates) {
      const src = readPdf(relative);
      assert.match(src, /showDraftWatermark/);
    }
  });

  it("PI reference remains visible and is not an INV number", async () => {
    const data = await buildProformaPdfData(fixtureDraftProforma());
    assert.equal(data.invoiceNumber, "PI-2026-000001");
    assert.match(data.invoiceNumber ?? "", /^PI-/);
    assert.equal(data.documentType, "proforma");

    const meta = readPdf("shared/recipient-block.tsx");
    assert.match(meta, /INVOICE_PDF_LABELS\.proformaNumber/);
    assert.match(meta, /INVOICE_PDF_LABELS\.issueDate/);
    assert.match(meta, /INVOICE_PDF_LABELS\.dueDate/);
  });

  it("official Invoice PDF still shows Draft watermark and status on drafts", async () => {
    const draft = await buildInvoicePdfData(fixtureShortInvoice(), {
      mode: "draft",
    });
    assert.equal(draft.documentType, "invoice");
    assert.equal(invoicePdfVisibleHeading(draft), "Invoice");
    assert.equal(officialInvoicePdfTitleUnchanged(), "Invoice");
    assert.equal(draft.showDraftWatermark, true);
    assert.equal(draft.showDocumentStatusBadge, true);

    const issued = await buildInvoicePdfData(fixtureShortInvoice(), {
      mode: "issued",
    });
    assert.equal(issued.showDraftWatermark, false);
    assert.equal(issued.showDocumentStatusBadge, true);
    assert.equal(isFin005ProformaPdf(issued), false);

    const calm = readPdf("templates/calm-standard.tsx");
    assert.match(calm, /invoiceFontSize=\{PDF_TYPE\.documentTitle \+ 2\}/);
    const ticketing = readPdf("templates/ticketing.tsx");
    assert.match(ticketing, /showDraftWatermark/);
  });
});
