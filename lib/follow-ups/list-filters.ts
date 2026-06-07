import type { createClient } from "@/utils/supabase/server";

export const FOLLOW_UP_CENTER_FILTERS = [
  "pending",
  "today",
  "overdue",
  "completed",
] as const;

export type FollowUpCenterFilter =
  (typeof FOLLOW_UP_CENTER_FILTERS)[number];

export type FollowUpCenterSearchParams = {
  filter?: string;
  assigned?: string;
  error?: string;
  success?: string;
};

export type FollowUpCenterQuery = {
  filter: FollowUpCenterFilter;
  assigned: string;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type FollowUpCenterAssignedFilter = ReturnType<
  typeof resolveFollowUpCenterAssignedFilter
>;

export function isFollowUpCenterFilter(
  value: string,
): value is FollowUpCenterFilter {
  return FOLLOW_UP_CENTER_FILTERS.includes(value as FollowUpCenterFilter);
}

export function parseFollowUpCenterFilter(
  params: FollowUpCenterSearchParams,
): FollowUpCenterFilter {
  const filter = params.filter ?? "pending";
  return isFollowUpCenterFilter(filter) ? filter : "pending";
}

export function parseFollowUpCenterQuery(
  params: FollowUpCenterSearchParams,
): FollowUpCenterQuery {
  return {
    filter: parseFollowUpCenterFilter(params),
    assigned: params.assigned?.trim() ?? "",
  };
}

export function buildFollowUpCenterHref({
  filter = "pending",
  assigned = "",
}: {
  filter?: FollowUpCenterFilter;
  assigned?: string;
} = {}) {
  const params = new URLSearchParams();

  if (filter !== "pending") {
    params.set("filter", filter);
  }

  if (assigned) {
    params.set("assigned", assigned);
  }

  const query = params.toString();
  return query ? `/follow-ups?${query}` : "/follow-ups";
}

export function getFollowUpTodayBounds() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  return { todayStart, todayEnd };
}

export const FOLLOW_UP_CENTER_FILTER_LABELS: Record<
  FollowUpCenterFilter,
  string
> = {
  pending: "All Pending",
  today: "Due Today",
  overdue: "Overdue",
  completed: "Completed",
};

export function resolveFollowUpCenterAssignedFilter(
  assigned: string,
  currentProfileId: string,
  validProfileIds: Set<string>,
) {
  if (assigned === "me") {
    return { type: "profile" as const, profileId: currentProfileId };
  }

  if (assigned === "unassigned") {
    return { type: "unassigned" as const };
  }

  if (assigned && validProfileIds.has(assigned)) {
    return { type: "profile" as const, profileId: assigned };
  }

  return { type: "all" as const };
}

export async function getFollowUpCenterLeadIdsForAssignee(
  supabase: SupabaseServerClient,
  organizationId: string,
  assignedFilter: FollowUpCenterAssignedFilter,
) {
  if (assignedFilter.type === "all") {
    return null;
  }

  let query = supabase
    .from("leads")
    .select("id")
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  if (assignedFilter.type === "unassigned") {
    query = query.is("assigned_to", null);
  } else {
    query = query.eq("assigned_to", assignedFilter.profileId);
  }

  const { data: leads, error } = await query;

  if (error) {
    throw new Error("Gagal memuat filter assignee.");
  }

  return (leads ?? [])
    .map((lead) => lead.id)
    .filter((leadId): leadId is string => Boolean(leadId));
}
