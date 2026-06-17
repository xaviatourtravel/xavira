export const CONTENT_STATUSES = [
  "idea",
  "draft",
  "review",
  "approved",
  "scheduled",
  "published",
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_STATUS_OPTIONS = [
  { value: "idea", label: "Idea" },
  { value: "draft", label: "Draft" },
  { value: "review", label: "Review" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
] as const satisfies ReadonlyArray<{ value: ContentStatus; label: string }>;

export const CONTENT_PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "youtube", label: "YouTube" },
  { value: "website", label: "Website" },
  { value: "other", label: "Other" },
] as const;

export const CONTENT_TYPE_OPTIONS = [
  { value: "social_post", label: "Social Post" },
  { value: "reel", label: "Reel" },
  { value: "carousel", label: "Carousel" },
  { value: "story", label: "Story" },
  { value: "whatsapp_broadcast", label: "WhatsApp Broadcast" },
  { value: "caption", label: "Caption" },
  { value: "other", label: "Other" },
] as const;

const CONTENT_STATUS_SET = new Set<string>(CONTENT_STATUSES);
const CONTENT_PLATFORM_SET = new Set<string>(
  CONTENT_PLATFORM_OPTIONS.map((option) => option.value),
);
const CONTENT_TYPE_SET = new Set<string>(
  CONTENT_TYPE_OPTIONS.map((option) => option.value),
);

export function parseContentStatus(value: string): ContentStatus {
  if (CONTENT_STATUS_SET.has(value)) {
    return value as ContentStatus;
  }

  return "idea";
}

export function isContentStatus(value: string): value is ContentStatus {
  return CONTENT_STATUS_SET.has(value);
}

export function parseContentPlatform(value: string) {
  if (CONTENT_PLATFORM_SET.has(value)) {
    return value;
  }

  return "other";
}

export function parseContentType(value: string) {
  if (CONTENT_TYPE_SET.has(value)) {
    return value;
  }

  return "other";
}

export function formatContentStatusLabel(status: string) {
  const option = CONTENT_STATUS_OPTIONS.find((item) => item.value === status);
  return option?.label ?? status.replace(/_/g, " ");
}

export function formatContentPlatformLabel(platform: string) {
  const option = CONTENT_PLATFORM_OPTIONS.find((item) => item.value === platform);
  return option?.label ?? platform.replace(/_/g, " ");
}

export function formatContentTypeLabel(contentType: string) {
  const option = CONTENT_TYPE_OPTIONS.find((item) => item.value === contentType);
  return option?.label ?? contentType.replace(/_/g, " ");
}
