import {
  DEFAULT_LEAD_SOURCE,
  LEAD_SOURCES,
  LEGACY_LEAD_SOURCES,
  type LeadSourceValue,
} from "@/constants/lead-sources";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionary";
import type { LeadsUiKey } from "@/lib/i18n/leads-dictionary";
import type { Database } from "@/types/database";

export type LeadSourceV1 = LeadSourceValue;

export type LeadSource = Database["public"]["Enums"]["lead_source"];

export { DEFAULT_LEAD_SOURCE, LEAD_SOURCES, LEGACY_LEAD_SOURCES };

export type LeadSourceOption = {
  value: LeadSourceValue;
  labelKey: LeadsUiKey;
  label: string;
  icon?: string;
};

export type LeadSourceStatsRow = {
  source: LeadSourceV1;
  label: string;
  leadCount: number;
  wonCount: number;
  conversionRate: number;
};

const SAVEABLE_LEAD_SOURCES = new Set<string>([
  ...LEAD_SOURCES.map((option) => option.value),
  ...LEGACY_LEAD_SOURCES,
]);

const ANALYTICS_LEGACY_BUCKETS: Partial<Record<string, LeadSourceV1>> = {
  facebook: "meta_ads",
};

function getLeadsUi(locale: Locale = DEFAULT_LOCALE) {
  return dictionaries[locale].leadsUi;
}

export function getLeadSourceOptions(locale: Locale = DEFAULT_LOCALE): LeadSourceOption[] {
  const leadsUi = getLeadsUi(locale);

  return LEAD_SOURCES.map((source) => ({
    value: source.value,
    labelKey: source.labelKey,
    label: leadsUi[source.labelKey],
    icon: source.icon,
  }));
}

/** @deprecated Use getLeadSourceOptions() for locale-aware labels. */
export const LEAD_SOURCE_OPTIONS = getLeadSourceOptions("en");

export function getLeadSourceLabel(
  source: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  const leadsUi = getLeadsUi(locale);
  const option = LEAD_SOURCES.find((item) => item.value === source);

  if (option) {
    return leadsUi[option.labelKey];
  }

  if (source === "facebook") {
    return `${leadsUi.leadSourceMetaAds} (${leadsUi.leadSourceLegacySuffix})`;
  }

  return leadsUi.leadSourceOther;
}

export function formatLeadSourceLabel(source: string, locale: Locale = DEFAULT_LOCALE) {
  return getLeadSourceLabel(source, locale);
}

export function isLeadSourceV1(value: string): value is LeadSourceV1 {
  return LEAD_SOURCES.some((option) => option.value === value);
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

export function resolveLeadSourceFilterValues(source: string): LeadSource[] | null {
  if (!source) {
    return null;
  }

  if (isLeadSourceV1(source)) {
    return [source];
  }

  return null;
}

export function getLeadSourceFilterLabel(source: string, locale: Locale = DEFAULT_LOCALE) {
  if (isLeadSourceV1(source)) {
    return getLeadSourceLabel(source, locale);
  }

  return "Source";
}

export function getLeadSourceAnalyticsBucket(source: string): LeadSourceV1 {
  if (isLeadSourceV1(source)) {
    return source;
  }

  return ANALYTICS_LEGACY_BUCKETS[source] ?? "other";
}

export function buildLeadSourceStats(
  leads: ReadonlyArray<{ source: string; status: string }>,
  locale: Locale = DEFAULT_LOCALE,
): LeadSourceStatsRow[] {
  const options = getLeadSourceOptions(locale);
  const buckets = new Map<LeadSourceV1, { leadCount: number; wonCount: number }>(
    options.map((option) => [option.value, { leadCount: 0, wonCount: 0 }]),
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

  return options
    .map((option) => {
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
    })
    .sort((a, b) => b.leadCount - a.leadCount);
}
