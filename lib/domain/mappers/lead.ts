import type { Lead, LeadRow } from "../lead";
import type { LeadHealthBadge } from "@/lib/leads/health-score";

export function mapLeadFromRow(
  row: LeadRow,
  relations?: {
    assignedToName?: string | null;
    healthScore?: number | null;
    healthBadge?: LeadHealthBadge | null;
    tags?: string[];
    lastFollowUpAt?: string | null;
    nextFollowUpAt?: string | null;
  },
): Lead {
  return {
    id: row.id,
    fullName: row.full_name?.trim() || "Unknown lead",
    status: row.status,
    email: row.email,
    phone: row.phone ?? row.whatsapp_number,
    source: row.source,
    packageInterest: row.package_interest,
    travelDatePreference: row.travel_date_preference,
    partySize: row.party_size,
    budgetIdr: row.budget_idr,
    assignedToId: row.assigned_to,
    assignedToName: relations?.assignedToName ?? null,
    healthScore: relations?.healthScore ?? null,
    healthBadge: relations?.healthBadge ?? null,
    tags: relations?.tags ?? [],
    lastFollowUpAt: relations?.lastFollowUpAt ?? row.last_contacted_at,
    nextFollowUpAt: relations?.nextFollowUpAt ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapLeadFromSalesAssistantRow(row: {
  full_name: string;
  status: string;
  package_interest: string | null;
  budget_idr: number | null;
  travel_date_preference: string | null;
  party_size: number | null;
  updated_at: string;
}): Lead {
  return {
    id: "prompt-lead",
    fullName: row.full_name,
    status: row.status,
    email: null,
    phone: null,
    source: "sales_assistant",
    packageInterest: row.package_interest,
    travelDatePreference: row.travel_date_preference,
    partySize: row.party_size,
    budgetIdr: row.budget_idr,
    assignedToId: null,
    assignedToName: null,
    healthScore: null,
    healthBadge: null,
    tags: [],
    lastFollowUpAt: null,
    nextFollowUpAt: null,
    createdAt: row.updated_at,
    updatedAt: row.updated_at,
  };
}
