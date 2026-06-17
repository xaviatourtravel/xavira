import { redirect } from "next/navigation";

import { RevenueIntelligenceView } from "@/components/dashboard/revenue/revenue-intelligence-view";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { loadRevenueIntelligenceMetrics } from "@/lib/dashboard/revenue-intelligence";

export default async function RevenueIntelligencePage() {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect("/dashboard");
  }

  const metrics = await loadRevenueIntelligenceMetrics(profile);

  return (
    <RevenueIntelligenceView
      metrics={metrics}
      canGenerateInsights={isAdminOrOwner(profile)}
    />
  );
}
