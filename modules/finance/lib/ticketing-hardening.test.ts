import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  codeForStageError,
  InvoicePdfStageError,
} from "@/modules/finance/pdf/invoice-pdf-debug";
import { buildTicketingInvoiceItems } from "@/modules/finance/lib/ticketing-pricing";
import { calculateInvoiceTotals } from "@/modules/finance/lib/invoice-calculator";

const MIGRATION = path.join(
  process.cwd(),
  "supabase/migrations/20260717000000_invoice_ticketing.sql",
);

const SERVICE = path.join(
  process.cwd(),
  "modules/finance/services/invoice-pdf-service.ts",
);

const INVOICE_SERVICE = path.join(
  process.cwd(),
  "modules/finance/services/invoice-service.ts",
);

function readMigration(): string {
  return readFileSync(MIGRATION, "utf8");
}

// ---------------------------------------------------------------------------
// Issue transaction lock / validation contracts (SQL static)
// Live concurrency smoke still required against Postgres.
// ---------------------------------------------------------------------------
describe("FIN-002A issue transaction contracts", () => {
  const sql = readMigration();

  it("issue locks invoice before ticket children", () => {
    const issueStart = sql.indexOf(
      "CREATE OR REPLACE FUNCTION public.issue_invoice(p_invoice_id uuid)",
    );
    assert.ok(issueStart > 0, "hardened issue_invoice must exist in FIN-002 migration");
    const body = sql.slice(issueStart);

    const invoiceLock = body.indexOf("FOR UPDATE");
    const ticketValidate = body.indexOf("lock_and_validate_ticketing_for_issue");
    assert.ok(invoiceLock > 0);
    assert.ok(ticketValidate > invoiceLock);
  });

  it("ticket groups are locked deterministically (sort_order, id)", () => {
    assert.match(
      sql,
      /FROM public\.invoice_ticket_groups g[\s\S]*?ORDER BY g\.sort_order, g\.id[\s\S]*?FOR UPDATE/,
    );
  });

  it("flight segments are locked deterministically (group, segment_order, id)", () => {
    assert.match(
      sql,
      /FROM public\.invoice_flight_segments s[\s\S]*?ORDER BY s\.ticket_group_id, s\.segment_order, s\.id[\s\S]*?FOR UPDATE/,
    );
  });

  it("ticketing validation runs inside issue transaction", () => {
    const issueStart = sql.lastIndexOf(
      "CREATE OR REPLACE FUNCTION public.issue_invoice(p_invoice_id uuid)",
    );
    const body = sql.slice(issueStart, issueStart + 8000);
    assert.match(body, /lock_and_validate_ticketing_for_issue/);
    assert.match(body, /invoice_type = 'ticketing'/);
    assert.match(body, /recalculate_invoice_totals/);
    assert.match(body, /INVOICE_ISSUED/);
  });

  it("documents concurrent-edit protection via parent invoice lock", () => {
    assert.match(sql, /lock_parent_invoice_for_ticket_mutation/);
    assert.match(
      sql,
      /CREATE TRIGGER invoice_ticket_groups_lock_parent/,
    );
    assert.match(
      sql,
      /CREATE TRIGGER invoice_flight_segments_lock_parent/,
    );
    // LIVE POSTGRES: concurrent edit vs issue must be smoke-tested.
  });

  it("rejects moving child rows between invoices/groups after creation", () => {
    assert.match(sql, /prevent_ticket_parent_ref_move/);
    assert.match(sql, /cannot be moved between invoices/);
  });
});

// ---------------------------------------------------------------------------
// Atomic duplicate contracts
// ---------------------------------------------------------------------------
describe("FIN-002A atomic duplicate contracts", () => {
  const sql = readMigration();
  const serviceSrc = readFileSync(INVOICE_SERVICE, "utf8");

  it("duplicate RPC copies groups and segments in one function", () => {
    assert.match(
      sql,
      /CREATE OR REPLACE FUNCTION public\.duplicate_invoice_as_draft\(p_source_invoice_id uuid\)/,
    );
    const start = sql.indexOf(
      "CREATE OR REPLACE FUNCTION public.duplicate_invoice_as_draft",
    );
    const body = sql.slice(start, start + 12000);
    assert.match(body, /INSERT INTO public\.invoices/);
    assert.match(body, /INSERT INTO public\.invoice_items/);
    assert.match(body, /INSERT INTO public\.invoice_ticket_groups/);
    assert.match(body, /INSERT INTO public\.invoice_flight_segments/);
    assert.match(body, /INVOICE_DUPLICATED/);
  });

  it("duplicate event is written only after successful copy", () => {
    const start = sql.indexOf(
      "CREATE OR REPLACE FUNCTION public.duplicate_invoice_as_draft",
    );
    const body = sql.slice(start, start + 12000);
    const lastInsert = Math.max(
      body.lastIndexOf("INSERT INTO public.invoice_flight_segments"),
      body.lastIndexOf("INSERT INTO public.invoice_items"),
    );
    const eventIdx = body.indexOf("INVOICE_DUPLICATED");
    assert.ok(eventIdx > lastInsert);
  });

  it("app duplicate path uses the atomic RPC (no multi-step copy)", () => {
    assert.match(serviceSrc, /rpcDuplicateInvoiceAsDraft/);
    assert.doesNotMatch(serviceSrc, /copyTicketDataToDraft/);
    assert.doesNotMatch(
      serviceSrc.slice(serviceSrc.indexOf("duplicateInvoiceAsDraft")),
      /rpcRecordInvoiceDuplicated/,
    );
  });

  // LIVE POSTGRES: partial duplicate rollback must be smoke-tested.
});

// ---------------------------------------------------------------------------
// PDF post-claim hydration
// ---------------------------------------------------------------------------
describe("FIN-002A PDF hydration contracts", () => {
  const serviceSrc = readFileSync(SERVICE, "utf8");

  it("PDF claim payload without children is rehydrated", () => {
    assert.match(serviceSrc, /hydrateTicketingInvoiceForPdf/);
    const genStart = serviceSrc.indexOf(
      "export async function generateIssuedInvoicePdf",
    );
    const body = serviceSrc.slice(genStart);
    const claimIdx = body.indexOf("rpcClaimInvoicePdfGeneration");
    const hydrateIdx = body.indexOf("hydrateTicketingInvoiceForPdf");
    const buildIdx = body.indexOf('buildInvoicePdfData(working');
    assert.ok(claimIdx > 0 && hydrateIdx > claimIdx && buildIdx > hydrateIdx);
    assert.match(body, /requireCompleteTicketing:\s*true/);
  });

  it("ticket groups survive logo-freeze merge", () => {
    const genStart = serviceSrc.indexOf(
      "export async function generateIssuedInvoicePdf",
    );
    const body = serviceSrc.slice(genStart, genStart + 5000);
    // ticketingGroups captured before logo freeze, passed into build after.
    assert.match(body, /ticketingGroups = hydrated\.ticketing/);
    assert.match(body, /ensureFrozenLogoAsset\(working\)/);
    assert.match(body, /ticketing:\s*ticketingGroups/);
  });

  it("missing issued ticket data gets TICKETING_DATA_MISSING", () => {
    assert.match(serviceSrc, /TICKETING_DATA_MISSING/);
    const err = new InvoicePdfStageError(
      "data_normalization",
      "Issued ticketing invoice has no ticket groups",
      { errorCode: "TICKETING_DATA_MISSING" },
    );
    assert.equal(codeForStageError(err), "TICKETING_DATA_MISSING");
    assert.equal(
      codeForStageError(new Error("ticketing data missing")),
      "TICKETING_DATA_MISSING",
    );
  });
});

// ---------------------------------------------------------------------------
// Migration compatibility + SQL security
// ---------------------------------------------------------------------------
describe("FIN-002A migration compatibility & SQL security", () => {
  const sql = readMigration();

  it("existing package rows need no migration UPDATE", () => {
    // Column add with DEFAULT — no backfill UPDATE of issued rows.
    assert.match(
      sql,
      /ADD COLUMN invoice_type text NOT NULL DEFAULT 'package'/,
    );
    assert.match(
      sql,
      /ADD COLUMN document_type text NOT NULL DEFAULT 'invoice'/,
    );
    assert.doesNotMatch(
      sql,
      /UPDATE\s+public\.invoices\s+SET\s+invoice_type/i,
    );
    assert.doesNotMatch(
      sql,
      /UPDATE\s+public\.invoices\s+SET\s+document_type/i,
    );
  });

  it("package issued invoices remain unaffected by ticketing validation", () => {
    assert.match(
      sql,
      /IF v_invoice\.invoice_type = 'ticketing' THEN[\s\S]*lock_and_validate_ticketing_for_issue/,
    );
    assert.match(
      sql,
      /Ticket groups can only attach to ticketing invoices/,
    );
  });

  it("ticket child insert on package invoice is rejected", () => {
    assert.match(
      sql,
      /Ticket groups can only attach to ticketing invoices/,
    );
    assert.match(
      sql,
      /Flight segments can only attach to ticketing invoices/,
    );
  });

  it("organization_id is validated against parent invoice", () => {
    assert.match(sql, /Ticket group organization must match its invoice/);
    assert.match(sql, /Flight segment organization must match its ticket group/);
  });

  it("issued\/sent\/void invoices reject ticket edits", () => {
    assert.match(sql, /prevent_issued_ticket_group_edit/);
    assert.match(sql, /prevent_issued_flight_segment_edit/);
    assert.match(sql, /Issued invoice ticket groups cannot be edited/);
  });
});

// ---------------------------------------------------------------------------
// Pricing authority (unit)
// ---------------------------------------------------------------------------
describe("FIN-002A pricing authority", () => {
  it("pricing cannot be double-counted through ticketing helpers", () => {
    const priced = buildTicketingInvoiceItems({
      passengerCount: 2,
      pricePerPassengerMinor: 1_000_000,
      serviceFeeMinor: 100_000,
      taxesAndFeesMinor: 50_000,
      discountMinor: 25_000,
      routeSummary: "CGK → JED",
    });
    // Service fee is a line item; taxes go to additionalFees; discount to invoice.
    assert.equal(priced.items.length, 2);
    assert.equal(priced.totals.additionalFeesMinor, 50_000);
    assert.equal(priced.totals.discountMinor, 25_000);

    const totals = calculateInvoiceTotals({
      items: priced.items.map((item) => ({
        quantity: item.quantity,
        unitPriceMinor: item.unitPriceMinor,
        discountMinor: item.discountMinor,
      })),
      additionalFeesMinor: priced.totals.additionalFeesMinor,
      discountMinor: priced.totals.discountMinor,
    });
    // (2*1_000_000 + 100_000) - 25_000 + 50_000 = 2_125_000
    assert.equal(totals.totalMinor, 2_125_000);
  });

  it("client totals remain untrusted — calculator is authoritative", () => {
    const sql = readMigration();
    assert.match(sql, /recalculate_invoice_totals/);
    assert.match(sql, /Ticket passenger count must match pax line item quantity/);
    // Issue never accepts caller totals / snapshot JSON.
    const issueStart = sql.lastIndexOf(
      "CREATE OR REPLACE FUNCTION public.issue_invoice(p_invoice_id uuid)",
    );
    const body = sql.slice(issueStart, issueStart + 3000);
    assert.match(body, /issue_invoice\(p_invoice_id uuid\)/);
    assert.doesNotMatch(body, /p_snapshot|p_totals|p_ticketing/);
  });
});
