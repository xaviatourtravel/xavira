import Link from "next/link";
import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/session";
import { assertRoutePermission } from "@/lib/auth/route-access";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/dictionary";
import { InvoiceBrandSettingsForm } from "@/modules/finance/components/invoice-brand-settings-form";
import { canEditInvoices } from "@/modules/finance/lib/invoice-access";
import {
  invoiceBrandWorkspacePath,
  parseInvoiceBrandKey,
} from "@/modules/finance/lib/invoice-brand-workspaces";
import { getOrganizationFinanceBrands } from "@/modules/finance/services/invoice-brand-service";

type PageProps = {
  searchParams: Promise<{ brand?: string }>;
};

export default async function InvoiceBrandSettingsPage({
  searchParams,
}: PageProps) {
  const { profile } = await requireProfile();
  assertRoutePermission(profile, "invoices.view");
  if (!canEditInvoices(profile)) {
    redirect("/finance/invoices/xavia");
  }

  const t = createTranslator(DEFAULT_LOCALE);
  const params = await searchParams;
  const brandKey = parseInvoiceBrandKey(params.brand);
  const { profiles, editorOptions } = await getOrganizationFinanceBrands(profile);
  const logoPreviewById = Object.fromEntries(
    editorOptions.map((option) => [option.id, option.logoPreviewUrl]),
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link
            href={invoiceBrandWorkspacePath(brandKey)}
            className="hover:underline"
          >
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
        profiles={profiles}
        logoPreviewById={logoPreviewById}
        initialBrandKey={brandKey}
      />
    </div>
  );
}
