"use server";

import { getBusinessBrainDashboardPlaceholder } from "@/modules/business-brain/services";

export async function loadBusinessBrainDashboardAction() {
  return getBusinessBrainDashboardPlaceholder();
}
