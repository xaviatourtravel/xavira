export const FOLLOW_UP_ASSISTANT_TONES = [
  "friendly",
  "professional",
  "luxury",
  "urgent",
] as const;

export type FollowUpAssistantTone = (typeof FOLLOW_UP_ASSISTANT_TONES)[number];

export const FOLLOW_UP_DELIVERY_CHANNELS = [
  "whatsapp",
  "instagram",
  "email",
] as const;

export type FollowUpDeliveryChannel =
  (typeof FOLLOW_UP_DELIVERY_CHANNELS)[number];

export type BookingPaymentReminderType =
  | "dp_not_paid"
  | "partial_payment"
  | "final_payment_due";

export const TONE_INSTRUCTIONS: Record<FollowUpAssistantTone, string> = {
  friendly:
    "Gunakan nada hangat dan approachable. Sapaan Kak, bahasa natural, emoji secukupnya (maksimal 1).",
  professional:
    "Gunakan nada profesional dan jelas. Sopan, to the point, tanpa emoji.",
  luxury:
    "Gunakan nada premium dan refined. Tekankan pengalaman eksklusif tanpa berlebihan.",
  urgent:
    "Tekankan urgensi dengan sopan. Ajak tindakan cepat tanpa tekanan agresif.",
};

export function parseFollowUpAssistantTone(
  value: string,
): FollowUpAssistantTone {
  const trimmed = value.trim() as FollowUpAssistantTone;
  return FOLLOW_UP_ASSISTANT_TONES.includes(trimmed) ? trimmed : "professional";
}

export function formatFollowUpAssistantToneLabel(tone: FollowUpAssistantTone) {
  const labels: Record<FollowUpAssistantTone, string> = {
    friendly: "Friendly",
    professional: "Professional",
    luxury: "Luxury",
    urgent: "Urgent",
  };

  return labels[tone];
}

export function formatBookingReminderTypeLabel(
  type: BookingPaymentReminderType,
) {
  const labels: Record<BookingPaymentReminderType, string> = {
    dp_not_paid: "DP belum dibayar",
    partial_payment: "Pembayaran sebagian",
    final_payment_due: "Pelunasan jatuh tempo",
  };

  return labels[type];
}
