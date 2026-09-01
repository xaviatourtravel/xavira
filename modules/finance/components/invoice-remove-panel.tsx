"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  archiveInvoiceFormAction,
  deleteArchivedInvoiceFormAction,
  deleteDraftInvoiceFormAction,
  restoreInvoiceFormAction,
} from "@/modules/finance/actions/invoice-actions";
import type { InvoiceLifecycleStatus } from "@/modules/finance/types/invoices";

type InvoiceRemovePanelProps = {
  invoiceId: string;
  lifecycleStatus: InvoiceLifecycleStatus;
  archivedAt: string | null;
  canRemove: boolean;
  canPermanentlyDeleteArchived: boolean;
  /** Soft UI hint; RPC is authoritative for payment history. */
  likelyHasPayments?: boolean;
};

export function InvoiceRemovePanel({
  invoiceId,
  lifecycleStatus,
  archivedAt,
  canRemove,
  canPermanentlyDeleteArchived,
  likelyHasPayments = false,
}: InvoiceRemovePanelProps) {
  const { tStrict } = useTranslation();
  const [open, setOpen] = useState(false);
  const [permanentOpen, setPermanentOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (archivedAt) {
    if (!canRemove && !canPermanentlyDeleteArchived) return null;

    return (
      <div className="space-y-4">
        <div className="space-y-3 rounded-2xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            {tStrict("financeUi.archivedNotice")}
          </p>
          {canRemove ? (
            <form action={restoreInvoiceFormAction} data-global-loading="">
              <input type="hidden" name="invoice_id" value={invoiceId} />
              <Button type="submit" variant="outline" disabled={pending}>
                {tStrict("financeUi.restoreInvoice")}
              </Button>
            </form>
          ) : null}
        </div>

        {canPermanentlyDeleteArchived ? (
          <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50/40 p-4 dark:border-rose-900 dark:bg-rose-950/20">
            <h2 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
              {tStrict("financeUi.deletePermanently")}
            </h2>
            {likelyHasPayments ? (
              <p className="text-sm text-rose-800 dark:text-rose-200">
                {tStrict("financeUi.deleteArchivedBlockedPayments")}
              </p>
            ) : !permanentOpen ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setPermanentOpen(true)}
              >
                {tStrict("financeUi.deletePermanently")}
              </Button>
            ) : (
              <form
                action={(formData) => {
                  startTransition(() => {
                    void deleteArchivedInvoiceFormAction(formData);
                  });
                }}
                data-global-loading=""
                className="space-y-3"
              >
                <input type="hidden" name="invoice_id" value={invoiceId} />
                <p className="text-sm font-medium">
                  {tStrict("financeUi.deleteArchivedTitle")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {tStrict("financeUi.deleteArchivedDescription")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPermanentOpen(false)}
                    disabled={pending}
                  >
                    {tStrict("financeUi.cancelAction")}
                  </Button>
                    <Button type="submit" variant="destructive" disabled={pending}>
                    {tStrict("financeUi.deletePermanently")}
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  if (!canRemove) return null;

  const isDraft = lifecycleStatus === "draft";
  const canArchive =
    lifecycleStatus === "issued" ||
    lifecycleStatus === "sent" ||
    lifecycleStatus === "void";

  if (!isDraft && !canArchive) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50/40 p-4 dark:border-rose-900 dark:bg-rose-950/20">
      <h2 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
        {tStrict("financeUi.deleteInvoice")}
      </h2>

      {!open ? (
        <Button
          type="button"
          variant="destructive"
          onClick={() => setOpen(true)}
        >
          {tStrict("financeUi.deleteInvoice")}
        </Button>
      ) : isDraft ? (
        <form
          action={(formData) => {
            startTransition(() => {
              void deleteDraftInvoiceFormAction(formData);
            });
          }}
          data-global-loading=""
          className="space-y-3"
        >
          <input type="hidden" name="invoice_id" value={invoiceId} />
          <p className="text-sm font-medium">{tStrict("financeUi.deleteDraftTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {tStrict("financeUi.deleteDraftDescription")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              {tStrict("financeUi.cancelAction")}
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {tStrict("financeUi.deleteDraftConfirm")}
            </Button>
          </div>
        </form>
      ) : (
        <form
          action={(formData) => {
            startTransition(() => {
              void archiveInvoiceFormAction(formData);
            });
          }}
          data-global-loading=""
          className="space-y-3"
        >
          <input type="hidden" name="invoice_id" value={invoiceId} />
          <p className="text-sm font-medium">
            {tStrict("financeUi.archiveInvoiceTitle")}
          </p>
          <p className="text-sm text-muted-foreground">
            {tStrict("financeUi.archiveInvoiceDescription")}
          </p>
          <label className="block text-sm">
            <span className="mb-1 block">{tStrict("financeUi.archiveReason")}</span>
            <textarea
              name="reason"
              required
              rows={2}
              placeholder={tStrict("financeUi.archiveReasonPlaceholder")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              {tStrict("financeUi.cancelAction")}
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {tStrict("financeUi.archiveConfirm")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
