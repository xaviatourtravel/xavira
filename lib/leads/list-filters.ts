import {
  type OrgProfileOption,
  parseLeadAgingFilter,
  resolveLeadAssignedFilter,
} from "@/lib/leads/assignment";

export type LeadsListFilters = {
  q: string;
  status: string;
  assigned: string;
  assignedTo: string;
  aging: number | null;
};

export type LeadsListSearchParams = {
  q?: string;
  status?: string;
  assigned?: string;
  assigned_to?: string;
  aging?: string;
  page?: string;
};

export function parseLeadsListFilters(
  params: LeadsListSearchParams,
): LeadsListFilters {
  return {
    q: params.q?.trim() ?? "",
    status: params.status?.trim() ?? "",
    assigned: params.assigned?.trim() ?? "",
    assignedTo: params.assigned_to?.trim() ?? "",
    aging: parseLeadAgingFilter(params.aging?.trim() ?? ""),
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

  if (!omit.has("assigned") && filters.assigned) {
    params.set("assigned", filters.assigned);
  }

  if (!omit.has("assignedTo") && filters.assignedTo) {
    params.set("assigned_to", filters.assignedTo);
  }

  if (!omit.has("aging") && filters.aging != null) {
    params.set("aging", String(filters.aging));
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

  if (filters.assignedTo === "me") {
    badges.push({
      key: "assignedTo",
      label: "Assigned to Me",
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
      label: "Need Follow Up (>3 days)",
      href: buildLeadsListHref(filters, { omit: ["aging"] }),
    });
  } else if (filters.aging === 7) {
    badges.push({
      key: "aging",
      label: "Critical Leads (>7 days)",
      href: buildLeadsListHref(filters, { omit: ["aging"] }),
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
