import Link from "next/link";

import { formatMinorAsIdr } from "@/modules/finance/lib/invoice-money";
import { InvoiceList } from "@/modules/finance/components/invoice-list";
import { invoiceListFiltersSchema } from "@/modules/finance/schemas/invoices";
import { listOrganizationInvoices } from "@/modules/finance/services/invoice-service";
import {
  canCreateInvoices,
  canEditInvoices,
  canPermanentlyDeleteArchivedInvoices,
  canRemoveInvoices,
} from "@/modules/finance/lib/invoice-access";
import {
  invoiceBrandWorkspacePath,
  invoiceCreatePath,
} from "@/modules/finance/lib/invoice-brand-workspaces";
import type { InvoiceBrandProfileKey } from "@/modules/finance/lib/invoice-brand-profiles";
import type { Profile } from "@/types/app-types";
import type { TranslateFn } from "@/lib/i18n/dictionary";

type SearchParams = {
  q?: string;
  lifecycle?: string;
  payment?: string;
  archive?: string;
  deleted?: string;
  archived?: string;
};

export async function InvoiceWorkspacePage({
  brandKey,
  profile,
  t,
  params,
}: {
  brandKey: InvoiceBrandProfileKey;
  profile: Profile;
  t: TranslateFn;
  params: SearchParams;
}) {
  const archiveRaw = params.archive || "active";
  const archiveFilter =
    archiveRaw === "archived" || archiveRaw === "all" ? archiveRaw : "active";
  const listPath = invoiceBrandWorkspacePath(brandKey);
  const createHref = invoiceCreatePath({ brandKey, type: "package" });

  const filters = invoiceListFiltersSchema.parse({
    q: params.q || undefined,
    lifecycleStatus: params.lifecycle || undefined,
    paymentStatus: params.payment || undefined,
    archiveFilter,
    brandKey,
  });

  const [invoices, activeForSummary] = await Promise.all([
    listOrganizationInvoices(profile, filters),
    archiveFilter === "active"
      ? Promise.resolve(null)
      : listOrganizationInvoices(profile, { archiveFilter: "active", brandKey }),
  ]);

  const summarySource = activeForSummary ?? invoices;
  const summary = {
    drafts: summarySource.filter((row) => row.lifecycleStatus === "draft").length,
    issued: summarySource.filter(
      (row) =>
        row.lifecycleStatus === "issued" || row.lifecycleStatus === "sent",
    ).length,
    unpaid: summarySource.filter(
      (row) => (row.effectivePaymentStatus ?? row.paymentStatus) === "unpaid",
    ).length,
    overdue: summarySource.filter(
      (row) => row.effectivePaymentStatus === "overdue",
    ).length,
  };

  const title =
    brandKey === "consortium"
      ? t("financeUi.invoiceWorkspaceConsortiumTitle")
      : t("financeUi.invoiceWorkspaceXaviaTitle");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/finance" className="hover:underline">
              {t("navigation.finance")}
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("financeUi.invoiceWorkspaceSubtitle")}
          </p>
        </div>
        {canCreateInvoices(profile) ? (
          <div className="flex flex-wrap gap-2">
            {canEditInvoices(profile) ? (
              <Link
                href={`/finance/invoices/settings?brand=${brandKey}`}
                className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
              >
                {t("financeUi.brandSettingsTitle")}
              </Link>
            ) : null}
            <Link
              href={createHref}
              className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              {t("financeUi.createInvoice")}
            </Link>
          </div>
        ) : null}
      </div>

      {params.deleted === "1" ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t("financeUi.deletedBanner")}
        </p>
      ) : null}
      {params.archived === "1" ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t("financeUi.archivedBanner")}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t("financeUi.summaryDrafts"), value: summary.drafts },
          { label: t("financeUi.summaryIssued"), value: summary.issued },
          { label: t("financeUi.summaryUnpaid"), value: summary.unpaid },
          { label: t("financeUi.summaryOverdue"), value: summary.overdue },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <form className="flex flex-wrap gap-3" method="get" action={listPath}>
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder={t("financeUi.searchPlaceholder")}
          className="h-10 min-w-[220px] flex-1 rounded-md border border-input bg-background px-3 text-sm"
        />
        <select
          name="lifecycle"
          defaultValue={params.lifecycle ?? ""}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          aria-label={t("financeUi.filterLifecycle")}
        >
          <option value="">{t("financeUi.filterAll")}</option>
          <option value="draft">{t("financeUi.statusDraft")}</option>
          <option value="issued">{t("financeUi.statusIssued")}</option>
          <option value="sent">{t("financeUi.statusSent")}</option>
          <option value="void">{t("financeUi.statusVoid")}</option>
        </select>
        <select
          name="payment"
          defaultValue={params.payment ?? ""}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          aria-label={t("financeUi.filterPayment")}
        >
          <option value="">{t("financeUi.filterAll")}</option>
          <option value="unpaid">{t("financeUi.paymentUnpaid")}</option>
          <option value="partially_paid">
            {t("financeUi.paymentPartiallyPaid")}
          </option>
          <option value="paid">{t("financeUi.paymentPaid")}</option>
          <option value="overdue">{t("financeUi.paymentOverdue")}</option>
        </select>
        <select
          name="archive"
          defaultValue={archiveFilter}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          aria-label={t("financeUi.filterArchive")}
        >
          <option value="active">{t("financeUi.filterArchiveActive")}</option>
          <option value="archived">{t("financeUi.filterArchiveArchived")}</option>
          <option value="all">{t("financeUi.filterArchiveAll")}</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          {t("workspaceHeader.searchLabel")}
        </button>
      </form>

      <InvoiceList
        rows={invoices}
        canRemove={canRemoveInvoices(profile)}
        canPermanentlyDeleteArchived={canPermanentlyDeleteArchivedInvoices(
          profile,
        )}
        archivedView={archiveFilter === "archived"}
        createHref={createHref}
      />

      {invoices.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {formatMinorAsIdr(
            invoices.reduce((sum, row) => sum + row.balanceDueMinor, 0),
          )}{" "}
          {t("financeUi.balance").toLowerCase()}
        </p>
      ) : null}
    </div>
  );
}
