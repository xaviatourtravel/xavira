import Link from "next/link";

import { requireProfile } from "@/lib/auth/session";
import { assertRoutePermission } from "@/lib/auth/route-access";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/dictionary";
import { ProformaList } from "@/modules/finance/components/proforma-list";
import { canCreateInvoices } from "@/modules/finance/lib/invoice-access";
import { proformaListFiltersSchema } from "@/modules/finance/schemas/proforma";
import { listOrganizationProformas } from "@/modules/finance/services/proforma-service";

type PageProps = {
  searchParams: Promise<{ q?: string; lifecycle?: string; deleted?: string }>;
};

export default async function FinanceProformasPage({ searchParams }: PageProps) {
  const { profile } = await requireProfile();
  assertRoutePermission(profile, "invoices.view");
  const t = createTranslator(DEFAULT_LOCALE);
  const params = await searchParams;
  const filters = proformaListFiltersSchema.parse({
    q: params.q || undefined,
    lifecycleStatus: params.lifecycle || undefined,
  });
  const rows = await listOrganizationProformas(profile, filters);
  const summary = {
    drafts: rows.filter((row) => row.lifecycleStatus === "draft").length,
    converted: rows.filter((row) => row.lifecycleStatus === "converted").length,
    cancelled: rows.filter((row) => row.lifecycleStatus === "cancelled").length,
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/finance" className="hover:underline">
              {t("navigation.finance")}
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {t("financeUi.proformasTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("financeUi.proformasSubtitle")}
          </p>
        </div>
        {canCreateInvoices(profile) ? (
          <Link
            href="/finance/proformas/new"
            className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            {t("financeUi.createProforma")}
          </Link>
        ) : null}
      </div>

      {params.deleted === "1" ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t("financeUi.proformaDeletedBanner")}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: t("financeUi.summaryProformaDrafts"), value: summary.drafts },
          {
            label: t("financeUi.summaryProformaConverted"),
            value: summary.converted,
          },
          {
            label: t("financeUi.summaryProformaCancelled"),
            value: summary.cancelled,
          },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <form className="flex flex-wrap gap-3" method="get">
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
          <option value="draft">{t("financeUi.statusProformaDraft")}</option>
          <option value="converted">
            {t("financeUi.statusProformaConverted")}
          </option>
          <option value="cancelled">
            {t("financeUi.statusProformaCancelled")}
          </option>
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          {t("workspaceHeader.searchLabel")}
        </button>
      </form>

      <ProformaList
        rows={rows}
        emptyTitle={t("financeUi.proformaEmptyTitle")}
        emptyDescription={t("financeUi.proformaEmptyDescription")}
        createHref={canCreateInvoices(profile) ? "/finance/proformas/new" : undefined}
        createLabel={t("financeUi.createProforma")}
        columns={{
          reference: t("financeUi.proformaNumber"),
          recipient: t("financeUi.customer"),
          date: t("financeUi.issueDate"),
          total: t("financeUi.total"),
          status: t("financeUi.lifecycle"),
          invoice: t("financeUi.invoiceNumber"),
        }}
      />
    </div>
  );
}
