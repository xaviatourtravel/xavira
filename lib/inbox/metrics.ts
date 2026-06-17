import type { InboxStatus } from "@/lib/inbox/constants";
import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type InboxDashboardMetrics = {
  newConversations: number;
  convertedLeads: number;
  conversionRate: number;
  totalConversations: number;
  qualifiedConversations: number;
};

export async function loadInboxDashboardMetrics(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<InboxDashboardMetrics> {
  const { data, error } = await supabase
    .from("inbox_conversations")
    .select("status")
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Load inbox dashboard metrics error:", error);
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const totalConversations = rows.length;
  const newConversations = rows.filter((row) => row.status === "new").length;
  const qualifiedConversations = rows.filter(
    (row) => row.status === "qualified",
  ).length;
  const convertedLeads = rows.filter((row) => row.status === "converted").length;

  const conversionRate =
    totalConversations > 0
      ? Math.round((convertedLeads / totalConversations) * 100)
      : 0;

  return {
    newConversations,
    convertedLeads,
    conversionRate,
    totalConversations,
    qualifiedConversations,
  };
}

export function parseInboxListSearchParams(searchParams: {
  status?: string;
  source?: string;
  assigned?: string;
}) {
  return {
    status: searchParams.status?.trim() || undefined,
    source: searchParams.source?.trim() || undefined,
    assigned: searchParams.assigned?.trim() || undefined,
  };
}

export function isActiveInboxStatus(status: InboxStatus) {
  return status === "new" || status === "qualified";
}
