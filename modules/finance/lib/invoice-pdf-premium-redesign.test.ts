import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  getDocumentBrandColor,
  getDocumentSafePdfTheme,
  getDocumentTint,
  isHighChromaDocumentColor,
} from "@/modules/finance/pdf/invoice-pdf-document-colors";
import { INVOICE_PDF_LABELS } from "@/modules/finance/pdf/invoice-pdf-labels";
import { buildInvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-data";
import { renderInvoicePdfBuffer } from "@/modules/finance/pdf/invoice-pdf-renderer";
import { invoiceTemplateRegistryKeys } from "@/modules/finance/pdf/invoice-template-registry";
import type { InvoiceRecord } from "@/modules/finance/types/invoices";

const PDF_ROOT = path.join(process.cwd(), "modules/finance/pdf");

function readPdfSource(relative: string): string {
  return readFileSync(path.join(PDF_ROOT, relative), "utf8");
}

function baseInvoice(overrides: Partial<InvoiceRecord> = {}): InvoiceRecord {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    organizationId: "22222222-2222-2222-2222-222222222222",
    recipientSource: "manual",
    customerId: null,
    bookingId: null,
    manualRecipientName: "Budi",
    manualRecipientCompany: null,
    manualRecipientPhone: null,
    manualRecipientEmail: null,
    manualRecipientAddress: null,
    manualRecipientTaxId: null,
    invoiceNumber: "INV/XAVIA/2026/0010",
    lifecycleStatus: "issued",
    paymentStatus: "unpaid",
    effectivePaymentStatus: "unpaid",
    currency: "IDR",
    issueDate: "2026-07-14",
    dueDate: "2026-07-21",
    subtotalMinor: 2_000_000,
    discountMinor: 0,
    taxMinor: 0,
    taxRateBps: 0,
    additionalFeesMinor: 0,
    totalMinor: 2_000_000,
    amountPaidMinor: 0,
    balanceDueMinor: 2_000_000,
    templateKey: "corporate",
    templateVersion: 2,
    themeSnapshot: {
      templateKey: "corporate",
      templateVersion: 2,
      primaryColor: "#00FF66",
      secondaryColor: "#64748B",
      accentColor: "#00E5FF",
    },
    companySnapshot: {
      legalName: "PT Xavia Mulya Semesta",
      logoUrl: null,
      address: "Jakarta",
      email: "hello@example.com",
      phone: null,
      website: null,
      taxId: null,
      paymentAccounts: [
        {
          id: "a1",
          bankName: "BCA",
          accountNumber: "1234567890",
          accountHolder: "PT Xavia Mulya Semesta",
          enabled: true,
          isDefault: true,
          sortOrder: 0,
        },
      ],
      primaryColor: "#00FF66",
      secondaryColor: "#64748B",
      accentColor: "#00E5FF",
      footerText: "Terima kasih",
    },
    customerSnapshot: {
      source: "manual",
      customer_id: null,
      name: "Budi",
      company: null,
      phone: null,
      email: null,
      address: null,
      tax_id: null,
    },
    bookingSnapshot: null,
    notes: null,
    paymentInstructions: null,
    terms: null,
    pdfStoragePath: null,
    pdfStatus: "ready",
    pdfGeneratedAt: null,
    pdfErrorCode: null,
    logoAssetPath: null,
    logoContentHash: null,
    issuedAt: "2026-07-14T01:00:00.000Z",
    sentAt: null,
    voidedAt: null,
    voidReason: null,
    createdBy: null,
    updatedBy: null,
    createdAt: "2026-07-14T00:00:00.000Z",
    updatedAt: "2026-07-14T00:00:00.000Z",
    items: [
      {
        id: "33333333-3333-3333-3333-333333333333",
        invoiceId: "11111111-1111-1111-1111-111111111111",
        description: "Paket Umroh",
        detail: null,
        quantity: 2,
        unit: "pax",
        unitPriceMinor: 1_000_000,
        discountMinor: 0,
        lineTotalMinor: 2_000_000,
        sortOrder: 0,
      },
    ],
    ...overrides,
  };
}

describe("FIN-001.3C premium redesign from first principles", () => {
  it("never shows internal DEFAULT label in customer payment PDF", () => {
    const payment = readPdfSource("shared/payment-information.tsx");
    assert.doesNotMatch(payment, /defaultAccount|isDefault|\bDEFAULT\b/);
    assert.doesNotMatch(payment, /\bisDefault\b|\bsortOrder\b|method enum/i);
    assert.doesNotMatch(payment, /account\.enabled|account\.isDefault/);
    assert.equal("defaultAccount" in INVOICE_PDF_LABELS, false);
  });

  it("Corporate has no diagonal decorative shapes or gradients", () => {
    const corporate = readPdfSource("templates/corporate.tsx");
    assert.doesNotMatch(corporate, /rotate\(|diagonal|gradient/i);
    assert.doesNotMatch(corporate, /transform:\s*["']rotate/);
    assert.match(corporate, /thin brand|brand accent|Restrained top brand/i);
    assert.doesNotMatch(corporate, /CompanyHeader/);
  });

  it("status appears only once in metadata (pill, not duplicated row)", () => {
    const recipient = readPdfSource("shared/recipient-block.tsx");
    assert.match(recipient, /StatusBadge/);
    assert.match(recipient, /status shown once/i);
    // No MetaRow for payment/status labels
    assert.doesNotMatch(
      recipient,
      /INVOICE_PDF_LABELS\.status[\s\S]{0,40}MetaRow|MetaRow[\s\S]{0,80}INVOICE_PDF_LABELS\.payment/,
    );
  });

  it("final line-item column label is Jumlah", () => {
    assert.equal(INVOICE_PDF_LABELS.lineAmount, "Jumlah");
    const table = readPdfSource("shared/invoice-items-table.tsx");
    assert.match(table, /INVOICE_PDF_LABELS\.lineAmount/);
  });

  it("payment section renders structured fields only", async () => {
    const payment = readPdfSource("shared/payment-information.tsx");
    assert.match(payment, /account\.bankName/);
    assert.match(payment, /account\.accountNumber/);
    assert.match(payment, /accountHolder|accountName/);
    assert.doesNotMatch(payment, /JSON\.stringify|borderRadius: 6/);
    const data = await buildInvoicePdfData(baseInvoice(), { mode: "issued" });
    assert.equal(data.company.paymentAccounts[0]?.bankName, "BCA");
    assert.equal(data.company.paymentAccounts[0]?.accountNumber, "1234567890");
  });

  it("document-safe color helpers reduce neon saturation", () => {
    assert.equal(isHighChromaDocumentColor("#00FF66"), true);
    const safe = getDocumentBrandColor("#00FF66");
    assert.equal(isHighChromaDocumentColor(safe), false);
    const theme = getDocumentSafePdfTheme({
      primaryColor: "#00FF66",
      accentColor: "#00E5FF",
      secondaryColor: "#64748B",
    });
    assert.equal(isHighChromaDocumentColor(theme.primaryColor), false);
    assert.match(getDocumentTint("#00FF66"), /^#/);
    assert.notEqual(theme.primaryColor, "#00FF66");
  });

  it("all templates remain visually distinct", () => {
    const calm = readPdfSource("templates/calm-standard.tsx");
    const corporate = readPdfSource("templates/corporate.tsx");
    const travel = readPdfSource("templates/travel-banner.tsx");
    const editorial = readPdfSource("templates/editorial-sidebar.tsx");
    assert.match(calm, /CompanyHeader/);
    assert.match(corporate, /structured branded header/i);
    assert.match(travel, /travel motif|route line/i);
    assert.doesNotMatch(travel, /rotate\(18deg\)|diagonal bands/i);
    assert.doesNotMatch(travel, /transform:\s*["']rotate/);
    assert.match(editorial, /pageWithSidebar|styles\.sidebar/);
  });

  it("short invoice composition stays balanced and multipage-safe for long invoices", async () => {
    const short = await buildInvoicePdfData(baseInvoice(), { mode: "issued" });
    assert.ok(short.theme.tint);
    assert.ok(!isHighChromaDocumentColor(short.theme.primaryColor));
    const shortPdf = await renderInvoicePdfBuffer(short);
    assert.ok(shortPdf.byteLength > 800);

    const items = Array.from({ length: 40 }, (_, index) => ({
      id: `33333333-3333-3333-3333-${String(index).padStart(12, "0")}`,
      invoiceId: "11111111-1111-1111-1111-111111111111",
      description: `Item ${index + 1}`,
      detail: null as string | null,
      quantity: 1,
      unit: "pax",
      unitPriceMinor: 100_000,
      discountMinor: 0,
      lineTotalMinor: 100_000,
      sortOrder: index,
    }));

    for (const key of invoiceTemplateRegistryKeys()) {
      const data = await buildInvoicePdfData(
        baseInvoice({
          templateKey: key,
          themeSnapshot: {
            templateKey: key,
            templateVersion: 2,
            primaryColor: "#0F172A",
            secondaryColor: "#64748B",
            accentColor: "#0F766E",
          },
          items,
          subtotalMinor: 4_000_000,
          totalMinor: 4_000_000,
          balanceDueMinor: 4_000_000,
        }),
        { mode: "issued" },
      );
      const pdf = await renderInvoicePdfBuffer(data);
      assert.equal(pdf.subarray(0, 5).toString("utf8"), "%PDF-");
      assert.ok(pdf.byteLength > 1500);
    }
  });

  it("template thumbnails reflect redesigned structures", () => {
    const thumb = readFileSync(
      path.join(
        process.cwd(),
        "modules/finance/components/invoice-template-thumbnail.tsx",
      ),
      "utf8",
    );
    assert.match(thumb, /Restrained header line|header line/);
    assert.match(thumb, /data-preview-layout="corporate-header"/);
    assert.match(thumb, /data-preview-layout="travel-banner"/);
    assert.match(thumb, /data-preview-layout="calm-header"/);
    assert.match(thumb, /data-preview-layout="editorial-sidebar"/);
    assert.doesNotMatch(thumb, /from-\[|bg-gradient|linear-gradient/);
  });
});
