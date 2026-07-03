"use client";

import { useMemo } from "react";

import { getBusinessBrainDashboardPlaceholder } from "@/modules/business-brain/services";

export function useBusinessBrainDashboardPlaceholder() {
  return useMemo(() => getBusinessBrainDashboardPlaceholder(), []);
}
