import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/session";
import { assertRoutePermission } from "@/lib/auth/route-access";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/dictionary";
import {
  updateInvoiceDraftAndRedirectAction,
} from "@/modules/finance/actions/invoice-actions";
import { InvoiceDraftEditor } from "@/modules/finance/components/invoice-draft-editor";
import { canEditInvoices } from "@/modules/finance/lib/invoice-access";
import {
  getOrganizationInvoice,
  getOrganizationInvoiceBrandSettings,
  loadInvoiceEditorOptions,
} from "@/modules/finance/services/invoice-service";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditInvoicePage({
  params,
  searchParams,
}: PageProps) {
  const { profile } = await requireProfile();
  assertRoutePermission(profile, "invoices.view");
  if (!canEditInvoices(profile)) {
    redirect("/finance/invoices");
  }

  const t = createTranslator(DEFAULT_LOCALE);
  const { id } = await params;
  const query = await searchParams;

  let invoice;
  try {
    invoice = await getOrganizationInvoice(profile, id);
  } catch {
    notFound();
  }

  if (invoice.lifecycleStatus !== "draft") {
    redirect(`/finance/invoices/${id}`);
  }

  const options = await loadInvoiceEditorOptions(profile, invoice.customerId);
  const brandSettings = await getOrganizationInvoiceBrandSettings(profile);
  const theme = invoice.themeSnapshot as {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    templateKey?: string;
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 md:px-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href={`/finance/invoices/${id}`} className="hover:underline">
            {t("financeUi.viewInvoice")}
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {t("financeUi.editDraftTitle")}
        </h1>
      </div>

      <InvoiceDraftEditor
        mode="edit"
        action={updateInvoiceDraftAndRedirectAction}
        customers={options.customers}
        bookings={options.bookings}
        workspaceBrand={{
          templateKey: brandSettings.brand.defaultTemplateKey,
          primaryColor: brandSettings.workspace.primaryColor,
          secondaryColor: brandSettings.workspace.secondaryColor,
          accentColor: brandSettings.workspace.accentColor,
        }}
        errorMessage={query.error ?? null}
        initial={{
          invoiceId: invoice.id,
          recipientSource: invoice.recipientSource,
          customerId: invoice.customerId ?? undefined,
          bookingId: invoice.bookingId,
          manualRecipientName: invoice.manualRecipientName,
          manualRecipientCompany: invoice.manualRecipientCompany,
          manualRecipientPhone: invoice.manualRecipientPhone,
          manualRecipientEmail: invoice.manualRecipientEmail,
          manualRecipientAddress: invoice.manualRecipientAddress,
          manualRecipientTaxId: invoice.manualRecipientTaxId,
          templateKey: theme.templateKey ?? invoice.templateKey,
          primaryColor:
            theme.primaryColor ?? brandSettings.workspace.primaryColor,
          secondaryColor:
            theme.secondaryColor ?? brandSettings.workspace.secondaryColor,
          accentColor: theme.accentColor ?? brandSettings.workspace.accentColor,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          notes: invoice.notes,
          paymentInstructions: invoice.paymentInstructions,
          terms: invoice.terms,
          discountMinor: invoice.discountMinor,
          taxRateBps: invoice.taxRateBps,
          taxMinor: invoice.taxMinor,
          additionalFeesMinor: invoice.additionalFeesMinor,
          amountPaidMinor: invoice.amountPaidMinor,
          items:
            invoice.items?.map((item) => ({
              description: item.description,
              detail: item.detail ?? "",
              quantity: item.quantity,
              unit: item.unit,
              unitPriceMinor: item.unitPriceMinor,
              discountMinor: item.discountMinor,
            })) ?? [],
        }}
      />
    </div>
  );
}
