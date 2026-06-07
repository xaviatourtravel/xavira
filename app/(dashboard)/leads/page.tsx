import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { LeadsActiveFilters } from "@/components/leads/leads-active-filters";
import {
  formatAssignedUserLabel,
  getLeadAssigneeName,
  getLeadAgingCutoffIso,
  shouldExcludeClosedLeadsForAging,
  CLOSED_LEAD_STATUS_FILTER,
  type OrgProfileOption,
} from "@/lib/leads/assignment";
import {
  buildLeadsListHref,
  getActiveLeadFilterBadges,
  getLeadIdsForHealthFilterQuery,
  getOverdueFollowUpLeadIds,
  isLeadHealthFilter,
  isOverdueFollowUpFilter,
  parseLeadsListFilters,
  resolveLeadsListAssignedFilter,
  type LeadsListSearchParams,
} from "@/lib/leads/list-filters";
import { parseLeadHealthFilter } from "@/lib/leads/health-score";
import { requireProfile } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

type LeadRow = {
  id: string;
  full_name: string;
  phone: string | null;
  whatsapp_number: string | null;
  source: string;
  interest_type: string;
  package_interest: string | null;
  status: string;
  assigned_to: string | null;
  created_at: string;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function getContactPhone(lead: LeadRow) {
  return lead.whatsapp_number || lead.phone || "-";
}

type LeadsPageProps = {
  searchParams: Promise<LeadsListSearchParams>;
};

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const params = await searchParams;
  const filters = parseLeadsListFilters(params);
  const currentPage = Math.max(Number(params.page ?? "1"), 1);
  const pageSize = 20;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: orgProfiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", profile.organization_id)
    .order("full_name");

  const profiles = (orgProfiles ?? []) as OrgProfileOption[];
  const validProfileIds = new Set(profiles.map((item) => item.id));
  const assignedUserFilter = resolveLeadsListAssignedFilter(
    filters,
    profile.id,
    validProfileIds,
  );
  const activeFilterBadges = getActiveLeadFilterBadges(filters, profiles);
  const filtersActive = activeFilterBadges.length > 0;

  const overdueLeadIds = isOverdueFollowUpFilter(filters.followUp)
    ? await getOverdueFollowUpLeadIds(supabase, profile.organization_id)
    : null;

  const healthFilter = parseLeadHealthFilter(filters.health);
  const healthLeadIds = healthFilter
    ? await getLeadIdsForHealthFilterQuery(
        supabase,
        profile.organization_id,
        healthFilter,
      )
    : null;

  if (healthFilter && healthLeadIds?.length === 0) {
    return (
      <LeadsPageContent
        filters={filters}
        profiles={profiles}
        activeFilterBadges={activeFilterBadges}
        filtersActive={filtersActive}
        rows={[]}
        currentPage={1}
        totalPages={1}
      />
    );
  }

  let query = supabase
    .from("leads")
    .select(
      `
      id,
      full_name,
      phone,
      whatsapp_number,
      source,
      interest_type,
      package_interest,
      status,
      assigned_to,
      created_at,
      profiles!leads_assigned_to_fkey (
        full_name
      )
    `,
      { count: "exact" },
    )
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null);

  if (filters.q) {
    query = query.or(
      `full_name.ilike.%${filters.q}%,whatsapp_number.ilike.%${filters.q}%,phone.ilike.%${filters.q}%`,
    );
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (assignedUserFilter.type === "unassigned") {
    query = query.is("assigned_to", null);
  } else if (assignedUserFilter.type === "profile") {
    query = query.eq("assigned_to", assignedUserFilter.profileId);
  }

  if (filters.aging != null) {
    query = query.lt("updated_at", getLeadAgingCutoffIso(filters.aging));

    if (shouldExcludeClosedLeadsForAging(filters.aging)) {
      query = query.not("status", "in", CLOSED_LEAD_STATUS_FILTER);
    }
  }

  if (isOverdueFollowUpFilter(filters.followUp)) {
    if (!overdueLeadIds?.length) {
      const rows: LeadRow[] = [];
      const totalPages = 1;

      return (
        <LeadsPageContent
          filters={filters}
          profiles={profiles}
          activeFilterBadges={activeFilterBadges}
          filtersActive={filtersActive}
          rows={rows}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      );
    }

    query = query.in("id", overdueLeadIds);
  }

  if (healthFilter && healthLeadIds) {
    query = query.in("id", healthLeadIds);
  }

  const { data: leads, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error("Gagal memuat data lead.");
  }

  const rows = (leads ?? []) as LeadRow[];
  const totalPages = Math.max(Math.ceil((count ?? 0) / pageSize), 1);

  return (
    <LeadsPageContent
      filters={filters}
      profiles={profiles}
      activeFilterBadges={activeFilterBadges}
      filtersActive={filtersActive}
      rows={rows}
      currentPage={currentPage}
      totalPages={totalPages}
    />
  );
}

type LeadsPageContentProps = {
  filters: ReturnType<typeof parseLeadsListFilters>;
  profiles: OrgProfileOption[];
  activeFilterBadges: ReturnType<typeof getActiveLeadFilterBadges>;
  filtersActive: boolean;
  rows: LeadRow[];
  currentPage: number;
  totalPages: number;
};

function LeadsPageContent({
  filters,
  profiles,
  activeFilterBadges,
  filtersActive,
  rows,
  currentPage,
  totalPages,
}: LeadsPageContentProps) {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Link
          href="/leads/pipeline"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Pipeline
        </Link>

        <Link href="/leads/new" className={cn(buttonVariants())}>
          Tambah Lead
        </Link>
      </div>

      <form method="GET" className="flex flex-wrap gap-2">
        {filters.assignedTo && (
          <input type="hidden" name="assigned_to" value={filters.assignedTo} />
        )}

        {filters.aging != null && (
          <input type="hidden" name="aging" value={String(filters.aging)} />
        )}

        {filters.followUp && (
          <input type="hidden" name="follow_up" value={filters.followUp} />
        )}

        {isLeadHealthFilter(filters.health) && (
          <input type="hidden" name="health" value={filters.health} />
        )}

        <input
          type="text"
          name="q"
          defaultValue={filters.q}
          placeholder="Cari nama atau WA..."
          className="rounded-md border px-3 py-2 text-sm"
        />

        <select
          name="status"
          defaultValue={filters.status}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="proposal_sent">Proposal</option>
          <option value="negotiating">Negotiating</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>

        <select
          name="assigned"
          defaultValue={filters.assigned}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">All Users</option>
          <option value="unassigned">Unassigned</option>
          {profiles.map((member) => (
            <option key={member.id} value={member.id}>
              {member.full_name || "Pengguna"}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-md border px-3 py-2 text-sm"
        >
          Filter
        </button>
      </form>

      <LeadsActiveFilters badges={activeFilterBadges} />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="text-lg font-medium">
            {filtersActive ? "Lead tidak ditemukan" : "Belum ada lead"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {filtersActive
              ? "Coba ubah kata kunci atau filter pencarian."
              : "Mulai dengan menambahkan lead pertama Anda."}
          </p>
          {filtersActive ? (
            <Link
              href="/leads"
              className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex")}
            >
              Clear filters
            </Link>
          ) : (
            <Link
              href="/leads/new"
              className={cn(buttonVariants(), "mt-4 inline-flex")}
            >
              Tambah Lead
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="border-b bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">WhatsApp / Telepon</th>
                  <th className="px-4 py-3 font-medium">Sumber</th>
                  <th className="px-4 py-3 font-medium">Minat</th>
                  <th className="px-4 py-3 font-medium">Paket</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Assigned User</th>
                  <th className="px-4 py-3 font-medium">Dibuat</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((lead) => (
                  <tr key={lead.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {lead.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{getContactPhone(lead)}</td>
                    <td className="px-4 py-3 capitalize">
                      {formatLabel(lead.source)}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {formatLabel(lead.interest_type)}
                    </td>
                    <td className="px-4 py-3">
                      {lead.package_interest || "-"}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {formatLabel(lead.status)}
                    </td>
                    <td className="px-4 py-3">
                      {formatAssignedUserLabel(getLeadAssigneeName(lead.profiles))}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDate(lead.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {getContactPhone(lead) !== "-" && (
                        <a
                          href={`https://wa.me/${getContactPhone(lead).replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded bg-green-600 px-3 py-1 text-xs text-white"
                        >
                          WhatsApp
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Halaman {currentPage} dari {totalPages}
            </p>

            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link
                  href={buildLeadsListHref(filters, { page: currentPage - 1 })}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Previous
                </Link>
              )}

              {currentPage < totalPages && (
                <Link
                  href={buildLeadsListHref(filters, { page: currentPage + 1 })}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
