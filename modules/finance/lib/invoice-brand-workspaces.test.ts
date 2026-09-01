import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { buildInvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-data";
import { invoicePdfVisibleHeading } from "@/modules/finance/pdf/invoice-pdf-labels";
import {
  formatBrandInvoiceNumber,
  freezeInvoiceBrandSnapshot,
  INVOICE_BRAND_NUMBERING_MODE,
  nextBrandSequenceNumber,
  normalizeBrandInvoicePrefix,
  readBrandSnapshot,
  assertUniqueActiveBrandPrefix,
  defaultInvoiceTitleForBrandKey,
  type InvoiceBrandProfile,
} from "@/modules/finance/lib/invoice-brand-profiles";
import {
  inheritXaviaSequenceLastNumber,
  invoiceCreatePath,
  invoiceMatchesBrandWorkspace,
  parseInvoiceBrandKey,
} from "@/modules/finance/lib/invoice-brand-workspaces";
import { formatProformaNumber } from "@/modules/finance/lib/proforma-lifecycle";
import type { InvoiceRecord } from "@/modules/finance/types/invoices";

const MIGRATION = path.join(
  process.cwd(),
  "supabase/migrations/20260901150000_brand_scoped_invoice_numbering.sql",
);
const FIN006 = path.join(
  process.cwd(),
  "supabase/migrations/20260901120000_invoice_brand_profiles.sql",
);

function baseInvoice(
  overrides: Partial<InvoiceRecord> = {},
): InvoiceRecord {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    organizationId: "22222222-2222-2222-2222-222222222222",
    invoiceType: "package",
    documentType: "invoice",
    recipientSource: "manual",
    customerId: null,
    bookingId: null,
    manualRecipientName: "Budi",
    manualRecipientCompany: null,
    manualRecipientPhone: null,
    manualRecipientEmail: null,
    manualRecipientAddress: null,
    manualRecipientTaxId: null,
    invoiceNumber: "INV/XAV/2026/0149",
    lifecycleStatus: "issued",
    paymentStatus: "unpaid",
    effectivePaymentStatus: "unpaid",
    currency: "IDR",
    issueDate: "2026-09-01",
    dueDate: "2026-09-08",
    subtotalMinor: 1000,
    discountMinor: 0,
    taxMinor: 0,
    taxRateBps: 0,
    additionalFeesMinor: 0,
    totalMinor: 1000,
    amountPaidMinor: 0,
    balanceDueMinor: 1000,
    templateKey: "calm-standard",
    templateVersion: 2,
    themeSnapshot: {
      templateKey: "calm-standard",
      templateVersion: 2,
      primaryColor: "#0F172A",
      secondaryColor: "#64748B",
      accentColor: "#0EA5E9",
    },
    companySnapshot: {
      legalName: "PT Xavia",
      logoUrl: null,
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
    customerSnapshot: { source: "manual", name: "Budi" },
    bookingSnapshot: null,
    notes: null,
    paymentInstructions: null,
    terms: null,
    pdfStoragePath: null,
    issuedAt: "2026-09-01T00:00:00.000Z",
    sentAt: null,
    voidedAt: null,
    voidReason: null,
    archivedAt: null,
    archivedBy: null,
    archiveReason: null,
    createdBy: null,
    updatedBy: null,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    items: [
      {
        id: "33333333-3333-3333-3333-333333333333",
        invoiceId: "11111111-1111-1111-1111-111111111111",
        description: "Paket",
        detail: null,
        quantity: 1,
        unit: "unit",
        unitPriceMinor: 1000,
        discountMinor: 0,
        lineTotalMinor: 1000,
        sortOrder: 0,
      },
    ],
    ...overrides,
  };
}

function profile(overrides: Partial<InvoiceBrandProfile> = {}): InvoiceBrandProfile {
  return {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    organizationId: "22222222-2222-2222-2222-222222222222",
    key: "xavia",
    name: "Xavia",
    displayName: "Xavia",
    legalName: "PT Xavia",
    logoPath: null,
    logoContentHash: null,
    logoStorageRef: null,
    primaryColor: "#0F172A",
    secondaryColor: "#64748B",
    accentColor: "#0EA5E9",
    address: null,
    email: null,
    phone: null,
    website: null,
    taxId: null,
    footerText: null,
    paymentAccountsJson: [],
    invoicePrefix: "INV/XAV",
    invoiceTitle: "INVOICE",
    isDefault: true,
    isActive: true,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("FIN-006A brand-scoped invoice workspaces", () => {
  it("Xavia list includes default and brand-null historical invoices", () => {
    const xaviaId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const consortiumId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    assert.equal(
      invoiceMatchesBrandWorkspace(
        { brandProfileId: null },
        { brandKey: "xavia", brandProfileId: xaviaId },
      ),
      true,
    );
    assert.equal(
      invoiceMatchesBrandWorkspace(
        { brandProfileId: xaviaId },
        { brandKey: "xavia", brandProfileId: xaviaId },
      ),
      true,
    );
    assert.equal(
      invoiceMatchesBrandWorkspace(
        { brandProfileId: consortiumId },
        { brandKey: "xavia", brandProfileId: xaviaId },
      ),
      false,
    );
  });

  it("Consortium list is exact-match only", () => {
    const xaviaId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const consortiumId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    assert.equal(
      invoiceMatchesBrandWorkspace(
        { brandProfileId: null },
        { brandKey: "consortium", brandProfileId: consortiumId },
      ),
      false,
    );
    assert.equal(
      invoiceMatchesBrandWorkspace(
        { brandProfileId: xaviaId },
        { brandKey: "consortium", brandProfileId: consortiumId },
      ),
      false,
    );
    assert.equal(
      invoiceMatchesBrandWorkspace(
        { brandProfileId: consortiumId },
        { brandKey: "consortium", brandProfileId: consortiumId },
      ),
      true,
    );
  });

  it("historical brand-null invoices stay on the Xavia workspace without mutation", () => {
    const repo = readFileSync(
      path.join(process.cwd(), "modules/finance/repositories/invoice-repository.ts"),
      "utf8",
    );
    assert.match(repo, /brand_profile_id\.is\.null/);
    assert.doesNotMatch(repo, /UPDATE[\s\S]*brand_profile_id[\s\S]*issued/);
  });

  it("Xavia and Consortium sequences are independent and inherit existing last_number", () => {
    assert.equal(INVOICE_BRAND_NUMBERING_MODE, "per_brand");
    const inherited = inheritXaviaSequenceLastNumber({
      existingOrgYearLastNumber: 148,
    });
    assert.equal(inherited.xaviaLastNumber, 148);
    assert.equal(inherited.consortiumLastNumber, 0);
    assert.equal(nextBrandSequenceNumber(inherited.xaviaLastNumber), 149);
    assert.equal(nextBrandSequenceNumber(inherited.consortiumLastNumber), 1);
    assert.equal(
      formatBrandInvoiceNumber({
        prefix: "INV/XAV",
        year: 2026,
        sequence: 149,
      }),
      "INV/XAV/2026/0149",
    );
    assert.equal(
      formatBrandInvoiceNumber({
        prefix: "INV/CON",
        year: 2026,
        sequence: 1,
      }),
      "INV/CON/2026/0001",
    );
  });

  it("issuing one brand does not increment the other sequence", () => {
    let xavia = 148;
    let consortium = 0;
    xavia = nextBrandSequenceNumber(xavia);
    assert.equal(xavia, 149);
    assert.equal(consortium, 0);
    consortium = nextBrandSequenceNumber(consortium);
    assert.equal(xavia, 149);
    assert.equal(consortium, 1);
  });

  it("invoice prefix and title come from the trusted brand profile", () => {
    assert.equal(normalizeBrandInvoicePrefix(" inv/xav "), "INV/XAV");
    assert.throws(() => normalizeBrandInvoicePrefix("INV"));
    assert.throws(() => normalizeBrandInvoicePrefix("INV/XAV/EXTRA/TOOLONGPREFIXVALUE"));
    const frozen = freezeInvoiceBrandSnapshot(
      profile({
        invoicePrefix: "INV/CON",
        invoiceTitle: "CONSORTIUM INVOICE",
        key: "consortium",
        name: "Consortium",
      }),
    );
    assert.equal(frozen.invoicePrefix, "INV/CON");
    assert.equal(frozen.invoiceTitle, "CONSORTIUM INVOICE");
    assert.doesNotThrow(() =>
      assertUniqueActiveBrandPrefix({
        profiles: [
          profile({ id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", invoicePrefix: "INV/XAV" }),
          profile({
            id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            key: "consortium",
            invoicePrefix: "INV/CON",
          }),
        ],
        profileId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        invoicePrefix: "INV/CON",
      }),
    );
    assert.throws(() =>
      assertUniqueActiveBrandPrefix({
        profiles: [
          profile({ id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", invoicePrefix: "INV/XAV" }),
          profile({
            id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            key: "consortium",
            invoicePrefix: "INV/CON",
          }),
        ],
        profileId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        invoicePrefix: "INV/XAV",
      }),
    );
  });

  it("issued snapshot freezes title so later brand edits do not change historical PDFs", async () => {
    const live = profile({ invoiceTitle: "CONSORTIUM INVOICE", key: "consortium" });
    const frozen = freezeInvoiceBrandSnapshot(live, "2026-09-01T01:00:00.000Z");
    live.invoiceTitle = "INVOICE CONSORTIUM";
    const reread = readBrandSnapshot(frozen);
    assert.equal(reread?.invoiceTitle, "CONSORTIUM INVOICE");

    const data = await buildInvoicePdfData(
      baseInvoice({
        brandSnapshot: frozen,
        invoiceNumber: "INV/CON/2026/0001",
      }),
      { mode: "issued" },
    );
    live.invoiceTitle = "CHANGED";
    assert.equal(data.documentTitle, "CONSORTIUM INVOICE");
    assert.equal(invoicePdfVisibleHeading(data), "CONSORTIUM INVOICE");
  });

  it("new Consortium documents use INVOICE while historical snapshots stay frozen", async () => {
    assert.equal(defaultInvoiceTitleForBrandKey("xavia"), "INVOICE");
    assert.equal(defaultInvoiceTitleForBrandKey("consortium"), "INVOICE");
    const live = freezeInvoiceBrandSnapshot(
      profile({ key: "consortium", invoiceTitle: "INVOICE" }),
    );
    const data = await buildInvoicePdfData(
      baseInvoice({
        brandSnapshot: live,
        invoiceNumber: "INV/CON/2026/0001",
      }),
      { mode: "issued" },
    );
    assert.equal(data.documentTitle, "INVOICE");
    const sql = readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20260901170000_consortium_invoice_title.sql",
      ),
      "utf8",
    );
    assert.match(sql, /invoice_title = 'INVOICE'/);
    assert.match(sql, /key = 'consortium'/);
    assert.doesNotMatch(sql, /UPDATE public\.invoices/);
    assert.doesNotMatch(sql, /brand_snapshot\s*=/);
  });

  it("create pages default to the brand from the workspace query", () => {
    assert.equal(parseInvoiceBrandKey("consortium"), "consortium");
    assert.equal(parseInvoiceBrandKey("nope"), "xavia");
    assert.equal(
      invoiceCreatePath({ brandKey: "xavia", type: "package" }),
      "/finance/invoices/new?type=package&brand=xavia",
    );
    assert.equal(
      invoiceCreatePath({ brandKey: "consortium", type: "package" }),
      "/finance/invoices/new?type=package&brand=consortium",
    );
    const page = readFileSync(
      path.join(process.cwd(), "app/(dashboard)/finance/invoices/new/page.tsx"),
      "utf8",
    );
    assert.match(page, /parseInvoiceBrandKey\(params\.brand\)/);
    assert.match(page, /brandProfileId: selectedBrandId/);
  });

  it("Proforma numbering stays independent PI sequences", () => {
    assert.equal(formatProformaNumber(2026, 1), "PI-2026-000001");
    const sql = readFileSync(MIGRATION, "utf8");
    assert.match(sql, /Proforma PI-YYYY-NNNNNN sequences are unchanged/);
    assert.doesNotMatch(sql, /UPDATE public\.proforma_sequences/);
  });

  it("settings page no longer stacks both brands or extra vertical padding", () => {
    const page = readFileSync(
      path.join(
        process.cwd(),
        "app/(dashboard)/finance/invoices/settings/page.tsx",
      ),
      "utf8",
    );
    const form = readFileSync(
      path.join(
        process.cwd(),
        "modules/finance/components/invoice-brand-settings-form.tsx",
      ),
      "utf8",
    );
    assert.doesNotMatch(page, /min-h-screen|h-screen|overflow-y-auto/);
    assert.doesNotMatch(page, /px-4 py-6/);
    assert.match(form, /role="tablist"/);
    assert.match(form, /brandNumberingHint/);
    assert.match(form, /selected \? \(/);
    assert.doesNotMatch(form, /listInvoiceTemplates/);
  });

  it("historical issued invoices without a brand key still render", async () => {
    const data = await buildInvoicePdfData(
      baseInvoice({
        brandSnapshot: null,
        brandProfileId: null,
        templateKey: "corporate",
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
    assert.equal(data.theme.templateKey, "corporate");
    assert.equal(data.documentTitle, "Invoice");
  });

  it("FIN-006 snapshots without invoiceTitle keep the historical Invoice heading", async () => {
    const data = await buildInvoicePdfData(
      baseInvoice({
        brandSnapshot: {
          id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          key: "xavia",
          name: "Xavia",
          displayName: "Xavia",
          legalName: "PT Xavia",
          logoUrl: null,
          logoPath: null,
          primaryColor: "#0F172A",
          secondaryColor: "#64748B",
          accentColor: "#0EA5E9",
          address: null,
          email: null,
          phone: null,
          website: null,
          taxId: null,
          footerText: null,
          paymentAccounts: [],
          fixedLayout: true,
          layoutKey: "calm-standard",
          snapshotAt: "2026-09-01T00:00:00.000Z",
        },
      }),
      { mode: "issued" },
    );
    assert.equal(data.documentTitle, "Invoice");
  });

  it("ticketing invoices keep the ticketing document title", async () => {
    const data = await buildInvoicePdfData(
      baseInvoice({
        invoiceType: "ticketing",
        brandSnapshot: freezeInvoiceBrandSnapshot(profile()),
      }),
      { mode: "issued" },
    );
    assert.equal(data.documentTitle, "INVOICE TIKET PESAWAT");
  });

  it("new migration allocates brand-scoped numbers without editing FIN-006", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    const original = readFileSync(FIN006, "utf8");
    assert.match(sql, /allocate_brand_invoice_number/);
    assert.match(sql, /invoice_sequences_org_brand_year_unique/);
    assert.match(sql, /p\.key = 'xavia'/);
    assert.match(sql, /INV\/XAV/);
    assert.match(sql, /INV\/CON/);
    assert.match(sql, /invoice_title/);
    assert.doesNotMatch(sql, /nextval\s*\(\s*'/);
    assert.match(sql, /FOR UPDATE/);
    assert.match(original, /Numbering remains workspace-shared/);
    assert.doesNotMatch(original, /allocate_brand_invoice_number/);
  });
});
