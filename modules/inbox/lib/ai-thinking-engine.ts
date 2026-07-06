import { buildRuleBasedIntelligence } from "@/lib/communication/intelligence/rule-based-intelligence";
import type { IntelligenceIntent } from "@/lib/communication/intelligence/rule-based-intelligence";
import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import type { WhatsappAiAuditEvent } from "@/lib/whatsapp-inbox/ai/activity-events";
import { resolveWhatsappAiState } from "@/lib/whatsapp-inbox/ai/constants";
import {
  buildCommandCenterNextAction,
  getQualificationFieldRows,
} from "@/modules/inbox/lib/build-ai-command-center";
import {
  generateSuggestedReply,
  type MissingContextKey,
  type ReplyConfidenceLevel,
} from "@/modules/inbox/lib/suggested-reply-engine";
import type { Locale } from "@/lib/i18n/config";

export type ThinkingSourceType = "identity" | "product" | "knowledge" | "document" | "rule";

export type ThinkingKnowledgeSource = {
  type: ThinkingSourceType;
  /** User-facing label (product name, article title, etc.) — not translated */
  name: string;
  href: string;
  typeLabelKey: InboxKey;
};

export type ThinkingRuleItem = {
  /** Translated rule label when from deterministic defaults */
  labelKey?: InboxKey;
  /** Raw Business Brain rule text when from pipeline metadata */
  rawLabel?: string;
};

export type ThinkingMissingItem = {
  key: MissingContextKey | "visaInformation" | "itineraryDocument" | "qualificationField";
  labelKey: InboxKey;
  href: string;
};

export type AiThinkingResult = {
  available: boolean;
  intentKey: InboxKey;
  confidence: number;
  confidenceLevel: ReplyConfidenceLevel;
  confidenceLabelKey: InboxKey;
  whyBullets: InboxKey[];
  knowledgeSources: ThinkingKnowledgeSource[];
  rulesApplied: ThinkingRuleItem[];
  missingContext: ThinkingMissingItem[];
};

const SOURCE_HREFS: Record<ThinkingSourceType, string> = {
  identity: "/business-brain/identity",
  product: "/business-brain/products",
  knowledge: "/business-brain/knowledge",
  document: "/business-brain/documents",
  rule: "/business-brain/rules",
};

const SOURCE_TYPE_LABEL_KEYS: Record<ThinkingSourceType, InboxKey> = {
  identity: "sourceIdentity",
  product: "thinkingSourceProduct",
  knowledge: "thinkingSourceKnowledge",
  document: "thinkingSourceDocument",
  rule: "thinkingSourceRule",
};

const MISSING_LABEL_KEYS: Record<
  MissingContextKey | "visaInformation" | "itineraryDocument",
  InboxKey
> = {
  refundPolicy: "missingRefundPolicy",
  visaPolicy: "missingVisaInformation",
  pricing: "missingPricing",
  visaInformation: "missingVisaInformation",
  itineraryDocument: "missingItineraryDocument",
};

const DEFAULT_RULE_KEYS: InboxKey[] = [
  "ruleDoNotMentionDesklabs",
  "ruleAskOneQuestionAtATime",
  "ruleDoNotPromiseAvailability",
  "ruleKeepReplyConcise",
];

const PIPELINE_EVENT_PRIORITY: WhatsappAiAuditEvent["eventType"][] = [
  "AI_LLM_REPLY_SENT",
  "AI_REPLY_SENT",
  "AI_INTENT_CLASSIFIED",
  "CONTEXT_RETRIEVED",
];

function hasIncomingText(messages: OmnichannelConversationDetail["messages"]) {
  return messages.some(
    (message) => message.direction === "incoming" && message.message_text?.trim(),
  );
}

function mapIntentToKey(intent: IntelligenceIntent | string): InboxKey {
  const normalized = intent.trim().toLowerCase();

  if (
    normalized === "price_inquiry" ||
    normalized.includes("price") ||
    normalized.includes("package_inquiry")
  ) {
    return "intentPackageInquiry";
  }
  if (normalized === "booking_interest" || normalized.includes("booking")) {
    return "intentBookingInterest";
  }
  if (normalized === "destination_interest" || normalized.includes("destination")) {
    return "intentDestinationInterest";
  }
  if (normalized === "muslim_friendly" || normalized.includes("halal")) {
    return "intentMuslimFriendly";
  }
  if (normalized === "hotel_concern") return "intentHotelConcern";
  if (normalized === "departure_date") return "intentDepartureDate";
  if (normalized === "pax") return "intentPax";
  if (normalized === "general_question") return "intentGeneralQuestion";
  return "intentUnknown";
}

function parseUsedSourceLabel(raw: string): ThinkingKnowledgeSource | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();

  if (lower === "identity" || lower.includes("company")) {
    return {
      type: "identity",
      name: "",
      href: SOURCE_HREFS.identity,
      typeLabelKey: SOURCE_TYPE_LABEL_KEYS.identity,
    };
  }

  const colonMatch = trimmed.match(/^([^:]+):\s*(.+)$/);
  if (colonMatch) {
    const prefix = colonMatch[1].trim().toLowerCase();
    const value = colonMatch[2].trim();

    if (prefix.startsWith("product")) {
      return {
        type: "product",
        name: value,
        href: SOURCE_HREFS.product,
        typeLabelKey: SOURCE_TYPE_LABEL_KEYS.product,
      };
    }
    if (prefix.startsWith("knowledge") || prefix.startsWith("article")) {
      return {
        type: "knowledge",
        name: value,
        href: SOURCE_HREFS.knowledge,
        typeLabelKey: SOURCE_TYPE_LABEL_KEYS.knowledge,
      };
    }
    if (prefix.startsWith("document")) {
      return {
        type: "document",
        name: value,
        href: SOURCE_HREFS.document,
        typeLabelKey: SOURCE_TYPE_LABEL_KEYS.document,
      };
    }
    if (prefix.startsWith("rule") || prefix.startsWith("behavior")) {
      return {
        type: "rule",
        name: value,
        href: SOURCE_HREFS.rule,
        typeLabelKey: SOURCE_TYPE_LABEL_KEYS.rule,
      };
    }
  }

  if (lower.startsWith("rule ")) {
    return {
      type: "rule",
      name: trimmed.slice(5).trim(),
      href: SOURCE_HREFS.rule,
      typeLabelKey: SOURCE_TYPE_LABEL_KEYS.rule,
    };
  }

  return null;
}

function collectPipelineUsedSources(events: WhatsappAiAuditEvent[] | null | undefined): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();

  for (const eventType of PIPELINE_EVENT_PRIORITY) {
    const event = [...(events ?? [])].reverse().find((item) => item.eventType === eventType);
    for (const source of event?.usedSources ?? []) {
      const normalized = source.trim();
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        merged.push(normalized);
      }
    }
  }

  return merged;
}

function findLatestPipelineEvent(
  events: WhatsappAiAuditEvent[] | null | undefined,
): WhatsappAiAuditEvent | null {
  for (const eventType of PIPELINE_EVENT_PRIORITY) {
    const event = [...(events ?? [])].reverse().find((item) => item.eventType === eventType);
    if (event) return event;
  }
  return null;
}

function buildKnowledgeSourcesFallback(
  conversation: OmnichannelConversationDetail,
): ThinkingKnowledgeSource[] {
  const sources: ThinkingKnowledgeSource[] = [];
  const seen = new Set<string>();

  const push = (source: ThinkingKnowledgeSource) => {
    const key = `${source.type}:${source.name}`;
    if (seen.has(key)) return;
    seen.add(key);
    sources.push(source);
  };

  push({
    type: "identity",
    name: "",
    href: SOURCE_HREFS.identity,
    typeLabelKey: SOURCE_TYPE_LABEL_KEYS.identity,
  });

  const destination =
    conversation.leadQualification?.fields.destination?.trim() ||
    conversation.conversationMemory?.destination?.memoryValue?.trim();

  if (destination) {
    push({
      type: "product",
      name: destination,
      href: SOURCE_HREFS.product,
      typeLabelKey: SOURCE_TYPE_LABEL_KEYS.product,
    });
  }

  for (const document of conversation.recommendedDocuments ?? []) {
    push({
      type: "document",
      name: document.name,
      href: SOURCE_HREFS.document,
      typeLabelKey: SOURCE_TYPE_LABEL_KEYS.document,
    });
  }

  for (const row of getQualificationFieldRows(conversation.leadQualification)) {
    if (!row.completed || !row.value) continue;
    push({
      type: "knowledge",
      name: row.value,
      href: SOURCE_HREFS.knowledge,
      typeLabelKey: SOURCE_TYPE_LABEL_KEYS.knowledge,
    });
  }

  return sources;
}

function buildKnowledgeSourcesFromPipeline(
  usedSources: string[],
  conversation: OmnichannelConversationDetail,
): ThinkingKnowledgeSource[] {
  const contentSources = usedSources.filter((source) => {
    const lower = source.trim().toLowerCase();
    return !lower.startsWith("rule:") && !lower.startsWith("behavior:");
  });

  const parsed = contentSources
    .map(parseUsedSourceLabel)
    .filter((item): item is ThinkingKnowledgeSource => item !== null && item.type !== "rule");

  if (parsed.length > 0) return parsed;
  return buildKnowledgeSourcesFallback(conversation);
}

function buildRulesFromPipeline(usedSources: string[]): ThinkingRuleItem[] {
  const rules: ThinkingRuleItem[] = [];
  const seen = new Set<string>();

  for (const source of usedSources) {
    const trimmed = source.trim();
    const lower = trimmed.toLowerCase();
    if (!lower.startsWith("rule:") && !lower.startsWith("behavior:")) continue;

    const rawLabel = trimmed.includes(":") ? trimmed.slice(trimmed.indexOf(":") + 1).trim() : trimmed;
    if (!rawLabel || seen.has(rawLabel)) continue;
    seen.add(rawLabel);
    rules.push({ rawLabel });
  }

  return rules;
}

function buildRulesFallback(
  conversation: OmnichannelConversationDetail,
  pipelineRules: ThinkingRuleItem[],
): ThinkingRuleItem[] {
  const rules = [...pipelineRules];
  const seen = new Set(rules.map((rule) => rule.rawLabel ?? rule.labelKey));

  for (const labelKey of DEFAULT_RULE_KEYS) {
    if (seen.has(labelKey)) continue;
    seen.add(labelKey);
    rules.push({ labelKey });
  }

  const aiState = resolveWhatsappAiState(conversation.aiState);
  if (aiState === "HUMAN_ONLY" && !seen.has("ruleHumanOnly")) {
    rules.push({ labelKey: "ruleHumanOnly" });
  }
  if (aiState === "READY_FOR_HUMAN" && !seen.has("ruleReadyForHuman")) {
    rules.push({ labelKey: "ruleReadyForHuman" });
  }

  return rules;
}

function buildWhyBullets(
  conversation: OmnichannelConversationDetail,
  intent: IntelligenceIntent,
): InboxKey[] {
  const bullets: InboxKey[] = [];
  const qualification = conversation.leadQualification;
  const hasProduct = Boolean(
    conversation.recommendedDocuments?.length ||
      qualification?.fields.destination?.trim() ||
      conversation.conversationMemory?.destination?.memoryValue?.trim(),
  );

  if (intent === "price_inquiry") {
    bullets.push("thinkingWhyCustomerAskedPricing");
  } else if (intent === "destination_interest") {
    bullets.push("thinkingWhyCustomerAskedDestination");
  } else if (intent === "booking_interest") {
    bullets.push("thinkingWhyCustomerAskedBooking");
  } else {
    bullets.push("thinkingWhyCustomerMessageReviewed");
  }

  if (hasProduct) {
    bullets.push("thinkingWhyProductFound");
  }

  const completionScore = qualification?.completionScore ?? 0;
  if (completionScore < 80) {
    bullets.push("thinkingWhyQualificationIncomplete");
  }

  const missingDeparture = qualification?.missingFields?.includes("departure");
  const missingBudget = qualification?.missingFields?.includes("budget");

  const nextAction = buildCommandCenterNextAction({
    aiState: conversation.aiState,
    leadQualification: qualification,
    conversationMemory: conversation.conversationMemory,
  });

  if (missingDeparture || intent === "departure_date") {
    bullets.push("thinkingWhyNextAskDeparture");
  } else if (missingBudget || nextAction.id === "ask_budget") {
    bullets.push("thinkingWhyNextAskBudget");
  } else if (nextAction.id === "recommend_package") {
    bullets.push("thinkingWhyNextRecommendPackage");
  } else if (nextAction.id === "send_brochure") {
    bullets.push("thinkingWhyNextSendBrochure");
  } else if (nextAction.id === "handover") {
    bullets.push("thinkingWhyNextHandover");
  } else if (nextAction.id === "take_over") {
    bullets.push("thinkingWhyNextTakeOver");
  } else {
    bullets.push("thinkingWhyNextDefault");
  }

  return [...new Set(bullets)].slice(0, 4);
}

function resolveConfidenceLevel(score: number): ReplyConfidenceLevel {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}

function confidenceLabelKey(level: ReplyConfidenceLevel): InboxKey {
  if (level === "high") return "confidenceHigh";
  if (level === "medium") return "confidenceMedium";
  return "confidenceLow";
}
function buildMissingContext(
  conversation: OmnichannelConversationDetail,
  suggestedMissing: MissingContextKey[],
): ThinkingMissingItem[] {
  const items: ThinkingMissingItem[] = [];
  const seen = new Set<string>();

  const push = (item: ThinkingMissingItem) => {
    if (seen.has(item.labelKey)) return;
    seen.add(item.labelKey);
    items.push(item);
  };

  for (const key of suggestedMissing) {
    const labelKey =
      key === "visaPolicy" ? MISSING_LABEL_KEYS.visaInformation : MISSING_LABEL_KEYS[key];
    push({
      key,
      labelKey,
      href: "/business-brain/knowledge",
    });
  }

  if (
    (conversation.recommendedDocuments?.length ?? 0) === 0 &&
    (conversation.leadQualification?.fields.destination?.trim() ||
      conversation.conversationMemory?.destination?.memoryValue?.trim())
  ) {
    push({
      key: "itineraryDocument",
      labelKey: MISSING_LABEL_KEYS.itineraryDocument,
      href: "/business-brain/documents",
    });
  }

  for (const fieldKey of conversation.leadQualification?.missingFields ?? []) {
    const fieldLabels: Partial<Record<string, InboxKey>> = {
      destination: "fieldDestination",
      departure: "fieldDeparture",
      passenger_count: "fieldPassengerCount",
      budget: "fieldBudget",
      trip_type: "fieldTripType",
      special_request: "fieldSpecialRequest",
    };
    const labelKey = fieldLabels[fieldKey];
    if (labelKey) {
      push({
        key: "qualificationField",
        labelKey,
        href: "/business-brain/knowledge",
      });
    }
  }

  return items;
}

export function buildAiThinking(input: {
  conversation: OmnichannelConversationDetail;
  locale: Locale;
}): AiThinkingResult {
  const { conversation, locale } = input;

  if (!hasIncomingText(conversation.messages)) {
    return {
      available: false,
      intentKey: "intentUnknown",
      confidence: 0,
      confidenceLevel: "low",
      confidenceLabelKey: "confidenceLow",
      whyBullets: [],
      knowledgeSources: [],
      rulesApplied: [],
      missingContext: [],
    };
  }

  const suggested = generateSuggestedReply({ conversation, locale });
  const intelligence = buildRuleBasedIntelligence(
    {
      displayName: conversation.customerName,
      channelLabel: conversation.channelLabel,
      statusLabel: conversation.statusLabel,
      unreadCount: conversation.unreadCount,
      leadId: conversation.leadId,
    },
    conversation.messages,
  );

  const pipelineEvent = findLatestPipelineEvent(conversation.aiActivityEvents);
  const usedSources = collectPipelineUsedSources(conversation.aiActivityEvents);

  const intentKey = pipelineEvent?.intent
    ? mapIntentToKey(pipelineEvent.intent)
    : mapIntentToKey(intelligence.intent);

  const pipelineConfidence = pipelineEvent?.confidence;
  const confidence =
    typeof pipelineConfidence === "number" && pipelineConfidence > 0
      ? Math.round(pipelineConfidence <= 1 ? pipelineConfidence * 100 : pipelineConfidence)
      : suggested.confidence;

  const confidenceLevel = resolveConfidenceLevel(confidence);
  const confidenceLabelKeyValue = confidenceLabelKey(confidenceLevel);

  const knowledgeSources = buildKnowledgeSourcesFromPipeline(usedSources, conversation);
  const pipelineRules = buildRulesFromPipeline(usedSources);
  const rulesApplied = buildRulesFallback(conversation, pipelineRules);
  const whyBullets = buildWhyBullets(conversation, intelligence.intent);
  const missingContext = buildMissingContext(conversation, suggested.missingContext);

  return {
    available: true,
    intentKey,
    confidence,
    confidenceLevel,
    confidenceLabelKey: confidenceLabelKeyValue,
    whyBullets,
    knowledgeSources,
    rulesApplied,
    missingContext,
  };
}
