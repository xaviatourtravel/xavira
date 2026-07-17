import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  coercePaymentAccounts,
  createEmptyPaymentAccount,
  enabledPaymentAccountsForDocuments,
  invoicePaymentAccountsSchema,
  parsePaymentAccountsStrict,
  reorderPaymentAccounts,
  setDefaultPaymentAccount,
} from "@/modules/finance/lib/invoice-payment-accounts";
import {
  getInvoiceTemplateTicketId,
  invoiceTemplateRegistryKeys,
  listInvoiceTemplates,
  normalizeInvoiceTemplateKey,
  registerInvoiceTemplate,
} from "@/modules/finance/pdf/invoice-template-registry";
import { buildInvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-data";
import { renderInvoicePdfBuffer } from "@/modules/finance/pdf/invoice-pdf-renderer";
import { INVOICE_PDF_LABELS } from "@/modules/finance/pdf/invoice-pdf-labels";
import type { InvoiceRecord } from "@/modules/finance/types/invoices";
import { readFileSync } from "node:fs";
import path from "node:path";

function baseInvoice(overrides: Partial<InvoiceRecord> = {}): InvoiceRecord {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    organizationId: "22222222-2222-2222-2222-222222222222",
    recipientSource: "manual",
    customerId: null,
    bookingId: null,
    manualRecipientName: "Budi Santoso",
    manualRecipientCompany: "PT Panjang Sekali Namanya Untuk Uji Layout",
    manualRecipientPhone: "+6281234567890",
    manualRecipientEmail: "budi@example.com",
    manualRecipientAddress:
      "Jl. Sudirman No. 123, Gedung Perkantoran Lantai 18, Jakarta Pusat 10220, DKI Jakarta, Indonesia",
    manualRecipientTaxId: "10.20.30.40-567.000",
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
    templateVersion: 2,
    themeSnapshot: {
      templateKey: "calm-standard",
      templateVersion: 2,
      primaryColor: "#0F172A",
      secondaryColor: "#64748B",
      accentColor: "#0F766E",
    },
    companySnapshot: {
      legalName: "PT Xavia Mulya Semesta Travel Nusantara Internasional",
      tagline: "Perjalanan halal yang tenang",
      logoUrl: null,
      address:
        "Office Park Tower A Lt. 12, Jl. TB Simatupang Kav. 88, Jakarta Selatan 12560",
      email: "finance@xavia.example",
      phone: "+62211234567",
      website: "https://xavia.example",
      taxId: "01.234.567.8-901.000",
      paymentAccounts: [
        {
          id: "a1",
          method: "bank_transfer",
          bankName: "BCA",
          accountNumber: "1234567890",
          accountHolder: "PT Xavia Mulya Semesta",
          enabled: true,
          isDefault: true,
          sortOrder: 0,
        },
        {
          id: "a2",
          method: "bank_transfer",
          bankName: "Mandiri",
          accountNumber: "987654321",
          accountHolder: "PT Xavia Mulya Semesta",
          enabled: true,
          isDefault: false,
          sortOrder: 1,
        },
      ],
      primaryColor: "#0F172A",
      secondaryColor: "#64748B",
      accentColor: "#0F766E",
      footerText: "Terima kasih atas kepercayaan Anda.",
    },
    customerSnapshot: {
      source: "manual",
      customer_id: null,
      name: "Budi Santoso",
      company: "PT Panjang Sekali Namanya Untuk Uji Layout",
      phone: "+6281234567890",
      email: "budi@example.com",
      address:
        "Jl. Sudirman No. 123, Gedung Perkantoran Lantai 18, Jakarta Pusat 10220, DKI Jakarta, Indonesia",
      tax_id: "10.20.30.40-567.000",
    },
    bookingSnapshot: null,
    notes: "Catatan panjang untuk menguji wrapping teks pada dokumen invoice premium.",
    paymentInstructions: "Mohon cantumkan nomor invoice pada berita transfer.",
    terms: "Pembayaran tidak dapat dikembalikan setelah layanan dimulai.",
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
        description: "Paket Umroh Reguler",
        detail: "Double occupancy",
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

describe("FIN-001.3B payment accounts", () => {
  it("validates CRUD-shaped accounts and rejects duplicate defaults", () => {
    const accounts = [
      {
        ...createEmptyPaymentAccount(0),
        bankName: "BCA",
        accountNumber: "111",
        accountHolder: "PT A",
        isDefault: true,
      },
      {
        ...createEmptyPaymentAccount(1),
        bankName: "Mandiri",
        accountNumber: "222",
        accountHolder: "PT A",
        isDefault: true,
      },
    ];
    assert.equal(invoicePaymentAccountsSchema.safeParse(accounts).success, false);
  });

  it("requires at least one enabled account when list is non-empty", () => {
    const accounts = [
      {
        ...createEmptyPaymentAccount(0),
        bankName: "BCA",
        accountNumber: "111",
        accountHolder: "PT A",
        enabled: false,
        isDefault: false,
      },
    ];
    assert.equal(invoicePaymentAccountsSchema.safeParse(accounts).success, false);
  });

  it("coerces legacy JSON and sets a single default", () => {
    const coerced = coercePaymentAccounts([
      {
        bank_name: "BCA",
        account_number: "123",
        account_name: "PT Legacy",
        bank_code: "014",
      },
      {
        bankName: "Mandiri",
        accountNumber: "999",
        accountHolder: "PT Legacy",
        isDefault: true,
      },
    ]);
    assert.equal(coerced.length, 2);
    assert.equal(coerced.filter((account) => account.isDefault).length, 1);
    assert.equal(coerced[0]!.accountHolder || coerced[1]!.accountHolder, "PT Legacy");
  });

  it("reorders and sets default account", () => {
    const a = {
      ...createEmptyPaymentAccount(0),
      id: "1",
      bankName: "BCA",
      accountNumber: "1",
      accountHolder: "A",
      isDefault: true,
    };
    const b = {
      ...createEmptyPaymentAccount(1),
      id: "2",
      bankName: "MDR",
      accountNumber: "2",
      accountHolder: "A",
      isDefault: false,
    };
    const reordered = reorderPaymentAccounts([a, b], 0, 1);
    assert.equal(reordered[0]!.id, "2");
    assert.equal(reordered[1]!.id, "1");
    const withDefault = setDefaultPaymentAccount(reordered, "1");
    assert.equal(withDefault.find((row) => row.id === "1")?.isDefault, true);
    assert.equal(withDefault.find((row) => row.id === "2")?.isDefault, false);
  });

  it("document export only includes enabled accounts with default first", () => {
    const accounts = parsePaymentAccountsStrict([
      {
        id: "x",
        bankName: "Off",
        accountNumber: "0",
        accountHolder: "A",
        enabled: false,
        isDefault: false,
        sortOrder: 0,
      },
      {
        id: "y",
        bankName: "Second",
        accountNumber: "2",
        accountHolder: "A",
        enabled: true,
        isDefault: false,
        sortOrder: 1,
      },
      {
        id: "z",
        bankName: "Default",
        accountNumber: "1",
        accountHolder: "A",
        enabled: true,
        isDefault: true,
        sortOrder: 2,
      },
    ]);
    const enabled = enabledPaymentAccountsForDocuments(accounts);
    assert.equal(enabled.length, 2);
    assert.equal(enabled[0]!.bankName, "Default");
  });
});

describe("FIN-001.3B template registry", () => {
  it("exposes ticket ids 007–010 and registerInvoiceTemplate API", () => {
    const list = listInvoiceTemplates();
    assert.deepEqual(
      list
        .slice()
        .sort((a, b) => a.ticketId.localeCompare(b.ticketId))
        .map((item) => item.ticketId),
      ["007", "008", "009", "010"],
    );
    assert.equal(getInvoiceTemplateTicketId("corporate"), "007");
    assert.equal(getInvoiceTemplateTicketId("editorial-sidebar"), "008");
    assert.equal(getInvoiceTemplateTicketId("calm-standard"), "009");
    assert.equal(getInvoiceTemplateTicketId("travel-banner"), "010");
    assert.equal(typeof registerInvoiceTemplate, "function");
    assert.equal(normalizeInvoiceTemplateKey("classic"), "calm-standard");
    assert.deepEqual(invoiceTemplateRegistryKeys().sort(), [
      "calm-standard",
      "corporate",
      "editorial-sidebar",
      "travel-banner",
    ]);
  });
});

describe("FIN-001.3B premium PDF finalization", () => {
  it("renders all four templates with multiple accounts and long identity", async () => {
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
        }),
        { mode: "issued" },
      );
      assert.equal(data.company.paymentAccounts.length, 2);
      assert.equal(data.paymentStatus, "unpaid");
      assert.ok(data.company.legalName.length > 20);
      assert.ok((data.recipient.address ?? "").length > 40);
      const pdf = await renderInvoicePdfBuffer(data);
      assert.ok(pdf.byteLength > 1200);
    }
  });

  it("renders large invoices without throwing", async () => {
    const items = Array.from({ length: 50 }, (_, index) => ({
      id: `33333333-3333-3333-3333-3333333333${String(index).padStart(2, "0")}`.slice(0, 36),
      invoiceId: "11111111-1111-1111-1111-111111111111",
      sortOrder: index,
      description: `Item perjalanan ${index + 1}`,
      detail: "Detail panjang untuk menguji page break dan header berulang.",
      quantity: 1,
      unit: "pax",
      unitPriceMinor: 100_000,
      discountMinor: 0,
      lineTotalMinor: 100_000,
    }));
    const data = await buildInvoicePdfData(
      baseInvoice({
        items,
        subtotalMinor: 5_000_000,
        totalMinor: 5_000_000,
        balanceDueMinor: 5_000_000,
      }),
      { mode: "issued" },
    );
    assert.equal(data.items.length, 50);
    const pdf = await renderInvoicePdfBuffer(data);
    assert.ok(pdf.byteLength > 3000);
  });

  it("payment cards, totals, footer, and status badge exist in shared components", () => {
    const payment = readFileSync(
      path.join(process.cwd(), "modules/finance/pdf/shared/payment-information.tsx"),
      "utf8",
    );
    const summary = readFileSync(
      path.join(process.cwd(), "modules/finance/pdf/shared/payment-summary.tsx"),
      "utf8",
    );
    const recipient = readFileSync(
      path.join(process.cwd(), "modules/finance/pdf/shared/recipient-block.tsx"),
      "utf8",
    );
    const table = readFileSync(
      path.join(process.cwd(), "modules/finance/pdf/shared/invoice-items-table.tsx"),
      "utf8",
    );
    assert.match(payment, /bankTransfer|paymentInformation/);
    assert.match(payment, /thankYou/);
    assert.match(summary, /fontSize: PDF_TYPE\.amountEmphasis|amountEmphasis|fontSize: 1[46]/);
    assert.match(summary, /balanceDue/);
    assert.match(recipient, /borderRadius: 999/);
    assert.match(recipient, /paymentBadgeColors/);
    assert.match(table, /fixed/);
    assert.match(table, /wrap=\{false\}/);
    assert.equal(INVOICE_PDF_LABELS.paymentInformation, "Informasi pembayaran");
  });

  it("editorial sidebar fills identity and payment summary", () => {
    const sidebar = readFileSync(
      path.join(process.cwd(), "modules/finance/pdf/shared/company-header.tsx"),
      "utf8",
    );
    assert.match(sidebar, /tagline/);
    assert.match(sidebar, /paymentAccounts/);
    assert.match(sidebar, /NPWP/);
  });

  it("travel banner remains the hero template with destination motif", () => {
    const travel = readFileSync(
      path.join(process.cwd(), "modules/finance/pdf/templates/travel-banner.tsx"),
      "utf8",
    );
    assert.match(travel, /travel motif|route line/i);
    assert.match(travel, /muted banner|bannerBg|tint/i);
  });
});
