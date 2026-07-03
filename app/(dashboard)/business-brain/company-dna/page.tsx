import { CompanyDnaPageClient } from "@/modules/business-brain/components";
import { loadCompanyDnaAction } from "@/modules/business-brain/actions";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";

export const metadata = {
  title: "Company DNA · Business Brain · Desklabs",
};

export default async function CompanyDnaRoutePage() {
  const { profile } = await requireProfile();
  const { record } = await loadCompanyDnaAction();

  return (
    <CompanyDnaPageClient
      initialRecord={record}
      canEdit={isAdminOrOwner(profile)}
    />
  );
}
