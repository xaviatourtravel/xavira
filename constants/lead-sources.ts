export const LEAD_SOURCES = [
  { value: "meta_ads", labelKey: "leadSourceMetaAds", icon: "meta" },
  { value: "instagram", labelKey: "leadSourceInstagram", icon: "instagram" },
  { value: "tiktok", labelKey: "leadSourceTiktok", icon: "tiktok" },
  { value: "website", labelKey: "leadSourceWebsite", icon: "globe" },
  { value: "whatsapp", labelKey: "leadSourceWhatsapp", icon: "whatsapp" },
  { value: "referral", labelKey: "leadSourceReferral", icon: "users" },
  { value: "repeat_customer", labelKey: "leadSourceRepeatCustomer", icon: "user-check" },
  { value: "walk_in", labelKey: "leadSourceWalkIn", icon: "map-pin" },
  { value: "other", labelKey: "leadSourceOther", icon: "more-horizontal" },
] as const;

export type LeadSourceValue = (typeof LEAD_SOURCES)[number]["value"];

/** Legacy enum values still stored on older leads; not offered for new leads. */
export const LEGACY_LEAD_SOURCES = ["facebook"] as const;

export type LegacyLeadSourceValue = (typeof LEGACY_LEAD_SOURCES)[number];

export const DEFAULT_LEAD_SOURCE: LeadSourceValue = "other";

export const LEAD_SOURCE_VALUES = LEAD_SOURCES.map((source) => source.value);
