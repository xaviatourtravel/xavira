import { requireProfile } from "@/lib/auth/session";
import { assertRoutePermission } from "@/lib/auth/route-access";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/dictionary";
import { InvoiceWorkspacePage } from "@/modules/finance/components/invoice-workspace-page";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    lifecycle?: string;
    payment?: string;
    archive?: string;
    deleted?: string;
    archived?: string;
  }>;
};

export default async function XaviaInvoicesPage({ searchParams }: PageProps) {
  const { profile } = await requireProfile();
  assertRoutePermission(profile, "invoices.view");
  const t = createTranslator(DEFAULT_LOCALE);
  const params = await searchParams;
  return (
    <InvoiceWorkspacePage
      brandKey="xavia"
      profile={profile}
      t={t}
      params={params}
    />
  );
}
