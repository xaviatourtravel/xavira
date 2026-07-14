import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { calculateInvoiceTotals } from "@/modules/finance/lib/invoice-calculator";
import {
  formatInvoiceNumber,
  resolveInvoiceNumberCode,
} from "@/modules/finance/lib/invoice-money";
import {
  assertSameOrganization,
  isCommerciallyLockedLifecycle,
} from "@/modules/finance/lib/invoice-access";
import {
  deriveEffectivePaymentStatus,
  workspaceTodayJakarta,
} from "@/modules/finance/lib/invoice-payment-status";
import { buildBookingPrefill } from "@/modules/finance/lib/invoice-prefill";
import {
  createInvoiceDraftSchema,
  invoiceListFiltersSchema,
  issueInvoiceSchema,
  voidInvoiceSchema,
} from "@/modules/finance/schemas/invoices";
import { roleHasPermission } from "@/lib/auth/permission-matrix";

const MIGRATION_PATH = path.join(
  process.cwd(),
  "supabase/migrations/20260714000000_create_invoice_domain.sql",
);

function readMigration() {
  return readFileSync(MIGRATION_PATH, "utf8");
}

describe("invoice calculator", () => {
  it("handles zero tax/fees/discount with multiple items", () => {
    const result = calculateInvoiceTotals({
      items: [
        { quantity: 2, unitPriceMinor: 1_000_000, discountMinor: 0 },
        { quantity: 1, unitPriceMinor: 500_000, discountMinor: 0 },
      ],
    });
    assert.equal(result.subtotalMinor, 2_500_000);
    assert.equal(result.totalMinor, 2_500_000);
    assert.equal(result.balanceDueMinor, 2_500_000);
    assert.equal(result.paymentStatus, "unpaid");
  });

  it("applies line and invoice discounts", () => {
    const result = calculateInvoiceTotals({
      items: [{ quantity: 1, unitPriceMinor: 10_000_000, discountMinor: 1_000_000 }],
      discountMinor: 500_000,
    });
    assert.equal(result.lines[0]!.lineTotalMinor, 9_000_000);
    assert.equal(result.subtotalMinor, 9_000_000);
    assert.equal(result.discountMinor, 500_000);
    assert.equal(result.totalMinor, 8_500_000);
  });

  it("calculates large IDR totals without floating-point drift", () => {
    const result = calculateInvoiceTotals({
      items: [
        { quantity: 10, unitPriceMinor: 23_500_000 },
        { quantity: 3, unitPriceMinor: 12_750_000 },
      ],
      additionalFeesMinor: 250_000,
    });
    assert.equal(result.subtotalMinor, 273_250_000);
    assert.equal(result.totalMinor, 273_500_000);
  });

  it("rejects negative monetary values", () => {
    assert.throws(
      () =>
        calculateInvoiceTotals({
          items: [{ quantity: 1, unitPriceMinor: -1 }],
        }),
      /cannot be negative|must be an integer/,
    );
  });

  it("applies tax rate in basis points", () => {
    const result = calculateInvoiceTotals({
      items: [{ quantity: 1, unitPriceMinor: 1_000_000 }],
      taxRateBps: 1100,
    });
    assert.equal(result.taxMinor, 110_000);
    assert.equal(result.totalMinor, 1_110_000);
  });

  it("computes balance due and exact paid status", () => {
    const unpaid = calculateInvoiceTotals({
      items: [{ quantity: 1, unitPriceMinor: 1_000_000 }],
      amountPaidMinor: 0,
    });
    assert.equal(unpaid.paymentStatus, "unpaid");

    const partial = calculateInvoiceTotals({
      items: [{ quantity: 1, unitPriceMinor: 1_000_000 }],
      amountPaidMinor: 400_000,
    });
    assert.equal(partial.paymentStatus, "partially_paid");

    const paid = calculateInvoiceTotals({
      items: [{ quantity: 1, unitPriceMinor: 1_000_000 }],
      amountPaidMinor: 1_000_000,
    });
    assert.equal(paid.paymentStatus, "paid");
  });

  it("rejects overpayment", () => {
    assert.throws(
      () =>
        calculateInvoiceTotals({
          items: [{ quantity: 1, unitPriceMinor: 1_000_000 }],
          amountPaidMinor: 1_000_001,
        }),
      /overpayment is not allowed/,
    );
  });

  it("rejects empty invoice", () => {
    assert.throws(
      () => calculateInvoiceTotals({ items: [] }),
      /at least one line item/,
    );
  });

  it("is server-authoritative: ignores implied browser total", () => {
    const browserClaimedTotal = 1;
    const result = calculateInvoiceTotals({
      items: [{ quantity: 2, unitPriceMinor: 3_000_000 }],
    });
    assert.notEqual(result.totalMinor, browserClaimedTotal);
    assert.equal(result.totalMinor, 6_000_000);
  });

  it("never persists overdue as base payment status", () => {
    const result = calculateInvoiceTotals({
      items: [{ quantity: 1, unitPriceMinor: 500_000 }],
      amountPaidMinor: 100_000,
    });
    assert.equal(result.paymentStatus, "partially_paid");
    assert.notEqual(result.paymentStatus, "overdue");
  });
});

describe("effective overdue (derived on read)", () => {
  it("becomes overdue after due date without modifying the row", () => {
    const status = deriveEffectivePaymentStatus({
      lifecycleStatus: "issued",
      paymentStatus: "unpaid",
      balanceDueMinor: 1_000_000,
      dueDate: "2026-01-01",
      today: "2026-07-14",
    });
    assert.equal(status, "overdue");
  });

  it("is not overdue before due date", () => {
    const status = deriveEffectivePaymentStatus({
      lifecycleStatus: "issued",
      paymentStatus: "unpaid",
      balanceDueMinor: 1_000_000,
      dueDate: "2026-12-31",
      today: "2026-07-14",
    });
    assert.equal(status, "unpaid");
  });

  it("void invoice never displays overdue", () => {
    const status = deriveEffectivePaymentStatus({
      lifecycleStatus: "void",
      paymentStatus: "unpaid",
      balanceDueMinor: 5_000_000,
      dueDate: "2020-01-01",
      today: "2026-07-14",
    });
    assert.equal(status, "unpaid");
    assert.notEqual(status, "overdue");
  });

  it("paid balance is never overdue", () => {
    const status = deriveEffectivePaymentStatus({
      lifecycleStatus: "sent",
      paymentStatus: "paid",
      balanceDueMinor: 0,
      dueDate: "2020-01-01",
      today: "2026-07-14",
    });
    assert.equal(status, "paid");
  });

  it("workspaceTodayJakarta returns YYYY-MM-DD", () => {
    assert.match(workspaceTodayJakarta(new Date("2026-07-14T12:00:00+07:00")), /^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("invoice numbering", () => {
  it("formats INV/{CODE}/{YEAR}/{PADDED}", () => {
    assert.equal(
      formatInvoiceNumber({
        workspaceCode: resolveInvoiceNumberCode({
          configuredPrefix: "XAVIA",
        }),
        year: 2026,
        sequence: 1,
      }),
      "INV/XAVIA/2026/0001",
    );
  });

  it("allocates unique concurrent-safe sequence numbers in memory", async () => {
    let lastNumber = 0;
    const lock = { queue: Promise.resolve() };

    async function allocate(): Promise<number> {
      const run = lock.queue.then(async () => {
        const next = lastNumber + 1;
        lastNumber = next;
        return next;
      });
      lock.queue = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    }

    const results = await Promise.all(
      Array.from({ length: 20 }, () => allocate()),
    );
    assert.equal(new Set(results).size, 20);
  });
});

describe("organization isolation and permissions", () => {
  it("member cannot access another organization invoice", () => {
    assert.throws(
      () => assertSameOrganization("org-a", "org-b"),
      /does not belong/,
    );
  });

  it("list filters schema remains organization-scoped (no orgId accept)", () => {
    const parsed = invoiceListFiltersSchema.parse({
      q: "INV",
      lifecycleStatus: "draft",
    });
    assert.equal("organizationId" in parsed, false);
  });

  it("finance role can manage invoices; sales cannot", () => {
    assert.equal(roleHasPermission("finance", "invoices.create"), true);
    assert.equal(roleHasPermission("finance", "invoices.issue"), true);
    assert.equal(roleHasPermission("sales", "invoices.create"), false);
    assert.equal(roleHasPermission("owner", "invoices.issue"), true);
  });
});

describe("draft / issue / void / duplicate rules", () => {
  it("draft schema requires items and has no invoice number field", () => {
    const draft = createInvoiceDraftSchema.parse({
      recipientSource: "linked_customer",
      customerId: "11111111-1111-1111-1111-111111111111",
      items: [
        {
          description: "Paket Umroh",
          quantity: 2,
          unitPriceMinor: 25_000_000,
        },
      ],
    });
    assert.equal("invoiceNumber" in draft, false);
  });

  it("issue schema accepts only invoiceId — no actor/org/snapshots", () => {
    const parsed = issueInvoiceSchema.parse({
      invoiceId: "11111111-1111-1111-1111-111111111111",
    });
    assert.deepEqual(Object.keys(parsed).sort(), ["invoiceId"]);
    assert.throws(() =>
      issueInvoiceSchema.parse({
        invoiceId: "11111111-1111-1111-1111-111111111111",
        actorUserId: "22222222-2222-2222-2222-222222222222",
        organizationId: "33333333-3333-3333-3333-333333333333",
        companySnapshot: { legalName: "Forged" },
      }),
    );
  });

  it("void requires reason", () => {
    assert.throws(
      () =>
        voidInvoiceSchema.parse({
          invoiceId: "11111111-1111-1111-1111-111111111111",
          reason: "   ",
        }),
      /void reason|too small|required/i,
    );
  });

  it("issued lifecycle is commercially locked", () => {
    assert.equal(isCommerciallyLockedLifecycle("issued"), true);
    assert.equal(isCommerciallyLockedLifecycle("sent"), true);
    assert.equal(isCommerciallyLockedLifecycle("void"), true);
    assert.equal(isCommerciallyLockedLifecycle("draft"), false);
  });

  it("duplicate draft keeps number absent", () => {
    const sourceNumber = "INV/XAVIA/2026/0001";
    const duplicated = {
      invoiceNumber: null as string | null,
      sourceInvoiceNumber: sourceNumber,
    };
    assert.equal(duplicated.invoiceNumber, null);
    assert.notEqual(duplicated.invoiceNumber, sourceNumber);
  });
});

describe("customer/booking org rules via schema + prefill", () => {
  it("rejects invalid customer uuid", () => {
    assert.throws(() =>
      createInvoiceDraftSchema.parse({
        recipientSource: "linked_customer",
        customerId: "not-a-uuid",
        items: [{ description: "x", quantity: 1, unitPriceMinor: 1000 }],
      }),
    );
  });

  it("prefills booking without inventing missing prices", () => {
    const incomplete = buildBookingPrefill({
      id: "booking-1",
      lead_id: null,
      booking_code: "BK-1",
      customer_name: "",
      package_name: null,
      departure_date: null,
      total_pax: null,
      total_amount: null,
      discount_amount: null,
    });
    assert.equal(incomplete.suggestedItem, null);
    assert.ok(incomplete.missingFields.includes("customer"));
  });

  it("issued snapshots remain stable after customer/booking identity change", () => {
    const issuedCustomerSnapshot = { name: "Original Customer", phone: "081" };
    const customerUpdatedLater = { name: "Changed Name", phone: "082" };
    assert.notEqual(issuedCustomerSnapshot.name, customerUpdatedLater.name);
    assert.equal(issuedCustomerSnapshot.name, "Original Customer");
  });
});

describe("FIN-001.1A migration security guarantees (static / SQL contract)", () => {
  const sql = readMigration();

  it("issue_invoice accepts only p_invoice_id", () => {
    assert.match(
      sql,
      /CREATE OR REPLACE FUNCTION public\.issue_invoice\(\s*p_invoice_id uuid\s*\)/,
    );
    assert.doesNotMatch(
      sql,
      /issue_invoice\(\s*p_invoice_id uuid,\s*p_actor_user_id/,
    );
    assert.doesNotMatch(sql, /p_company_snapshot/);
    assert.doesNotMatch(sql, /p_customer_snapshot/);
    assert.doesNotMatch(sql, /p_booking_snapshot/);
    assert.doesNotMatch(sql, /p_theme_snapshot/);
    assert.doesNotMatch(sql, /p_actor_user_id/);
  });

  it("caller cannot supply actor or organization identity to issue", () => {
    assert.match(sql, /v_actor uuid := auth\.uid\(\)/);
    assert.match(sql, /v_org_id := v_invoice\.organization_id/);
    assert.match(
      sql,
      /CREATE OR REPLACE FUNCTION public\.issue_invoice\(\s*p_invoice_id uuid\s*\)/,
    );
    assert.doesNotMatch(
      sql,
      /CREATE OR REPLACE FUNCTION public\.issue_invoice\([^)]*p_organization_id/,
    );
    assert.doesNotMatch(
      sql,
      /CREATE OR REPLACE FUNCTION public\.issue_invoice\([^)]*p_actor/,
    );
    assert.doesNotMatch(
      sql,
      /CREATE OR REPLACE FUNCTION public\.issue_invoice\([^)]*snapshot/,
    );
  });

  it("can_manage_invoices is organization-aware", () => {
    assert.match(
      sql,
      /CREATE OR REPLACE FUNCTION public\.can_manage_invoices\(p_organization_id uuid\)/,
    );
    assert.match(sql, /v_profile_org IS DISTINCT FROM p_organization_id/);
    assert.match(sql, /can_manage_invoices\(organization_id\)/);
    assert.doesNotMatch(
      sql,
      /public\.can_manage_invoices\(\)/,
    );
  });

  it("issue verifies membership against invoice organization", () => {
    assert.match(sql, /can_manage_invoices\(v_org_id\)/);
    assert.match(sql, /FOR UPDATE/);
  });

  it("snapshots are built from authoritative tables, not caller JSON", () => {
    assert.match(sql, /build_invoice_company_snapshot/);
    assert.match(sql, /build_invoice_customer_snapshot/);
    assert.match(sql, /build_invoice_booking_snapshot/);
    assert.match(sql, /build_invoice_theme_snapshot/);
    assert.match(sql, /company_snapshot = v_company/);
  });

  it("cross-org customer and booking rejected by database trigger", () => {
    assert.match(sql, /validate_invoice_org_refs/);
    assert.match(sql, /Customer must belong to the invoice organization/);
    assert.match(sql, /Booking must belong to the invoice organization/);
  });

  it("totals recalculated during issue; empty invoice rejected", () => {
    assert.match(sql, /recalculate_invoice_totals\(v_invoice\.id\)/);
    assert.match(sql, /Invoice must have at least one line item/);
    assert.match(sql, /overpayment is not allowed/);
  });

  it("critical audit events cannot be forged directly", () => {
    assert.match(sql, /Critical invoice events can only be written by trusted functions/);
    assert.match(sql, /NEW\.actor_user_id := auth\.uid\(\)/);
    assert.match(
      sql,
      /event_type IN \('INVOICE_CREATED', 'INVOICE_UPDATED'\)/,
    );
    assert.match(sql, /insert_trusted_invoice_event/);
  });

  it("SECURITY DEFINER helpers use empty search_path and revoke PUBLIC", () => {
    assert.match(sql, /SET search_path = ''/);
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.issue_invoice\(uuid\) FROM PUBLIC/);
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.void_invoice\(uuid, text\) FROM PUBLIC/);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.issue_invoice\(uuid\) TO authenticated/);
  });

  it("payment_status check excludes overdue (derived on read)", () => {
    assert.match(
      sql,
      /payment_status IN \('unpaid', 'partially_paid', 'paid'\)/,
    );
    assert.doesNotMatch(
      sql,
      /payment_status IN \('unpaid', 'partially_paid', 'paid', 'overdue'\)/,
    );
  });

  it("issued commercial fields remain immutable", () => {
    assert.match(sql, /Issued invoices cannot be commercially edited/);
    assert.match(sql, /NEW\.invoice_number IS DISTINCT FROM OLD\.invoice_number/);
    assert.match(sql, /NEW\.customer_snapshot IS DISTINCT FROM OLD\.customer_snapshot/);
    assert.match(sql, /NEW\.total_minor IS DISTINCT FROM OLD\.total_minor/);
    assert.match(sql, /Issued invoice items cannot be edited/);
  });

  it("audit actor equals auth.uid for trusted events", () => {
    assert.match(
      sql,
      /INSERT INTO public\.invoice_events[\s\S]*?auth\.uid\(\)/,
    );
  });
});
