import { isBookingPaymentSettled } from "@/lib/bookings/payment-status";
import {
  getEffectiveLeadTemperature,
  type LeadTemperature,
} from "@/lib/leads/lead-temperature";
import {
  getLeadSourceAnalyticsBucket,
  LEAD_SOURCE_OPTIONS,
  type LeadSourceV1,
} from "@/lib/leads/source-tracking";
import type { Tables } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

type Profile = Tables<"profiles">;

type RevenueLeadRow = {
  id: string;
  source: string;
  status: string;
  assigned_to: string | null;
  package_interest: string | null;
  campaign_id: string | null;
  lead_temperature: string | null;
  updated_at: string;
};

type RevenueBookingRow = {
  id: string;
  lead_id: string | null;
  package_name: string | null;
  payment_status: string;
};

type CampaignRow = {
  id: string;
  name: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
};

/** Statuses representing a lead that has been qualified or progressed further. */
const QUALIFIED_OR_BEYOND = new Set([
  "qualified",
  "proposal_sent",
  "negotiating",
  "won",
]);

export type PerformanceRow = {
  key: string;
  label: string;
  leads: number;
  bookings: number;
  conversionRate: number;
};

export type RevenueFunnel = {
  totalLeads: number;
  qualified: number;
  warmOrHot: number;
  booking: number;
  paid: number;
};

export type RevenueIntelligenceMetrics = {
  leadSourcePerformance: PerformanceRow[];
  campaignPerformance: PerformanceRow[];
  packagePerformance: PerformanceRow[];
  salesPerformance: PerformanceRow[];
  funnel: RevenueFunnel;
  hasData: boolean;
};

function conversionRate(leads: number, bookings: number) {
  return leads > 0 ? Math.round((bookings / leads) * 100) : 0;
}

function buildLeadIndex(leads: RevenueLeadRow[]) {
  const leadById = new Map<string, RevenueLeadRow>();
  for (const lead of leads) {
    leadById.set(lead.id, lead);
  }
  return leadById;
}

export function buildLeadSourcePerformance(
  leads: RevenueLeadRow[],
  bookings: RevenueBookingRow[],
  leadById: Map<string, RevenueLeadRow>,
): PerformanceRow[] {
  const counters = new Map<LeadSourceV1, { leads: number; bookings: number }>(
    LEAD_SOURCE_OPTIONS.map((option) => [
      option.value,
      { leads: 0, bookings: 0 },
    ]),
  );

  for (const lead of leads) {
    const bucket = getLeadSourceAnalyticsBucket(lead.source);
    const counter = counters.get(bucket);
    if (counter) {
      counter.leads += 1;
    }
  }

  for (const booking of bookings) {
    if (!booking.lead_id) {
      continue;
    }
    const lead = leadById.get(booking.lead_id);
    if (!lead) {
      continue;
    }
    const counter = counters.get(getLeadSourceAnalyticsBucket(lead.source));
    if (counter) {
      counter.bookings += 1;
    }
  }

  return LEAD_SOURCE_OPTIONS.map((option) => {
    const counter = counters.get(option.value)!;
    return {
      key: option.value,
      label: option.label,
      leads: counter.leads,
      bookings: counter.bookings,
      conversionRate: conversionRate(counter.leads, counter.bookings),
    } satisfies PerformanceRow;
  })
    .filter((row) => row.leads > 0 || row.bookings > 0)
    .sort((a, b) => b.bookings - a.bookings || b.leads - a.leads);
}

export function buildCampaignPerformance(
  leads: RevenueLeadRow[],
  bookings: RevenueBookingRow[],
  campaigns: CampaignRow[],
  leadById: Map<string, RevenueLeadRow>,
): PerformanceRow[] {
  const counters = new Map<string, { leads: number; bookings: number }>();

  for (const lead of leads) {
    if (!lead.campaign_id) {
      continue;
    }
    const counter = counters.get(lead.campaign_id) ?? { leads: 0, bookings: 0 };
    counter.leads += 1;
    counters.set(lead.campaign_id, counter);
  }

  for (const booking of bookings) {
    if (!booking.lead_id) {
      continue;
    }
    const lead = leadById.get(booking.lead_id);
    if (!lead?.campaign_id) {
      continue;
    }
    const counter = counters.get(lead.campaign_id) ?? { leads: 0, bookings: 0 };
    counter.bookings += 1;
    counters.set(lead.campaign_id, counter);
  }

  const campaignNameById = new Map(
    campaigns.map((campaign) => [campaign.id, campaign.name]),
  );

  return [...counters.entries()]
    .map(([campaignId, counter]) => ({
      key: campaignId,
      label: campaignNameById.get(campaignId) ?? "Tanpa Campaign",
      leads: counter.leads,
      bookings: counter.bookings,
      conversionRate: conversionRate(counter.leads, counter.bookings),
    }))
    .sort((a, b) => b.bookings - a.bookings || b.leads - a.leads);
}

export function buildPackagePerformance(
  leads: RevenueLeadRow[],
  bookings: RevenueBookingRow[],
): PerformanceRow[] {
  const counters = new Map<string, { leads: number; bookings: number }>();

  for (const lead of leads) {
    const packageName = lead.package_interest?.trim();
    if (!packageName) {
      continue;
    }
    const counter = counters.get(packageName) ?? { leads: 0, bookings: 0 };
    counter.leads += 1;
    counters.set(packageName, counter);
  }

  for (const booking of bookings) {
    const packageName = booking.package_name?.trim();
    if (!packageName) {
      continue;
    }
    const counter = counters.get(packageName) ?? { leads: 0, bookings: 0 };
    counter.bookings += 1;
    counters.set(packageName, counter);
  }

  return [...counters.entries()]
    .map(([packageName, counter]) => ({
      key: packageName,
      label: packageName,
      leads: counter.leads,
      bookings: counter.bookings,
      conversionRate: conversionRate(counter.leads, counter.bookings),
    }))
    .sort(
      (a, b) =>
        b.bookings - a.bookings ||
        b.leads - a.leads ||
        a.label.localeCompare(b.label, "id"),
    );
}

export function buildSalesPerformance(
  leads: RevenueLeadRow[],
  bookings: RevenueBookingRow[],
  profiles: ProfileRow[],
  leadById: Map<string, RevenueLeadRow>,
): PerformanceRow[] {
  const counters = new Map<string, { leads: number; bookings: number }>();

  for (const lead of leads) {
    if (!lead.assigned_to) {
      continue;
    }
    const counter = counters.get(lead.assigned_to) ?? { leads: 0, bookings: 0 };
    counter.leads += 1;
    counters.set(lead.assigned_to, counter);
  }

  for (const booking of bookings) {
    if (!booking.lead_id) {
      continue;
    }
    const lead = leadById.get(booking.lead_id);
    if (!lead?.assigned_to) {
      continue;
    }
    const counter = counters.get(lead.assigned_to) ?? { leads: 0, bookings: 0 };
    counter.bookings += 1;
    counters.set(lead.assigned_to, counter);
  }

  const nameById = new Map(
    profiles.map((profile) => [profile.id, profile.full_name]),
  );

  return [...counters.entries()]
    .map(([profileId, counter]) => ({
      key: profileId,
      label: nameById.get(profileId)?.trim() || "Pengguna",
      leads: counter.leads,
      bookings: counter.bookings,
      conversionRate: conversionRate(counter.leads, counter.bookings),
    }))
    .sort((a, b) => b.bookings - a.bookings || b.leads - a.leads);
}

export function buildRevenueFunnel(
  leads: RevenueLeadRow[],
  bookings: RevenueBookingRow[],
): RevenueFunnel {
  const leadsWithBooking = new Set<string>();
  const leadsWithPaidBooking = new Set<string>();

  for (const booking of bookings) {
    if (!booking.lead_id) {
      continue;
    }
    leadsWithBooking.add(booking.lead_id);
    if (isBookingPaymentSettled(booking.payment_status)) {
      leadsWithPaidBooking.add(booking.lead_id);
    }
  }

  let qualified = 0;
  let warmOrHot = 0;

  for (const lead of leads) {
    if (QUALIFIED_OR_BEYOND.has(lead.status)) {
      qualified += 1;
    }

    const temperature: LeadTemperature = getEffectiveLeadTemperature(lead).value;
    if (temperature === "warm" || temperature === "hot") {
      warmOrHot += 1;
    }
  }

  return {
    totalLeads: leads.length,
    qualified,
    warmOrHot,
    booking: leadsWithBooking.size,
    paid: leadsWithPaidBooking.size,
  };
}

export async function loadRevenueIntelligenceMetrics(
  profile: Profile,
): Promise<RevenueIntelligenceMetrics> {
  const supabase = await createClient();
  const organizationId = profile.organization_id;

  const [{ data: leads }, { data: bookings }, { data: campaigns }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("leads")
        .select(
          "id, source, status, assigned_to, package_interest, campaign_id, lead_temperature, updated_at",
        )
        .eq("organization_id", organizationId)
        .is("deleted_at", null),
      supabase
        .from("bookings")
        .select("id, lead_id, package_name, payment_status")
        .eq("organization_id", organizationId),
      supabase
        .from("campaigns")
        .select("id, name")
        .eq("organization_id", organizationId),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("organization_id", organizationId),
    ]);

  const leadRows = (leads ?? []) as RevenueLeadRow[];
  const bookingRows = (bookings ?? []) as RevenueBookingRow[];
  const campaignRows = (campaigns ?? []) as CampaignRow[];
  const profileRows = (profiles ?? []) as ProfileRow[];
  const leadById = buildLeadIndex(leadRows);

  return {
    leadSourcePerformance: buildLeadSourcePerformance(
      leadRows,
      bookingRows,
      leadById,
    ),
    campaignPerformance: buildCampaignPerformance(
      leadRows,
      bookingRows,
      campaignRows,
      leadById,
    ),
    packagePerformance: buildPackagePerformance(leadRows, bookingRows),
    salesPerformance: buildSalesPerformance(
      leadRows,
      bookingRows,
      profileRows,
      leadById,
    ),
    funnel: buildRevenueFunnel(leadRows, bookingRows),
    hasData: leadRows.length > 0 || bookingRows.length > 0,
  };
}
