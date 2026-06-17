import Link from "next/link";

import { completeFollowUpTaskFromCenter } from "@/app/(dashboard)/follow-ups/actions";
import {
  FollowUpCenterTable,
  type FollowUpCenterTask,
} from "@/components/follow-ups/follow-up-center-table";
import { FollowUpsFilters } from "@/components/follow-ups/follow-ups-filters";
import { requireProfile } from "@/lib/auth/session";
import type { OrgProfileOption } from "@/lib/leads/assignment";
import {
  getFollowUpCenterLeadIdsForAssignee,
  getFollowUpTodayBounds,
  parseFollowUpCenterQuery,
  resolveFollowUpCenterAssignedFilter,
  type FollowUpCenterSearchParams,
} from "@/lib/follow-ups/list-filters";
import { createClient } from "@/utils/supabase/server";

type FollowUpLead = {
  full_name: string | null;
  whatsapp_number: string | null;
  phone: string | null;
};

type FollowUpTaskRow = {
  id: string;
  title: string;
  due_date: string;
  status: string;
  lead_id: string;
  leads: FollowUpLead | FollowUpLead[] | null;
};

type FollowUpsPageProps = {
  searchParams: Promise<FollowUpCenterSearchParams>;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function getLeadRecord(leads: FollowUpTaskRow["leads"]) {
  const lead = Array.isArray(leads) ? leads[0] : leads;
  return lead ?? null;
}

function getLeadName(leads: FollowUpTaskRow["leads"]) {
  return getLeadRecord(leads)?.full_name ?? "Lead";
}

function getWhatsAppHref(leads: FollowUpTaskRow["leads"]) {
  const lead = getLeadRecord(leads);
  const phone = lead?.whatsapp_number || lead?.phone;

  if (!phone) {
    return null;
  }

  const cleaned = phone.replace(/\D/g, "");
  return cleaned ? `https://wa.me/${cleaned}` : null;
}

function getEmptyMessage(
  filter: ReturnType<typeof parseFollowUpCenterQuery>["filter"],
  hasAssigneeFilter: boolean,
) {
  if (hasAssigneeFilter) {
    return "Tidak ada follow up untuk filter assignee ini.";
  }

  switch (filter) {
    case "today":
      return "Tidak ada follow up jatuh tempo hari ini.";
    case "overdue":
      return "Tidak ada follow up yang terlambat.";
    case "completed":
      return "Belum ada follow up yang selesai.";
    default:
      return "Tidak ada follow up pending.";
  }
}

export default async function FollowUpsPage({ searchParams }: FollowUpsPageProps) {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const params = await searchParams;
  const { filter, assigned } = parseFollowUpCenterQuery(params);
  const { todayStart, todayEnd } = getFollowUpTodayBounds();
  const nowIso = new Date().toISOString();

  const { data: orgProfiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", profile.organization_id)
    .order("full_name");

  const profiles = (orgProfiles ?? []) as OrgProfileOption[];
  const validProfileIds = new Set(profiles.map((member) => member.id));
  const assignedFilter = resolveFollowUpCenterAssignedFilter(
    assigned,
    profile.id,
    validProfileIds,
  );
  const hasAssigneeFilter = assignedFilter.type !== "all";

  const assigneeLeadIds = hasAssigneeFilter
    ? await getFollowUpCenterLeadIdsForAssignee(
        supabase,
        profile.organization_id,
        assignedFilter,
      )
    : null;

  let rows: FollowUpTaskRow[] = [];

  if (assigneeLeadIds && assigneeLeadIds.length === 0) {
    rows = [];
  } else {
    let query = supabase
      .from("follow_up_tasks")
      .select(
        `
        id,
        title,
        due_date,
        status,
        lead_id,
        leads (
          full_name,
          whatsapp_number,
          phone
        )
      `,
      )
      .eq("organization_id", profile.organization_id);

    if (assigneeLeadIds) {
      query = query.in("lead_id", assigneeLeadIds);
    }

    if (filter === "completed") {
      query = query.eq("status", "completed");
    } else {
      query = query.eq("status", "pending");

      if (filter === "today") {
        query = query
          .gte("due_date", todayStart.toISOString())
          .lte("due_date", todayEnd.toISOString());
      } else if (filter === "overdue") {
        query = query.lt("due_date", nowIso);
      }
    }

    const { data: tasks, error } = await query.order("due_date", {
      ascending: filter !== "completed",
    });

    if (error) {
      throw new Error("Gagal memuat data follow up.");
    }

    rows = (tasks ?? []) as FollowUpTaskRow[];
  }

  const tableTasks: FollowUpCenterTask[] = rows.map((task) => ({
    id: task.id,
    title: task.title,
    dueDateLabel: formatDateTime(task.due_date),
    status: task.status,
    statusLabel: formatLabel(task.status),
    leadId: task.lead_id,
    leadName: getLeadName(task.leads),
    whatsAppHref: getWhatsAppHref(task.leads),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Follow Up Center</h1>
          <p className="text-sm text-muted-foreground">
            Kelola semua follow up terjadwal untuk organisasi Anda.
          </p>
        </div>
        <Link
          href="/follow-ups/queue"
          className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent/50"
        >
          Open Follow Up Queue
        </Link>
      </div>

      {params.success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {decodeURIComponent(params.success)}
        </div>
      )}

      {params.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <FollowUpsFilters
        activeFilter={filter}
        activeAssigned={assigned}
        profiles={profiles}
      />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="text-lg font-medium">Tidak ada follow up</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {getEmptyMessage(filter, hasAssigneeFilter)}
          </p>
        </div>
      ) : (
        <FollowUpCenterTable
          tasks={tableTasks}
          filter={filter}
          assigned={assigned}
          completeFollowUpTask={completeFollowUpTaskFromCenter}
        />
      )}
    </div>
  );
}
