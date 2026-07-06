import { buildRuleBasedIntelligence } from "@/lib/communication/intelligence/rule-based-intelligence";
import type { WhatsappAiAuditEvent } from "@/lib/whatsapp-inbox/ai/activity-events";
import { resolveWhatsappAiState } from "@/lib/whatsapp-inbox/ai/constants";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import type { LeadQualificationFieldKey } from "@/modules/ai/types/lead-qualification";
import type { QualificationStatus } from "@/modules/ai/types/lead-qualification";
import {
  buildCommandCenterNextAction,
  buildCommandCenterStats,
  filterCommandCenterActivity,
  getQualificationFieldRows,
  type CommandCenterNextAction,
} from "@/modules/inbox/lib/build-ai-command-center";
import type { InboxKey } from "@/lib/i18n/inbox-dictionary";

export type CopilotSummaryFact =
  | { key: "destination"; value: string }
  | { key: "departure"; value: string }
  | { key: "passengers"; value: string }
  | { key: "budget"; value: string }
  | { key: "budgetMissing" }
  | { key: "tripType"; value: string }
  | { key: "specialRequest"; value: string };

export type CopilotSuggestedReply = {
  text: string;
  confidence: number;
};

export type CopilotThinking = {
  intentKey: InboxKey;
  intentDetail: string | null;
  knowledgeItems: string[];
  rulesItems: string[];
  whyKey: InboxKey;
  whyDetail: string | null;
};

export type CopilotMissingKnowledge = {
  fieldKey: LeadQualificationFieldKey;
  labelKey: InboxKey;
};

export type CopilotRecommendedAction = {
  id: CommandCenterNextAction["id"] | "mark_qualified" | "create_note";
  labelKey: InboxKey;
};

export type CopilotTimelineEvent = {
  id: string;
  labelKey: InboxKey;
  detail: string | null;
  timestamp: string;
};

const QUALIFICATION_STATUS_KEYS: Record<QualificationStatus, InboxKey> = {
  NEW: "leadProgressNew",
  QUALIFYING: "leadProgressQualifying",
  QUALIFIED: "leadProgressQualified",
  HANDOVER_READY: "leadProgressHandoverReady",
  CLOSED: "leadProgressClosed",
};

const FIELD_LABEL_KEYS: Record<LeadQualificationFieldKey, InboxKey> = {
  destination: "fieldDestination",
  departure: "fieldDeparture",
  passenger_count: "fieldPassengerCount",
  budget: "fieldBudget",
  trip_type: "fieldTripType",
  special_request: "fieldSpecialRequest",
};

const TIMELINE_EVENT_KEYS: Partial<Record<string, InboxKey>> = {
  AI_INTENT_CLASSIFIED: "timelineIntentDetected",
  AI_REPLY_SENT: "timelineReplySuggested",
  AI_LLM_REPLY_SENT: "timelineReplySuggested",
  MEMORY_CREATED: "timelineMemoryUpdated",
  MEMORY_UPDATED: "timelineMemoryUpdated",
  MEMORY_EXTRACTION_COMPLETED: "timelineMemoryUpdated",
  AI_DOCUMENT_SENT: "timelineDocumentRecommended",
  AI_HANDOFF_TRIGGERED: "timelineHandoverTriggered",
  AI_LLM_HANDOFF: "timelineHandoverTriggered",
  LEAD_QUALIFICATION_UPDATED: "timelineLeadQualified",
  AI_STATE_CHANGED: "timelineStateChanged",
};

export function getQualificationFieldLabelKey(key: LeadQualificationFieldKey): InboxKey {
  return FIELD_LABEL_KEYS[key];
}

export function getLeadProgressKey(
  status: QualificationStatus | null | undefined,
): InboxKey {
  if (!status) return "leadProgressNew";
  return QUALIFICATION_STATUS_KEYS[status];
}

export function buildCopilotSummaryFacts(
  conversation: OmnichannelConversationDetail,
): CopilotSummaryFact[] {
  const qualification = conversation.leadQualification;
  const memory = conversation.conversationMemory;

  const facts: CopilotSummaryFact[] = [];
  const destination =
    qualification?.fields.destination?.trim() ||
    memory?.destination?.memoryValue?.trim();
  const departure =
    qualification?.fields.departure_month?.trim() ||
    qualification?.fields.departure_date?.trim() ||
    memory?.departure_month?.memoryValue?.trim() ||
    memory?.departure_date?.memoryValue?.trim();
  const passengers =
    qualification?.fields.passenger_count?.trim() ||
    memory?.passenger_count?.memoryValue?.trim();
  const budget =
    qualification?.fields.budget?.trim() || memory?.budget?.memoryValue?.trim();
  const tripType =
    qualification?.fields.trip_type?.trim() || memory?.trip_type?.memoryValue?.trim();
  const specialRequest =
    qualification?.fields.special_request?.trim() ||
    memory?.special_request?.memoryValue?.trim();

  if (destination) facts.push({ key: "destination", value: destination });
  if (departure) facts.push({ key: "departure", value: departure });
  if (passengers) facts.push({ key: "passengers", value: passengers });
  if (budget) facts.push({ key: "budget", value: budget });
  else if (destination || departure || passengers) facts.push({ key: "budgetMissing" });
  if (tripType) facts.push({ key: "tripType", value: tripType });
  if (specialRequest) facts.push({ key: "specialRequest", value: specialRequest });

  return facts;
}

export function buildCopilotSuggestedReply(
  conversation: OmnichannelConversationDetail,
): CopilotSuggestedReply {
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

  const text = intelligence.suggestedReply?.trim();
  const confidence = Math.min(
    95,
    Math.max(
      45,
      (conversation.leadQualification?.completionScore ?? 30) +
        (text ? 15 : 0),
    ),
  );

  return {
    text: text || "",
    confidence,
  };
}

export function buildCopilotConfidence(conversation: OmnichannelConversationDetail): number {
  const fromAction = conversation.aiActions?.find(
    (action) => typeof action.confidence === "number",
  )?.confidence;

  if (typeof fromAction === "number") {
    return Math.round(fromAction * (fromAction <= 1 ? 100 : 1));
  }

  return conversation.leadQualification?.completionScore ?? 0;
}

export function buildCopilotThinking(
  conversation: OmnichannelConversationDetail,
): CopilotThinking {
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

  const knowledgeItems: string[] = [];
  for (const row of getQualificationFieldRows(conversation.leadQualification)) {
    if (row.completed && row.value) {
      knowledgeItems.push(row.value);
    }
  }

  const rulesItems: string[] = [];
  const aiState = resolveWhatsappAiState(conversation.aiState);
  if (aiState === "HUMAN_ONLY") rulesItems.push("human_only");
  if (aiState === "READY_FOR_HUMAN") rulesItems.push("ready_for_human");
  if (conversation.aiHandoffReason?.trim()) {
    rulesItems.push(conversation.aiHandoffReason.trim());
  }

  const nextAction = buildCommandCenterNextAction({
    aiState: conversation.aiState,
    leadQualification: conversation.leadQualification,
    conversationMemory: conversation.conversationMemory,
  });

  const intentKey = mapIntentToKey(intelligence.intent);
  const whyKey = mapNextActionToWhyKey(nextAction.id);

  return {
    intentKey,
    intentDetail: intelligence.entities.latestQuestion,
    knowledgeItems,
    rulesItems,
    whyKey,
    whyDetail: nextAction.description,
  };
}

function mapIntentToKey(intent: string): InboxKey {
  switch (intent) {
    case "price_inquiry":
      return "intentPriceInquiry";
    case "booking_interest":
      return "intentBookingInterest";
    case "destination_interest":
      return "intentDestinationInterest";
    case "muslim_friendly":
      return "intentMuslimFriendly";
    case "hotel_concern":
      return "intentHotelConcern";
    case "departure_date":
      return "intentDepartureDate";
    case "pax":
      return "intentPax";
    case "general_question":
      return "intentGeneralQuestion";
    default:
      return "intentUnknown";
  }
}

function mapNextActionToWhyKey(id: CommandCenterNextAction["id"]): InboxKey {
  switch (id) {
    case "ask_budget":
      return "whyAskBudget";
    case "send_brochure":
      return "whySendBrochure";
    case "recommend_package":
      return "whyRecommendPackage";
    case "handover":
      return "whyHandover";
    case "take_over":
      return "whyTakeOver";
    default:
      return "whyDefault";
  }
}

export function buildCopilotMissingKnowledge(
  conversation: OmnichannelConversationDetail,
): CopilotMissingKnowledge[] {
  const missing = conversation.leadQualification?.missingFields ?? [];

  return missing.map((fieldKey) => ({
    fieldKey,
    labelKey: FIELD_LABEL_KEYS[fieldKey],
  }));
}

export function buildCopilotRecommendedActions(
  conversation: OmnichannelConversationDetail,
): CopilotRecommendedAction[] {
  const next = buildCommandCenterNextAction({
    aiState: conversation.aiState,
    leadQualification: conversation.leadQualification,
    conversationMemory: conversation.conversationMemory,
  });

  const actions: CopilotRecommendedAction[] = [];

  const push = (id: CopilotRecommendedAction["id"], labelKey: InboxKey) => {
    if (!actions.some((item) => item.id === id)) {
      actions.push({ id, labelKey });
    }
  };

  push("send_brochure", "actionSendBrochure");
  push("ask_budget", "actionAskBudget");
  push("take_over", "actionTakeOver");

  if (
    conversation.leadQualification?.qualificationStatus === "QUALIFIED" ||
    conversation.leadQualification?.qualificationStatus === "HANDOVER_READY"
  ) {
    push("mark_qualified", "actionMarkQualified");
  }

  push("create_note", "actionCreateNote");

  if (next.id === "handover") {
    push("handover", "actionTakeOver");
  }

  return actions;
}

export function buildCopilotTimeline(
  events: WhatsappAiAuditEvent[] | null | undefined,
  limit = 8,
): CopilotTimelineEvent[] {
  return filterCommandCenterActivity(events, limit).map((event) => ({
    id: event.id,
    labelKey: TIMELINE_EVENT_KEYS[event.eventType] ?? "timelineGeneric",
    detail: event.detail ?? event.reason ?? event.label ?? null,
    timestamp: event.timestamp,
  }));
}

export { buildCommandCenterNextAction, buildCommandCenterStats, getQualificationFieldRows };
