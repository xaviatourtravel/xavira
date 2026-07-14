"use client";

import { useTranslation } from "@/lib/i18n/use-translation";
import type {
  InvoiceLifecycleStatus,
  InvoicePaymentStatus,
} from "@/modules/finance/types/invoices";
import { cn } from "@/lib/utils";

const lifecycleKey = {
  draft: "financeUi.statusDraft",
  issued: "financeUi.statusIssued",
  sent: "financeUi.statusSent",
  void: "financeUi.statusVoid",
} as const;

const paymentKey = {
  unpaid: "financeUi.paymentUnpaid",
  partially_paid: "financeUi.paymentPartiallyPaid",
  paid: "financeUi.paymentPaid",
  overdue: "financeUi.paymentOverdue",
} as const;

export function InvoiceLifecycleBadge({
  status,
}: {
  status: InvoiceLifecycleStatus;
}) {
  const { tStrict } = useTranslation();
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "draft" && "bg-slate-100 text-slate-700",
        status === "issued" && "bg-sky-100 text-sky-800",
        status === "sent" && "bg-emerald-100 text-emerald-800",
        status === "void" && "bg-rose-100 text-rose-800",
      )}
    >
      {tStrict(lifecycleKey[status])}
    </span>
  );
}

export function InvoicePaymentBadge({
  status,
}: {
  status: InvoicePaymentStatus | "overdue";
}) {
  const { tStrict } = useTranslation();
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "unpaid" && "bg-amber-100 text-amber-800",
        status === "partially_paid" && "bg-orange-100 text-orange-800",
        status === "paid" && "bg-emerald-100 text-emerald-800",
        status === "overdue" && "bg-rose-100 text-rose-800",
      )}
    >
      {tStrict(paymentKey[status])}
    </span>
  );
}
