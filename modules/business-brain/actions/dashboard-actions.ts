"use server";

import { requireProfile } from "@/lib/auth/session";
import { getBusinessBrainOverview } from "@/modules/business-brain/services/business-brain-overview-service";

export async function loadBusinessBrainDashboardAction() {
  const { profile } = await requireProfile();
  if (!profile.organization_id) {
    return getBusinessBrainOverview("");
  }
  return getBusinessBrainOverview(profile.organization_id);
}
