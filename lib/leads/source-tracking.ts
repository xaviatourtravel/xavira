import type { Database } from "@/types/database";

export const LEAD_SOURCE_OPTIONS = [
  { value: "meta_ads", label: "Meta Ads" },
  { value: "tiktok", label: "TikTok" },
  { value: "website", label: "Website" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "referral", label: "Referral" },
  { value: "repeat_customer", label: "Repeat Customer" },
  { value: "walk_in", label: "Walk In" },
  { value: "other", label: "Other" },
] as const;

export type LeadSourceV1 = (typeof LEAD_SOURCE_OPTIONS)[number]["value"];

export type LeadSource = Database["public"]["Enums"]["lead_source"];

export const DEFAULT_LEAD_SOURCE: LeadSourceV1 = "other";

/** Legacy enum values still stored on older leads; shown in edit UI only. */
const LEGACY_LEAD_SOURCES = ["instagram", "facebook"] as const;

const LEAD_SOURCE_LABELS: Record<string, string> = {
  meta_ads: "Meta Ads",
  tiktok: "TikTok",
  website: "Website",
  whatsapp: "WhatsApp",
  referral: "Referral",
  repeat_customer: "Repeat Customer",
  walk_in: "Walk In",
  other: "Other",
  instagram: "Meta Ads",
  facebook: "Meta Ads",
};

const SAVEABLE_LEAD_SOURCES = new Set<string>([
  ...LEAD_SOURCE_OPTIONS.map((option) => option.value),
  ...LEGACY_LEAD_SOURCES,
]);

export type LeadSourceStatsRow = {
  source: LeadSourceV1;
  label: string;
  leadCount: number;
  wonCount: number;
  conversionRate: number;
};

export function isLeadSourceV1(value: string): value is LeadSourceV1 {
  return LEAD_SOURCE_OPTIONS.some((option) => option.value === value);
}

export function parseLeadSource(value: string): LeadSourceV1 {
  if (isLeadSourceV1(value)) {
    return value;
  }

  return DEFAULT_LEAD_SOURCE;
}

export function parseLeadSourceForSave(value: string): LeadSource {
  const trimmed = value.trim();

  if (SAVEABLE_LEAD_SOURCES.has(trimmed)) {
    return trimmed as LeadSource;
  }

  return DEFAULT_LEAD_SOURCE;
}

export function formatLeadSourceLabel(source: string) {
  return LEAD_SOURCE_LABELS[source] ?? "Other";
}

export function resolveLeadSourceFilterValues(source: string): LeadSource[] | null {
  if (!source) {
    return null;
  }

  if (isLeadSourceV1(source)) {
    return [source];
  }

  return null;
}

export function getLeadSourceFilterLabel(source: string) {
  if (isLeadSourceV1(source)) {
    const option = LEAD_SOURCE_OPTIONS.find((item) => item.value === source);
    return option?.label ?? "Source";
  }

  return "Source";
}

export function getLeadSourceAnalyticsBucket(source: string): LeadSourceV1 {
  if (isLeadSourceV1(source)) {
    return source;
  }

  return "other";
}

export function buildLeadSourceStats(
  leads: ReadonlyArray<{ source: string; status: string }>,
): LeadSourceStatsRow[] {
  const buckets = new Map<
    LeadSourceV1,
    { leadCount: number; wonCount: number }
  >(
    LEAD_SOURCE_OPTIONS.map((option) => [
      option.value,
      { leadCount: 0, wonCount: 0 },
    ]),
  );

  for (const lead of leads) {
    const bucketKey = getLeadSourceAnalyticsBucket(lead.source);
    const bucket = buckets.get(bucketKey);

    if (!bucket) {
      continue;
    }

    bucket.leadCount += 1;

    if (lead.status === "won") {
      bucket.wonCount += 1;
    }
  }

  return LEAD_SOURCE_OPTIONS.map((option) => {
    const stats = buckets.get(option.value)!;

    return {
      source: option.value,
      label: option.label,
      leadCount: stats.leadCount,
      wonCount: stats.wonCount,
      conversionRate:
        stats.leadCount > 0
          ? Math.round((stats.wonCount / stats.leadCount) * 100)
          : 0,
    };
  }).sort((a, b) => b.leadCount - a.leadCount);
}
