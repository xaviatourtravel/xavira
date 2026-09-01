import Link from "next/link";

import { formatMinorAsIdr } from "@/modules/finance/lib/invoice-money";
import { ProformaStatusBadge } from "@/modules/finance/components/proforma-status-badge";
import type { ProformaRecord } from "@/modules/finance/types/proforma";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function ProformaList({
  rows,
  emptyTitle,
  emptyDescription,
  createHref,
  createLabel,
  columns,
}: {
  rows: ProformaRecord[];
  emptyTitle: string;
  emptyDescription: string;
  createHref?: string;
  createLabel?: string;
  columns: {
    reference: string;
    recipient: string;
    date: string;
    total: string;
    status: string;
    invoice: string;
  };
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border bg-card px-6 py-12 text-center">
        <p className="font-medium">{emptyTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
        {createHref && createLabel ? (
          <Link
            href={createHref}
            className="mt-4 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            {createLabel}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b text-xs text-muted-foreground">
            <th className="px-4 py-3 font-medium">{columns.reference}</th>
            <th className="px-4 py-3 font-medium">{columns.recipient}</th>
            <th className="px-4 py-3 font-medium">{columns.date}</th>
            <th className="px-4 py-3 font-medium">{columns.total}</th>
            <th className="px-4 py-3 font-medium">{columns.status}</th>
            <th className="px-4 py-3 font-medium">{columns.invoice}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              <td className="px-4 py-3">
                <Link
                  href={`/finance/proformas/${row.id}`}
                  className="font-medium hover:underline"
                >
                  {row.proformaNumber}
                </Link>
              </td>
              <td className="px-4 py-3">{row.recipientDisplayName ?? "—"}</td>
              <td className="px-4 py-3">{formatDate(row.issueDate ?? row.createdAt)}</td>
              <td className="px-4 py-3">{formatMinorAsIdr(row.totalMinor)}</td>
              <td className="px-4 py-3">
                <ProformaStatusBadge status={row.lifecycleStatus} />
              </td>
              <td className="px-4 py-3">
                {row.convertedInvoiceId && row.convertedInvoiceNumber ? (
                  <Link
                    href={`/finance/invoices/${row.convertedInvoiceId}`}
                    className="hover:underline"
                  >
                    {row.convertedInvoiceNumber}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
