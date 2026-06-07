import {
  formatAssignedUserLabel,
  getLeadAssigneeName,
} from "@/lib/leads/assignment";
import { formatAutomaticFollowUpTitle } from "@/lib/leads/follow-up-task-display";
import {
  buildFollowUpCountByLeadId,
  calculateLeadHealthScoreForLead,
  getNegativeHealthFactors,
  isActiveLeadForHealthScore,
  sortCriticalLeads,
} from "@/lib/leads/health-score";
import { getLeadWhatsAppPhone } from "@/lib/leads/next-best-action";

export const CRITICAL_BULK_FOLLOW_UP_BASE_TITLE = "Follow up critical lead";

export const CRITICAL_BULK_FOLLOW_UP_ACTIVITY = {
  title: "Follow Up Critical Lead Dibuat",
  body: "Sistem membuat follow up untuk lead yang masuk kategori critical.",
} as const;

export function getCriticalBulkFollowUpTaskTitle() {
  return formatAutomaticFollowUpTitle(CRITICAL_BULK_FOLLOW_UP_BASE_TITLE);
}

export type CriticalLeadSourceRecord = {
  id: string;
  full_name: string;
  status: string;
  assigned_to: string | null;
  updated_at: string;
  whatsapp_number: string | null;
  phone: string | null;
  profiles:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null;
};

export type CriticalLeadListItem = {
  id: string;
  fullName: string;
  score: number;
  status: string;
  assignedUserName: string;
  updatedAt: string;
  negativeFactors: string[];
  whatsAppHref: string | null;
};

function buildWhatsAppHref(lead: CriticalLeadSourceRecord) {
  const phone = getLeadWhatsAppPhone(lead.whatsapp_number, lead.phone);
  return phone ? `https://wa.me/${phone}` : null;
}

export function buildCriticalLeadListItems(
  leads: ReadonlyArray<CriticalLeadSourceRecord>,
  followUpTasks: ReadonlyArray<{ lead_id: string }>,
): CriticalLeadListItem[] {
  const followUpCountByLeadId = buildFollowUpCountByLeadId(followUpTasks);

  return sortCriticalLeads(
    leads
      .filter((lead) => isActiveLeadForHealthScore(lead.status))
      .map((lead) => {
        const health = calculateLeadHealthScoreForLead(
          lead,
          followUpCountByLeadId.get(lead.id) ?? 0,
        );

        if (health.badge !== "Critical") {
          return null;
        }

        return {
          id: lead.id,
          fullName: lead.full_name,
          score: health.score,
          status: lead.status,
          assignedUserName: formatAssignedUserLabel(
            getLeadAssigneeName(lead.profiles),
          ),
          updatedAt: lead.updated_at,
          negativeFactors: getNegativeHealthFactors(health.reasons),
          whatsAppHref: buildWhatsAppHref(lead),
        };
      })
      .filter((lead): lead is CriticalLeadListItem => lead != null),
  );
}
