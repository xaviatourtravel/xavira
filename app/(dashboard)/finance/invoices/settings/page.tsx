import Link from "next/link";
import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/session";
import { assertRoutePermission } from "@/lib/auth/route-access";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/dictionary";
import { InvoiceBrandSettingsForm } from "@/modules/finance/components/invoice-brand-settings-form";
import { canEditInvoices } from "@/modules/finance/lib/invoice-access";
import { getOrganizationInvoiceBrandSettings } from "@/modules/finance/services/invoice-service";

export default async function InvoiceBrandSettingsPage() {
  const { profile } = await requireProfile();
  assertRoutePermission(profile, "invoices.view");
  if (!canEditInvoices(profile)) {
    redirect("/finance/invoices");
  }

  const t = createTranslator(DEFAULT_LOCALE);
  const { brand, workspace } = await getOrganizationInvoiceBrandSettings(profile);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 md:px-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/finance/invoices" className="hover:underline">
            {t("financeUi.backToList")}
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {t("financeUi.brandSettingsTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("financeUi.brandSettingsSubtitle")}
        </p>
      </div>

      <InvoiceBrandSettingsForm
        initial={{
          defaultTemplateKey: brand.defaultTemplateKey,
          footerText: brand.footerText,
          invoicePrefix: brand.invoicePrefix,
          paymentAccountsJson: brand.paymentAccountsJson,
          workspace,
        }}
      />
    </div>
  );
}
