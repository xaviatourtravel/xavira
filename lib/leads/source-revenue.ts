import {
  LEAD_SOURCE_OPTIONS,
  type LeadSourceV1,
  getLeadSourceAnalyticsBucket,
} from "@/lib/leads/source-tracking";

export type LeadSourceRevenueRow = {
  source: LeadSourceV1;
  label: string;
  leadCount: number;
  wonCount: number;
  totalRevenueReceived: number;
  conversionRate: number;
};

type LeadSourceRevenueLead = {
  source: string;
  status: string;
};

type LeadSourceRevenuePayment = {
  amount: number | string;
  bookings:
    | {
        lead_id: string | null;
        leads: { source: string } | { source: string }[] | null;
      }
    | {
        lead_id: string | null;
        leads: { source: string } | { source: string }[] | null;
      }[]
    | null;
};

function getPaymentLeadSource(payment: LeadSourceRevenuePayment): LeadSourceV1 {
  const booking = Array.isArray(payment.bookings)
    ? payment.bookings[0]
    : payment.bookings;

  if (!booking?.lead_id) {
    return "other";
  }

  const lead = Array.isArray(booking.leads) ? booking.leads[0] : booking.leads;

  if (!lead?.source) {
    return "other";
  }

  return getLeadSourceAnalyticsBucket(lead.source);
}

export function buildLeadSourceRevenueStats(
  leads: ReadonlyArray<LeadSourceRevenueLead>,
  payments: ReadonlyArray<LeadSourceRevenuePayment>,
): LeadSourceRevenueRow[] {
  const buckets = new Map<
    LeadSourceV1,
    { leadCount: number; wonCount: number; totalRevenueReceived: number }
  >(
    LEAD_SOURCE_OPTIONS.map((option) => [
      option.value,
      { leadCount: 0, wonCount: 0, totalRevenueReceived: 0 },
    ]),
  );

  for (const lead of leads) {
    const bucket = buckets.get(getLeadSourceAnalyticsBucket(lead.source));

    if (!bucket) {
      continue;
    }

    bucket.leadCount += 1;

    if (lead.status === "won") {
      bucket.wonCount += 1;
    }
  }

  for (const payment of payments) {
    const bucket = buckets.get(getPaymentLeadSource(payment));

    if (!bucket) {
      continue;
    }

    bucket.totalRevenueReceived += Number(payment.amount ?? 0);
  }

  return LEAD_SOURCE_OPTIONS.map((option) => {
    const stats = buckets.get(option.value)!;

    return {
      source: option.value,
      label: option.label,
      leadCount: stats.leadCount,
      wonCount: stats.wonCount,
      totalRevenueReceived: stats.totalRevenueReceived,
      conversionRate:
        stats.leadCount > 0
          ? Math.round((stats.wonCount / stats.leadCount) * 100)
          : 0,
    };
  }).sort((a, b) => b.totalRevenueReceived - a.totalRevenueReceived);
}
