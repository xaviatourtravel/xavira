import type {
  InvoiceLifecycleStatus,
  InvoicePaymentStatus,
} from "@/modules/finance/types/invoices";

export type InvoiceArchiveFilter = "active" | "archived" | "all";

export type InvoiceRemovalMode = "hard_delete" | "archive" | "blocked";

/**
 * Product rule (FIN-003): removal mode depends on lifecycle only.
 * Payment status never upgrades a draft to archive or an issued row to hard-delete.
 */
export function resolveInvoiceRemovalMode(input: {
  lifecycleStatus: InvoiceLifecycleStatus | string;
  archivedAt?: string | null;
}): InvoiceRemovalMode {
  if (input.archivedAt) {
    return "blocked";
  }
  if (input.lifecycleStatus === "draft") {
    return "hard_delete";
  }
  if (
    input.lifecycleStatus === "issued" ||
    input.lifecycleStatus === "sent" ||
    input.lifecycleStatus === "void"
  ) {
    return "archive";
  }
  return "blocked";
}

export function canHardDeleteInvoice(input: {
  lifecycleStatus: InvoiceLifecycleStatus | string;
  paymentCount?: number;
  archivedAt?: string | null;
}): boolean {
  if (input.archivedAt) return false;
  if (input.lifecycleStatus !== "draft") return false;
  if ((input.paymentCount ?? 0) > 0) return false;
  return true;
}

export function canArchiveInvoice(input: {
  lifecycleStatus: InvoiceLifecycleStatus | string;
  archivedAt?: string | null;
}): boolean {
  if (input.archivedAt) return false;
  return (
    input.lifecycleStatus === "issued" ||
    input.lifecycleStatus === "sent" ||
    input.lifecycleStatus === "void"
  );
}

export function canRestoreInvoice(input: {
  archivedAt?: string | null;
}): boolean {
  return Boolean(input.archivedAt);
}

export function isInvoiceArchived(archivedAt?: string | null): boolean {
  return Boolean(archivedAt);
}

/** Paid never hard-deletes — even if somehow still draft, payments block delete. */
export function assertPaidNeverHardDeleted(input: {
  lifecycleStatus: InvoiceLifecycleStatus | string;
  paymentStatus: InvoicePaymentStatus | string;
}): void {
  if (
    input.paymentStatus === "paid" &&
    input.lifecycleStatus !== "draft"
  ) {
    // issued/sent/void paid → archive path only
    return;
  }
  if (input.paymentStatus === "paid" && input.lifecycleStatus === "draft") {
    throw new Error("Paid invoices cannot be permanently deleted");
  }
}

export function summarizeBulkRemoval(rows: Array<{
  id: string;
  lifecycleStatus: InvoiceLifecycleStatus | string;
  archivedAt?: string | null;
}>): {
  deleteIds: string[];
  archiveIds: string[];
  skippedIds: string[];
} {
  const deleteIds: string[] = [];
  const archiveIds: string[] = [];
  const skippedIds: string[] = [];

  for (const row of rows) {
    const mode = resolveInvoiceRemovalMode(row);
    if (mode === "hard_delete") deleteIds.push(row.id);
    else if (mode === "archive") archiveIds.push(row.id);
    else skippedIds.push(row.id);
  }

  return { deleteIds, archiveIds, skippedIds };
}
