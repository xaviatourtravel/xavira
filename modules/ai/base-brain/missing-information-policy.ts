import type { BusinessBrainCompleteness } from "@/modules/ai/base-brain/types";
import type { IntentFallbackStrategy } from "@/modules/ai/base-brain/types";

export function buildMissingInformationPolicy(): string {
  return [
    "Known versus unknown information:",
    "- Clearly separate verified Business Brain facts from assumptions.",
    "- Never fabricate company-specific facts, prices, availability, schedules, discounts, policies, guarantees, or service inclusions.",
    "- Never claim an action is completed unless a tool or stored operation confirms it.",
    "- When company-specific information is missing, remain helpful: gather requirements, explain that confirmation is needed, and offer human follow-up.",
    "- Do not answer only with \"I don't know.\"",
  ].join("\n");
}

export function buildEmptyBrainPolicy(): string {
  return [
    "Empty published Business Brain:",
    "- No verified company-specific facts are available yet.",
    "- Greet appropriately on the first interaction only.",
    "- Understand the customer's goal and ask concise clarification.",
    "- Collect basic requirements such as service needed, timing, scope, and urgency.",
    "- Explain that specific company details need team confirmation.",
    "- Prepare a concise handoff summary when useful.",
    "- Do not invent offerings, prices, dates, or policies.",
  ].join("\n");
}

export function buildPartialBrainPolicy(completeness: BusinessBrainCompleteness): string {
  if (completeness !== "partial") {
    return "";
  }

  return [
    "Partial published Business Brain:",
    "- Use verified published facts directly when they answer the question.",
    "- Identify which parts remain unknown and do not invent them.",
    "- Ask only for relevant missing customer information.",
    "- Offer verification or human follow-up for missing company-specific details.",
  ].join("\n");
}

const INTENT_FALLBACK_LINES: Record<IntentFallbackStrategy, string> = {
  general_inquiry:
    "General inquiry: clarify the service or goal, collect timing and scope, offer team confirmation for specifics.",
  product_inquiry:
    "Product or service inquiry: identify the service needed, use verified facts if available, collect requirements, do not invent catalog items.",
  pricing_inquiry:
    "Pricing inquiry: identify which service, explain current price needs confirmation, collect requirements, never invent a number.",
  availability_inquiry:
    "Availability inquiry: identify the service and timing, explain availability needs confirmation, never guarantee seats or slots.",
  schedule_inquiry:
    "Schedule inquiry: identify preferred timing, explain schedule needs confirmation, never invent departure or appointment dates.",
  booking_request:
    "Booking request: gather requirements, acknowledge interest, do not confirm booking; recommend human follow-up.",
  payment_inquiry:
    "Payment inquiry: gather context, do not confirm payment received or approved; hand off when proof or approval is involved.",
  complaint:
    "Complaint: acknowledge concern empathetically, avoid defensive claims, recommend human follow-up promptly.",
  refund_inquiry:
    "Refund or cancellation inquiry: gather context, do not approve or deny refunds; recommend human follow-up.",
  human_request:
    "Human request: set handoffRequired true, acknowledge briefly, do not continue sales interrogation.",
  unsupported_inquiry:
    "Unsupported inquiry: stay polite, explain limits, offer human assistance if appropriate.",
  unknown:
    "Unknown intent: ask one clarifying question and remain honest about missing company-specific facts.",
};

export function buildIntentFallbackPolicy(strategy: IntentFallbackStrategy): string {
  return [
    "Intent-aware fallback:",
    `- ${INTENT_FALLBACK_LINES[strategy]}`,
  ].join("\n");
}

export function resolveIntentFallbackStrategy(intent: string): IntentFallbackStrategy {
  const normalized = intent.trim().toUpperCase();

  if (normalized.includes("HUMAN") || normalized === "HANDOFF") {
    return "human_request";
  }
  if (normalized.includes("PRICE") || normalized === "PRICE_INQUIRY" || normalized === "PAYMENT") {
    return normalized === "PAYMENT" ? "payment_inquiry" : "pricing_inquiry";
  }
  if (normalized.includes("BOOK") || normalized === "BOOKING") {
    return "booking_request";
  }
  if (normalized.includes("DEPARTURE") || normalized.includes("SCHEDULE") || normalized === "ITINERARY_REQUEST") {
    return "schedule_inquiry";
  }
  if (normalized.includes("PACKAGE") || normalized === "PACKAGE_INQUIRY" || normalized === "PACKAGE_RECOMMENDATION") {
    return "product_inquiry";
  }
  if (normalized.includes("COMPLAINT") || normalized === "COMPLAINT") {
    return "complaint";
  }
  if (normalized.includes("REFUND") || normalized.includes("CANCEL")) {
    return "refund_inquiry";
  }
  if (normalized.includes("BROCHURE") || normalized === "GENERAL") {
    return "general_inquiry";
  }
  if (normalized === "UNKNOWN") {
    return "unknown";
  }

  return "general_inquiry";
}
