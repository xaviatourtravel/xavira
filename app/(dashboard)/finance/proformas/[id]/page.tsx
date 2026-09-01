import Link from "next/link";
import { notFound } from "next/navigation";

import { requireProfile } from "@/lib/auth/session";
import { assertRoutePermission } from "@/lib/auth/route-access";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/dictionary";
import { ProformaLifecycleActions } from "@/modules/finance/components/proforma-lifecycle-actions";
import { ProformaStatusBadge } from "@/modules/finance/components/proforma-status-badge";
import {
  canEditInvoices,
  canIssueInvoices,
  canVoidInvoices,
} from "@/modules/finance/lib/invoice-access";
import {
  canCancelProforma,
  canConvertProforma,
  canDeleteProforma,
  isProformaEditable,
} from "@/modules/finance/lib/proforma-lifecycle";
import { formatMinorAsIdr } from "@/modules/finance/lib/invoice-money";
import { getOrganizationProforma } from "@/modules/finance/services/proforma-service";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export default async function ProformaDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { profile } = await requireProfile();
  assertRoutePermission(profile, "invoices.view");
  const t = createTranslator(DEFAULT_LOCALE);
  const { id } = await params;
  const query = await searchParams;

  let proforma;
  try {
    proforma = await getOrganizationProforma(profile, id);
  } catch {
    notFound();
  }

  const customerSnapshot = proforma.customerSnapshot as {
    name?: string;
    phone?: string | null;
    email?: string | null;
    company?: string | null;
  };
  const recipientName =
    proforma.recipientDisplayName ??
    customerSnapshot.name ??
    proforma.customerName ??
    proforma.manualRecipientName ??
    t("financeUi.recipientUnset");

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/finance/proformas" className="hover:underline">
              {t("financeUi.backToProformas")}
            </Link>
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("financeUi.proformaDraftTitle")}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {proforma.proformaNumber}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <ProformaStatusBadge status={proforma.lifecycleStatus} />
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-muted text-muted-foreground">
              {t("financeUi.typeLabelPackage")}
            </span>
          </div>
        </div>
        {isProformaEditable(proforma.lifecycleStatus) && canEditInvoices(profile) ? (
          <Link
            href={`/finance/proformas/${proforma.id}/edit`}
            className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
          >
            {t("financeUi.editDraft")}
          </Link>
        ) : null}
      </div>

      {query.error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {query.error}
        </p>
      ) : null}

      {proforma.lifecycleStatus === "converted" && proforma.convertedInvoiceId ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t("financeUi.convertedToInvoice")}{" "}
          <Link
            href={`/finance/invoices/${proforma.convertedInvoiceId}`}
            className="font-medium underline"
          >
            {proforma.convertedInvoiceNumber ?? proforma.convertedInvoiceId}
          </Link>
        </p>
      ) : null}

      <ProformaLifecycleActions
        proformaId={proforma.id}
        canConvert={canConvertProforma(proforma) && canIssueInvoices(profile)}
        canCancel={canCancelProforma(proforma) && canVoidInvoices(profile)}
        canDelete={canDeleteProforma(proforma) && canEditInvoices(profile)}
      />

      <section className="space-y-3 rounded-2xl border bg-card p-4">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          {t("financeUi.pdfSection")}
        </h2>
        <a
          href={`/api/finance/proformas/${proforma.id}/pdf?preview=1`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          {t("financeUi.previewProforma")}
        </a>
      </section>

      <section className="rounded-2xl border bg-card p-4">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          {t("financeUi.sectionCustomerBooking")}
        </h2>
        <p className="mt-2 font-medium">{recipientName}</p>
        <p className="text-sm text-muted-foreground">
          {customerSnapshot.phone ?? proforma.manualRecipientPhone ?? "—"}
        </p>
      </section>

      <section className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="px-4 py-3">{t("financeUi.description")}</th>
              <th className="px-4 py-3">{t("financeUi.quantity")}</th>
              <th className="px-4 py-3">{t("financeUi.unitPrice")}</th>
              <th className="px-4 py-3">{t("financeUi.lineTotal")}</th>
            </tr>
          </thead>
          <tbody>
            {(proforma.items ?? []).map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{item.description}</p>
                  {item.detail ? (
                    <p className="whitespace-pre-line text-xs text-muted-foreground">
                      {item.detail}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {item.quantity} {item.unit}
                </td>
                <td className="px-4 py-3">
                  {formatMinorAsIdr(item.unitPriceMinor)}
                </td>
                <td className="px-4 py-3">
                  {formatMinorAsIdr(item.lineTotalMinor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <dl className="grid gap-2 rounded-2xl border bg-card p-4 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-4">
          <dt>{t("financeUi.issueDate")}</dt>
          <dd>{formatDate(proforma.issueDate)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>{t("financeUi.dueDate")}</dt>
          <dd>{formatDate(proforma.dueDate)}</dd>
        </div>
        <div className="flex justify-between gap-4 sm:col-span-2">
          <dt className="font-semibold">{t("financeUi.total")}</dt>
          <dd className="font-semibold">{formatMinorAsIdr(proforma.totalMinor)}</dd>
        </div>
      </dl>
    </div>
  );
}
