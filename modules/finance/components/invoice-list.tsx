"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/use-translation";
import { bulkRemoveInvoicesAction } from "@/modules/finance/actions/invoice-actions";
import {
  InvoiceLifecycleBadge,
  InvoicePaymentBadge,
} from "@/modules/finance/components/invoice-status-badges";
import {
  aggregateFailureMessages,
  summarizeBulkRemoval,
} from "@/modules/finance/lib/invoice-archive";
import { formatMinorAsIdr } from "@/modules/finance/lib/invoice-money";
import type { InvoiceRecord } from "@/modules/finance/types/invoices";
import { restoreInvoiceFormAction } from "@/modules/finance/actions/invoice-actions";

type InvoiceListProps = {
  rows: InvoiceRecord[];
  canRemove?: boolean;
  canPermanentlyDeleteArchived?: boolean;
  /** When true, bulk actions are restore / permanent delete (never archive). */
  archivedView?: boolean;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function InvoiceTypeLabel({ invoice }: { invoice: InvoiceRecord }) {
  const { tStrict } = useTranslation();
  const isTicketing = invoice.invoiceType === "ticketing";
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        isTicketing
          ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {isTicketing
        ? tStrict("financeUi.typeLabelTicketing")
        : tStrict("financeUi.typeLabelPackage")}
    </span>
  );
}

function ArchivedBadge() {
  const { tStrict } = useTranslation();
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
      {tStrict("financeUi.statusArchived")}
    </span>
  );
}

export function InvoiceList({
  rows,
  canRemove = false,
  canPermanentlyDeleteArchived = false,
  archivedView = false,
}: InvoiceListProps) {
  const { tStrict } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<
    "active" | "restore" | "permanent_delete"
  >("active");
  const [archiveReason, setArchiveReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedRows = useMemo(
    () => rows.filter((row) => selected.has(row.id)),
    [rows, selected],
  );
  const summary = summarizeBulkRemoval(selectedRows);
  const showBulk = archivedView
    ? canRemove || canPermanentlyDeleteArchived
    : canRemove;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === rows.length) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(rows.map((row) => row.id)));
  }

  function openConfirm(mode: "active" | "restore" | "permanent_delete") {
    setConfirmMode(mode);
    setConfirmOpen(true);
    setError(null);
  }

  function runBulk() {
    setError(null);
    startTransition(async () => {
      const result = await bulkRemoveInvoicesAction({
        invoiceIds: Array.from(selected),
        archiveReason:
          confirmMode === "active"
            ? archiveReason.trim() || undefined
            : undefined,
        mode: confirmMode,
      });
      if (!result.success) {
        setError(result.message);
        return;
      }
      if (result.failed.length > 0) {
        setError(
          `${tStrict("financeUi.bulkPartialFailure")} ${aggregateFailureMessages(result.failed)}`,
        );
      } else {
        setConfirmOpen(false);
        setSelected(new Set());
        setArchiveReason("");
      }
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card/40 px-6 py-12 text-center">
        <h2 className="text-base font-semibold">{tStrict("financeUi.emptyTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {tStrict("financeUi.emptyDescription")}
        </p>
        <Link
          href="/finance/invoices/new"
          className="mt-4 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          {tStrict("financeUi.createInvoice")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showBulk && selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card px-4 py-3">
          <p className="text-sm">
            {tStrict("financeUi.bulkSelectedCount").replace(
              "{count}",
              String(selected.size),
            )}
          </p>
          {archivedView ? (
            <>
              {canRemove ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openConfirm("restore")}
                >
                  {tStrict("financeUi.restoreInvoice")}
                </Button>
              ) : null}
              {canPermanentlyDeleteArchived ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => openConfirm("permanent_delete")}
                >
                  {tStrict("financeUi.deletePermanently")}
                </Button>
              ) : null}
            </>
          ) : (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => openConfirm("active")}
            >
              {tStrict("financeUi.bulkDeleteArchive")}
            </Button>
          )}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      {confirmOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-remove-title"
          className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900 dark:bg-rose-950/20"
        >
          <h2 id="bulk-remove-title" className="text-sm font-semibold">
            {confirmMode === "permanent_delete"
              ? tStrict("financeUi.bulkPermanentDeleteTitle")
              : confirmMode === "restore"
                ? tStrict("financeUi.bulkRestoreTitle")
                : tStrict("financeUi.bulkConfirmTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {tStrict("financeUi.bulkSelectedCount").replace(
              "{count}",
              String(selected.size),
            )}
          </p>
          {confirmMode === "permanent_delete" ? (
            <p className="text-sm">
              {tStrict("financeUi.bulkPermanentDeleteDescription")}
            </p>
          ) : null}
          {confirmMode === "active" && summary.deleteIds.length > 0 ? (
            <p className="text-sm">
              {tStrict("financeUi.bulkDeleteSummary").replace(
                "{count}",
                String(summary.deleteIds.length),
              )}
            </p>
          ) : null}
          {confirmMode === "active" && summary.archiveIds.length > 0 ? (
            <p className="text-sm">
              {tStrict("financeUi.bulkArchiveSummary").replace(
                "{count}",
                String(summary.archiveIds.length),
              )}
            </p>
          ) : null}
          {confirmMode === "active" && summary.archiveIds.length > 0 ? (
            <label className="block text-sm">
              <span className="mb-1 block">{tStrict("financeUi.archiveReason")}</span>
              <textarea
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                required
                rows={2}
                placeholder={tStrict("financeUi.archiveReasonPlaceholder")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              {tStrict("financeUi.cancelAction")}
            </Button>
            <Button
              type="button"
              variant={confirmMode === "restore" ? "outline" : "destructive"}
              disabled={
                pending ||
                (confirmMode === "active" &&
                  summary.archiveIds.length > 0 &&
                  !archiveReason.trim())
              }
              onClick={runBulk}
            >
              {pending
                ? "…"
                : confirmMode === "restore"
                  ? tStrict("financeUi.restoreInvoice")
                  : confirmMode === "permanent_delete"
                    ? tStrict("financeUi.deletePermanently")
                    : tStrict("financeUi.bulkConfirm")}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-3 md:hidden">
        {rows.map((invoice) => (
          <article key={invoice.id} className="rounded-2xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {showBulk ? (
                    <input
                      type="checkbox"
                      checked={selected.has(invoice.id)}
                      onChange={() => toggle(invoice.id)}
                      aria-label={invoice.invoiceNumber ?? invoice.id}
                      className="mt-1 h-4 w-4"
                    />
                  ) : null}
                  <Link
                    href={`/finance/invoices/${invoice.id}`}
                    className="block truncate font-semibold text-primary hover:underline"
                  >
                    {invoice.invoiceNumber ?? tStrict("financeUi.noNumberYet")}
                  </Link>
                  <InvoiceTypeLabel invoice={invoice} />
                  {invoice.archivedAt ? <ArchivedBadge /> : null}
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {invoice.recipientDisplayName ?? invoice.customerName ?? "—"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <InvoiceLifecycleBadge status={invoice.lifecycleStatus} />
                <InvoicePaymentBadge
                  status={invoice.effectivePaymentStatus ?? invoice.paymentStatus}
                />
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">
                  {tStrict("financeUi.total")}
                </dt>
                <dd className="font-medium">
                  {formatMinorAsIdr(invoice.totalMinor)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {tStrict("financeUi.balance")}
                </dt>
                <dd className="font-medium">
                  {formatMinorAsIdr(invoice.balanceDueMinor)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {tStrict("financeUi.dueDate")}
                </dt>
                <dd className="font-medium">{formatDate(invoice.dueDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {tStrict("financeUi.booking")}
                </dt>
                <dd className="font-medium">{invoice.bookingCode ?? "—"}</dd>
              </div>
            </dl>
            {canRemove && invoice.archivedAt ? (
              <form action={restoreInvoiceFormAction} className="mt-3">
                <input type="hidden" name="invoice_id" value={invoice.id} />
                <Button type="submit" variant="outline" size="sm">
                  {tStrict("financeUi.restoreInvoice")}
                </Button>
              </form>
            ) : null}
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border bg-card md:block">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {showBulk ? (
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.size === rows.length && rows.length > 0}
                    onChange={toggleAll}
                    aria-label={tStrict("financeUi.bulkDeleteArchive")}
                    className="h-4 w-4"
                  />
                </th>
              ) : null}
              <th className="px-4 py-3 font-medium">{tStrict("financeUi.invoiceNumber")}</th>
              <th className="px-4 py-3 font-medium">{tStrict("financeUi.customer")}</th>
              <th className="px-4 py-3 font-medium">{tStrict("financeUi.booking")}</th>
              <th className="px-4 py-3 font-medium">{tStrict("financeUi.lifecycle")}</th>
              <th className="px-4 py-3 font-medium">{tStrict("financeUi.paymentStatus")}</th>
              <th className="px-4 py-3 font-medium">{tStrict("financeUi.total")}</th>
              <th className="px-4 py-3 font-medium">{tStrict("financeUi.paid")}</th>
              <th className="px-4 py-3 font-medium">{tStrict("financeUi.balance")}</th>
              <th className="px-4 py-3 font-medium">{tStrict("financeUi.dueDate")}</th>
              {showBulk ? (
                <th className="px-4 py-3 font-medium">{tStrict("financeUi.viewInvoice")}</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((invoice) => (
              <tr key={invoice.id} className="border-b last:border-0">
                {showBulk ? (
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(invoice.id)}
                      onChange={() => toggle(invoice.id)}
                      aria-label={invoice.invoiceNumber ?? invoice.id}
                      className="h-4 w-4"
                    />
                  </td>
                ) : null}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/finance/invoices/${invoice.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {invoice.invoiceNumber ?? tStrict("financeUi.noNumberYet")}
                    </Link>
                    <InvoiceTypeLabel invoice={invoice} />
                    {invoice.archivedAt ? <ArchivedBadge /> : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {invoice.recipientDisplayName ?? invoice.customerName ?? "—"}
                </td>
                <td className="px-4 py-3">{invoice.bookingCode ?? "—"}</td>
                <td className="px-4 py-3">
                  <InvoiceLifecycleBadge status={invoice.lifecycleStatus} />
                </td>
                <td className="px-4 py-3">
                  <InvoicePaymentBadge
                    status={
                      invoice.effectivePaymentStatus ?? invoice.paymentStatus
                    }
                  />
                </td>
                <td className="px-4 py-3">{formatMinorAsIdr(invoice.totalMinor)}</td>
                <td className="px-4 py-3">{formatMinorAsIdr(invoice.amountPaidMinor)}</td>
                <td className="px-4 py-3">{formatMinorAsIdr(invoice.balanceDueMinor)}</td>
                <td className="px-4 py-3">{formatDate(invoice.dueDate)}</td>
                {showBulk ? (
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/finance/invoices/${invoice.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {tStrict("financeUi.viewInvoice")}
                      </Link>
                      {canRemove && invoice.archivedAt ? (
                        <form action={restoreInvoiceFormAction}>
                          <input type="hidden" name="invoice_id" value={invoice.id} />
                          <button
                            type="submit"
                            className="text-sm text-primary hover:underline"
                          >
                            {tStrict("financeUi.restoreInvoice")}
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
