export type CampaignMetrics = {
  leadCount: number;
  wonCount: number;
  conversionRate: number;
  revenueReceived: number;
};

type LeadCampaignRow = {
  id: string;
  campaign_id: string | null;
  status: string;
};

type BookingRow = {
  id: string;
  lead_id: string | null;
};

type PaymentRow = {
  amount: number;
  booking_id: string;
};

export function calculateConversionRate(leadCount: number, wonCount: number) {
  return leadCount > 0 ? Math.round((wonCount / leadCount) * 100) : 0;
}

export function createEmptyCampaignMetrics(): CampaignMetrics {
  return {
    leadCount: 0,
    wonCount: 0,
    conversionRate: 0,
    revenueReceived: 0,
  };
}

export function buildCampaignMetricsByCampaignId(
  leads: LeadCampaignRow[],
  bookings: BookingRow[],
  payments: PaymentRow[],
): Record<string, CampaignMetrics> {
  const metrics: Record<string, CampaignMetrics> = {};
  const bookingLeadMap = new Map(
    bookings
      .filter((booking) => booking.lead_id)
      .map((booking) => [booking.id, booking.lead_id as string]),
  );
  const leadCampaignMap = new Map<string, string>();

  for (const lead of leads) {
    if (!lead.campaign_id) {
      continue;
    }

    leadCampaignMap.set(lead.id, lead.campaign_id);

    if (!metrics[lead.campaign_id]) {
      metrics[lead.campaign_id] = createEmptyCampaignMetrics();
    }

    metrics[lead.campaign_id].leadCount += 1;

    if (lead.status === "won") {
      metrics[lead.campaign_id].wonCount += 1;
    }
  }

  for (const payment of payments) {
    const leadId = bookingLeadMap.get(payment.booking_id);

    if (!leadId) {
      continue;
    }

    const campaignId = leadCampaignMap.get(leadId);

    if (!campaignId) {
      continue;
    }

    if (!metrics[campaignId]) {
      metrics[campaignId] = createEmptyCampaignMetrics();
    }

    metrics[campaignId].revenueReceived += payment.amount;
  }

  for (const campaignId of Object.keys(metrics)) {
    const entry = metrics[campaignId];
    entry.conversionRate = calculateConversionRate(
      entry.leadCount,
      entry.wonCount,
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
