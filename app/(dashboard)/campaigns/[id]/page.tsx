import Link from "next/link";
import { notFound } from "next/navigation";

import { CampaignRowActions } from "@/components/campaigns/campaign-row-actions";
import { buttonVariants } from "@/components/ui/button";
import {
  formatCampaignStatusLabel,
  type CampaignStatus,
} from "@/lib/campaigns/constants";
import {
  getCampaignMetrics,
  loadCampaignMetricsForOrganization,
} from "@/lib/campaigns/queries";
import { formatLeadDate } from "@/lib/leads/lead-date";
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
  source: string;
  lead_date: string | null;
  created_at: string;
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
        .select("id, full_name, status, source, lead_date, created_at")
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
  const metricsByCampaignId = await loadCampaignMetricsForOrganization(
    supabase,
    profile.organization_id,
  );
  const metrics = getCampaignMetrics(metricsByCampaignId, detail.id);

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
            Detail campaign attribution dan lead terkait.
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Lead Count" value={metrics.leadCount} />
        <MetricCard label="Won Count" value={metrics.wonCount} />
        <MetricCard
          label="Conversion Rate"
          value={`${metrics.conversionRate}%`}
        />
        <MetricCard
          label="Revenue Received"
          value={formatCurrency(metrics.revenueReceived)}
        />
      </div>

      <div className="rounded-xl border p-6">
        <h2 className="text-lg font-semibold">Informasi Campaign</h2>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Source</dt>
            <dd className="mt-1 text-sm font-medium">
              {formatLeadSourceLabel(detail.source ?? "other")}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Status</dt>
            <dd className="mt-1 text-sm font-medium capitalize">
              {formatCampaignStatusLabel(detail.status)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Budget</dt>
            <dd className="mt-1 text-sm font-medium">
              {formatCurrency(detail.budget ?? 0)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Periode</dt>
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

      <div className="overflow-x-auto rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Lead Terkait</h2>
        </div>

        {leads.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Belum ada lead yang ditautkan ke campaign ini.
          </div>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Lead Source</th>
                <th className="px-4 py-3 font-medium">Tanggal Lead</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {lead.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {formatLabel(lead.status)}
                  </td>
                  <td className="px-4 py-3">
                    {formatLeadSourceLabel(lead.source)}
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
