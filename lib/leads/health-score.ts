export type LeadHealthBadge =
  | "Excellent"
  | "Healthy"
  | "Attention Needed"
  | "Critical";

export type LeadHealthReason = {
  label: string;
  impact: number;
};

export type LeadHealthScoreInput = {
  assignedTo: string | null;
  updatedAt: string;
  status: string;
  followUpTaskCount: number;
};

export type LeadHealthScoreResult = {
  score: number;
  badge: LeadHealthBadge;
  reasons: LeadHealthReason[];
};

export type LeadForHealthScore = {
  id: string;
  assigned_to: string | null;
  updated_at: string;
  status: string;
};

export const LEAD_HEALTH_FILTERS = [
  "excellent",
  "healthy",
  "attention",
  "critical",
] as const;

export type LeadHealthFilter = (typeof LEAD_HEALTH_FILTERS)[number];

export type LeadHealthOverviewCounts = Record<LeadHealthFilter, number>;

const BASE_SCORE = 50;

const LEAD_HEALTH_FILTER_LABELS: Record<LeadHealthFilter, string> = {
  excellent: "Excellent Leads",
  healthy: "Healthy Leads",
  attention: "Attention Needed",
  critical: "Critical Leads",
};

const LEAD_HEALTH_FILTER_TO_BADGE: Record<LeadHealthFilter, LeadHealthBadge> = {
  excellent: "Excellent",
  healthy: "Healthy",
  attention: "Attention Needed",
  critical: "Critical",
};

const LEAD_HEALTH_BADGE_TO_FILTER: Record<LeadHealthBadge, LeadHealthFilter> = {
  Excellent: "excellent",
  Healthy: "healthy",
  "Attention Needed": "attention",
  Critical: "critical",
};

function getDaysSinceUpdate(updatedAt: string, now = new Date()) {
  const updated = new Date(updatedAt).getTime();
  const diffMs = now.getTime() - updated;

  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function clampScore(score: number) {
  return Math.min(100, Math.max(0, score));
}

export function getLeadHealthBadge(score: number): LeadHealthBadge {
  if (score >= 80) {
    return "Excellent";
  }

  if (score >= 60) {
    return "Healthy";
  }

  if (score >= 40) {
    return "Attention Needed";
  }

  return "Critical";
}

export function calculateLeadHealthScore({
  assignedTo,
  updatedAt,
  status,
  followUpTaskCount,
}: LeadHealthScoreInput): LeadHealthScoreResult {
  let score = BASE_SCORE;
  const reasons: LeadHealthReason[] = [];

  if (assignedTo) {
    score += 10;
    reasons.push({ label: "Assigned to sales", impact: 10 });
  } else {
    score -= 30;
    reasons.push({ label: "Lead is unassigned", impact: -30 });
  }

  if (followUpTaskCount > 0) {
    score += 10;
    reasons.push({ label: "Has follow up task", impact: 10 });
  } else {
    score -= 15;
    reasons.push({ label: "No follow up task", impact: -15 });
  }

  const daysSinceUpdate = getDaysSinceUpdate(updatedAt);

  if (daysSinceUpdate <= 3) {
    score += 10;
    reasons.push({ label: "Recent activity", impact: 10 });
  } else if (daysSinceUpdate > 7) {
    score -= 20;
    reasons.push({
      label: `Not updated for ${daysSinceUpdate} days`,
      impact: -20,
    });
  }

  if (status === "qualified") {
    score += 10;
    reasons.push({ label: "Status: qualified", impact: 10 });
  } else if (status === "proposal_sent") {
    score += 15;
    reasons.push({ label: "Status: proposal sent", impact: 15 });
  } else if (status === "negotiating") {
    score += 20;
    reasons.push({ label: "Status: negotiating", impact: 20 });
  }

  const clampedScore = clampScore(score);
  const sortedReasons = [...reasons].sort(
    (a, b) => Math.abs(b.impact) - Math.abs(a.impact),
  );

  return {
    score: clampedScore,
    badge: getLeadHealthBadge(clampedScore),
    reasons: sortedReasons,
  };
}

export function isActiveLeadForHealthScore(status: string) {
  return status !== "won" && status !== "lost";
}

export function parseLeadHealthFilter(
  value: string,
): LeadHealthFilter | null {
  return LEAD_HEALTH_FILTERS.includes(value as LeadHealthFilter)
    ? (value as LeadHealthFilter)
    : null;
}

export function getLeadHealthBadgeForFilter(filter: LeadHealthFilter) {
  return LEAD_HEALTH_FILTER_TO_BADGE[filter];
}

export function getLeadHealthFilterLabel(filter: LeadHealthFilter) {
  return LEAD_HEALTH_FILTER_LABELS[filter];
}

export function getLeadHealthFilterForBadge(badge: LeadHealthBadge) {
  return LEAD_HEALTH_BADGE_TO_FILTER[badge];
}

export function buildFollowUpCountByLeadId(
  followUpTasks: ReadonlyArray<{ lead_id: string }>,
) {
  const counts = new Map<string, number>();

  for (const task of followUpTasks) {
    counts.set(task.lead_id, (counts.get(task.lead_id) ?? 0) + 1);
  }

  return counts;
}

export function calculateLeadHealthBadgeForLead(
  lead: LeadForHealthScore,
  followUpTaskCount: number,
) {
  return calculateLeadHealthScore({
    assignedTo: lead.assigned_to,
    updatedAt: lead.updated_at,
    status: lead.status,
    followUpTaskCount,
  }).badge;
}

export function buildLeadHealthOverviewCounts(
  leads: ReadonlyArray<LeadForHealthScore>,
  followUpCountByLeadId: ReadonlyMap<string, number>,
): LeadHealthOverviewCounts {
  const counts: LeadHealthOverviewCounts = {
    excellent: 0,
    healthy: 0,
    attention: 0,
    critical: 0,
  };

  for (const lead of leads) {
    if (!isActiveLeadForHealthScore(lead.status)) {
      continue;
    }

    const badge = calculateLeadHealthBadgeForLead(
      lead,
      followUpCountByLeadId.get(lead.id) ?? 0,
    );
    const filter = getLeadHealthFilterForBadge(badge);
    counts[filter] += 1;
  }

  return counts;
}

export function getLeadIdsForHealthFilter(
  leads: ReadonlyArray<LeadForHealthScore>,
  followUpCountByLeadId: ReadonlyMap<string, number>,
  filter: LeadHealthFilter,
) {
  const targetBadge = getLeadHealthBadgeForFilter(filter);

  return leads
    .filter((lead) => isActiveLeadForHealthScore(lead.status))
    .filter(
      (lead) =>
        calculateLeadHealthBadgeForLead(
          lead,
          followUpCountByLeadId.get(lead.id) ?? 0,
        ) === targetBadge,
    )
    .map((lead) => lead.id);
}

export function getNegativeHealthFactors(reasons: ReadonlyArray<LeadHealthReason>) {
  return reasons
    .filter((reason) => reason.impact < 0)
    .map((reason) => {
      if (reason.label === "Lead is unassigned") {
        return "Unassigned";
      }

      return reason.label;
    });
}

export function sortCriticalLeads<
  T extends { score: number; updatedAt: string },
>(rows: ReadonlyArray<T>) {
  return [...rows].sort((a, b) => {
    if (a.score !== b.score) {
      return a.score - b.score;
    }

    return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
  });
}

export function calculateLeadHealthScoreForLead(
  lead: LeadForHealthScore,
  followUpTaskCount: number,
) {
  return calculateLeadHealthScore({
    assignedTo: lead.assigned_to,
    updatedAt: lead.updated_at,
    status: lead.status,
    followUpTaskCount,
  });
}
