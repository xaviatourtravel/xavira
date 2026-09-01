"use client";

import { useTranslation } from "@/lib/i18n/use-translation";
import type { ProformaLifecycleStatus } from "@/modules/finance/types/proforma";
import { cn } from "@/lib/utils";

const statusKey = {
  draft: "financeUi.statusProformaDraft",
  converted: "financeUi.statusProformaConverted",
  cancelled: "financeUi.statusProformaCancelled",
} as const;

export function ProformaStatusBadge({
  status,
}: {
  status: ProformaLifecycleStatus;
}) {
  const { tStrict } = useTranslation();
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "draft" && "bg-slate-100 text-slate-700",
        status === "converted" && "bg-sky-100 text-sky-800",
        status === "cancelled" && "bg-rose-100 text-rose-800",
      )}
    >
      {tStrict(statusKey[status])}
    </span>
  );
}
