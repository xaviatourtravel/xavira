import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  companyInitialsForPdf,
  FORBIDDEN_ENGLISH_PDF_LABELS,
  formatInvoicePdfLifecycleStatus,
  formatInvoicePdfPaymentStatus,
  INVOICE_PDF_LABELS,
} from "@/modules/finance/pdf/invoice-pdf-labels";
import { buildInvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-data";
import { renderInvoicePdfBuffer } from "@/modules/finance/pdf/invoice-pdf-renderer";
import { invoiceTemplateRegistryKeys } from "@/modules/finance/pdf/invoice-template-registry";
import type { InvoiceRecord } from "@/modules/finance/types/invoices";

const PDF_ROOT = path.join(process.cwd(), "modules/finance/pdf");
const THUMBNAIL = path.join(
  process.cwd(),
  "modules/finance/components/invoice-template-thumbnail.tsx",
);

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
    invoiceNumber: "INV/XAV/2026/0009",
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
    templateKey: "calm-standard",
    templateVersion: 1,
    themeSnapshot: {
      templateKey: "calm-standard",
      templateVersion: 1,
      primaryColor: "#0F172A",
      secondaryColor: "#64748B",
      accentColor: "#0EA5E9",
    },
    companySnapshot: {
      legalName: "Xavia Travel Nusantara",
      logoUrl: null,
      address: "Jakarta",
      email: "hello@example.com",
      phone: null,
      website: null,
      taxId: null,
      paymentAccounts: [
        {
          bankName: "BCA",
          accountNumber: "1234567890",
          accountName: "Xavia Travel",
          bankCode: "014",
        },
      ],
      primaryColor: "#0F172A",
      secondaryColor: "#64748B",
      accentColor: "#0EA5E9",
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
    notes: "Catatan uji",
    paymentInstructions: "Transfer sebelum jatuh tempo",
    terms: "Tidak dapat dikembalikan",
    pdfStoragePath: null,
    pdfStatus: "ready",
    pdfGeneratedAt: null,
    pdfErrorCode: null,
    logoAssetPath: null,
    logoContentHash: null,
    issuedAt: "2026-07-14T00:00:00.000Z",
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

function readPdfSource(relative: string): string {
  return readFileSync(path.join(PDF_ROOT, relative), "utf8");
}

describe("FIN-001.2D Indonesian PDF localization", () => {
  it("exposes Indonesian customer labels", () => {
    assert.equal(INVOICE_PDF_LABELS.billTo, "Ditagihkan kepada");
    assert.equal(INVOICE_PDF_LABELS.number, "Nomor invoice");
    assert.equal(INVOICE_PDF_LABELS.balanceDue, "Sisa pembayaran");
    assert.equal(INVOICE_PDF_LABELS.paymentInformation, "Informasi pembayaran");
  });

  it("maps statuses without raw enums", () => {
    assert.equal(formatInvoicePdfLifecycleStatus("issued"), "Terbit");
    assert.equal(formatInvoicePdfLifecycleStatus("void"), "Dibatalkan");
    assert.equal(formatInvoicePdfPaymentStatus("unpaid"), "Belum dibayar");
    assert.equal(formatInvoicePdfPaymentStatus("paid"), "Lunas");
    assert.equal(formatInvoicePdfPaymentStatus("partially_paid"), "Dibayar sebagian");
  });

  it("buildInvoicePdfData never returns raw English payment labels or enums", async () => {
    const data = await buildInvoicePdfData(baseInvoice(), { mode: "issued" });
    assert.equal(data.lifecycleStatusLabel, "Terbit");
    assert.equal(data.paymentStatusLabel, "Belum dibayar");
    assert.doesNotMatch(data.paymentStatusLabel, /unpaid|paid|overdue/i);
    assert.doesNotMatch(data.lifecycleStatusLabel, /issued|sent|void|draft/i);
  });

  it("shared sources do not keep forbidden English skeleton labels", () => {
    const sources = [
      readPdfSource("shared/recipient-block.tsx"),
      readPdfSource("shared/payment-summary.tsx"),
      readPdfSource("shared/payment-information.tsx"),
      readPdfSource("shared/invoice-items-table.tsx"),
    ].join("\n");
    for (const label of FORBIDDEN_ENGLISH_PDF_LABELS) {
      assert.equal(
        sources.includes(`"${label}"`) || sources.includes(`'${label}'`),
        false,
        `unexpected English label: ${label}`,
      );
    }
  });
});

describe("FIN-001.2D layout polish", () => {
  it("travel-banner does not duplicate company identity below banner", () => {
    const src = readPdfSource("templates/travel-banner.tsx");
    assert.match(src, /Full-width branded travel banner/);
    assert.doesNotMatch(src, /CompanyHeader/);
    assert.match(src, /LogoMark/);
  });

  it("corporate and editorial keep structurally distinct layouts", () => {
    const calm = readPdfSource("templates/calm-standard.tsx");
    const corporate = readPdfSource("templates/corporate.tsx");
    const travel = readPdfSource("templates/travel-banner.tsx");
    const editorial = readPdfSource("templates/editorial-sidebar.tsx");
    assert.match(calm, /CompanyHeader/);
    assert.match(corporate, /structured branded header/i);
    assert.doesNotMatch(corporate, /CompanyHeader/);
    assert.match(travel, /route line|Travel motif|travel motif/i);
    assert.match(editorial, /pageWithSidebar|styles\.sidebar/);
  });

  it("payment summary hides zero optional rows and separates total/balance", () => {
    const src = readPdfSource("shared/payment-summary.tsx");
    assert.match(src, /discountMinor > 0/);
    assert.match(src, /taxMinor > 0/);
    assert.match(src, /additionalFeesMinor > 0/);
    assert.match(src, /amountPaidMinor > 0/);
    assert.match(src, /INVOICE_PDF_LABELS\.total/);
    assert.match(src, /INVOICE_PDF_LABELS\.balanceDue/);
    // Distinct layout blocks
    assert.match(src, /borderTopWidth: 1/);
    assert.ok(src.indexOf("Total invoice") === -1 || src.includes("INVOICE_PDF_LABELS.total"));
  });

  it("payment accounts render structured fields, not JSON dumps", async () => {
    const src = readPdfSource("shared/payment-information.tsx");
    assert.match(src, /account\.bankName/);
    assert.match(src, /account\.accountNumber/);
    assert.match(src, /account\.accountName|account\.accountHolder/);
    assert.doesNotMatch(src, /JSON\.stringify|paymentAccounts\}/);
    const data = await buildInvoicePdfData(baseInvoice(), { mode: "issued" });
    assert.equal(data.company.paymentAccounts[0]?.bankName, "BCA");
    assert.equal(
      data.company.paymentAccounts[0]?.bankCode ||
        data.company.paymentAccounts[0]?.swiftCode,
      "014",
    );
  });

  it("empty payment/notes/terms sections are hidden", () => {
    const src = readPdfSource("shared/payment-information.tsx");
    assert.match(src, /if \(accounts\.length === 0 && !hasInstructions\) return null/);
    assert.match(src, /if \(!notes && !terms\) return null/);
  });

  it("missing logo fallback still renders meaningful initials", async () => {
    assert.equal(companyInitialsForPdf("Xavia Travel Nusantara"), "XTN");
    assert.equal(companyInitialsForPdf("Xavia"), "XAV");
    const data = await buildInvoicePdfData(baseInvoice(), { mode: "issued" });
    assert.equal(data.company.logo?.kind, "initials");
    if (data.company.logo?.kind === "initials") {
      assert.ok(data.company.logo.initials.length >= 2);
      assert.ok(data.company.logo.initials.length <= 3);
    }
  });

  it("all four templates render multipage-safe PDF buffers", async () => {
    const manyItems = Array.from({ length: 28 }, (_, index) => ({
      id: `33333333-3333-3333-3333-${String(index).padStart(12, "0")}`,
      invoiceId: "11111111-1111-1111-1111-111111111111",
      description: `Item ${index + 1}`,
      detail: null,
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
            templateVersion: 1,
            primaryColor: "#0F172A",
            secondaryColor: "#64748B",
            accentColor: "#0EA5E9",
          },
          items: manyItems,
          subtotalMinor: 2_800_000,
          totalMinor: 2_800_000,
          balanceDueMinor: 2_800_000,
        }),
        { mode: "issued" },
      );
      const buffer = await renderInvoicePdfBuffer(data);
      assert.equal(buffer.subarray(0, 5).toString("utf8"), "%PDF-");
      assert.ok(buffer.length > 1000);
    }
  });
});

describe("FIN-001.2D template picker thumbnails", () => {
  it("exposes distinct preview structures per template", () => {
    const src = readFileSync(THUMBNAIL, "utf8");
    assert.match(src, /data-template-preview=/);
    assert.match(src, /data-preview-layout="calm-header"/);
    assert.match(src, /data-preview-layout="corporate-header"/);
    assert.match(src, /data-preview-layout="travel-banner"/);
    assert.match(src, /data-preview-layout="editorial-sidebar"/);
    assert.match(src, /data-preview-region="banner"/);
    assert.match(src, /data-preview-region="sidebar"/);
    assert.match(src, /data-preview-region="table"/);
    assert.match(src, /data-preview-region="totals"/);
  });
});
