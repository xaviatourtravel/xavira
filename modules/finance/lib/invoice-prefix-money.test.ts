import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  createInvoiceDraftSchema,
  invoicePrefixSchema,
  issueInvoiceSchema,
} from "@/modules/finance/schemas/invoices";
import { financeUiId } from "@/lib/i18n/finance-dictionary";
import {
  deriveInvoicePrefixFromOrganizationName,
  formatIdrGrouped,
  formatInvoiceNumber,
  normalizeIdrDigitString,
  parseIdrInputToMinor,
  resolveInvoiceNumberCode,
} from "@/modules/finance/lib/invoice-money";

const MIGRATION_PATH = path.join(
  process.cwd(),
  "supabase/migrations/20260714020000_invoice_number_prefix.sql",
);

describe("invoice prefix validation", () => {
  it("prefix longer than 10 characters is rejected", () => {
    assert.throws(() => invoicePrefixSchema.parse({ invoicePrefix: "ABCDEFGHIJK" }));
  });

  it("punctuation and slash are rejected", () => {
    assert.throws(() => invoicePrefixSchema.parse({ invoicePrefix: "XA/VIA" }));
    assert.throws(() => invoicePrefixSchema.parse({ invoicePrefix: "XA.VIA" }));
    assert.throws(() => invoicePrefixSchema.parse({ invoicePrefix: "XA VIA" }));
  });

  it("accepts XAVIA and uppercases", () => {
    const parsed = invoicePrefixSchema.parse({ invoicePrefix: "xavia" });
    assert.equal(parsed.invoicePrefix, "XAVIA");
  });

  it("allows clearing prefix (null)", () => {
    const parsed = invoicePrefixSchema.parse({ invoicePrefix: null });
    assert.equal(parsed.invoicePrefix, null);
  });
});

describe("invoice number prefix resolution", () => {
  it("configured prefix XAVIA generates INV/XAVIA/YEAR/NNNN", () => {
    const code = resolveInvoiceNumberCode({
      configuredPrefix: "XAVIA",
      organizationName: "Ignored Name",
    });
    assert.equal(
      formatInvoiceNumber({ workspaceCode: code, year: 2026, sequence: 2 }),
      "INV/XAVIA/2026/0002",
    );
  });

  it("organization-name fallback is deterministic", () => {
    assert.equal(
      deriveInvoicePrefixFromOrganizationName("Xavia Tour and Travel"),
      "XAVIA",
    );
    assert.equal(
      deriveInvoicePrefixFromOrganizationName("PT Maju Bersama Sejahtera"),
      "MBS",
    );
    assert.equal(
      deriveInvoicePrefixFromOrganizationName("CV Cahaya Wisata Indonesia"),
      "CWI",
    );
    assert.equal(
      deriveInvoicePrefixFromOrganizationName("Xavia Tour and Travel"),
      deriveInvoicePrefixFromOrganizationName("Xavia Tour and Travel"),
    );
  });

  it("fallback never exposes UUID/random slug", () => {
    // Number code must come from configured prefix or org *name*, never slug.
    const code = resolveInvoiceNumberCode({
      configuredPrefix: null,
      organizationName: "Xavia Tour and Travel",
    });
    assert.equal(code, "XAVIA");
    assert.notEqual(code, "FALEEVIO13TRAVELRSFJN2");
    assert.ok(code.length <= 10);
    assert.doesNotMatch(code, /[0-9a-f]{8}-[0-9a-f]{4}-/i);
  });

  it("empty name falls back to ORG", () => {
    assert.equal(deriveInvoicePrefixFromOrganizationName(""), "ORG");
    assert.equal(deriveInvoicePrefixFromOrganizationName(null), "ORG");
  });
});

describe("IDR money input helpers", () => {
  it("02400000 normalizes to 2400000", () => {
    assert.equal(normalizeIdrDigitString("02400000"), "2400000");
    assert.equal(parseIdrInputToMinor("02400000"), 2_400_000);
  });

  it("2400000 displays as 2.400.000", () => {
    assert.equal(formatIdrGrouped(2_400_000), "2.400.000");
  });

  it("01000000 normalizes to 1000000", () => {
    assert.equal(normalizeIdrDigitString("01000000"), "1000000");
    assert.equal(parseIdrInputToMinor("01000000"), 1_000_000);
  });

  it("negative and invalid money values are rejected", () => {
    assert.throws(() => parseIdrInputToMinor("-1000"));
    assert.throws(() => parseIdrInputToMinor("12abc"));
    assert.throws(() => formatIdrGrouped(-1));
  });

  it("preserves zero and allows empty while editing", () => {
    assert.equal(parseIdrInputToMinor("0"), 0);
    assert.equal(parseIdrInputToMinor(""), null);
    assert.equal(formatIdrGrouped(0), "0");
  });
});

describe("overdue badge wording", () => {
  it("overdue badge displays Terlambat", () => {
    assert.equal(financeUiId.paymentOverdue, "Terlambat");
    assert.equal(financeUiId.summaryOverdue, "Terlambat");
    assert.equal(financeUiId.dueDate, "Jatuh tempo");
  });
});

describe("linked and manual recipient flows still pass", () => {
  it("linked and manual draft schemas still parse", () => {
    const linked = createInvoiceDraftSchema.parse({
      recipientSource: "linked_customer",
      customerId: "11111111-1111-1111-1111-111111111111",
      items: [{ description: "Paket", quantity: 1, unitPriceMinor: 2_400_000 }],
    });
    assert.equal(linked.recipientSource, "linked_customer");

    const manual = createInvoiceDraftSchema.parse({
      recipientSource: "manual",
      manualRecipientName: "Budi",
      items: [{ description: "Paket", quantity: 1, unitPriceMinor: 1_000_000 }],
    });
    assert.equal(manual.recipientSource, "manual");
  });
});

describe("FIN-001.1C migration contracts", () => {
  const sql = readFileSync(MIGRATION_PATH, "utf8");

  it("prefix is never taken from caller input on issue_invoice", () => {
    assert.match(
      sql,
      /CREATE OR REPLACE FUNCTION public\.issue_invoice\(\s*p_invoice_id uuid\s*\)/,
    );
    assert.doesNotMatch(sql, /p_invoice_prefix|p_number_code|p_workspace_code/);
    assert.match(sql, /resolve_invoice_number_code\(v_org_id\)/);
  });

  it("configured prefix and org-name fallback helpers exist", () => {
    assert.match(sql, /invoice_prefix/);
    assert.match(sql, /derive_invoice_prefix_from_name/);
    assert.match(sql, /resolve_invoice_number_code/);
    assert.match(sql, /invoice_brand_settings_invoice_prefix_check/);
  });

  it("fallback never reads organization slug", () => {
    assert.doesNotMatch(sql, /o\.slug|v_slug/);
    assert.match(sql, /SELECT o\.name/);
  });

  it("existing issued invoice number remains unchanged (lock preserved)", () => {
    // issue only assigns number when draft has no number; commercial lock lives in prior migrations
    assert.match(sql, /Draft invoices must not already have an invoice number/);
    assert.match(
      sql,
      /v_invoice_number := format\(\s*'INV\/%s\/%s\/%s'/,
    );
  });

  it("concurrent numbering behavior remains intact", () => {
    assert.match(sql, /FOR UPDATE/);
    assert.match(sql, /invoice_sequences/);
    assert.match(sql, /last_number \+ 1/);
  });

  it("issue schema still rejects caller snapshots / prefix", () => {
    assert.throws(() =>
      issueInvoiceSchema.parse({
        invoiceId: "11111111-1111-1111-1111-111111111111",
        invoicePrefix: "HACK",
      }),
    );
  });
});
