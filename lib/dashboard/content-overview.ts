import { CONTENT_STATUS_OPTIONS } from "@/lib/content/constants";
import { createClient } from "@/utils/supabase/server";

export type ContentOverviewStatusCount = {
  status: string;
  label: string;
  count: number;
};

export type ContentOverviewMetrics = {
  total: number;
  byStatus: ContentOverviewStatusCount[];
};

export async function loadContentOverviewMetrics(
  organizationId: string,
): Promise<ContentOverviewMetrics> {
  const supabase = await createClient();

  const { data: contents } = await supabase
    .from("contents")
    .select("status")
    .eq("organization_id", organizationId);

  const statusCounts: Record<string, number> = {};

  for (const item of contents ?? []) {
    statusCounts[item.status] = (statusCounts[item.status] ?? 0) + 1;
  }

  const byStatus = CONTENT_STATUS_OPTIONS.map((option) => ({
    status: option.value,
    label: option.label,
    count: statusCounts[option.value] ?? 0,
  }));

  return {
    total: contents?.length ?? 0,
    byStatus,
  };
}
