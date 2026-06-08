import {
  getLeadSourceFilterLabel,
  isLeadSourceV1,
} from "@/lib/leads/source-tracking";
import {
  buildFollowUpCountByLeadId,
  getLeadHealthFilterLabel,
  getLeadIdsForHealthFilter,
  parseLeadHealthFilter,
  type LeadHealthFilter,
} from "@/lib/leads/health-score";
import {
  type OrgProfileOption,
  parseLeadAgingFilter,
  resolveLeadAssignedFilter,
} from "@/lib/leads/assignment";
import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type LeadsListFilters = {
  q: string;
  status: string;
  source: string;
  assigned: string;
  assignedTo: string;
  aging: number | null;
  followUp: string;
  health: string;
};

export type LeadsListSearchParams = {
  q?: string;
  status?: string;
  source?: string;
  assigned?: string;
  assigned_to?: string;
  aging?: string;
  follow_up?: string;
  health?: string;
  page?: string;
};

export function parseLeadsListFilters(
  params: LeadsListSearchParams,
): LeadsListFilters {
  return {
    q: params.q?.trim() ?? "",
    status: params.status?.trim() ?? "",
    source: params.source?.trim() ?? "",
    assigned: params.assigned?.trim() ?? "",
    assignedTo: params.assigned_to?.trim() ?? "",
    aging: parseLeadAgingFilter(params.aging?.trim() ?? ""),
    followUp: params.follow_up?.trim() ?? "",
    health: params.health?.trim() ?? "",
  };
}

type BuildLeadsListHrefOptions = {
  page?: number;
  omit?: Array<keyof LeadsListFilters>;
};

export function buildLeadsListHref(
  filters: LeadsListFilters,
  options?: BuildLeadsListHrefOptions,
) {
  const omit = new Set(options?.omit ?? []);
  const params = new URLSearchParams();

  if (!omit.has("q") && filters.q) {
    params.set("q", filters.q);
  }

  if (!omit.has("status") && filters.status) {
    params.set("status", filters.status);
  }

  if (!omit.has("source") && filters.source) {
    params.set("source", filters.source);
  }

  if (!omit.has("assigned") && filters.assigned) {
    params.set("assigned", filters.assigned);
  }

  if (!omit.has("assignedTo") && filters.assignedTo) {
    params.set("assigned_to", filters.assignedTo);
  }

  if (!omit.has("aging") && filters.aging != null) {
    params.set("aging", String(filters.aging));
  }

  if (!omit.has("followUp") && filters.followUp) {
    params.set("follow_up", filters.followUp);
  }

  if (!omit.has("health") && filters.health) {
    params.set("health", filters.health);
  }

  if (options?.page != null && options.page > 1) {
    params.set("page", String(options.page));
  }

  const query = params.toString();
  return query ? `/leads?${query}` : "/leads";
}

export type ActiveLeadFilterBadge = {
  key: keyof LeadsListFilters;
  label: string;
  href: string;
};

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export function getActiveLeadFilterBadges(
  filters: LeadsListFilters,
  profiles: OrgProfileOption[],
): ActiveLeadFilterBadge[] {
  const badges: ActiveLeadFilterBadge[] = [];

  if (filters.q) {
    badges.push({
      key: "q",
      label: `Search: ${filters.q}`,
      href: buildLeadsListHref(filters, { omit: ["q"] }),
    });
  }

  if (filters.status) {
    badges.push({
      key: "status",
      label: `Status: ${formatStatusLabel(filters.status)}`,
      href: buildLeadsListHref(filters, { omit: ["status"] }),
    });
  }

  if (isLeadSourceV1(filters.source)) {
    badges.push({
      key: "source",
      label: `Source: ${getLeadSourceFilterLabel(filters.source)}`,
      href: buildLeadsListHref(filters, { omit: ["source"] }),
    });
  }

  if (filters.assignedTo === "me") {
    badges.push({
      key: "assignedTo",
      label: "Assigned to Me",
      href: buildLeadsListHref(filters, { omit: ["assignedTo"] }),
    });
  } else if (filters.assignedTo === "unassigned") {
    badges.push({
      key: "assignedTo",
      label: "Unassigned",
      href: buildLeadsListHref(filters, { omit: ["assignedTo"] }),
    });
  } else if (filters.assigned === "unassigned") {
    badges.push({
      key: "assigned",
      label: "Unassigned",
      href: buildLeadsListHref(filters, { omit: ["assigned"] }),
    });
  } else if (filters.assigned) {
    const profile = profiles.find((member) => member.id === filters.assigned);
    badges.push({
      key: "assigned",
      label: `Assigned: ${profile?.full_name || "Pengguna"}`,
      href: buildLeadsListHref(filters, { omit: ["assigned"] }),
    });
  }

  if (filters.aging === 3) {
    badges.push({
      key: "aging",
      label: "Inactive > 3 Days",
      href: buildLeadsListHref(filters, { omit: ["aging"] }),
    });
  } else if (filters.aging === 7) {
    badges.push({
      key: "aging",
      label: "Inactive > 7 Days",
      href: buildLeadsListHref(filters, { omit: ["aging"] }),
    });
  }

  if (filters.followUp === "overdue") {
    badges.push({
      key: "followUp",
      label: "Overdue Follow Up",
      href: buildLeadsListHref(filters, { omit: ["followUp"] }),
    });
  }

  const healthFilter = parseLeadHealthFilter(filters.health);
  if (healthFilter) {
    badges.push({
      key: "health",
      label: getLeadHealthFilterLabel(healthFilter),
      href: buildLeadsListHref(filters, { omit: ["health"] }),
    });
  }

  return badges;
}

export function hasActiveLeadFilters(
  filters: LeadsListFilters,
  profiles: OrgProfileOption[] = [],
) {
  return getActiveLeadFilterBadges(filters, profiles).length > 0;
}

export function resolveLeadsListAssignedFilter(
  filters: LeadsListFilters,
  currentProfileId: string,
  validProfileIds: Set<string>,
) {
  return resolveLeadAssignedFilter({
    assignedToParam: filters.assignedTo,
    assignedParam: filters.assigned,
    currentProfileId,
    validProfileIds,
  });
}

export function isOverdueFollowUpFilter(followUp: string) {
  return followUp === "overdue";
}

export function isLeadHealthFilter(health: string): health is LeadHealthFilter {
  return parseLeadHealthFilter(health) != null;
}

export async function getLeadIdsForHealthFilterQuery(
  supabase: SupabaseServerClient,
  organizationId: string,
  filter: LeadHealthFilter,
) {
  const [{ data: leads, error: leadsError }, { data: followUpTasks, error: tasksError }] =
    await Promise.all([
      supabase
        .from("leads")
        .select("id, assigned_to, updated_at, status")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .not("status", "in", "(won,lost)"),
      supabase
        .from("follow_up_tasks")
        .select("lead_id")
        .eq("organization_id", organizationId),
    ]);

  if (leadsError || tasksError) {
    throw new Error("Gagal memuat filter health lead.");
  }

  return getLeadIdsForHealthFilter(
    leads ?? [],
    buildFollowUpCountByLeadId(followUpTasks ?? []),
    filter,
  );
}

export async function getOverdueFollowUpLeadIds(
  supabase: SupabaseServerClient,
  organizationId: string,
) {
  const { data: overdueTasks, error } = await supabase
    .from("follow_up_tasks")
    .select("lead_id")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .lt("due_date", new Date().toISOString());

  if (error) {
    throw new Error("Gagal memuat follow up terlambat.");
  }

  return [
    ...new Set(
      (overdueTasks ?? [])
        .map((task) => task.lead_id)
        .filter((leadId): leadId is string => Boolean(leadId)),
    ),
  ];
}
