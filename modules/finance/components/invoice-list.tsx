"use client";

import Link from "next/link";

import { useTranslation } from "@/lib/i18n/use-translation";
import { formatMinorAsIdr } from "@/modules/finance/lib/invoice-money";
import {
  InvoiceLifecycleBadge,
  InvoicePaymentBadge,
} from "@/modules/finance/components/invoice-status-badges";
import type { InvoiceRecord } from "@/modules/finance/types/invoices";

type InvoiceListProps = {
  rows: InvoiceRecord[];
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function InvoiceList({ rows }: InvoiceListProps) {
  const { tStrict } = useTranslation();

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
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((invoice) => (
          <article key={invoice.id} className="rounded-2xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/finance/invoices/${invoice.id}`}
                  className="block truncate font-semibold text-primary hover:underline"
                >
                  {invoice.invoiceNumber ?? tStrict("financeUi.noNumberYet")}
                </Link>
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
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border bg-card md:block">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">{tStrict("financeUi.invoiceNumber")}</th>
              <th className="px-4 py-3 font-medium">{tStrict("financeUi.customer")}</th>
              <th className="px-4 py-3 font-medium">{tStrict("financeUi.booking")}</th>
              <th className="px-4 py-3 font-medium">{tStrict("financeUi.lifecycle")}</th>
              <th className="px-4 py-3 font-medium">{tStrict("financeUi.paymentStatus")}</th>
              <th className="px-4 py-3 font-medium">{tStrict("financeUi.total")}</th>
              <th className="px-4 py-3 font-medium">{tStrict("financeUi.paid")}</th>
              <th className="px-4 py-3 font-medium">{tStrict("financeUi.balance")}</th>
              <th className="px-4 py-3 font-medium">{tStrict("financeUi.dueDate")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((invoice) => (
              <tr key={invoice.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/finance/invoices/${invoice.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {invoice.invoiceNumber ?? tStrict("financeUi.noNumberYet")}
                  </Link>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
