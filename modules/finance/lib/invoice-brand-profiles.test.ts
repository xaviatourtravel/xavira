import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  companySnapshotFromBrand,
  DEFAULT_INVOICE_BRAND_KEY,
  FIXED_PACKAGE_INVOICE_LAYOUT_KEY,
  freezeInvoiceBrandSnapshot,
  INVOICE_BRAND_PROFILE_KEYS,
  readBrandSnapshot,
  summarizeBrandPaymentAccounts,
  themeSnapshotFromBrand,
  usesFixedPackageInvoiceLayout,
  type InvoiceBrandProfile,
} from "@/modules/finance/lib/invoice-brand-profiles";
import { createInvoiceDraftSchema } from "@/modules/finance/schemas/invoices";
import { parseDraftPayloadFromFormData } from "@/modules/finance/lib/parse-invoice-draft-form";

const MIGRATION = path.join(
  process.cwd(),
  "supabase/migrations/20260901120000_invoice_brand_profiles.sql",
);

function fixtureProfile(
  overrides: Partial<InvoiceBrandProfile> = {},
): InvoiceBrandProfile {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    organizationId: "22222222-2222-2222-2222-222222222222",
    key: "xavia",
    name: "Xavia",
    displayName: "Xavia",
    legalName: "PT Xavia",
    logoPath: null,
    logoContentHash: null,
    logoStorageRef: "storage://workspace-brand-assets/org/logo/aa.png",
    primaryColor: "#0F172A",
    secondaryColor: "#64748B",
    accentColor: "#0EA5E9",
    address: "Jakarta",
    email: "finance@xavia.test",
    phone: "+62811",
    website: "https://xavia.test",
    taxId: "10.0.1.3-000",
    footerText: "Thank you",
    paymentAccountsJson: [
      {
        id: "bank-1",
        method: "bank_transfer",
        bankName: "BCA",
        accountNumber: "1234567890",
        accountHolder: "PT Xavia",
        branch: null,
        swiftCode: null,
        notes: null,
        enabled: true,
        isDefault: true,
        sortOrder: 0,
      },
    ],
    invoicePrefix: "INV/XAV",
    invoiceTitle: "INVOICE",
    isDefault: true,
    isActive: true,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("FIN-006 finance brand profiles", () => {
  it("defaults new package invoices to a brand, not a template", () => {
    assert.equal(FIXED_PACKAGE_INVOICE_LAYOUT_KEY, "calm-standard");
    assert.equal(DEFAULT_INVOICE_BRAND_KEY, "xavia");
    assert.deepEqual([...INVOICE_BRAND_PROFILE_KEYS], ["xavia", "consortium"]);

    const parsed = createInvoiceDraftSchema.parse({
      recipientSource: "manual",
      manualRecipientName: "Budi",
      brandProfileId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      items: [{ description: "Paket", quantity: 1, unitPriceMinor: 1000 }],
    });
    assert.equal(parsed.brandProfileId, "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    assert.equal(parsed.templateKey, "calm-standard");
  });

  it("brand selection persists on draft form save", () => {
    const form = new FormData();
    form.set("recipient_source", "manual");
    form.set("manual_recipient_name", "Budi");
    form.set("brand_profile_id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    form.set("discount_minor", "0");
    const parsed = parseDraftPayloadFromFormData(form, [
      { description: "Paket", quantity: 1, unitPriceMinor: 1000 },
    ]);
    assert.equal(parsed.brandProfileId, "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    assert.equal(parsed.templateKey, "calm-standard");
    assert.equal("primaryColor" in parsed, false);
  });

  it("selected brand affects company identity and payment output", () => {
    const xavia = freezeInvoiceBrandSnapshot(fixtureProfile());
    const consortium = freezeInvoiceBrandSnapshot(
      fixtureProfile({
        id: "33333333-3333-3333-3333-333333333333",
        key: "consortium",
        name: "Consortium",
        displayName: "Consortium",
        legalName: "PT Consortium",
        footerText: "Consortium footer",
        paymentAccountsJson: [
          {
            id: "bank-2",
            method: "bank_transfer",
            bankName: "Mandiri",
            accountNumber: "9876543210",
            accountHolder: "PT Consortium",
            branch: null,
            swiftCode: null,
            notes: null,
            enabled: true,
            isDefault: true,
            sortOrder: 0,
          },
        ],
      }),
    );

    const xaviaCompany = companySnapshotFromBrand(xavia);
    const consortiumCompany = companySnapshotFromBrand(consortium);
    assert.equal(xaviaCompany.legalName, "PT Xavia");
    assert.equal(consortiumCompany.legalName, "PT Consortium");
    assert.equal(xaviaCompany.footerText, "Thank you");
    assert.equal(consortiumCompany.footerText, "Consortium footer");
    assert.match(summarizeBrandPaymentAccounts(xavia.paymentAccounts), /BCA/);
    assert.match(
      summarizeBrandPaymentAccounts(consortium.paymentAccounts),
      /Mandiri/,
    );
    assert.equal(themeSnapshotFromBrand(xavia).templateKey, "calm-standard");
  });

  it("issued/proforma snapshots stay stable after brand settings change", () => {
    const live = fixtureProfile();
    const frozen = freezeInvoiceBrandSnapshot(live, "2026-09-01T01:00:00.000Z");
    live.legalName = "Changed later";
    live.footerText = "New footer";
    live.paymentAccountsJson = [];

    const reread = readBrandSnapshot(frozen);
    assert.equal(reread?.legalName, "PT Xavia");
    assert.equal(reread?.footerText, "Thank you");
    assert.equal(reread?.paymentAccounts[0]?.bankName, "BCA");
    assert.equal(companySnapshotFromBrand(frozen).legalName, "PT Xavia");
  });

  it("official invoice fixed layout still renders for brand-backed documents", () => {
    assert.equal(
      usesFixedPackageInvoiceLayout({ brandKey: "xavia", invoiceType: "package" }),
      true,
    );
    assert.equal(
      usesFixedPackageInvoiceLayout({
        brandKey: "xavia",
        invoiceType: "ticketing",
      }),
      false,
    );
    assert.equal(
      usesFixedPackageInvoiceLayout({ brandKey: null, invoiceType: "package" }),
      false,
    );

    const source = readFileSync(
      path.join(process.cwd(), "modules/finance/pdf/invoice-pdf-document.tsx"),
      "utf8",
    );
    assert.match(source, /usesFixedPackageInvoiceLayout/);
    assert.match(source, /CalmStandardTemplate/);
    assert.match(source, /getInvoiceTemplateComponent\(data\.theme\.templateKey\)/);
  });

  it("template choice no longer appears in the package/proforma editor", () => {
    const editor = readFileSync(
      path.join(process.cwd(), "modules/finance/components/invoice-draft-editor.tsx"),
      "utf8",
    );
    const ticketing = readFileSync(
      path.join(
        process.cwd(),
        "modules/finance/components/ticketing-invoice-editor.tsx",
      ),
      "utf8",
    );
    const selector = readFileSync(
      path.join(process.cwd(), "modules/finance/components/invoice-brand-selector.tsx"),
      "utf8",
    );
    const settings = readFileSync(
      path.join(
        process.cwd(),
        "modules/finance/components/invoice-brand-settings-form.tsx",
      ),
      "utf8",
    );
    assert.match(editor, /InvoiceBrandSelector/);
    assert.match(ticketing, /InvoiceBrandSelector/);
    assert.doesNotMatch(editor, /InvoiceTemplateBrandingFields/);
    assert.doesNotMatch(ticketing, /InvoiceTemplateBrandingFields/);
    assert.doesNotMatch(editor, /template_key/);
    assert.match(selector, /financeUi\.sectionBranding/);
    assert.doesNotMatch(selector, /listInvoiceTemplates/);
    assert.doesNotMatch(settings, /default_template_key/);
    assert.doesNotMatch(settings, /listInvoiceTemplates/);
  });

  it("old historical documents still render safely without a brand key", () => {
    assert.equal(
      usesFixedPackageInvoiceLayout({
        brandKey: undefined,
        invoiceType: "package",
      }),
      false,
    );
    const source = readFileSync(
      path.join(process.cwd(), "modules/finance/pdf/invoice-pdf-document.tsx"),
      "utf8",
    );
    assert.match(source, /TicketingTemplate/);
  });

  it("does not rewrite the already-applied FIN-006 brand profiles migration", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    assert.match(sql, /Numbering remains workspace-shared/);
    assert.match(sql, /v_number_code := public\.resolve_invoice_number_code\(v_org_id\)/);
    assert.match(sql, /CREATE TABLE public\.invoice_brand_profiles/);
    assert.match(sql, /lifecycle_status = 'draft'/);
  });
});
