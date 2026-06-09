import Link from "next/link";

import { CampaignRowActions } from "@/components/campaigns/campaign-row-actions";
import { buttonVariants } from "@/components/ui/button";
import { formatCampaignStatusLabel } from "@/lib/campaigns/constants";
import {
  getCampaignMetrics,
  loadCampaignMetricsForOrganization,
} from "@/lib/campaigns/queries";
import { formatLeadSourceLabel } from "@/lib/leads/source-tracking";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

type CampaignRow = {
  id: string;
  name: string;
  source: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
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

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { profile } = await requireProfile();
  const canManageCampaigns = isAdminOrOwner(profile);
  const supabase = await createClient();

  const [{ data: campaigns, error }, metricsByCampaignId] = await Promise.all([
    supabase
      .from("campaigns")
      .select(
        "id, name, source, status, start_date, end_date, budget",
      )
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false }),
    loadCampaignMetricsForOrganization(supabase, profile.organization_id),
  ]);

  if (error) {
    throw new Error("Gagal memuat data campaign.");
  }

  const rows = (campaigns ?? []) as CampaignRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            {canManageCampaigns
              ? "Kelola campaign attribution untuk melacak performa sumber lead."
              : "Lihat campaign attribution yang aktif di organisasi Anda."}
          </p>
        </div>

        {canManageCampaigns && (
          <Link href="/campaigns/new" className={cn(buttonVariants())}>
            Campaign Baru
          </Link>
        )}
      </div>

      {params?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(params.error)}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="text-lg font-medium">Belum ada campaign</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {canManageCampaigns
              ? "Mulai dengan campaign pertama untuk melacak attribution lead."
              : "Belum ada campaign yang tersedia di organisasi Anda."}
          </p>
          {canManageCampaigns && (
            <Link
              href="/campaigns/new"
              className={cn(buttonVariants(), "mt-4 inline-flex")}
            >
              Campaign Baru
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[1120px] text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Campaign Name</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Budget</th>
                <th className="px-4 py-3 font-medium">Start Date</th>
                <th className="px-4 py-3 font-medium">End Date</th>
                <th className="px-4 py-3 font-medium">Lead Count</th>
                <th className="px-4 py-3 font-medium">Won Count</th>
                <th className="px-4 py-3 font-medium">Revenue Received</th>
                {canManageCampaigns && (
                  <th className="px-4 py-3 font-medium">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((campaign) => {
                const metrics = getCampaignMetrics(
                  metricsByCampaignId,
                  campaign.id,
                );

                return (
                  <tr key={campaign.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {campaign.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {formatLeadSourceLabel(campaign.source ?? "other")}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {formatCampaignStatusLabel(campaign.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatCurrency(campaign.budget ?? 0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(campaign.start_date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(campaign.end_date)}
                    </td>
                    <td className="px-4 py-3">{metrics.leadCount}</td>
                    <td className="px-4 py-3">{metrics.wonCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatCurrency(metrics.revenueReceived)}
                    </td>
                    {canManageCampaigns && (
                      <td className="px-4 py-3">
                        <CampaignRowActions campaignId={campaign.id} />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
