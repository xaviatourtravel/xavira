import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/session";
import { assertRoutePermission } from "@/lib/auth/route-access";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/dictionary";
import { updateProformaDraftAndRedirectAction } from "@/modules/finance/actions/proforma-actions";
import { InvoiceDraftEditor } from "@/modules/finance/components/invoice-draft-editor";
import { canEditInvoices } from "@/modules/finance/lib/invoice-access";
import { isProformaEditable } from "@/modules/finance/lib/proforma-lifecycle";
import {
  loadInvoiceEditorOptions,
} from "@/modules/finance/services/invoice-service";
import { listInvoiceBrandEditorOptions } from "@/modules/finance/services/invoice-brand-service";
import { getOrganizationProforma } from "@/modules/finance/services/proforma-service";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditProformaPage({
  params,
  searchParams,
}: PageProps) {
  const { profile } = await requireProfile();
  assertRoutePermission(profile, "invoices.view");
  if (!canEditInvoices(profile)) {
    redirect("/finance/proformas");
  }

  const t = createTranslator(DEFAULT_LOCALE);
  const { id } = await params;
  const query = await searchParams;

  let proforma;
  try {
    proforma = await getOrganizationProforma(profile, id);
  } catch {
    notFound();
  }

  if (!isProformaEditable(proforma.lifecycleStatus)) {
    redirect(`/finance/proformas/${id}`);
  }

  const options = await loadInvoiceEditorOptions(profile, proforma.customerId);
  const brands = await listInvoiceBrandEditorOptions(proforma.organizationId);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 md:px-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href={`/finance/proformas/${id}`} className="hover:underline">
            {t("financeUi.viewProforma")}
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {t("financeUi.editProformaTitle")}
        </h1>
      </div>
      <InvoiceDraftEditor
        mode="edit"
        variant="proforma"
        action={updateProformaDraftAndRedirectAction}
        customers={options.customers}
        bookings={options.bookings}
        brands={brands}
        errorMessage={query.error ?? null}
        initial={{
          invoiceId: proforma.id,
          recipientSource: proforma.recipientSource,
          customerId: proforma.customerId ?? undefined,
          bookingId: proforma.bookingId,
          manualRecipientName: proforma.manualRecipientName,
          manualRecipientCompany: proforma.manualRecipientCompany,
          manualRecipientPhone: proforma.manualRecipientPhone,
          manualRecipientEmail: proforma.manualRecipientEmail,
          manualRecipientAddress: proforma.manualRecipientAddress,
          manualRecipientTaxId: proforma.manualRecipientTaxId,
          brandProfileId: proforma.brandProfileId ?? null,
          issueDate: proforma.issueDate,
          dueDate: proforma.dueDate,
          notes: proforma.notes,
          paymentInstructions: proforma.paymentInstructions,
          terms: proforma.terms,
          discountMinor: proforma.discountMinor,
          taxRateBps: proforma.taxRateBps,
          taxMinor: proforma.taxMinor,
          additionalFeesMinor: proforma.additionalFeesMinor,
          amountPaidMinor: 0,
          items: (proforma.items ?? []).map((item) => ({
            description: item.description,
            detail: item.detail ?? "",
            quantity: item.quantity,
            unit: item.unit,
            unitPriceMinor: item.unitPriceMinor,
            discountMinor: item.discountMinor,
          })),
        }}
      />
    </div>
  );
}
