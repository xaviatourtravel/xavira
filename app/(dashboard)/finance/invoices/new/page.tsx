import Link from "next/link";

import { requireProfile } from "@/lib/auth/session";
import { assertRoutePermission } from "@/lib/auth/route-access";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/dictionary";
import { createInvoiceDraftAndRedirectAction } from "@/modules/finance/actions/invoice-actions";
import { createTicketingDraftAndRedirectAction } from "@/modules/finance/actions/ticketing-actions";
import { InvoiceDraftEditor } from "@/modules/finance/components/invoice-draft-editor";
import { TicketingInvoiceEditor } from "@/modules/finance/components/ticketing-invoice-editor";
import { canCreateInvoices, requireOrganizationId } from "@/modules/finance/lib/invoice-access";
import {
  loadInvoiceEditorOptions,
} from "@/modules/finance/services/invoice-service";
import { listInvoiceBrandEditorOptions } from "@/modules/finance/services/invoice-brand-service";
import { parseInvoiceBrandKey } from "@/modules/finance/lib/invoice-brand-workspaces";
import { invoiceBrandWorkspacePath } from "@/modules/finance/lib/invoice-brand-workspaces";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{
    type?: string;
    error?: string;
    booking_id?: string;
    customer_id?: string;
    brand?: string;
  }>;
};

export default async function NewInvoicePage({ searchParams }: PageProps) {
  const { profile } = await requireProfile();
  assertRoutePermission(profile, "invoices.view");
  if (!canCreateInvoices(profile)) {
    redirect("/finance/invoices/xavia");
  }

  const t = createTranslator(DEFAULT_LOCALE);
  const params = await searchParams;
  const type = params.type === "ticketing" || params.type === "package" ? params.type : null;
  const brandKey = parseInvoiceBrandKey(params.brand);
  const listHref = invoiceBrandWorkspacePath(brandKey);
  const brandQuery = `brand=${brandKey}`;

  // Step 1: type chooser
  if (!type) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 md:px-6">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href={listHref} className="hover:underline">
              {t("financeUi.backToList")}
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {t("financeUi.chooseInvoiceType")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("financeUi.chooseInvoiceTypeSubtitle")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={`/finance/invoices/new?type=package&${brandQuery}`}
            className="group flex flex-col gap-2 rounded-2xl border bg-card p-6 transition-colors hover:border-primary hover:bg-accent/40"
          >
            <span className="text-base font-semibold">
              {t("financeUi.typePackageTitle")}
            </span>
            <span className="text-sm text-muted-foreground">
              {t("financeUi.typePackageDesc")}
            </span>
          </Link>
          <Link
            href={`/finance/invoices/new?type=ticketing&${brandQuery}`}
            className="group flex flex-col gap-2 rounded-2xl border bg-card p-6 transition-colors hover:border-primary hover:bg-accent/40"
          >
            <span className="text-base font-semibold">
              {t("financeUi.typeTicketingTitle")}
            </span>
            <span className="text-sm text-muted-foreground">
              {t("financeUi.typeTicketingDesc")}
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const options = await loadInvoiceEditorOptions(
    profile,
    params.customer_id ?? null,
  );
  const brands = await listInvoiceBrandEditorOptions(
    requireOrganizationId(profile),
  );
  const selectedBrandId =
    brands.find((brand) => brand.key === brandKey)?.id ??
    brands.find((brand) => brand.isDefault)?.id ??
    brands[0]?.id ??
    "";
  const typeChooserHref = `/finance/invoices/new?${brandQuery}`;

  if (type === "ticketing") {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 md:px-6">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href={typeChooserHref} className="hover:underline">
              {t("financeUi.backToList")}
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {t("financeUi.ticketingEditorTitle")}
          </h1>
        </div>
        <TicketingInvoiceEditor
          mode="create"
          action={createTicketingDraftAndRedirectAction}
          customers={options.customers}
          bookings={options.bookings}
          brands={brands}
          errorMessage={params.error ?? null}
          initial={{
            customerId: params.customer_id,
            bookingId: params.booking_id ?? null,
            brandProfileId: selectedBrandId || null,
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 md:px-6">
      <div>
        <p className="text-sm text-muted-foreground">
            <Link href={typeChooserHref} className="hover:underline">
              {t("financeUi.backToList")}
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {t("financeUi.draftEditorTitle")}
          </h1>
        </div>

      <InvoiceDraftEditor
        mode="create"
        action={createInvoiceDraftAndRedirectAction}
        customers={options.customers}
        bookings={options.bookings}
        brands={brands}
        errorMessage={params.error ?? null}
        initial={{
          customerId: params.customer_id,
          bookingId: params.booking_id ?? null,
          brandProfileId: selectedBrandId || null,
        }}
      />
    </div>
  );
}
