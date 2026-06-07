export type SalesPerformanceProfile = {
  id: string;
  full_name: string | null;
};

export type SalesPerformanceLead = {
  assigned_to: string | null;
  status: string;
  updated_at: string;
};

export type SalesPerformanceRow = {
  profileId: string;
  name: string;
  assignedLeads: number;
  wonLeads: number;
  needAttention: number;
};

const CLOSED_STATUSES = new Set(["won", "lost"]);

export function buildSalesPerformanceRows(
  profiles: SalesPerformanceProfile[],
  leads: SalesPerformanceLead[],
  threeDaysAgoIso: string,
): SalesPerformanceRow[] {
  const stats = new Map<
    string,
    { assignedLeads: number; wonLeads: number; needAttention: number }
  >();

  for (const member of profiles) {
    stats.set(member.id, {
      assignedLeads: 0,
      wonLeads: 0,
      needAttention: 0,
    });
  }

  for (const lead of leads) {
    if (!lead.assigned_to || !stats.has(lead.assigned_to)) {
      continue;
    }

    const profileStats = stats.get(lead.assigned_to);
    if (!profileStats) {
      continue;
    }

    profileStats.assignedLeads += 1;

    if (lead.status === "won") {
      profileStats.wonLeads += 1;
    }

    if (
      !CLOSED_STATUSES.has(lead.status) &&
      lead.updated_at < threeDaysAgoIso
    ) {
      profileStats.needAttention += 1;
    }
  }

  return profiles.map((member) => {
    const profileStats = stats.get(member.id) ?? {
      assignedLeads: 0,
      wonLeads: 0,
      needAttention: 0,
    };

    return {
      profileId: member.id,
      name: member.full_name?.trim() || "Pengguna",
      assignedLeads: profileStats.assignedLeads,
      wonLeads: profileStats.wonLeads,
      needAttention: profileStats.needAttention,
    };
  });
}

export function getSalesPerformanceTotalAssigned(rows: SalesPerformanceRow[]) {
  return rows.reduce((sum, row) => sum + row.assignedLeads, 0);
}

export function shouldShowSalesPerformanceEmptyState(
  profiles: SalesPerformanceProfile[],
  rows: SalesPerformanceRow[],
) {
  return profiles.length === 0 || getSalesPerformanceTotalAssigned(rows) === 0;
}
