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

export const DEFAULT_LEAD_SOURCE: LeadSourceV1 = "meta_ads";

const LEGACY_META_SOURCES = ["instagram", "facebook"] as const;

/** Values accepted by the current `lead_source` Postgres enum (001_enums.sql). */
export const PERSISTED_LEAD_SOURCE_VALUES = [
  "whatsapp",
  "instagram",
  "facebook",
  "referral",
  "walk_in",
  "website",
  "other",
] as const;

export type PersistedLeadSource = (typeof PERSISTED_LEAD_SOURCE_VALUES)[number];

const V1_SOURCE_STORAGE_FALLBACK: Partial<
  Record<LeadSourceV1, PersistedLeadSource>
> = {
  meta_ads: "facebook",
  tiktok: "other",
  repeat_customer: "other",
};

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

const VALID_LEAD_SOURCES = new Set<string>([
  ...LEAD_SOURCE_OPTIONS.map((option) => option.value),
  ...LEGACY_META_SOURCES,
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

export function parseLeadSource(value: string) {
  if (VALID_LEAD_SOURCES.has(value)) {
    return value;
  }

  return DEFAULT_LEAD_SOURCE;
}

export function toPersistedLeadSource(value: string): PersistedLeadSource {
  const parsed = parseLeadSource(value);

  if (
    (PERSISTED_LEAD_SOURCE_VALUES as readonly string[]).includes(parsed)
  ) {
    return parsed as PersistedLeadSource;
  }

  if (isLeadSourceV1(parsed) && V1_SOURCE_STORAGE_FALLBACK[parsed]) {
    return V1_SOURCE_STORAGE_FALLBACK[parsed]!;
  }

  return "other";
}

function isPersistedLeadSource(value: string): value is PersistedLeadSource {
  return (PERSISTED_LEAD_SOURCE_VALUES as readonly string[]).includes(value);
}

export function formatLeadSourceLabel(source: string) {
  return LEAD_SOURCE_LABELS[source] ?? "Other";
}

export function normalizeLeadSourceForAnalytics(source: string): LeadSourceV1 {
  if (LEGACY_META_SOURCES.includes(source as (typeof LEGACY_META_SOURCES)[number])) {
    return "meta_ads";
  }

  if (isLeadSourceV1(source)) {
    return source;
  }

  return "other";
}

export function resolveLeadSourceFilterValues(source: string) {
  if (!source) {
    return null;
  }

  if (source === "meta_ads") {
    // Legacy Meta channels exist in DB today. Native `meta_ads` requires migration
    // 20260607000004_extend_lead_source_enum.sql before it can be used in filters.
    return [...LEGACY_META_SOURCES];
  }

  if (isPersistedLeadSource(source)) {
    return [source];
  }

  if (isLeadSourceV1(source)) {
    return [];
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
    const normalized = normalizeLeadSourceForAnalytics(lead.source);
    const bucket = buckets.get(normalized);

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
