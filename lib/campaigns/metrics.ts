import { getEffectiveLeadTemperature } from "@/lib/leads/lead-temperature";

export type CampaignMetrics = {
  leadCount: number;
  bookingCount: number;
  conversionRate: number;
  revenue: number;
};

export type CampaignTemperatureBreakdown = {
  hot: number;
  warm: number;
  cold: number;
};

export type CampaignRevenueByPackageRow = {
  packageName: string;
  revenue: number;
};

export type TopCampaignRow = {
  campaignId: string;
  campaignName: string;
  leadCount: number;
  bookingCount: number;
  revenue: number;
};

type LeadCampaignRow = {
  id: string;
  campaign_id: string | null;
};

type LeadTemperatureRow = {
  id: string;
  campaign_id: string | null;
  lead_temperature: string | null;
  status: string;
  updated_at: string;
};

type BookingRow = {
  id: string;
  lead_id: string | null;
  package_name: string | null;
};

type PaymentRow = {
  amount: number;
  booking_id: string;
};

export function calculateCampaignConversionRate(
  leadCount: number,
  bookingCount: number,
) {
  return leadCount > 0 ? Math.round((bookingCount / leadCount) * 100) : 0;
}

export function createEmptyCampaignMetrics(): CampaignMetrics {
  return {
    leadCount: 0,
    bookingCount: 0,
    conversionRate: 0,
    revenue: 0,
  };
}

export function buildCampaignMetricsByCampaignId(
  leads: LeadCampaignRow[],
  bookings: BookingRow[],
  payments: PaymentRow[],
): Record<string, CampaignMetrics> {
  const metrics: Record<string, CampaignMetrics> = {};
  const leadCampaignMap = new Map<string, string>();
  const campaignBookingIds = new Map<string, Set<string>>();

  for (const lead of leads) {
    if (!lead.campaign_id) {
      continue;
    }

    leadCampaignMap.set(lead.id, lead.campaign_id);

    if (!metrics[lead.campaign_id]) {
      metrics[lead.campaign_id] = createEmptyCampaignMetrics();
    }

    metrics[lead.campaign_id].leadCount += 1;
  }

  for (const booking of bookings) {
    if (!booking.lead_id) {
      continue;
    }

    const campaignId = leadCampaignMap.get(booking.lead_id);

    if (!campaignId) {
      continue;
    }

    if (!metrics[campaignId]) {
      metrics[campaignId] = createEmptyCampaignMetrics();
    }

    if (!campaignBookingIds.has(campaignId)) {
      campaignBookingIds.set(campaignId, new Set());
    }

    campaignBookingIds.get(campaignId)?.add(booking.id);
  }

  for (const payment of payments) {
    const booking = bookings.find((item) => item.id === payment.booking_id);

    if (!booking?.lead_id) {
      continue;
    }

    const campaignId = leadCampaignMap.get(booking.lead_id);

    if (!campaignId) {
      continue;
    }

    if (!metrics[campaignId]) {
      metrics[campaignId] = createEmptyCampaignMetrics();
    }

    metrics[campaignId].revenue += Number(payment.amount ?? 0);
  }

  for (const [campaignId, bookingIds] of campaignBookingIds.entries()) {
    const entry = metrics[campaignId] ?? createEmptyCampaignMetrics();
    entry.bookingCount = bookingIds.size;
    metrics[campaignId] = entry;
  }

  for (const campaignId of Object.keys(metrics)) {
    const entry = metrics[campaignId];
    entry.conversionRate = calculateCampaignConversionRate(
      entry.leadCount,
      entry.bookingCount,
    );
  }

  return metrics;
}

export function getCampaignMetrics(
  metricsByCampaignId: Record<string, CampaignMetrics>,
  campaignId: string,
): CampaignMetrics {
  return metricsByCampaignId[campaignId] ?? createEmptyCampaignMetrics();
}

export function buildCampaignTemperatureBreakdown(
  leads: LeadTemperatureRow[],
  campaignId: string,
): CampaignTemperatureBreakdown {
  const breakdown: CampaignTemperatureBreakdown = {
    hot: 0,
    warm: 0,
    cold: 0,
  };

  for (const lead of leads) {
    if (lead.campaign_id !== campaignId) {
      continue;
    }

    const { value } = getEffectiveLeadTemperature(lead);
    breakdown[value] += 1;
  }

  return breakdown;
}

export function buildCampaignRevenueByPackage(
  campaignLeadIds: Set<string>,
  bookings: BookingRow[],
  payments: PaymentRow[],
): CampaignRevenueByPackageRow[] {
  const bookingPackageMap = new Map<string, string>();
  const revenueByPackage = new Map<string, number>();

  for (const booking of bookings) {
    if (!booking.lead_id || !campaignLeadIds.has(booking.lead_id)) {
      continue;
    }

    const packageName = booking.package_name?.trim() || "Tanpa Paket";
    bookingPackageMap.set(booking.id, packageName);
  }

  for (const payment of payments) {
    const packageName = bookingPackageMap.get(payment.booking_id);

    if (!packageName) {
      continue;
    }

    revenueByPackage.set(
      packageName,
      (revenueByPackage.get(packageName) ?? 0) + Number(payment.amount ?? 0),
    );
  }

  return [...revenueByPackage.entries()]
    .map(([packageName, revenue]) => ({ packageName, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function buildTopCampaigns(
  campaigns: Array<{ id: string; name: string }>,
  metricsByCampaignId: Record<string, CampaignMetrics>,
  limit = 5,
): TopCampaignRow[] {
  return campaigns
    .map((campaign) => {
      const metrics = getCampaignMetrics(metricsByCampaignId, campaign.id);

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        leadCount: metrics.leadCount,
        bookingCount: metrics.bookingCount,
        revenue: metrics.revenue,
      };
    })
    .sort(
      (a, b) =>
        b.revenue - a.revenue ||
        b.bookingCount - a.bookingCount ||
        b.leadCount - a.leadCount,
    )
    .slice(0, limit);
}
