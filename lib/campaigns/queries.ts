import type { CampaignOption } from "@/lib/campaigns/constants";
import {
  buildCampaignMetricsByCampaignId,
  getCampaignMetrics,
  type CampaignMetrics,
} from "@/lib/campaigns/metrics";
import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function getOrgCampaignOptions(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<CampaignOption[]> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, name, status")
    .eq("organization_id", organizationId)
    .order("name");

  if (error) {
    throw new Error("Gagal memuat daftar campaign.");
  }

  return (data ?? []) as CampaignOption[];
}

export async function loadCampaignMetricsForOrganization(
  supabase: SupabaseServerClient,
  organizationId: string,
): Promise<Record<string, CampaignMetrics>> {
  const [{ data: leads }, { data: bookings }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, campaign_id, status")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .not("campaign_id", "is", null),
    supabase
      .from("bookings")
      .select("id, lead_id")
      .eq("organization_id", organizationId),
  ]);

  const leadRows = leads ?? [];
  const bookingRows = (bookings ?? []).filter(
    (booking) => booking.lead_id && leadRows.some((lead) => lead.id === booking.lead_id),
  );
  const bookingIds = bookingRows.map((booking) => booking.id);

  let payments: { amount: number; booking_id: string }[] = [];

  if (bookingIds.length > 0) {
    const { data: paymentRows, error } = await supabase
      .from("booking_payments")
      .select("amount, booking_id")
      .in("booking_id", bookingIds);

    if (error) {
      throw new Error("Gagal memuat data revenue campaign.");
    }

    payments = paymentRows ?? [];
  }

  return buildCampaignMetricsByCampaignId(leadRows, bookingRows, payments);
}

export { getCampaignMetrics };

export async function resolveCampaignIdForOrganization(
  supabase: SupabaseServerClient,
  organizationId: string,
  campaignId: string,
): Promise<string | null> {
  const trimmed = campaignId.trim();

  if (!trimmed) {
    return null;
  }

  const { data, error } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", trimmed)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ?? null;
}
