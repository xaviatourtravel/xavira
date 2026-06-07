export type OrgProfileOption = {
  id: string;
  full_name: string;
};

type ProfileRelation =
  | { full_name: string | null }
  | { full_name: string | null }[]
  | null
  | undefined;

export function getLeadAssigneeName(profiles: ProfileRelation) {
  if (!profiles) {
    return null;
  }

  if (Array.isArray(profiles)) {
    const name = profiles[0]?.full_name?.trim();
    return name || null;
  }

  const name = profiles.full_name?.trim();
  return name || null;
}

export function formatAssignedUserLabel(assigneeName: string | null | undefined) {
  return assigneeName?.trim() ? assigneeName : "Belum di-assign";
}

export function buildAssignedUserFilter(
  assignedFilter: string,
  validProfileIds: Set<string>,
) {
  if (assignedFilter === "unassigned") {
    return { type: "unassigned" as const };
  }

  if (assignedFilter && validProfileIds.has(assignedFilter)) {
    return { type: "profile" as const, profileId: assignedFilter };
  }

  return { type: "all" as const };
}

export function resolveLeadAssignedFilter({
  assignedToParam,
  assignedParam,
  currentProfileId,
  validProfileIds,
}: {
  assignedToParam: string;
  assignedParam: string;
  currentProfileId: string;
  validProfileIds: Set<string>;
}) {
  if (assignedToParam === "me") {
    return { type: "profile" as const, profileId: currentProfileId };
  }

  if (assignedToParam === "unassigned") {
    return { type: "unassigned" as const };
  }

  return buildAssignedUserFilter(assignedParam, validProfileIds);
}

export function parseLeadAgingFilter(value: string) {
  if (value === "3" || value === "7") {
    return Number(value);
  }

  return null;
}

export function getLeadAgingCutoffIso(days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff.toISOString();
}

export const CLOSED_LEAD_STATUS_FILTER = "(won,lost)";

export function shouldExcludeClosedLeadsForAging(agingDays: number | null) {
  return agingDays === 3 || agingDays === 7;
}

export type MyLeadsMetrics = {
  totalAssigned: number;
  needFollowUp: number;
  criticalLeads: number;
  wonLeads: number;
};

export type NeedAttentionMetrics = {
  overdueFollowUps: number;
  leadsInactive3Days: number;
  leadsInactive7Days: number;
  unassignedLeads: number;
};
