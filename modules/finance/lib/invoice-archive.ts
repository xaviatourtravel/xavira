import type {
  InvoiceLifecycleStatus,
  InvoicePaymentStatus,
} from "@/modules/finance/types/invoices";

export type InvoiceArchiveFilter = "active" | "archived" | "all";

export type InvoiceRemovalMode =
  | "hard_delete"
  | "archive"
  | "permanent_delete_archived"
  | "restore"
  | "blocked";

export type BulkInvoiceAction = "remove_active" | "restore" | "permanent_delete";

/**
 * Active-list removal: draft → hard delete, issued/sent/void → archive.
 * Archived rows never go through archive_invoice().
 */
export function resolveInvoiceRemovalMode(input: {
  lifecycleStatus: InvoiceLifecycleStatus | string;
  archivedAt?: string | null;
}): InvoiceRemovalMode {
  if (input.archivedAt) {
    return "permanent_delete_archived";
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

export function canPermanentlyDeleteArchivedInvoice(input: {
  archivedAt?: string | null;
  paymentCount?: number;
}): boolean {
  if (!input.archivedAt) return false;
  if ((input.paymentCount ?? 0) > 0) return false;
  return true;
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
    if (row.archivedAt) {
      skippedIds.push(row.id);
      continue;
    }
    const mode = resolveInvoiceRemovalMode(row);
    if (mode === "hard_delete") deleteIds.push(row.id);
    else if (mode === "archive") archiveIds.push(row.id);
    else skippedIds.push(row.id);
  }

  return { deleteIds, archiveIds, skippedIds };
}

export function summarizeBulkArchivedPermanentDelete(rows: Array<{
  id: string;
  archivedAt?: string | null;
}>): { eligibleIds: string[]; skippedIds: string[] } {
  const eligibleIds: string[] = [];
  const skippedIds: string[] = [];
  for (const row of rows) {
    if (row.archivedAt) eligibleIds.push(row.id);
    else skippedIds.push(row.id);
  }
  return { eligibleIds, skippedIds };
}

/** Collapse repeated identical failure messages for clean UI banners. */
export function aggregateFailureMessages(
  failed: Array<{ message: string }>,
): string {
  const counts = new Map<string, number>();
  for (const row of failed) {
    const key = row.message.trim() || "Failed";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([message, count]) =>
      count > 1 ? `${message} (${count})` : message,
    )
    .join("; ");
}

export function shouldRouteBulkThroughArchive(rows: Array<{
  archivedAt?: string | null;
}>): boolean {
  return rows.some((row) => !row.archivedAt);
}
