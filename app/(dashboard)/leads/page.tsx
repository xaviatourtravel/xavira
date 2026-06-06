import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  formatAssignedUserLabel,
  getLeadAssigneeName,
  getLeadAgingCutoffIso,
  parseLeadAgingFilter,
  resolveLeadAssignedFilter,
  shouldExcludeClosedLeadsForAging,
  CLOSED_LEAD_STATUS_FILTER,
  type OrgProfileOption,
} from "@/lib/leads/assignment";
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
  searchParams: Promise<{
    q?: string;
    status?: string;
    assigned?: string;
    assigned_to?: string;
    aging?: string;
    page?: string;
  }>;
};

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const params = await searchParams;

  const search = params.q?.trim() ?? "";
  const statusFilter = params.status?.trim() ?? "";
  const assignedFilter = params.assigned?.trim() ?? "";
  const assignedToParam = params.assigned_to?.trim() ?? "";
  const agingFilter = parseLeadAgingFilter(params.aging?.trim() ?? "");
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
  const assignedUserFilter = resolveLeadAssignedFilter({
    assignedToParam,
    assignedParam: assignedFilter,
    currentProfileId: profile.id,
    validProfileIds,
  });

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

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,whatsapp_number.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  }

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  if (assignedUserFilter.type === "unassigned") {
    query = query.is("assigned_to", null);
  } else if (assignedUserFilter.type === "profile") {
    query = query.eq("assigned_to", assignedUserFilter.profileId);
  }

  if (agingFilter != null) {
    query = query.lt("updated_at", getLeadAgingCutoffIso(agingFilter));

    if (shouldExcludeClosedLeadsForAging(agingFilter)) {
      query = query.not("status", "in", CLOSED_LEAD_STATUS_FILTER);
    }
  }

  const { data: leads, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error("Gagal memuat data lead.");
  }

  const rows = (leads ?? []) as LeadRow[];
  const totalPages = Math.max(Math.ceil((count ?? 0) / pageSize), 1);

  const buildPageHref = (page: number) => {
    const queryParams = new URLSearchParams();

    if (search) {
      queryParams.set("q", search);
    }

    if (statusFilter) {
      queryParams.set("status", statusFilter);
    }

    if (assignedFilter) {
      queryParams.set("assigned", assignedFilter);
    }

    if (assignedToParam) {
      queryParams.set("assigned_to", assignedToParam);
    }

    if (agingFilter != null) {
      queryParams.set("aging", String(agingFilter));
    }

    queryParams.set("page", String(page));

    return `/leads?${queryParams.toString()}`;
  };

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
        {assignedToParam && (
          <input type="hidden" name="assigned_to" value={assignedToParam} />
        )}

        {agingFilter != null && (
          <input type="hidden" name="aging" value={String(agingFilter)} />
        )}

        <input
          type="text"
          name="q"
          defaultValue={search}
          placeholder="Cari nama atau WA..."
          className="rounded-md border px-3 py-2 text-sm"
        />

        <select
          name="status"
          defaultValue={statusFilter}
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
          defaultValue={assignedFilter}
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

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="text-lg font-medium">Belum ada lead</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Mulai dengan menambahkan lead pertama Anda.
          </p>
          <Link
            href="/leads/new"
            className={cn(buttonVariants(), "mt-4 inline-flex")}
          >
            Tambah Lead
          </Link>
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
                  href={buildPageHref(currentPage - 1)}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Previous
                </Link>
              )}

              {currentPage < totalPages && (
                <Link
                  href={buildPageHref(currentPage + 1)}
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
