export const CONTACT_SOURCE = "website_contact";

export const CONTACT_TOPIC_OPTIONS = [
  { value: "demo", label: "Demo" },
  { value: "partnership", label: "Partnership" },
  { value: "support", label: "Support" },
  { value: "billing", label: "Billing" },
  { value: "press", label: "Press" },
  { value: "other", label: "Other" },
] as const;

export type ContactTopic = (typeof CONTACT_TOPIC_OPTIONS)[number]["value"];

export const CONTACT_INQUIRY_CHANNELS = [
  {
    id: "general",
    title: "General Inquiries",
    email: "hello@desklabs.id",
    description: "Pertanyaan umum tentang Desklabs dan platform.",
  },
  {
    id: "sales",
    title: "Sales / Demo",
    email: "sales@desklabs.id",
    description: "Demo produk, pricing, dan evaluasi platform.",
  },
  {
    id: "support",
    title: "Support",
    email: "support@desklabs.id",
    description: "Bantuan teknis dan dukungan penggunaan platform.",
  },
  {
    id: "billing",
    title: "Billing",
    email: "billing@desklabs.id",
    description: "Invoice, pembayaran, dan pertanyaan billing.",
  },
] as const;

export function isContactTopic(value: string): value is ContactTopic {
  return CONTACT_TOPIC_OPTIONS.some((option) => option.value === value);
}

export function getContactTopicLabel(value: string) {
  return CONTACT_TOPIC_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
