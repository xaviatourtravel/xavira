import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  aggregateFailureMessages,
  canArchiveInvoice,
  canHardDeleteInvoice,
  canPermanentlyDeleteArchivedInvoice,
  canRestoreInvoice,
  isInvoiceArchived,
  resolveInvoiceRemovalMode,
  summarizeBulkRemoval,
} from "@/modules/finance/lib/invoice-archive";
import {
  archiveInvoiceSchema,
  bulkRemoveInvoicesSchema,
  deleteArchivedInvoiceSchema,
  deleteDraftInvoiceSchema,
  invoiceListFiltersSchema,
  restoreInvoiceSchema,
} from "@/modules/finance/schemas/invoices";
import { roleHasPermission } from "@/lib/auth/permission-matrix";
import { canPermanentlyDeleteArchivedInvoices } from "@/modules/finance/lib/invoice-access";
import type { Profile } from "@/types/app-types";

const ARCHIVE_MIGRATION_PATH = path.join(
  process.cwd(),
  "supabase/migrations/20260828000000_invoice_archive_delete.sql",
);
const FIX_MIGRATION_PATH = path.join(
  process.cwd(),
  "supabase/migrations/20260828120000_invoice_delete_cascade_fix.sql",
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

function readFixMigration() {
  return readFileSync(FIX_MIGRATION_PATH, "utf8");
}

function readArchiveMigration() {
  return readFileSync(ARCHIVE_MIGRATION_PATH, "utf8");
}

describe("FIN-003 removal mode rules", () => {
  it("package draft can be hard deleted", () => {
    assert.equal(
      resolveInvoiceRemovalMode({ lifecycleStatus: "draft" }),
      "hard_delete",
    );
    assert.equal(
      canHardDeleteInvoice({ lifecycleStatus: "draft", paymentCount: 0 }),
      true,
    );
  });

  it("ticketing draft uses same hard-delete mode", () => {
    assert.equal(
      resolveInvoiceRemovalMode({ lifecycleStatus: "draft" }),
      "hard_delete",
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
  });

  it("paid invoice cannot be hard deleted (archive only)", () => {
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

  it("archived without payments can be permanently deleted", () => {
    assert.equal(
      canPermanentlyDeleteArchivedInvoice({
        archivedAt: "2026-08-28T00:00:00Z",
        paymentCount: 0,
      }),
      true,
    );
  });

  it("archived with payments cannot be permanently deleted", () => {
    assert.equal(
      canPermanentlyDeleteArchivedInvoice({
        archivedAt: "2026-08-28T00:00:00Z",
        paymentCount: 1,
      }),
      false,
    );
  });

  it("non-archived issued cannot use archived hard-delete eligibility", () => {
    assert.equal(
      canPermanentlyDeleteArchivedInvoice({
        archivedAt: null,
        paymentCount: 0,
      }),
      false,
    );
  });

  it("bulk summary for active never routes archived through archive", () => {
    const summary = summarizeBulkRemoval([
      { id: "a", lifecycleStatus: "draft" },
      { id: "b", lifecycleStatus: "issued" },
      { id: "c", lifecycleStatus: "sent", archivedAt: "x" },
    ]);
    assert.deepEqual(summary.deleteIds, ["a"]);
    assert.deepEqual(summary.archiveIds, ["b"]);
    assert.deepEqual(summary.skippedIds, ["c"]);
  });

  it("active bulk behavior unchanged for draft + issued", () => {
    const summary = summarizeBulkRemoval([
      { id: "d1", lifecycleStatus: "draft" },
      { id: "i1", lifecycleStatus: "issued" },
      { id: "v1", lifecycleStatus: "void" },
    ]);
    assert.deepEqual(summary.deleteIds, ["d1"]);
    assert.deepEqual(summary.archiveIds, ["i1", "v1"]);
  });

  it("archived bulk action never implies archive_invoice routing", () => {
    assert.equal(
      resolveInvoiceRemovalMode({
        lifecycleStatus: "issued",
        archivedAt: "2026-08-28T00:00:00Z",
      }),
      "permanent_delete_archived",
    );
    assert.equal(
      canArchiveInvoice({
        lifecycleStatus: "issued",
        archivedAt: "2026-08-28T00:00:00Z",
      }),
      false,
    );
  });

  it("owner/admin can permanently delete archived; finance cannot", () => {
    const owner = { role: "owner" } as Profile;
    const admin = { role: "admin" } as Profile;
    const finance = { role: "finance" } as Profile;
    assert.equal(canPermanentlyDeleteArchivedInvoices(owner), true);
    assert.equal(canPermanentlyDeleteArchivedInvoices(admin), true);
    assert.equal(canPermanentlyDeleteArchivedInvoices(finance), false);
    assert.equal(roleHasPermission("finance", "invoices.edit"), true);
  });

  it("aggregates duplicate identical errors cleanly", () => {
    assert.equal(
      aggregateFailureMessages([
        { message: "archive reason is required" },
        { message: "archive reason is required" },
        { message: "archive reason is required" },
        { message: "Invoice not found" },
      ]),
      "archive reason is required (3); Invoice not found",
    );
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
  });

  it("delete draft / archived / restore schemas accept uuid", () => {
    deleteDraftInvoiceSchema.parse({
      invoiceId: "11111111-1111-1111-1111-111111111111",
    });
    deleteArchivedInvoiceSchema.parse({
      invoiceId: "11111111-1111-1111-1111-111111111111",
    });
    restoreInvoiceSchema.parse({
      invoiceId: "11111111-1111-1111-1111-111111111111",
    });
  });

  it("bulk remove modes include restore and permanent_delete", () => {
    const active = bulkRemoveInvoicesSchema.parse({
      invoiceIds: ["11111111-1111-1111-1111-111111111111"],
      archiveReason: "cleanup",
    });
    assert.equal(active.mode, "active");
    const permanent = bulkRemoveInvoicesSchema.parse({
      invoiceIds: ["11111111-1111-1111-1111-111111111111"],
      mode: "permanent_delete",
    });
    assert.equal(permanent.mode, "permanent_delete");
    const restore = bulkRemoveInvoicesSchema.parse({
      invoiceIds: ["11111111-1111-1111-1111-111111111111"],
      mode: "restore",
    });
    assert.equal(restore.mode, "restore");
  });
});

describe("FIN-003A cascade delete + archived permanent delete contracts", () => {
  const fix = readFixMigration();
  const archive = readArchiveMigration();
  const domain = readFileSync(DOMAIN_MIGRATION_PATH, "utf8");
  const payments = readFileSync(PAYMENTS_MIGRATION_PATH, "utf8");
  const ticketing = readFileSync(TICKETING_MIGRATION_PATH, "utf8");

  it("root cause function is lock_parent_invoice_for_ticket_mutation", () => {
    assert.match(
      ticketing,
      /Ticket row must reference an existing invoice/,
    );
    assert.match(ticketing, /lock_parent_invoice_for_ticket_mutation/);
    assert.match(fix, /CREATE OR REPLACE FUNCTION public\.lock_parent_invoice_for_ticket_mutation/);
  });

  it("DELETE allows missing parent (cascade); INSERT/UPDATE still require parent", () => {
    assert.match(fix, /IF TG_OP = 'DELETE' THEN/);
    assert.match(fix, /IF NOT FOUND THEN\s+RETURN OLD;/);
    assert.match(fix, /Ticket row must reference an existing invoice/);
  });

  it("ticket integrity still enforced on insert/update via validate triggers", () => {
    assert.match(ticketing, /validate_ticket_group_refs/);
    assert.match(ticketing, /Ticket groups can only attach to ticketing invoices/);
    assert.match(ticketing, /BEFORE INSERT OR UPDATE OF organization_id, invoice_id/);
    assert.doesNotMatch(
      fix,
      /DROP TRIGGER IF EXISTS invoice_ticket_groups_validate_refs/,
    );
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

  it("trusted delete flag allows issued child cascade during permanent delete", () => {
    assert.match(fix, /app\.trusted_invoice_delete/);
    assert.match(fix, /prevent_issued_ticket_group_edit/);
    assert.match(fix, /prevent_issued_flight_segment_edit/);
    assert.match(fix, /prevent_issued_invoice_item_edit/);
  });

  it("delete_draft_invoice sets trusted flag before DELETE", () => {
    assert.match(
      fix,
      /PERFORM set_config\('app\.trusted_invoice_delete', '1', true\);/,
    );
    assert.match(fix, /Only draft invoices can be permanently deleted/);
  });

  it("delete_archived_invoice requires archived + blocks payments", () => {
    assert.match(
      fix,
      /CREATE OR REPLACE FUNCTION public\.delete_archived_invoice\(p_invoice_id uuid\)/,
    );
    assert.match(
      fix,
      /Only archived invoices can be permanently deleted with this operation/,
    );
    assert.match(
      fix,
      /Invoice memiliki riwayat pembayaran dan tidak dapat dihapus permanen\./,
    );
    assert.doesNotMatch(
      fix,
      /delete_archived_invoice\([^)]*p_organization_id/,
    );
    assert.doesNotMatch(fix, /delete_archived_invoice\([^)]*p_actor/);
  });

  it("archived permanent delete permission is owner/admin only", () => {
    assert.match(
      fix,
      /can_permanently_delete_archived_invoices/,
    );
    assert.match(fix, /RETURN v_role IN \('owner', 'admin'\)/);
  });

  it("cross-workspace deletion rejected via org check", () => {
    assert.match(
      fix,
      /can_permanently_delete_archived_invoices\(v_invoice\.organization_id\)/,
    );
    assert.match(fix, /FOR UPDATE/);
  });

  it("issued hard-delete via draft RPC remains blocked", () => {
    assert.match(fix, /Only draft invoices can be permanently deleted/);
    assert.match(domain, /invoices_delete_manager_draft/);
    assert.match(domain, /lifecycle_status = 'draft'/);
  });

  it("FIN-003 archive/restore RPCs still present", () => {
    assert.match(archive, /archive_invoice/);
    assert.match(archive, /restore_invoice/);
    assert.match(archive, /INVOICE_ARCHIVED/);
    assert.match(archive, /INVOICE_RESTORED/);
  });
});
