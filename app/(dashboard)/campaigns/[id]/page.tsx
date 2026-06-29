import Link from "next/link";
import { notFound } from "next/navigation";

import { CampaignRowActions } from "@/components/campaigns/campaign-row-actions";
import { buttonVariants } from "@/components/ui/button";
import {
  formatCampaignStatusLabel,
  type CampaignStatus,
} from "@/lib/campaigns/constants";
import { loadCampaignDetailAttribution } from "@/lib/campaigns/queries";
import { customerWorkspaceHref } from "@/lib/customers/routes";
import {
  formatAssignedUserLabel,
  getLeadAssigneeName,
} from "@/lib/leads/assignment";
import { formatLeadDate } from "@/lib/leads/lead-date";
import { getEffectiveLeadTemperature } from "@/lib/leads/lead-temperature";
import { LeadTemperatureBadge } from "@/components/leads/lead-temperature-badge";
import { formatLeadSourceLabel } from "@/lib/leads/source-tracking";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

type CampaignDetail = {
  id: string;
  name: string;
  source: string | null;
  status: CampaignStatus;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type CampaignLeadRow = {
  id: string;
  full_name: string;
  status: string;
  lead_temperature: string | null;
  updated_at: string;
  package_interest: string | null;
  lead_date: string | null;
  created_at: string;
  assigned_to: string | null;
  profiles:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null;
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function TemperatureStat({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold", className)}>{value}</p>
    </div>
  );
}

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { profile } = await requireProfile();
  const canManageCampaigns = isAdminOrOwner(profile);
  const supabase = await createClient();

  const [{ data: campaign, error }, { data: relatedLeads, error: leadsError }] =
    await Promise.all([
      supabase
        .from("campaigns")
        .select(
          "id, name, source, status, start_date, end_date, budget, notes, created_at, updated_at",
        )
        .eq("id", id)
        .eq("organization_id", profile.organization_id)
        .maybeSingle(),
      supabase
        .from("leads")
        .select(
          `
          id,
          full_name,
          status,
          lead_temperature,
          updated_at,
          package_interest,
          lead_date,
          created_at,
          assigned_to,
          profiles!leads_assigned_to_fkey (
            full_name
          )
        `,
        )
        .eq("organization_id", profile.organization_id)
        .eq("campaign_id", id)
        .is("deleted_at", null)
        .order("lead_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false }),
    ]);

  if (error || leadsError) {
    throw new Error("Gagal memuat detail campaign.");
  }

  if (!campaign) {
    notFound();
  }

  const detail = campaign as CampaignDetail;
  const leads = (relatedLeads ?? []) as CampaignLeadRow[];
  const { metrics, temperatureBreakdown, revenueByPackage } =
    await loadCampaignDetailAttribution(
      supabase,
      profile.organization_id,
      detail.id,
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/campaigns"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Kembali ke Campaigns
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{detail.name}</h1>
          <p className="text-sm text-muted-foreground">
            Campaign attribution dan performa marketing.
          </p>
        </div>

        {canManageCampaigns && (
          <div className="flex items-center gap-2">
            <Link
              href={`/campaigns/${detail.id}/edit`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Edit Campaign
            </Link>
            <CampaignRowActions campaignId={detail.id} />
          </div>
        )}
      </div>

      {query?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(query.error)}
        </div>
      )}

      <div className="rounded-xl border p-6">
        <h2 className="text-lg font-semibold">Campaign Information</h2>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Name</dt>
            <dd className="mt-1 text-sm font-medium">{detail.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Source</dt>
            <dd className="mt-1 text-sm font-medium">
              {formatLeadSourceLabel(detail.source ?? "other")}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Budget</dt>
            <dd className="mt-1 text-sm font-medium">
              {formatCurrency(detail.budget ?? 0)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Status</dt>
            <dd className="mt-1 text-sm font-medium capitalize">
              {formatCampaignStatusLabel(detail.status)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted-foreground">Date Range</dt>
            <dd className="mt-1 text-sm font-medium">
              {formatDate(detail.start_date)} - {formatDate(detail.end_date)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted-foreground">Catatan</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm">
              {detail.notes || "-"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Leads" value={metrics.leadCount} />
        <MetricCard label="Bookings" value={metrics.bookingCount} />
        <MetricCard label="Revenue" value={formatCurrency(metrics.revenue)} />
        <MetricCard
          label="Conversion Rate"
          value={`${metrics.conversionRate}%`}
        />
      </div>

      <div className="rounded-xl border p-6">
        <h2 className="text-lg font-semibold">Lead Temperature Breakdown</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Distribusi suhu lead yang ditautkan ke campaign ini.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <TemperatureStat
            label="Hot"
            value={temperatureBreakdown.hot}
            className="text-orange-700"
          />
          <TemperatureStat
            label="Warm"
            value={temperatureBreakdown.warm}
            className="text-yellow-700"
          />
          <TemperatureStat
            label="Cold"
            value={temperatureBreakdown.cold}
            className="text-slate-700"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Leads</h2>
        </div>

        {leads.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Belum ada lead yang ditautkan ke campaign ini.
          </div>
        ) : (
          <table className="w-full min-w-[960px] text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Temperature</th>
                <th className="px-4 py-3 font-medium">Assigned Sales</th>
                <th className="px-4 py-3 font-medium">Package</th>
                <th className="px-4 py-3 font-medium">Lead Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const temperature = getEffectiveLeadTemperature({
                  lead_temperature: lead.lead_temperature,
                  status: lead.status,
                  updated_at: lead.updated_at,
                });

                return (
                  <tr key={lead.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={customerWorkspaceHref(lead.id)}
                        className="text-blue-600 hover:underline"
                      >
                        {lead.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {formatLabel(lead.status)}
                    </td>
                    <td className="px-4 py-3">
                      <LeadTemperatureBadge
                        value={temperature.value}
                        isSuggested={temperature.isSuggested}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {formatAssignedUserLabel(
                        getLeadAssigneeName(lead.profiles),
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {lead.package_interest || "-"}
                    </td>
                    <td
                      className="px-4 py-3 whitespace-nowrap"
                      title={
                        lead.lead_date
                          ? `Dibuat di CRM: ${formatDate(lead.created_at)}`
                          : undefined
                      }
                    >
                      {lead.lead_date
                        ? formatLeadDate(lead.lead_date)
                        : formatDate(lead.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-xl border p-6">
        <h2 className="text-lg font-semibold">Revenue by Package</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Pendapatan dari booking lead campaign ini, dikelompokkan per paket.
        </p>

        {revenueByPackage.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada revenue dari lead campaign ini.
          </p>
        ) : (
          <div className="space-y-3">
            {revenueByPackage.map((row) => (
              <div
                key={row.packageName}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span className="font-medium">{row.packageName}</span>
                <span className="text-sm text-green-700">
                  {formatCurrency(row.revenue)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
