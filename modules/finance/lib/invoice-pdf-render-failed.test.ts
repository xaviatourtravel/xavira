import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  codeForStageError,
  InvoicePdfStageError,
  isInvoicePdfDebugEnabled,
} from "@/modules/finance/pdf/invoice-pdf-debug";
import { buildInvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-data";
import { renderInvoicePdfBuffer } from "@/modules/finance/pdf/invoice-pdf-renderer";
import { InvoicePdfGenerationFailedError } from "@/modules/finance/services/invoice-pdf-service";
import type { InvoiceRecord } from "@/modules/finance/types/invoices";
import { readFileSync } from "node:fs";
import path from "node:path";

function baseInvoice(overrides: Partial<InvoiceRecord> = {}): InvoiceRecord {
  return {
    id: "96880fc2-705d-4e4f-ba34-17b9e3a53c0c",
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
    invoiceNumber: "INV/XAV/2026/0001",
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
      footerText: null,
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
    pdfStatus: "generating",
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
        id: "0cbbab92-d2a6-4cda-b640-045faf0dc25d",
        invoiceId: "96880fc2-705d-4e4f-ba34-17b9e3a53c0c",
        description: "Paket",
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

describe("FIN-001.2C claim header must be hydrated with items", () => {
  it("claim-shaped invoice without items fails normalization (root cause)", async () => {
    const headerOnly = baseInvoice({ items: undefined });
    await assert.rejects(
      () => buildInvoicePdfData(headerOnly, { mode: "issued" }),
      /no line items/i,
    );
  });

  it("issued invoice renders from snapshots when items are hydrated", async () => {
    const data = await buildInvoicePdfData(baseInvoice(), { mode: "issued" });
    const buffer = await renderInvoicePdfBuffer(data);
    assert.ok(buffer.length > 100);
    assert.equal(buffer.subarray(0, 5).toString("utf8"), "%PDF-");
  });

  it("draft preview still renders", async () => {
    const draft = baseInvoice({
      lifecycleStatus: "draft",
      invoiceNumber: null,
      issuedAt: null,
      pdfStatus: "not_generated",
    });
    const data = await buildInvoicePdfData(draft, { mode: "draft" });
    const buffer = await renderInvoicePdfBuffer(data);
    assert.ok(buffer.length > 100);
  });

  it("missing logo cannot crash rendering", async () => {
    const data = await buildInvoicePdfData(
      baseInvoice({
        companySnapshot: {
          legalName: "Xavia Tour",
          logoUrl: "https://evil.example/x.png",
          address: null,
          email: null,
          phone: null,
          website: null,
          taxId: null,
          paymentAccounts: [],
          primaryColor: null,
          secondaryColor: null,
          accentColor: null,
          footerText: null,
        },
      }),
      { mode: "issued" },
    );
    assert.equal(data.company.logo?.kind, "initials");
    const buffer = await renderInvoicePdfBuffer(data);
    assert.ok(buffer.length > 100);
  });
});

describe("FIN-001.2C error staging and HTTP semantics", () => {
  const generateRoute = readFileSync(
    path.join(
      process.cwd(),
      "app/api/finance/invoices/[id]/pdf/generate/route.ts",
    ),
    "utf8",
  );
  const serviceSrc = readFileSync(
    path.join(
      process.cwd(),
      "modules/finance/services/invoice-pdf-service.ts",
    ),
    "utf8",
  );

  it("maps missing line items to DATA_NORMALIZATION_FAILED not generic storage", () => {
    const err = new InvoicePdfStageError(
      "data_normalization",
      "Invoice has no line items",
    );
    assert.equal(codeForStageError(err), "DATA_NORMALIZATION_FAILED");
    assert.equal(
      codeForStageError(new Error("Invoice has no line items")),
      "DATA_NORMALIZATION_FAILED",
    );
  });

  it("production response contains safe error code only", () => {
    const failed = new InvoicePdfGenerationFailedError("DATA_NORMALIZATION_FAILED");
    assert.equal(failed.message, "PDF generation failed. You can retry.");
    assert.equal(failed.errorCode, "DATA_NORMALIZATION_FAILED");
    assert.doesNotMatch(failed.message, /stack|line items|at /i);
  });

  it("render failure returns HTTP 500, not 400", () => {
    assert.match(generateRoute, /InvoicePdfGenerationFailedError/);
    assert.match(generateRoute, /status:\s*500/);
    assert.doesNotMatch(
      generateRoute,
      /InvoicePdfGenerationFailedError[\s\S]{0,120}status:\s*400/,
    );
  });

  it("service hydrates items after claim before buildInvoicePdfData", () => {
    assert.match(serviceSrc, /hydrateInvoiceWithItemsForPdf/);
    const fnStart = serviceSrc.indexOf("export async function generateIssuedInvoicePdf");
    assert.ok(fnStart > 0);
    const body = serviceSrc.slice(fnStart);
    const claimIdx = body.indexOf("rpcClaimInvoicePdfGeneration");
    const hydrateIdx = body.indexOf("hydrateInvoiceWithItemsForPdf");
    const buildIdx = body.indexOf('buildInvoicePdfData(working, { mode: "issued" })');
    assert.ok(claimIdx > 0 && hydrateIdx > claimIdx && buildIdx > hydrateIdx);
  });

  it("renderer errors expose details only via debug logger path", () => {
    assert.equal(typeof isInvoicePdfDebugEnabled(), "boolean");
    assert.match(serviceSrc, /logInvoicePdfStage\("failed"/);
    assert.match(serviceSrc, /error,/);
  });
});
