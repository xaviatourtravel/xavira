import { AccountPageShell } from "@/components/account/account-page-shell";
import { BillingView } from "@/components/account/billing-view";
import { loadBillingSummary } from "@/lib/account/billing";
import { requireOrganizationProfile } from "@/lib/auth/session";

export default async function BillingPage() {
  const { profile } = await requireOrganizationProfile();
  const billing = await loadBillingSummary(profile.organization_id!);

  return (
    <AccountPageShell
      title="Billing"
      description="Ringkasan paket, penggunaan workspace, dan invoice."
    >
      <BillingView
        workspaceName={billing.workspaceName}
        teamMemberCount={billing.teamMemberCount}
      />
    </AccountPageShell>
  );
}
