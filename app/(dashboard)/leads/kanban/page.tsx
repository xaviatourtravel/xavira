import Link from "next/link";

import { LeadKanbanBoard } from "@/components/leads/lead-kanban-board";
import type { KanbanLeadItem } from "@/components/leads/lead-kanban-card";
import { LeadKanbanFilters } from "@/components/leads/lead-kanban-filters";
import { buttonVariants } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth/session";
import {
  buildAssignedUserFilter,
  getLeadAssigneeName,
  type OrgProfileOption,
} from "@/lib/leads/assignment";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

type KanbanLeadRow = {
  id: string;
  full_name: string;
  status: string;
  package_interest: string | null;
  whatsapp_number: string | null;
  phone: string | null;
  assigned_to: string | null;
  updated_at: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
  lead_scores: { score: number } | { score: number }[] | null;
};

function getPriorityScore(lead: KanbanLeadRow) {
  if (!lead.lead_scores) {
    return null;
  }

  if (Array.isArray(lead.lead_scores)) {
    return lead.lead_scores[0]?.score ?? null;
  }

  return lead.lead_scores.score ?? null;
}

const LEAD_STATUS_FILTERS = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiating",
  "won",
  "lost",
] as const;

function isLeadStatusFilter(
  value: string,
): value is (typeof LEAD_STATUS_FILTERS)[number] {
  return LEAD_STATUS_FILTERS.includes(
    value as (typeof LEAD_STATUS_FILTERS)[number],
  );
}

export default async function LeadKanbanPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    assigned?: string;
    status?: string;
    error?: string;
  }>;
}) {
  const query = await searchParams;
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const search = query.q?.trim() ?? "";
  const assignedFilter = query.assigned?.trim() ?? "";
  const statusFilter = query.status?.trim() ?? "";

  const { data: orgProfiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", profile.organization_id)
    .order("full_name");

  const profiles = (orgProfiles ?? []) as OrgProfileOption[];
  const validProfileIds = new Set(profiles.map((item) => item.id));
  const assignedUserFilter = buildAssignedUserFilter(
    assignedFilter,
    validProfileIds,
  );

  let leadsQuery = supabase
    .from("leads")
    .select(
      `
      id,
      full_name,
      status,
      package_interest,
      whatsapp_number,
      phone,
      assigned_to,
      updated_at,
      profiles!leads_assigned_to_fkey (
        full_name
      ),
      lead_scores (
        score
      )
    `,
    )
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null);

  if (search) {
    leadsQuery = leadsQuery.or(
      `full_name.ilike.%${search}%,package_interest.ilike.%${search}%,whatsapp_number.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  }

  if (assignedUserFilter.type === "unassigned") {
    leadsQuery = leadsQuery.is("assigned_to", null);
  } else if (assignedUserFilter.type === "profile") {
    leadsQuery = leadsQuery.eq("assigned_to", assignedUserFilter.profileId);
  }

  if (statusFilter && isLeadStatusFilter(statusFilter)) {
    leadsQuery = leadsQuery.eq("status", statusFilter);
  }

  const { data: leads, error } = await leadsQuery.order("updated_at", {
    ascending: false,
  });

  if (error) {
    throw new Error("Gagal memuat kanban lead.");
  }

  const rows: KanbanLeadItem[] = ((leads ?? []) as KanbanLeadRow[]).map(
    (lead) => ({
      id: lead.id,
      full_name: lead.full_name,
      status: lead.status,
      package_interest: lead.package_interest,
      whatsapp_number: lead.whatsapp_number,
      phone: lead.phone,
      assignee_name: getLeadAssigneeName(lead.profiles),
      priority_score: getPriorityScore(lead),
      updated_at: lead.updated_at,
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Lead Kanban</h1>
          <p className="text-sm text-muted-foreground">
            Kelola pipeline lead berdasarkan status.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/leads"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            List View
          </Link>
          <Link
            href="/leads/pipeline"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Pipeline
          </Link>
        </div>
      </div>

      {query?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(query.error)}
        </div>
      )}

      <LeadKanbanFilters
        search={search}
        assigned={assignedFilter}
        status={statusFilter}
        profiles={profiles}
      />

      <LeadKanbanBoard leads={rows} />
    </div>
  );
}
