"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  archiveInvoiceFormAction,
  deleteDraftInvoiceFormAction,
  restoreInvoiceFormAction,
} from "@/modules/finance/actions/invoice-actions";
import type { InvoiceLifecycleStatus } from "@/modules/finance/types/invoices";

type InvoiceRemovePanelProps = {
  invoiceId: string;
  lifecycleStatus: InvoiceLifecycleStatus;
  archivedAt: string | null;
  canRemove: boolean;
};

export function InvoiceRemovePanel({
  invoiceId,
  lifecycleStatus,
  archivedAt,
  canRemove,
}: InvoiceRemovePanelProps) {
  const { tStrict } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!canRemove) return null;

  if (archivedAt) {
    return (
      <form
        action={restoreInvoiceFormAction}
        className="space-y-3 rounded-2xl border bg-card p-4"
      >
        <input type="hidden" name="invoice_id" value={invoiceId} />
        <p className="text-sm text-muted-foreground">
          {tStrict("financeUi.archivedNotice")}
        </p>
        <Button type="submit" variant="outline" disabled={pending}>
          {tStrict("financeUi.restoreInvoice")}
        </Button>
      </form>
    );
  }

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
              {pending
                ? "…"
                : tStrict("financeUi.deleteDraftConfirm")}
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
              {pending ? "…" : tStrict("financeUi.archiveConfirm")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
