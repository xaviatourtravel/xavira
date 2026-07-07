import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { LeadsActiveFilters } from "@/components/leads/leads-active-filters";
import {
  LeadsListTable,
  type LeadsListTableRow,
} from "@/components/leads/leads-list-table";
import {
  formatAssignedUserLabel,
  getLeadAssigneeName,
  getLeadAgingCutoffIso,
  shouldExcludeClosedLeadsForAging,
  CLOSED_LEAD_STATUS_FILTER,
  type OrgProfileOption,
} from "@/lib/leads/assignment";
import { getUserFriendlyErrorMessage } from "@/lib/errors/get-user-friendly-error-message";
import { logServerError } from "@/lib/errors/log-server-error";
import {
  buildLeadsListHref,
  getActiveLeadFilterBadges,
  getLeadIdsForHealthFilterQuery,
  getOverdueFollowUpLeadIds,
  isLeadHealthFilter,
  getLeadIdsForTemperatureFilterQuery,
  isLeadTemperatureFilter,
  isOverdueFollowUpFilter,
  parseLeadsListFilters,
  resolveLeadsListAssignedFilter,
  type LeadsListSearchParams,
} from "@/lib/leads/list-filters";
import { parseLeadTemperatureFilter } from "@/lib/leads/lead-temperature";
import { parseLeadHealthFilter } from "@/lib/leads/health-score";
import { formatLeadDate } from "@/lib/leads/lead-date";
import { loadLeadFormOptions } from "@/lib/leads/load-lead-form-options";
import { canEditLead } from "@/lib/leads/permissions";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import {
  formatLeadSourceLabel,
  getLeadSourceOptions,
  resolveLeadSourceFilterValues,
} from "@/lib/leads/source-tracking";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { getOrgCampaignOptions } from "@/lib/campaigns/queries";
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
  lead_date: string | null;
  lead_temperature: string | null;
  updated_at: string;
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
  searchParams: Promise<LeadsListSearchParams & { success?: string; error?: string }>;
};

function mapLeadRowsToTableRows(
  rows: LeadRow[],
  profile: Awaited<ReturnType<typeof requireProfile>>["profile"],
): LeadsListTableRow[] {
  return rows.map((lead) => {
    const contactPhone = getContactPhone(lead);
    const normalizedPhone = contactPhone.replace(/\D/g, "");

    return {
      id: lead.id,
      fullName: lead.full_name,
      contactPhone,
      sourceLabel: formatLeadSourceLabel(lead.source),
      interestLabel: formatLabel(lead.interest_type),
      packageInterest: lead.package_interest || "-",
      statusLabel: formatLabel(lead.status),
      assignedUserLabel: formatAssignedUserLabel(getLeadAssigneeName(lead.profiles)),
      leadDateLabel: lead.lead_date
        ? formatLeadDate(lead.lead_date)
        : formatDate(lead.created_at),
      crmCreatedAtLabel: formatDate(lead.created_at),
      whatsAppHref:
        contactPhone !== "-" && normalizedPhone
          ? `https://wa.me/${normalizedPhone}`
          : null,
      canEdit: canEditLead(profile, {
        organization_id: profile.organization_id,
        assigned_to: lead.assigned_to,
      }),
      leadTemperature: lead.lead_temperature,
      status: lead.status,
      updatedAt: lead.updated_at,
    };
  });
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const params = await searchParams;
  const filters = parseLeadsListFilters(params);
  const canBulkDelete = isAdminOrOwner(profile);
  const currentPage = Math.max(Number(params.page ?? "1"), 1);
  const pageSize = 20;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: orgProfiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", profile.organization_id)
    .order("full_name");

  const [campaigns, formOptions] = await Promise.all([
    getOrgCampaignOptions(supabase, profile.organization_id),
    loadLeadFormOptions(supabase, profile.organization_id),
  ]);

  const profiles = (orgProfiles ?? []) as OrgProfileOption[];
  const validProfileIds = new Set(profiles.map((item) => item.id));
  const assignedUserFilter = resolveLeadsListAssignedFilter(
    filters,
    profile.id,
    validProfileIds,
  );
  const activeFilterBadges = getActiveLeadFilterBadges(
    filters,
    profiles,
    campaigns,
  );
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

  const temperatureFilter = parseLeadTemperatureFilter(filters.temperature);
  const temperatureLeadIds = temperatureFilter
    ? await getLeadIdsForTemperatureFilterQuery(
        supabase,
        profile.organization_id,
        temperatureFilter,
      )
    : null;

  if (healthFilter && healthLeadIds?.length === 0) {
    return (
      <LeadsPageContent
        filters={filters}
        profiles={profiles}
        campaigns={campaigns}
        activeFilterBadges={activeFilterBadges}
        filtersActive={filtersActive}
        rows={[]}
        currentPage={1}
        totalPages={1}
        canBulkDelete={canBulkDelete}
        formOptions={formOptions}
        profile={profile}
        successMessage={params.success}
        errorMessage={params.error}
      />
    );
  }

  const sourceFilterValues = resolveLeadSourceFilterValues(filters.source);
  if (temperatureFilter && temperatureLeadIds?.length === 0) {
    return (
      <LeadsPageContent
        filters={filters}
        profiles={profiles}
        campaigns={campaigns}
        activeFilterBadges={activeFilterBadges}
        filtersActive={filtersActive}
        rows={[]}
        currentPage={1}
        totalPages={1}
        canBulkDelete={canBulkDelete}
        formOptions={formOptions}
        profile={profile}
        successMessage={params.success}
        errorMessage={params.error}
      />
    );
  }

  if (sourceFilterValues?.length === 0) {
    return (
      <LeadsPageContent
        filters={filters}
        profiles={profiles}
        campaigns={campaigns}
        activeFilterBadges={activeFilterBadges}
        filtersActive={filtersActive}
        rows={[]}
        currentPage={1}
        totalPages={1}
        canBulkDelete={canBulkDelete}
        formOptions={formOptions}
        profile={profile}
        successMessage={params.success}
        errorMessage={params.error}
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
      lead_date,
      lead_temperature,
      updated_at,
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

  if (sourceFilterValues) {
    query = query.in("source", sourceFilterValues);
  }

  if (filters.campaign) {
    query = query.eq("campaign_id", filters.campaign);
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
          campaigns={campaigns}
          activeFilterBadges={activeFilterBadges}
          filtersActive={filtersActive}
          rows={rows}
          currentPage={currentPage}
          totalPages={totalPages}
          canBulkDelete={canBulkDelete}
          formOptions={formOptions}
          profile={profile}
          successMessage={params.success}
          errorMessage={params.error}
        />
      );
    }

    query = query.in("id", overdueLeadIds);
  }

  if (healthFilter && healthLeadIds) {
    query = query.in("id", healthLeadIds);
  }

  if (temperatureFilter && temperatureLeadIds) {
    query = query.in("id", temperatureLeadIds);
  }

  const { data: leads, error, count } = await query
    .order("lead_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    logServerError("leadsPage", error);
    throw new Error(getUserFriendlyErrorMessage(error));
  }

  const rows = (leads ?? []) as LeadRow[];
  const totalPages = Math.max(Math.ceil((count ?? 0) / pageSize), 1);

  return (
    <LeadsPageContent
      filters={filters}
      profiles={profiles}
      campaigns={campaigns}
      activeFilterBadges={activeFilterBadges}
      filtersActive={filtersActive}
      rows={rows}
      currentPage={currentPage}
      totalPages={totalPages}
      canBulkDelete={canBulkDelete}
      formOptions={formOptions}
      profile={profile}
      successMessage={params.success}
      errorMessage={params.error}
    />
  );
}

type LeadsPageContentProps = {
  filters: ReturnType<typeof parseLeadsListFilters>;
  profiles: OrgProfileOption[];
  campaigns: Awaited<ReturnType<typeof getOrgCampaignOptions>>;
  activeFilterBadges: ReturnType<typeof getActiveLeadFilterBadges>;
  filtersActive: boolean;
  rows: LeadRow[];
  currentPage: number;
  totalPages: number;
  canBulkDelete: boolean;
  formOptions: Awaited<ReturnType<typeof loadLeadFormOptions>>;
  profile: Awaited<ReturnType<typeof requireProfile>>["profile"];
  successMessage?: string;
  errorMessage?: string;
};

function LeadsPageContent({
  filters,
  profiles,
  campaigns,
  activeFilterBadges,
  filtersActive,
  rows,
  currentPage,
  totalPages,
  canBulkDelete,
  formOptions,
  profile,
  successMessage,
  errorMessage,
}: LeadsPageContentProps) {
  const returnTo = buildLeadsListHref(filters, { page: currentPage });
  const tableRows = mapLeadRowsToTableRows(rows, profile);

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

      <form method="GET" className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
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

        {isLeadTemperatureFilter(filters.temperature) && (
          <input type="hidden" name="temperature" value={filters.temperature} />
        )}

        <input
          type="text"
          name="q"
          defaultValue={filters.q}
          placeholder="Cari nama atau WA..."
          className="min-h-[44px] w-full rounded-md border px-3 py-2 text-sm sm:max-w-xs"
        />

        <select
          name="status"
          defaultValue={filters.status}
          className="min-h-[44px] w-full rounded-md border px-3 py-2 text-sm sm:w-auto"
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
          name="source"
          defaultValue={filters.source}
          className="min-h-[44px] w-full rounded-md border px-3 py-2 text-sm sm:w-auto"
        >
          <option value="">All Sources</option>
          {getLeadSourceOptions(DEFAULT_LOCALE).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          name="campaign"
          defaultValue={filters.campaign}
          className="min-h-[44px] w-full rounded-md border px-3 py-2 text-sm sm:w-auto"
        >
          <option value="">All Campaigns</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </select>

        <select
          name="assigned"
          defaultValue={filters.assigned}
          className="min-h-[44px] w-full rounded-md border px-3 py-2 text-sm sm:w-auto"
        >
          <option value="">All Users</option>
          <option value="unassigned">Unassigned</option>
          {profiles.map((member) => (
            <option key={member.id} value={member.id}>
              {member.full_name || "Pengguna"}
            </option>
          ))}
        </select>

        <select
          name="temperature"
          defaultValue={filters.temperature}
          className="min-h-[44px] w-full rounded-md border px-3 py-2 text-sm sm:w-auto"
        >
          <option value="">All Temperatures</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
          <option value="not_set">Not Set</option>
        </select>

        <button
          type="submit"
          className="min-h-[44px] w-full rounded-md border px-3 py-2 text-sm sm:w-auto"
        >
          Filter
        </button>
      </form>

      <LeadsActiveFilters badges={activeFilterBadges} />

      {successMessage && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {decodeURIComponent(successMessage)}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(errorMessage)}
        </div>
      )}

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
        <LeadsListTable
          rows={tableRows}
          profile={profile}
          formOptions={formOptions}
          canBulkDelete={canBulkDelete}
          returnTo={returnTo}
          currentPage={currentPage}
          totalPages={totalPages}
          previousPageHref={
            currentPage > 1
              ? buildLeadsListHref(filters, { page: currentPage - 1 })
              : null
          }
          nextPageHref={
            currentPage < totalPages
              ? buildLeadsListHref(filters, { page: currentPage + 1 })
              : null
          }
        />
      )}
    </div>
  );
}
