import Link from "next/link";

import { requireProfile } from "@/lib/auth/session";
import { assertRoutePermission } from "@/lib/auth/route-access";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/dictionary";
import {
  createInvoiceDraftAndRedirectAction,
} from "@/modules/finance/actions/invoice-actions";
import { InvoiceDraftEditor } from "@/modules/finance/components/invoice-draft-editor";
import { canCreateInvoices } from "@/modules/finance/lib/invoice-access";
import { loadInvoiceEditorOptions } from "@/modules/finance/services/invoice-service";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{
    error?: string;
    booking_id?: string;
    customer_id?: string;
  }>;
};

export default async function NewInvoicePage({ searchParams }: PageProps) {
  const { profile } = await requireProfile();
  assertRoutePermission(profile, "invoices.view");
  if (!canCreateInvoices(profile)) {
    redirect("/finance/invoices");
  }

  const t = createTranslator(DEFAULT_LOCALE);
  const params = await searchParams;
  const options = await loadInvoiceEditorOptions(
    profile,
    params.customer_id ?? null,
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 md:px-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/finance/invoices" className="hover:underline">
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
        errorMessage={params.error ?? null}
        initial={{
          customerId: params.customer_id,
          bookingId: params.booking_id ?? null,
        }}
      />
    </div>
  );
}
