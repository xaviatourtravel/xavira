import Link from "next/link";
import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/session";
import { assertRoutePermission } from "@/lib/auth/route-access";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/dictionary";
import { createProformaDraftAndRedirectAction } from "@/modules/finance/actions/proforma-actions";
import { InvoiceDraftEditor } from "@/modules/finance/components/invoice-draft-editor";
import { canCreateInvoices, requireOrganizationId } from "@/modules/finance/lib/invoice-access";
import {
  loadInvoiceEditorOptions,
} from "@/modules/finance/services/invoice-service";
import { listInvoiceBrandEditorOptions } from "@/modules/finance/services/invoice-brand-service";

type PageProps = {
  searchParams: Promise<{ error?: string; booking_id?: string; customer_id?: string }>;
};

export default async function NewProformaPage({ searchParams }: PageProps) {
  const { profile } = await requireProfile();
  assertRoutePermission(profile, "invoices.view");
  if (!canCreateInvoices(profile)) {
    redirect("/finance/proformas");
  }

  const t = createTranslator(DEFAULT_LOCALE);
  const params = await searchParams;
  const options = await loadInvoiceEditorOptions(
    profile,
    params.customer_id ?? null,
  );
  const brands = await listInvoiceBrandEditorOptions(
    requireOrganizationId(profile),
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 md:px-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/finance/proformas" className="hover:underline">
            {t("financeUi.backToProformas")}
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {t("financeUi.proformaDraftTitle")}
        </h1>
      </div>
      <InvoiceDraftEditor
        mode="create"
        variant="proforma"
        action={createProformaDraftAndRedirectAction}
        customers={options.customers}
        bookings={options.bookings}
        brands={brands}
        errorMessage={params.error ?? null}
        initial={{
          customerId: params.customer_id,
          bookingId: params.booking_id ?? null,
        }}
      />
    </div>
  );
}
