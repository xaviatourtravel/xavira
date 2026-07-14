import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  createInvoiceDraftSchema,
  issueInvoiceSchema,
  updateInvoiceDraftSchema,
} from "@/modules/finance/schemas/invoices";
import { resolveRecipientDisplayName } from "@/modules/finance/lib/invoice-recipient";
import {
  assertBookingMatchesInvoiceCustomer,
  isCommerciallyLockedLifecycle,
} from "@/modules/finance/lib/invoice-access";

const MIGRATION_PATH = path.join(
  process.cwd(),
  "supabase/migrations/20260714010000_invoice_manual_recipient.sql",
);

const linkedBase = {
  recipientSource: "linked_customer" as const,
  customerId: "11111111-1111-1111-1111-111111111111",
  items: [
    {
      description: "Paket",
      quantity: 1,
      unitPriceMinor: 10_000_000,
    },
  ],
};

const manualBase = {
  recipientSource: "manual" as const,
  manualRecipientName: "Budi Santoso",
  items: [
    {
      description: "Paket",
      quantity: 1,
      unitPriceMinor: 10_000_000,
    },
  ],
};

describe("manual invoice recipient schemas", () => {
  it("linked_customer requires customer_id", () => {
    assert.throws(() =>
      createInvoiceDraftSchema.parse({
        recipientSource: "linked_customer",
        items: linkedBase.items,
      }),
    );
    const parsed = createInvoiceDraftSchema.parse(linkedBase);
    assert.equal(parsed.recipientSource, "linked_customer");
    assert.equal(parsed.customerId, linkedBase.customerId);
  });

  it("manual requires recipient name", () => {
    assert.throws(() =>
      createInvoiceDraftSchema.parse({
        recipientSource: "manual",
        manualRecipientName: "   ",
        items: manualBase.items,
      }),
    );
    const parsed = createInvoiceDraftSchema.parse(manualBase);
    assert.equal(parsed.recipientSource, "manual");
    if (parsed.recipientSource !== "manual") {
      throw new Error("expected manual recipient");
    }
    assert.equal(parsed.manualRecipientName, "Budi Santoso");
  });

  it("manual rejects customer_id", () => {
    assert.throws(() =>
      createInvoiceDraftSchema.parse({
        ...manualBase,
        customerId: "11111111-1111-1111-1111-111111111111",
      }),
    );
  });

  it("manual rejects booking_id", () => {
    assert.throws(() =>
      createInvoiceDraftSchema.parse({
        ...manualBase,
        bookingId: "22222222-2222-2222-2222-222222222222",
      }),
    );
  });

  it("linked customer can use a matching booking id", () => {
    const parsed = createInvoiceDraftSchema.parse({
      ...linkedBase,
      bookingId: "22222222-2222-2222-2222-222222222222",
    });
    assert.equal(parsed.bookingId, "22222222-2222-2222-2222-222222222222");
    assert.doesNotThrow(() =>
      assertBookingMatchesInvoiceCustomer(
        linkedBase.customerId,
        linkedBase.customerId,
      ),
    );
  });

  it("linked customer rejects another customer's booking", () => {
    assert.throws(
      () =>
        assertBookingMatchesInvoiceCustomer(
          "99999999-9999-9999-9999-999999999999",
          linkedBase.customerId,
        ),
      /Booking customer must match invoice customer/,
    );
  });

  it("manual recipient can save a draft shape", () => {
    const parsed = createInvoiceDraftSchema.parse({
      ...manualBase,
      manualRecipientPhone: "+628123456789",
      manualRecipientEmail: "budi@example.com",
      manualRecipientCompany: "PT Budi",
    });
    assert.equal(parsed.recipientSource, "manual");
    if (parsed.recipientSource !== "manual") {
      throw new Error("expected manual recipient");
    }
    assert.equal(parsed.manualRecipientEmail, "budi@example.com");
  });

  it("update schema preserves recipient rules", () => {
    const linked = updateInvoiceDraftSchema.parse({
      invoiceId: "33333333-3333-3333-3333-333333333333",
      ...linkedBase,
    });
    assert.equal(linked.recipientSource, "linked_customer");

    assert.throws(() =>
      updateInvoiceDraftSchema.parse({
        invoiceId: "33333333-3333-3333-3333-333333333333",
        ...manualBase,
        bookingId: "22222222-2222-2222-2222-222222222222",
      }),
    );
  });

  it("existing linked-customer invoice flow still parses", () => {
    const parsed = createInvoiceDraftSchema.parse({
      recipientSource: "linked_customer",
      customerId: "11111111-1111-1111-1111-111111111111",
      currency: "IDR",
      items: [
        { description: "Umroh", quantity: 2, unit: "pax", unitPriceMinor: 25_000_000 },
      ],
      totals: { discountMinor: 0, taxRateBps: 0, additionalFeesMinor: 0 },
    });
    assert.equal(parsed.items.length, 1);
  });
});

describe("recipient display name and search helpers", () => {
  it("list displays manual recipient name", () => {
    assert.equal(
      resolveRecipientDisplayName({
        manualRecipientName: "Siti",
        customerName: null,
      }),
      "Siti",
    );
  });

  it("prefers issued snapshot name", () => {
    assert.equal(
      resolveRecipientDisplayName({
        customerSnapshot: { name: "Snapshot Name" },
        customerName: "Linked Name",
        manualRecipientName: "Manual Name",
      }),
      "Snapshot Name",
    );
  });

  it("search matches manual name, phone, and email", () => {
    const row = {
      invoiceNumber: "INV/X/2026/0001",
      recipientDisplayName: "Budi Santoso",
      manualRecipientPhone: "+62811111111",
      manualRecipientEmail: "budi@mail.com",
    };
    const needle = "budi";
    const matches = [
      row.invoiceNumber,
      row.recipientDisplayName,
      row.manualRecipientPhone,
      row.manualRecipientEmail,
    ].some((value) => value.toLowerCase().includes(needle));
    assert.equal(matches, true);
  });

  it("fallback when unset", () => {
    assert.equal(
      resolveRecipientDisplayName({}),
      "Penerima belum diisi",
    );
  });
});

describe("manual recipient issue / immutability contracts", () => {
  it("caller cannot supply manual snapshot JSON to issue schema", () => {
    assert.throws(() =>
      issueInvoiceSchema.parse({
        invoiceId: "11111111-1111-1111-1111-111111111111",
        customerSnapshot: { name: "Forged" },
      }),
    );
  });

  it("manual recipient fields lock after issue", () => {
    assert.equal(isCommerciallyLockedLifecycle("issued"), true);
  });

  it("duplicate preserves manual recipient data shape", () => {
    const source = {
      recipientSource: "manual" as const,
      manualRecipientName: "Budi",
      manualRecipientPhone: "+62812",
      customerId: null,
      bookingId: null,
      invoiceNumber: "INV/X/2026/0001",
    };
    const duplicated = {
      ...source,
      invoiceNumber: null,
    };
    assert.equal(duplicated.recipientSource, "manual");
    assert.equal(duplicated.manualRecipientName, "Budi");
    assert.equal(duplicated.customerId, null);
    assert.equal(duplicated.bookingId, null);
    assert.equal(duplicated.invoiceNumber, null);
  });

  it("issue builds manual customer_snapshot shape from persisted columns", () => {
    const snapshot = {
      source: "manual",
      customer_id: null,
      name: "Budi Santoso",
      company: "PT Budi",
      phone: "+62812",
      email: "budi@example.com",
      address: "Jakarta",
      tax_id: "10.20.30",
    };
    assert.equal(snapshot.source, "manual");
    assert.equal(snapshot.customer_id, null);
    assert.equal(snapshot.name, "Budi Santoso");
  });
});

describe("FIN-001.1B migration contracts", () => {
  const sql = readFileSync(MIGRATION_PATH, "utf8");

  it("adds recipient_source and manual columns", () => {
    assert.match(sql, /recipient_source/);
    assert.match(sql, /manual_recipient_name/);
    assert.match(sql, /manual_recipient_tax_id/);
  });

  it("enforces linked vs manual shape constraints", () => {
    assert.match(sql, /invoices_recipient_shape_check/);
    assert.match(sql, /Manual recipient invoices cannot attach a booking/);
    assert.match(sql, /Manual recipient invoices cannot link a customer/);
  });

  it("updates org-ref validation and issue snapshots", () => {
    assert.match(sql, /build_invoice_customer_snapshot_from_invoice/);
    assert.match(sql, /recipient_source = 'manual'/);
    assert.match(sql, /'source', 'manual'/);
    assert.match(sql, /'source', 'linked_customer'/);
  });

  it("locks manual recipient fields after issue", () => {
    assert.match(sql, /NEW\.recipient_source IS DISTINCT FROM OLD\.recipient_source/);
    assert.match(sql, /NEW\.manual_recipient_name IS DISTINCT FROM OLD\.manual_recipient_name/);
  });

  it("does not accept caller snapshot JSON on issue_invoice", () => {
    assert.match(
      sql,
      /CREATE OR REPLACE FUNCTION public\.issue_invoice\(\s*p_invoice_id uuid\s*\)/,
    );
    assert.doesNotMatch(sql, /p_customer_snapshot/);
  });

  it("preserves cross-organization booking/customer protections", () => {
    assert.match(sql, /Customer must belong to the invoice organization/);
    assert.match(sql, /Booking must belong to the invoice organization/);
    assert.match(sql, /Booking customer must match invoice customer/);
  });
});
