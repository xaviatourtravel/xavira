import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  canArchiveInvoice,
  canHardDeleteInvoice,
  canRestoreInvoice,
  isInvoiceArchived,
  resolveInvoiceRemovalMode,
  summarizeBulkRemoval,
} from "@/modules/finance/lib/invoice-archive";
import {
  archiveInvoiceSchema,
  bulkRemoveInvoicesSchema,
  deleteDraftInvoiceSchema,
  invoiceListFiltersSchema,
  restoreInvoiceSchema,
} from "@/modules/finance/schemas/invoices";
import { roleHasPermission } from "@/lib/auth/permission-matrix";

const ARCHIVE_MIGRATION_PATH = path.join(
  process.cwd(),
  "supabase/migrations/20260828000000_invoice_archive_delete.sql",
);
const DOMAIN_MIGRATION_PATH = path.join(
  process.cwd(),
  "supabase/migrations/20260714000000_create_invoice_domain.sql",
);
const PAYMENTS_MIGRATION_PATH = path.join(
  process.cwd(),
  "supabase/migrations/20260717120000_invoice_payments.sql",
);
const TICKETING_MIGRATION_PATH = path.join(
  process.cwd(),
  "supabase/migrations/20260717000000_invoice_ticketing.sql",
);

function readArchiveMigration() {
  return readFileSync(ARCHIVE_MIGRATION_PATH, "utf8");
}

describe("FIN-003 removal mode rules", () => {
  it("draft invoice can be hard deleted", () => {
    assert.equal(
      resolveInvoiceRemovalMode({ lifecycleStatus: "draft" }),
      "hard_delete",
    );
    assert.equal(
      canHardDeleteInvoice({ lifecycleStatus: "draft", paymentCount: 0 }),
      true,
    );
  });

  it("issued invoice cannot be hard deleted", () => {
    assert.equal(
      resolveInvoiceRemovalMode({ lifecycleStatus: "issued" }),
      "archive",
    );
    assert.equal(canHardDeleteInvoice({ lifecycleStatus: "issued" }), false);
  });

  it("sent invoice cannot be hard deleted", () => {
    assert.equal(
      resolveInvoiceRemovalMode({ lifecycleStatus: "sent" }),
      "archive",
    );
    assert.equal(canHardDeleteInvoice({ lifecycleStatus: "sent" }), false);
  });

  it("paid invoice cannot be hard deleted (archive only)", () => {
    assert.equal(
      resolveInvoiceRemovalMode({ lifecycleStatus: "issued" }),
      "archive",
    );
    assert.equal(
      canHardDeleteInvoice({
        lifecycleStatus: "issued",
        paymentCount: 1,
      }),
      false,
    );
  });

  it("issued invoice can be archived", () => {
    assert.equal(
      canArchiveInvoice({ lifecycleStatus: "issued", archivedAt: null }),
      true,
    );
  });

  it("archived invoice disappears from default list filter semantics", () => {
    const parsed = invoiceListFiltersSchema.parse({});
    assert.equal(parsed.archiveFilter, undefined);
    const active = invoiceListFiltersSchema.parse({ archiveFilter: "active" });
    assert.equal(active.archiveFilter, "active");
    assert.equal(isInvoiceArchived("2026-08-28T00:00:00Z"), true);
  });

  it("archived filter displays archived invoices", () => {
    const archived = invoiceListFiltersSchema.parse({
      archiveFilter: "archived",
    });
    assert.equal(archived.archiveFilter, "archived");
  });

  it("restore makes invoice active again (rule)", () => {
    assert.equal(
      canRestoreInvoice({ archivedAt: "2026-08-28T00:00:00Z" }),
      true,
    );
    assert.equal(canRestoreInvoice({ archivedAt: null }), false);
  });

  it("draft with financial history cannot be hard deleted", () => {
    assert.equal(
      canHardDeleteInvoice({
        lifecycleStatus: "draft",
        paymentCount: 1,
      }),
      false,
    );
  });

  it("bulk summary separates delete vs archive", () => {
    const summary = summarizeBulkRemoval([
      { id: "a", lifecycleStatus: "draft" },
      { id: "b", lifecycleStatus: "issued" },
      { id: "c", lifecycleStatus: "sent" },
      { id: "d", lifecycleStatus: "draft", archivedAt: "x" },
    ]);
    assert.deepEqual(summary.deleteIds, ["a"]);
    assert.deepEqual(summary.archiveIds, ["b", "c"]);
    assert.deepEqual(summary.skippedIds, ["d"]);
  });

  it("owner/admin/finance can remove via invoices.edit", () => {
    assert.equal(roleHasPermission("owner", "invoices.edit"), true);
    assert.equal(roleHasPermission("admin", "invoices.edit"), true);
    assert.equal(roleHasPermission("finance", "invoices.edit"), true);
    assert.equal(roleHasPermission("sales", "invoices.edit"), false);
  });
});

describe("FIN-003 schemas", () => {
  it("archive requires reason", () => {
    assert.throws(() =>
      archiveInvoiceSchema.parse({
        invoiceId: "11111111-1111-1111-1111-111111111111",
        reason: "  ",
      }),
    );
    const ok = archiveInvoiceSchema.parse({
      invoiceId: "11111111-1111-1111-1111-111111111111",
      reason: "Invoice hasil testing",
    });
    assert.equal(ok.reason, "Invoice hasil testing");
  });

  it("delete draft and restore schemas accept uuid", () => {
    deleteDraftInvoiceSchema.parse({
      invoiceId: "11111111-1111-1111-1111-111111111111",
    });
    restoreInvoiceSchema.parse({
      invoiceId: "11111111-1111-1111-1111-111111111111",
    });
  });

  it("bulk remove accepts optional archive reason", () => {
    const ok = bulkRemoveInvoicesSchema.parse({
      invoiceIds: ["11111111-1111-1111-1111-111111111111"],
      archiveReason: "cleanup",
    });
    assert.equal(ok.archiveReason, "cleanup");
    const draftOnly = bulkRemoveInvoicesSchema.parse({
      invoiceIds: ["11111111-1111-1111-1111-111111111111"],
    });
    assert.equal(draftOnly.archiveReason, null);
  });
});

describe("FIN-003 migration security contracts", () => {
  const sql = readArchiveMigration();
  const domain = readFileSync(DOMAIN_MIGRATION_PATH, "utf8");
  const payments = readFileSync(PAYMENTS_MIGRATION_PATH, "utf8");
  const ticketing = readFileSync(TICKETING_MIGRATION_PATH, "utf8");

  it("adds archive columns without altering commercial fields", () => {
    assert.match(sql, /ADD COLUMN IF NOT EXISTS archived_at/);
    assert.match(sql, /ADD COLUMN IF NOT EXISTS archived_by/);
    assert.match(sql, /ADD COLUMN IF NOT EXISTS archive_reason/);
  });

  it("issued invoice cannot be hard deleted via delete_draft_invoice", () => {
    assert.match(sql, /Only draft invoices can be permanently deleted/);
    assert.match(sql, /lifecycle_status <> 'draft'/);
  });

  it("sent / void archive path exists; draft cannot archive", () => {
    assert.match(sql, /Draft invoices must be permanently deleted, not archived/);
    assert.match(
      sql,
      /Only issued, sent, or void invoices can be archived/,
    );
  });

  it("draft with payment history blocked from hard delete", () => {
    assert.match(
      sql,
      /Draft invoice has payment history and cannot be permanently deleted/,
    );
  });

  it("archive does not alter invoice number / lifecycle / totals", () => {
    // UPDATE only sets archive fields + updated_by
    assert.match(
      sql,
      /archived_at = now\(\),\s*archived_by = v_actor,\s*archive_reason = v_reason,\s*updated_by = v_actor/,
    );
    assert.doesNotMatch(sql, /SET[\s\S]{0,200}invoice_number\s*=/);
    assert.doesNotMatch(sql, /SET[\s\S]{0,200}total_minor\s*=/);
    assert.doesNotMatch(sql, /SET[\s\S]{0,200}payment_status\s*=/);
    assert.doesNotMatch(
      sql,
      /UPDATE public\.invoices\s+SET[\s\S]{0,400}lifecycle_status\s*=/,
    );
  });

  it("restore clears archive timestamps without renumbering", () => {
    assert.match(sql, /archived_at = NULL/);
    assert.match(sql, /archived_by = NULL/);
    assert.doesNotMatch(
      sql,
      /restore_invoice[\s\S]{0,800}invoice_number\s*=/,
    );
  });

  it("archive/restore events use auth.uid actor path", () => {
    assert.match(sql, /v_actor uuid := auth\.uid\(\)/);
    assert.match(sql, /'INVOICE_ARCHIVED'/);
    assert.match(sql, /'INVOICE_RESTORED'/);
    assert.match(sql, /archived_by = v_actor/);
  });

  it("actor cannot forge archived_by without trusted setting", () => {
    assert.match(sql, /prevent_client_invoice_archive_state_edit/);
    assert.match(sql, /app\.trusted_invoice_archive/);
    assert.match(
      sql,
      /Archive state can only be changed by trusted invoice RPCs/,
    );
  });

  it("caller cannot supply organization or actor IDs to RPCs", () => {
    assert.match(
      sql,
      /CREATE OR REPLACE FUNCTION public\.archive_invoice\(\s*p_invoice_id uuid,\s*p_reason text\s*\)/,
    );
    assert.match(
      sql,
      /CREATE OR REPLACE FUNCTION public\.restore_invoice\(\s*p_invoice_id uuid\s*\)/,
    );
    assert.match(
      sql,
      /CREATE OR REPLACE FUNCTION public\.delete_draft_invoice\(\s*p_invoice_id uuid\s*\)/,
    );
    assert.doesNotMatch(
      sql,
      /archive_invoice\([^)]*p_organization_id/,
    );
    assert.doesNotMatch(sql, /archive_invoice\([^)]*p_actor/);
    assert.doesNotMatch(sql, /delete_draft_invoice\([^)]*p_organization_id/);
  });

  it("cross-workspace rejected via can_manage_invoices on invoice org", () => {
    assert.match(sql, /can_manage_invoices\(v_invoice\.organization_id\)/);
    assert.match(sql, /FOR UPDATE/);
  });

  it("existing delete RLS still drafts-only", () => {
    assert.match(domain, /invoices_delete_manager_draft/);
    assert.match(domain, /lifecycle_status = 'draft'/);
  });

  it("payments and ticketing cascade from invoices on hard delete", () => {
    assert.match(
      payments,
      /invoice_id uuid NOT NULL REFERENCES public\.invoices \(id\) ON DELETE CASCADE/,
    );
    assert.match(
      ticketing,
      /invoice_id uuid NOT NULL REFERENCES public\.invoices \(id\) ON DELETE CASCADE/,
    );
  });

  it("PDF path preserved on archive (no pdf_storage_path mutation)", () => {
    assert.doesNotMatch(
      sql,
      /UPDATE public\.invoices\s+SET\s+[\s\S]*pdf_storage_path\s*=/,
    );
  });

  it("delete_draft returns storage paths for best-effort cleanup", () => {
    assert.match(sql, /pdf_storage_path/);
    assert.match(sql, /logo_asset_path/);
    assert.match(sql, /DELETE FROM public\.invoices/);
  });

  it("SECURITY DEFINER helpers revoke PUBLIC", () => {
    assert.match(
      sql,
      /REVOKE ALL ON FUNCTION public\.archive_invoice\(uuid, text\) FROM PUBLIC/,
    );
    assert.match(
      sql,
      /REVOKE ALL ON FUNCTION public\.restore_invoice\(uuid\) FROM PUBLIC/,
    );
    assert.match(
      sql,
      /REVOKE ALL ON FUNCTION public\.delete_draft_invoice\(uuid\) FROM PUBLIC/,
    );
  });
});
