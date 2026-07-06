import { buildRuleBasedIntelligence } from "@/lib/communication/intelligence/rule-based-intelligence";
import type { Locale } from "@/lib/i18n/config";
import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { resolveWhatsappAiState } from "@/lib/whatsapp-inbox/ai/constants";
import type { RecommendedDocumentItem } from "@/modules/inbox/lib/build-ai-command-center";

export type NextBestActionId =
  | "ask_destination"
  | "ask_departure_date"
  | "ask_passenger_count"
  | "ask_budget"
  | "ask_hotel_preference"
  | "recommend_product"
  | "send_brochure"
  | "send_itinerary"
  | "send_company_profile"
  | "ask_follow_up"
  | "schedule_callback"
  | "take_over_conversation"
  | "mark_qualified"
  | "create_booking"
  | "create_crm_note";

export type NextBestActionPriority = "critical" | "high" | "medium" | "low";

export type NextBestActionType =
  | "insert_question"
  | "insert_reply"
  | "open_product"
  | "open_knowledge"
  | "send_document"
  | "take_over"
  | "create_note"
  | "mark_qualified";

export type NextBestActionRecommendation = {
  id: NextBestActionId;
  titleKey: InboxKey;
  descriptionKey: InboxKey;
  reasonKey: InboxKey;
  priority: NextBestActionPriority;
  priorityLabelKey: InboxKey;
  expectedImpactKey: InboxKey;
  actionType: NextBestActionType;
  ctaKey: InboxKey;
  ctaEnabled: boolean;
  insertText?: string;
  href?: string;
  documentId?: string;
  documentName?: string;
};

export type NextBestActionResult = {
  hasRecommendations: boolean;
  primary: NextBestActionRecommendation | null;
  others: NextBestActionRecommendation[];
};

const PRIORITY_LABEL_KEYS: Record<NextBestActionPriority, InboxKey> = {
  critical: "nbaPriorityCritical",
  high: "nbaPriorityHigh",
  medium: "nbaPriorityMedium",
  low: "nbaPriorityLow",
};

const PRIORITY_WEIGHT: Record<NextBestActionPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const MAX_RECOMMENDATIONS = 5;

type ActionDefinition = {
  titleKey: InboxKey;
  descriptionKey: InboxKey;
  reasonKey: InboxKey;
  expectedImpactKey: InboxKey;
  actionType: NextBestActionType;
  ctaKey: InboxKey;
  defaultPriority: NextBestActionPriority;
  implemented: boolean;
};

const ACTION_DEFINITIONS: Record<NextBestActionId, ActionDefinition> = {
  ask_destination: {
    titleKey: "nbaAskDestination",
    descriptionKey: "nbaDescAskDestination",
    reasonKey: "nbaReasonMissingDestination",
    expectedImpactKey: "nbaImpactQualification",
    actionType: "insert_question",
    ctaKey: "nbaCtaInsertQuestion",
    defaultPriority: "high",
    implemented: true,
  },
  ask_departure_date: {
    titleKey: "nbaAskDepartureDate",
    descriptionKey: "nbaDescAskDepartureDate",
    reasonKey: "nbaReasonMissingDeparture",
    expectedImpactKey: "nbaImpactQualification",
    actionType: "insert_question",
    ctaKey: "nbaCtaInsertQuestion",
    defaultPriority: "high",
    implemented: true,
  },
  ask_passenger_count: {
    titleKey: "nbaAskPassengerCount",
    descriptionKey: "nbaDescAskPassengerCount",
    reasonKey: "nbaReasonMissingPassengers",
    expectedImpactKey: "nbaImpactQualification",
    actionType: "insert_question",
    ctaKey: "nbaCtaInsertQuestion",
    defaultPriority: "medium",
    implemented: true,
  },
  ask_budget: {
    titleKey: "nbaAskBudget",
    descriptionKey: "nbaDescAskBudget",
    reasonKey: "nbaReasonMissingBudget",
    expectedImpactKey: "nbaImpactQualification",
    actionType: "insert_question",
    ctaKey: "nbaCtaInsertQuestion",
    defaultPriority: "high",
    implemented: true,
  },
  ask_hotel_preference: {
    titleKey: "nbaAskHotelPreference",
    descriptionKey: "nbaDescAskHotelPreference",
    reasonKey: "nbaReasonHotelConcern",
    expectedImpactKey: "nbaImpactQualification",
    actionType: "insert_question",
    ctaKey: "nbaCtaInsertQuestion",
    defaultPriority: "medium",
    implemented: true,
  },
  recommend_product: {
    titleKey: "nbaRecommendProduct",
    descriptionKey: "nbaDescRecommendProduct",
    reasonKey: "nbaReasonQualificationReady",
    expectedImpactKey: "nbaImpactProposal",
    actionType: "insert_reply",
    ctaKey: "nbaCtaInsertReply",
    defaultPriority: "high",
    implemented: true,
  },
  send_brochure: {
    titleKey: "nbaSendBrochure",
    descriptionKey: "nbaDescSendBrochure",
    reasonKey: "nbaReasonProductIdentified",
    expectedImpactKey: "nbaImpactReduceWaiting",
    actionType: "send_document",
    ctaKey: "nbaCtaSendDocument",
    defaultPriority: "medium",
    implemented: true,
  },
  send_itinerary: {
    titleKey: "nbaSendItinerary",
    descriptionKey: "nbaDescSendItinerary",
    reasonKey: "nbaReasonItineraryAvailable",
    expectedImpactKey: "nbaImpactProposal",
    actionType: "send_document",
    ctaKey: "nbaCtaSendDocument",
    defaultPriority: "medium",
    implemented: true,
  },
  send_company_profile: {
    titleKey: "nbaSendCompanyProfile",
    descriptionKey: "nbaDescSendCompanyProfile",
    reasonKey: "nbaReasonEarlyStage",
    expectedImpactKey: "nbaImpactReduceWaiting",
    actionType: "send_document",
    ctaKey: "nbaCtaSendDocument",
    defaultPriority: "low",
    implemented: true,
  },
  ask_follow_up: {
    titleKey: "nbaAskFollowUp",
    descriptionKey: "nbaDescAskFollowUp",
    reasonKey: "nbaReasonStaleConversation",
    expectedImpactKey: "nbaImpactReduceWaiting",
    actionType: "insert_question",
    ctaKey: "nbaCtaInsertQuestion",
    defaultPriority: "medium",
    implemented: true,
  },
  schedule_callback: {
    titleKey: "nbaScheduleCallback",
    descriptionKey: "nbaDescScheduleCallback",
    reasonKey: "nbaReasonQualifiedLead",
    expectedImpactKey: "nbaImpactBookingConfidence",
    actionType: "create_note",
    ctaKey: "nbaCtaCreateNote",
    defaultPriority: "low",
    implemented: false,
  },
  take_over_conversation: {
    titleKey: "nbaTakeOverConversation",
    descriptionKey: "nbaDescTakeOverConversation",
    reasonKey: "nbaReasonHandoverNeeded",
    expectedImpactKey: "nbaImpactBookingConfidence",
    actionType: "take_over",
    ctaKey: "nbaCtaTakeOver",
    defaultPriority: "critical",
    implemented: true,
  },
  mark_qualified: {
    titleKey: "nbaMarkQualified",
    descriptionKey: "nbaDescMarkQualified",
    reasonKey: "nbaReasonQualificationComplete",
    expectedImpactKey: "nbaImpactProposal",
    actionType: "mark_qualified",
    ctaKey: "nbaCtaMarkQualified",
    defaultPriority: "high",
    implemented: false,
  },
  create_booking: {
    titleKey: "nbaCreateBooking",
    descriptionKey: "nbaDescCreateBooking",
    reasonKey: "nbaReasonReadyToBook",
    expectedImpactKey: "nbaImpactBookingConfidence",
    actionType: "open_product",
    ctaKey: "nbaCtaOpenProduct",
    defaultPriority: "high",
    implemented: false,
  },
  create_crm_note: {
    titleKey: "nbaCreateCrmNote",
    descriptionKey: "nbaDescCreateCrmNote",
    reasonKey: "nbaReasonDocumentConversation",
    expectedImpactKey: "nbaImpactQualification",
    actionType: "create_note",
    ctaKey: "nbaCtaCreateNote",
    defaultPriority: "low",
    implemented: false,
  },
};

const QUESTION_TEMPLATES: Record<
  Extract<
    NextBestActionId,
    | "ask_destination"
    | "ask_departure_date"
    | "ask_passenger_count"
    | "ask_budget"
    | "ask_hotel_preference"
    | "ask_follow_up"
  >,
  Record<Locale, string>
> = {
  ask_destination: {
    id: "Baik Kak, boleh tahu destinasi yang Kakak minati?",
    en: "Which destination are you interested in traveling to?",
  },
  ask_departure_date: {
    id: "Baik Kak, rencana keberangkatan bulan atau tanggal berapa ya?",
    en: "When are you planning to depart?",
  },
  ask_passenger_count: {
    id: "Baik Kak, untuk berapa orang rencananya?",
    en: "How many guests will be traveling?",
  },
  ask_budget: {
    id: "Baik Kak, boleh info budget per orang atau total untuk trip ini?",
    en: "What budget range are you working with for this trip?",
  },
  ask_hotel_preference: {
    id: "Baik Kak, untuk hotel Kakak prefer standard, superior, atau upgrade?",
    en: "Do you prefer standard, superior, or upgraded hotel options?",
  },
  ask_follow_up: {
    id: "Halo Kak, ada yang masih bisa saya bantu? Saya siap follow up jika diperlukan.",
    en: "Hi! Just checking in — is there anything else I can help you with?",
  },
};

function pickValue(
  conversation: OmnichannelConversationDetail,
  qualificationKey: "destination" | "departure_month" | "passenger_count" | "budget",
  memoryKey: "destination" | "departure_month" | "passenger_count" | "budget",
): string | null {
  const fromQualification = conversation.leadQualification?.fields[qualificationKey]?.trim();
  if (fromQualification) return fromQualification;

  return conversation.conversationMemory?.[memoryKey]?.memoryValue?.trim() || null;
}

function pickDeparture(conversation: OmnichannelConversationDetail): string | null {
  return (
    pickValue(conversation, "departure_month", "departure_month") ||
    conversation.leadQualification?.fields.departure_date?.trim() ||
    conversation.conversationMemory?.departure_date?.memoryValue?.trim() ||
    null
  );
}

function hasIncomingText(messages: OmnichannelConversationDetail["messages"]) {
  return messages.some(
    (message) => message.direction === "incoming" && message.message_text?.trim(),
  );
}

function hasUnansweredIncoming(messages: OmnichannelConversationDetail["messages"]) {
  let lastIncomingAt: string | null = null;
  let lastOutgoingAt: string | null = null;

  for (const message of messages) {
    if (message.direction === "incoming" && message.message_text?.trim()) {
      lastIncomingAt = message.created_at;
    }
    if (message.direction === "outgoing") {
      lastOutgoingAt = message.created_at;
    }
  }

  if (!lastIncomingAt) return false;
  if (!lastOutgoingAt) return true;
  return Date.parse(lastIncomingAt) > Date.parse(lastOutgoingAt);
}

function isQualificationComplete(conversation: OmnichannelConversationDetail) {
  const missing = conversation.leadQualification?.missingFields ?? [];
  return missing.length === 0 && Boolean(conversation.leadQualification);
}

function findDocument(
  documents: RecommendedDocumentItem[],
  matcher: (document: RecommendedDocumentItem) => boolean,
): RecommendedDocumentItem | null {
  return documents.find(matcher) ?? null;
}

function buildRecommendProductReply(destination: string | null, locale: Locale) {
  const label = destination ?? (locale === "id" ? "destinasi tersebut" : "your destination");
  return locale === "id"
    ? `Baik Kak, berdasarkan kebutuhan Kakak saya rekomendasikan paket untuk ${label}. Boleh saya kirimkan detail lengkapnya?`
    : `Based on what you've shared, I'd recommend our package for ${label}. May I send you the full details?`;
}

function createRecommendation(
  id: NextBestActionId,
  locale: Locale,
  overrides: Partial<
    Pick<
      NextBestActionRecommendation,
      | "priority"
      | "insertText"
      | "href"
      | "documentId"
      | "documentName"
      | "ctaEnabled"
      | "reasonKey"
    >
  > = {},
): NextBestActionRecommendation {
  const definition = ACTION_DEFINITIONS[id];
  const priority = overrides.priority ?? definition.defaultPriority;

  return {
    id,
    titleKey: definition.titleKey,
    descriptionKey: definition.descriptionKey,
    reasonKey: overrides.reasonKey ?? definition.reasonKey,
    priority,
    priorityLabelKey: PRIORITY_LABEL_KEYS[priority],
    expectedImpactKey: definition.expectedImpactKey,
    actionType: definition.actionType,
    ctaKey: definition.ctaKey,
    ctaEnabled:
      overrides.ctaEnabled ??
      (definition.actionType === "send_document"
        ? definition.implemented && Boolean(overrides.documentId)
        : definition.implemented),
    insertText: overrides.insertText,
    href: overrides.href,
    documentId: overrides.documentId,
    documentName: overrides.documentName,
  };
}

function buildCandidateRecommendations(
  conversation: OmnichannelConversationDetail,
  locale: Locale,
): NextBestActionRecommendation[] {
  const candidates: NextBestActionRecommendation[] = [];
  const aiState = resolveWhatsappAiState(conversation.aiState);
  const qualification = conversation.leadQualification;
  const documents = conversation.recommendedDocuments ?? [];
  const destination = pickValue(conversation, "destination", "destination");
  const departure = pickDeparture(conversation);
  const passengers = pickValue(conversation, "passenger_count", "passenger_count");
  const budget = pickValue(conversation, "budget", "budget");
  const status = qualification?.qualificationStatus;

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

  const brochureDoc =
    findDocument(documents, (document) =>
      /brochure|brosur|profile|company/i.test(`${document.name} ${document.documentType}`),
    ) ?? documents[0] ??
    null;

  const itineraryDoc =
    findDocument(documents, (document) =>
      /itinerary|itinerari|jadwal|schedule/i.test(`${document.name} ${document.documentType}`),
    ) ?? null;

  const companyProfileDoc =
    findDocument(documents, (document) =>
      /company|profile|perusahaan/i.test(`${document.name} ${document.documentType}`),
    ) ?? brochureDoc;

  if (intelligence.sentiment === "concerned") {
    candidates.push(
      createRecommendation("take_over_conversation", locale, {
        priority: "critical",
        reasonKey: "nbaReasonComplaintDetected",
      }),
    );
  }

  if (aiState === "READY_FOR_HUMAN") {
    candidates.push(
      createRecommendation("take_over_conversation", locale, {
        priority: "critical",
        reasonKey: "nbaReasonReadyForHuman",
      }),
    );
  }

  if (status === "HANDOVER_READY" || status === "QUALIFIED") {
    candidates.push(createRecommendation("mark_qualified", locale, { priority: "high" }));
    candidates.push(createRecommendation("take_over_conversation", locale, { priority: "high" }));
    candidates.push(createRecommendation("create_booking", locale, { priority: "high" }));
    candidates.push(createRecommendation("schedule_callback", locale, { priority: "medium" }));
  }

  if (!destination) {
    candidates.push(
      createRecommendation("ask_destination", locale, {
        insertText: QUESTION_TEMPLATES.ask_destination[locale],
      }),
    );
  }

  if (destination && !departure) {
    candidates.push(
      createRecommendation("ask_departure_date", locale, {
        insertText: QUESTION_TEMPLATES.ask_departure_date[locale],
        priority: "high",
      }),
    );
  }

  if (destination && !passengers) {
    candidates.push(
      createRecommendation("ask_passenger_count", locale, {
        insertText: QUESTION_TEMPLATES.ask_passenger_count[locale],
      }),
    );
  }

  if (destination && !budget) {
    candidates.push(
      createRecommendation("ask_budget", locale, {
        insertText: QUESTION_TEMPLATES.ask_budget[locale],
        priority: "high",
      }),
    );
  }

  if (intelligence.intent === "hotel_concern") {
    candidates.push(
      createRecommendation("ask_hotel_preference", locale, {
        insertText: QUESTION_TEMPLATES.ask_hotel_preference[locale],
      }),
    );
  }

  if (destination && brochureDoc) {
    candidates.push(
      createRecommendation("send_brochure", locale, {
        documentId: brochureDoc.id,
        documentName: brochureDoc.name,
        ctaEnabled: true,
      }),
    );
  }

  if (destination && itineraryDoc) {
    candidates.push(
      createRecommendation("send_itinerary", locale, {
        documentId: itineraryDoc.id,
        documentName: itineraryDoc.name,
        ctaEnabled: true,
      }),
    );
  }

  if (!destination && companyProfileDoc && hasIncomingText(conversation.messages)) {
    candidates.push(
      createRecommendation("send_company_profile", locale, {
        documentId: companyProfileDoc.id,
        documentName: companyProfileDoc.name,
        ctaEnabled: true,
      }),
    );
  }

  if (destination && budget && passengers) {
    candidates.push(
      createRecommendation("recommend_product", locale, {
        insertText: buildRecommendProductReply(destination, locale),
        priority: "high",
      }),
    );
  } else if (destination) {
    candidates.push(
      createRecommendation("recommend_product", locale, {
        insertText: buildRecommendProductReply(destination, locale),
        priority: "medium",
        reasonKey: "nbaReasonProductIdentified",
      }),
    );
  }

  if (hasUnansweredIncoming(conversation.messages)) {
    candidates.push(
      createRecommendation("ask_follow_up", locale, {
        insertText: QUESTION_TEMPLATES.ask_follow_up[locale],
        priority: "medium",
      }),
    );
  }

  return candidates;
}

function dedupeAndRank(
  candidates: NextBestActionRecommendation[],
): NextBestActionRecommendation[] {
  const byId = new Map<NextBestActionId, NextBestActionRecommendation>();

  for (const candidate of candidates) {
    const existing = byId.get(candidate.id);
    if (!existing || PRIORITY_WEIGHT[candidate.priority] > PRIORITY_WEIGHT[existing.priority]) {
      byId.set(candidate.id, candidate);
    }
  }

  return [...byId.values()].sort(
    (left, right) => PRIORITY_WEIGHT[right.priority] - PRIORITY_WEIGHT[left.priority],
  );
}

function isConversationComplete(conversation: OmnichannelConversationDetail): boolean {
  const aiState = resolveWhatsappAiState(conversation.aiState);
  const status = conversation.leadQualification?.qualificationStatus;

  if (status === "CLOSED") return true;
  if (!hasIncomingText(conversation.messages)) return false;

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

  if (intelligence.sentiment === "concerned") return false;
  if (aiState === "READY_FOR_HUMAN") return false;
  if (hasUnansweredIncoming(conversation.messages)) return false;

  return (
    isQualificationComplete(conversation) &&
    (status === "QUALIFIED" || status === "HANDOVER_READY")
  );
}

export function buildNextBestActions(input: {
  conversation: OmnichannelConversationDetail;
  locale: Locale;
}): NextBestActionResult {
  if (isConversationComplete(input.conversation)) {
    return {
      hasRecommendations: false,
      primary: null,
      others: [],
    };
  }

  const ranked = dedupeAndRank(
    buildCandidateRecommendations(input.conversation, input.locale),
  ).slice(0, MAX_RECOMMENDATIONS);

  if (ranked.length === 0) {
    return {
      hasRecommendations: false,
      primary: null,
      others: [],
    };
  }

  const [primary, ...others] = ranked;
  return {
    hasRecommendations: true,
    primary: primary ?? null,
    others,
  };
}

export function getPrimaryNextBestActionTitleKey(
  result: NextBestActionResult,
): InboxKey {
  if (result.primary) return result.primary.titleKey;
  return "nbaNoActionShort";
}
