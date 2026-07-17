import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  getReadableForeground,
  getSafeInvoiceTheme,
  isValidHexColor,
  normalizeHexColor,
} from "@/modules/finance/lib/invoice-theme-colors";
import { getDocumentSafePdfTheme } from "@/modules/finance/pdf/invoice-pdf-document-colors";
import {
  createInvoiceDraftSchema,
  invoiceBrandSettingsUpdateSchema,
} from "@/modules/finance/schemas/invoices";
import {
  getInvoiceTemplateDefinition,
  invoiceTemplateRegistryKeys,
  listInvoiceTemplates,
  normalizeInvoiceTemplateKey,
} from "@/modules/finance/pdf/invoice-template-registry";
import {
  isPdfMagicBytes,
  sanitizeInvoicePdfFileName,
} from "@/modules/finance/pdf/invoice-pdf-renderer";
import { buildInvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-data";
import { renderInvoicePdfBuffer } from "@/modules/finance/pdf/invoice-pdf-renderer";
import type { InvoiceRecord } from "@/modules/finance/types/invoices";

const MIGRATION_PATH = path.join(
  process.cwd(),
  "supabase/migrations/20260714030000_invoice_pdf_templates.sql",
);

function baseInvoice(overrides: Partial<InvoiceRecord> = {}): InvoiceRecord {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    organizationId: "22222222-2222-2222-2222-222222222222",
    recipientSource: "manual",
    customerId: null,
    bookingId: null,
    manualRecipientName: "Budi Santoso",
    manualRecipientCompany: null,
    manualRecipientPhone: "+62812",
    manualRecipientEmail: null,
    manualRecipientAddress: null,
    manualRecipientTaxId: null,
    invoiceNumber: null,
    lifecycleStatus: "draft",
    paymentStatus: "unpaid",
    effectivePaymentStatus: "unpaid",
    currency: "IDR",
    issueDate: "2026-07-14",
    dueDate: "2026-07-21",
    subtotalMinor: 2_400_000,
    discountMinor: 0,
    taxMinor: 0,
    taxRateBps: 0,
    additionalFeesMinor: 0,
    totalMinor: 2_400_000,
    amountPaidMinor: 0,
    balanceDueMinor: 2_400_000,
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
      legalName: "Xavia Tour",
      logoUrl: null,
      address: "Jakarta",
      email: "hello@example.com",
      phone: null,
      website: null,
      taxId: null,
      paymentAccounts: [],
      primaryColor: "#0F172A",
      secondaryColor: "#64748B",
      accentColor: "#0EA5E9",
      footerText: "Thank you",
    },
    customerSnapshot: {
      source: "manual",
      customer_id: null,
      name: "Budi Santoso",
      company: null,
      phone: "+62812",
      email: null,
      address: null,
      tax_id: null,
    },
    bookingSnapshot: null,
    notes: null,
    paymentInstructions: null,
    terms: null,
    pdfStoragePath: null,
    pdfStatus: "not_generated",
    pdfGeneratedAt: null,
    pdfErrorCode: null,
    pdfGenerationToken: null,
    pdfGenerationClaimedAt: null,
    logoAssetPath: null,
    logoContentHash: null,
    issuedAt: null,
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
        quantity: 1,
        unit: "pax",
        unitPriceMinor: 2_400_000,
        discountMinor: 0,
        lineTotalMinor: 2_400_000,
        sortOrder: 0,
      },
    ],
    ...overrides,
  };
}

describe("invoice template registry", () => {
  it("all four template keys resolve", () => {
    assert.deepEqual(invoiceTemplateRegistryKeys(), [
      "calm-standard",
      "corporate",
      "travel-banner",
      "editorial-sidebar",
    ]);
    for (const key of invoiceTemplateRegistryKeys()) {
      assert.equal(getInvoiceTemplateDefinition(key).key, key);
    }
    assert.equal(listInvoiceTemplates().length, 4);
  });

  it("unknown template falls back safely", () => {
    assert.equal(normalizeInvoiceTemplateKey("classic"), "calm-standard");
    assert.equal(normalizeInvoiceTemplateKey("nope"), "calm-standard");
  });

  it("template registry contains no arbitrary executable database path", () => {
    for (const template of listInvoiceTemplates()) {
      assert.equal("pdfComponentPath" in template, false);
      assert.equal("componentPath" in template, false);
    }
  });
});

describe("invoice color safety", () => {
  it("valid colors normalize correctly", () => {
    assert.equal(normalizeHexColor("#0ea5e9"), "#0EA5E9");
    assert.equal(isValidHexColor("#FFFFFF"), true);
  });

  it("malformed color strings are rejected", () => {
    assert.throws(() => normalizeHexColor("rgb(0,0,0)"));
    assert.throws(() => normalizeHexColor("url(https://x)"));
    assert.throws(() => normalizeHexColor("#GGG"));
  });

  it("readable foreground works for light and dark colors", () => {
    assert.equal(getReadableForeground("#FFFFFF"), "#0F172A");
    assert.equal(getReadableForeground("#0F172A"), "#FFFFFF");
    const theme = getSafeInvoiceTheme({
      primaryColor: "#EEEEEE",
      accentColor: "#111111",
    });
    assert.equal(theme.primaryForeground, "#0F172A");
    assert.equal(theme.accentForeground, "#FFFFFF");
  });
});

describe("invoice PDF data and rendering", () => {
  it("manual recipient renders", async () => {
    const data = await buildInvoicePdfData(baseInvoice(), { mode: "draft" });
    assert.equal(data.recipient.source, "manual");
    assert.equal(data.recipient.name, "Budi Santoso");
    assert.equal(data.showDraftWatermark, true);
    assert.equal(data.invoiceNumber, null);
  });

  it("linked Customer recipient renders", async () => {
    const data = await buildInvoicePdfData(
      baseInvoice({
        recipientSource: "linked_customer",
        customerId: "44444444-4444-4444-4444-444444444444",
        customerName: "Siti",
        customerSnapshot: {
          source: "linked_customer",
          customer_id: "44444444-4444-4444-4444-444444444444",
          name: "Siti Linked",
          company: null,
          phone: null,
          email: null,
          address: null,
          tax_id: null,
        },
        manualRecipientName: null,
      }),
      { mode: "issued" },
    );
    assert.equal(data.recipient.source, "linked_customer");
    assert.equal(data.recipient.name, "Siti Linked");
  });

  it("optional Booking block renders only when present", async () => {
    const without = await buildInvoicePdfData(baseInvoice(), { mode: "draft" });
    assert.equal(without.booking, null);

    const withBooking = await buildInvoicePdfData(
      baseInvoice({
        bookingSnapshot: {
          bookingId: "55555555-5555-5555-5555-555555555555",
          bookingCode: "BK-1",
          packageName: "Umroh Plus",
          departureDate: "2026-09-01",
          participantCount: 2,
          leadTraveller: "Budi",
          totalAmountMinor: 5_000_000,
        },
      }),
      { mode: "draft" },
    );
    assert.equal(withBooking.booking?.bookingCode, "BK-1");
  });

  it("empty optional fields do not render in normalized payment accounts", async () => {
    const data = await buildInvoicePdfData(
      baseInvoice({
        companySnapshot: {
          legalName: "Xavia",
          logoUrl: null,
          address: null,
          email: null,
          phone: null,
          website: null,
          taxId: null,
          paymentAccounts: [{ bankName: "", accountNumber: "" }],
          primaryColor: "#0F172A",
          secondaryColor: "#64748B",
          accentColor: "#0EA5E9",
          footerText: null,
        },
      }),
      { mode: "draft" },
    );
    assert.equal(data.company.paymentAccounts.length, 0);
  });

  it("large IDR values and 20+ items do not silently truncate", async () => {
    const items = Array.from({ length: 22 }, (_, index) => ({
      id: `33333333-3333-3333-3333-${String(index).padStart(12, "0")}`,
      invoiceId: "11111111-1111-1111-1111-111111111111",
      description: `Item ${index + 1} with a reasonably long description for wrapping`,
      detail: "Detail ".repeat(8),
      quantity: 1,
      unit: "unit",
      unitPriceMinor: 12_345_678,
      discountMinor: 0,
      lineTotalMinor: 12_345_678,
      sortOrder: index,
    }));
    const data = await buildInvoicePdfData(
      baseInvoice({
        items,
        subtotalMinor: 12_345_678 * 22,
        totalMinor: 12_345_678 * 22,
        balanceDueMinor: 12_345_678 * 22,
      }),
      { mode: "draft" },
    );
    assert.equal(data.items.length, 22);
    const buffer = await renderInvoicePdfBuffer(data);
    assert.equal(isPdfMagicBytes(buffer), true);
    assert.ok(buffer.length > 1000);
  });

  it("issued PDF uses snapshots, not live customer names", async () => {
    const data = await buildInvoicePdfData(
      baseInvoice({
        lifecycleStatus: "issued",
        invoiceNumber: "INV/XAVIA/2026/0002",
        customerName: "Changed Live Name",
        customerSnapshot: {
          source: "manual",
          customer_id: null,
          name: "Frozen Snapshot Name",
          company: null,
          phone: null,
          email: null,
          address: null,
          tax_id: null,
        },
        themeSnapshot: {
          templateKey: "corporate",
          templateVersion: 1,
          primaryColor: "#111111",
          secondaryColor: "#222222",
          accentColor: "#333333",
        },
      }),
      { mode: "issued" },
    );
    assert.equal(data.recipient.name, "Frozen Snapshot Name");
    assert.equal(data.theme.templateKey, "corporate");
    // PDF presentation derives document-safe brand color (does not mutate snapshot).
    assert.equal(
      data.theme.primaryColor,
      getDocumentSafePdfTheme({ primaryColor: "#111111" }).primaryColor,
    );
    assert.equal(data.invoiceNumber, "INV/XAVIA/2026/0002");
    assert.equal(data.showDraftWatermark, false);
  });

  it("draft preview has DRAFT watermark and no invoice number", async () => {
    const data = await buildInvoicePdfData(
      baseInvoice({ invoiceNumber: "SHOULD_NOT_SHOW" }),
      { mode: "draft" },
    );
    assert.equal(data.showDraftWatermark, true);
    assert.equal(data.invoiceNumber, null);
  });

  it("missing logo falls back safely and unsupported logo does not crash", async () => {
    const data = await buildInvoicePdfData(
      baseInvoice({
        companySnapshot: {
          legalName: "Xavia Tour",
          logoUrl: "https://evil.example/logo.png",
          address: null,
          email: null,
          phone: null,
          website: null,
          taxId: null,
          paymentAccounts: [],
          primaryColor: "#0F172A",
          secondaryColor: "#64748B",
          accentColor: "#0EA5E9",
          footerText: null,
        },
      }),
      { mode: "draft" },
    );
    assert.ok(data.company.logo);
    assert.equal(data.company.logo?.kind, "initials");
    const buffer = await renderInvoicePdfBuffer(data);
    assert.equal(isPdfMagicBytes(buffer), true);
  });

  it("download filename is sanitized", () => {
    assert.equal(
      sanitizeInvoicePdfFileName("INV/XAVIA/2026/0002", "issued"),
      "INV-XAVIA-2026-0002.pdf",
    );
    assert.equal(sanitizeInvoicePdfFileName(null, "draft"), "invoice-draft.pdf");
  });

  it("generated PDF begins with valid PDF magic bytes", async () => {
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
        }),
        { mode: "draft" },
      );
      const buffer = await renderInvoicePdfBuffer(data);
      assert.equal(isPdfMagicBytes(buffer), true);
    }
  });
});

describe("draft branding persistence schemas", () => {
  it("configured workspace default / per-invoice template override persists in draft schema", () => {
    const draft = createInvoiceDraftSchema.parse({
      recipientSource: "manual",
      manualRecipientName: "Budi",
      templateKey: "travel-banner",
      primaryColor: "#112233",
      items: [{ description: "x", quantity: 1, unitPriceMinor: 1000 }],
    });
    assert.equal(draft.templateKey, "travel-banner");
    assert.equal(draft.primaryColor, "#112233");
  });

  it("invoice brand settings accept invoice-only fields", () => {
    const parsed = invoiceBrandSettingsUpdateSchema.parse({
      defaultTemplateKey: "calm-standard",
      footerText: "Thanks",
      primaryColor: "#112233",
      legalName: "Should Not Persist Via Invoice Settings",
    });
    assert.equal(parsed.defaultTemplateKey, "calm-standard");
    assert.equal(parsed.footerText, "Thanks");
    assert.equal("primaryColor" in parsed, false);
    assert.equal("legalName" in parsed, false);
  });
});

describe("FIN-001.2 migration contracts", () => {
  const sql = readFileSync(MIGRATION_PATH, "utf8");

  it("adds pdf status fields and private bucket", () => {
    assert.match(sql, /pdf_status/);
    assert.match(sql, /invoice-pdfs/);
    assert.match(sql, /PDF_GENERATED/);
    assert.match(sql, /pdf_generation_token/);
    assert.match(sql, /logo_asset_path/);
  });

  it("freezes draft theme on issue and does not take caller theme", () => {
    assert.match(sql, /build_invoice_theme_snapshot_from_invoice/);
    assert.match(sql, /issue_invoice\(\s*p_invoice_id uuid\s*\)/);
    assert.doesNotMatch(sql, /p_theme_snapshot|p_template_key/);
  });

  it("PDF failure leaves commercial issue path intact", () => {
    assert.match(sql, /pdf_status = 'not_generated'/);
    assert.match(sql, /fail_invoice_pdf_generation/);
  });
});

describe("FIN-001.2B legacy template migration vs issued immutability", () => {
  const sql = readFileSync(MIGRATION_PATH, "utf8");
  const domainSql = readFileSync(
    path.join(
      process.cwd(),
      "supabase/migrations/20260714000000_create_invoice_domain.sql",
    ),
    "utf8",
  );

  it("migration backfill only targets lifecycle_status = draft", () => {
    assert.match(
      sql,
      /UPDATE public\.invoices\s+SET template_key = 'calm-standard'\s+WHERE lifecycle_status = 'draft'/,
    );
    // Must not contain an unconstrained classic/null backfill on all invoices.
    assert.doesNotMatch(
      sql,
      /UPDATE public\.invoices\s+SET template_key = 'calm-standard'\s+WHERE template_key IS NULL/,
    );
  });

  it("issued classic invoice is not updated by migration", () => {
    const draftOnly = sql.match(
      /UPDATE public\.invoices\s+SET template_key = 'calm-standard'[\s\S]*?;/,
    )?.[0];
    assert.ok(draftOnly);
    assert.match(draftOnly, /lifecycle_status = 'draft'/);
    assert.doesNotMatch(draftOnly, /lifecycle_status IN/);
    assert.doesNotMatch(draftOnly, /issued|sent|void/);
  });

  it("issued classic resolves to Calm Standard without rewriting rows", () => {
    assert.equal(normalizeInvoiceTemplateKey("classic"), "calm-standard");
    assert.equal(
      getInvoiceTemplateDefinition("classic").name,
      "Calm Standard",
    );
    assert.match(sql, /WHEN lower\(trim\(COALESCE\(p_key, ''\)\)\) = 'classic' THEN 'calm-standard'/);
  });

  it("unknown template resolves to Calm Standard", () => {
    assert.equal(normalizeInvoiceTemplateKey("nope"), "calm-standard");
    assert.equal(normalizeInvoiceTemplateKey(null), "calm-standard");
  });

  it("new drafts default to calm-standard", () => {
    assert.match(sql, /ALTER COLUMN template_key SET DEFAULT 'calm-standard'/);
    assert.match(
      sql,
      /ALTER COLUMN default_template_key SET DEFAULT 'calm-standard'/,
    );
    assert.equal(
      createInvoiceDraftSchema.parse({
        recipientSource: "manual",
        manualRecipientName: "Budi",
        items: [{ description: "x", quantity: 1, unitPriceMinor: 1000 }],
      }).templateKey,
      "calm-standard",
    );
  });

  it("issued commercial immutability remains active", () => {
    assert.match(domainSql, /prevent_issued_invoice_commercial_edit/);
    assert.match(domainSql, /NEW\.template_key IS DISTINCT FROM OLD\.template_key/);
    assert.match(domainSql, /Issued invoices cannot be commercially edited/);
  });

  it("migration contains no global trigger disable or commercial trusted bypass", () => {
    assert.doesNotMatch(sql, /DISABLE\s+TRIGGER/i);
    assert.doesNotMatch(sql, /session_replication_role/i);
    // trusted_invoice_pdf may be set for PDF fields / issue_invoice only —
    // must not wrap the draft template backfill.
    const beforePdfSection = sql.slice(
      0,
      sql.indexOf("PDF generation status"),
    );
    assert.doesNotMatch(beforePdfSection, /set_config\(\s*'app\.trusted/);
  });

  it("CHECK allows legacy classic while new keys remain valid", () => {
    assert.match(
      sql,
      /invoices_template_key_check[\s\S]*'classic'/,
    );
  });
});

describe("linked and manual recipient draft schemas still pass", () => {
  it("keeps FIN-001.1 create shapes", () => {
    assert.equal(
      createInvoiceDraftSchema.parse({
        recipientSource: "linked_customer",
        customerId: "11111111-1111-1111-1111-111111111111",
        items: [{ description: "x", quantity: 1, unitPriceMinor: 1000 }],
      }).recipientSource,
      "linked_customer",
    );
    assert.equal(
      createInvoiceDraftSchema.parse({
        recipientSource: "manual",
        manualRecipientName: "Budi",
        items: [{ description: "x", quantity: 1, unitPriceMinor: 1000 }],
      }).recipientSource,
      "manual",
    );
  });
});
