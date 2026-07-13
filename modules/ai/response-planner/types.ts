import type { BusinessBrainContext } from "@/modules/business-brain/types/context";
import type { RetrievedBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import type { LeadQualificationSnapshot } from "@/modules/ai/types/lead-qualification";
import type { ConversationMemoryMap } from "@/modules/ai/types/memory";
import type { QuestionSemanticKey } from "@/modules/ai/conversation-state/types";
import type { CollectedInformationMap } from "@/modules/ai/conversation-state/types";
import type { ConversationStatePromptContext } from "@/modules/ai/conversation-state/types";
import type { WhatsAppConversationTurn } from "@/modules/business-brain/types/prompt";

export const REQUEST_TYPES = [
  "GREETING",
  "GENERAL_SERVICE_INQUIRY",
  "CATALOG_DISCOVERY",
  "DESTINATION_DISCOVERY",
  "PRODUCT_SELECTION",
  "PRODUCT_INFORMATION",
  "GEOGRAPHIC_CONFIRMATION",
  "PRODUCT_COMPARISON",
  "PRICE",
  "ITINERARY_OR_DOCUMENT",
  "SCHEDULE_OR_DEPARTURE",
  "AVAILABILITY",
  "INCLUSIONS",
  "EXCLUSIONS",
  "TERMS_OR_POLICY",
  "BOOKING_OR_APPOINTMENT",
  "PAYMENT",
  "COMPLAINT",
  "HUMAN_REQUEST",
  "UNKNOWN",
] as const;

export type RequestType = (typeof REQUEST_TYPES)[number];

export const ANSWERABILITY_STATES = [
  "ANSWERABLE",
  "PARTIALLY_ANSWERABLE",
  "NEEDS_DISAMBIGUATION",
  "NOT_ANSWERABLE",
  "REQUIRES_HUMAN_CONFIRMATION",
] as const;

export type Answerability = (typeof ANSWERABILITY_STATES)[number];

export const RESPONSE_ACTIONS = [
  "ANSWER_DIRECTLY",
  "ANSWER_THEN_ASK",
  "SEND_DOCUMENT_THEN_ASK",
  "ASK_ONE_CLARIFYING_QUESTION",
  "LIST_CATALOG_THEN_ASK",
  "LIST_DESTINATION_OPTIONS_THEN_ASK",
  "LIST_MATCHING_PRODUCTS_THEN_ASK",
  "HANDOFF_TO_HUMAN",
  "ACKNOWLEDGE_AND_HANDOFF",
] as const;

export type ResponseAction = (typeof RESPONSE_ACTIONS)[number];

export type SelectedEntitySource =
  | "explicit_latest_message"
  | "conversation_state"
  | "recent_history"
  | "single_retrieval_match"
  | "collected_information"
  | "destination_match";

export type CatalogMatchType = "exact" | "same_country_alternative";

export type CatalogResult = {
  entityId: string;
  displayName: string;
  destinationOrCategory: string;
  duration: string | null;
  startingPrice: number | null;
  currency: import("@/modules/business-brain/types/products").ProductCurrency | null;
  priceLabel: string | null;
  priceSourceField: string | null;
  priceBasis: string | null;
  departureDates: string[];
  sourceIds: string[];
  matchType: CatalogMatchType;
  geographicMatchType: string | null;
};

export type CatalogContext = {
  queryType: "country" | "destination" | "category" | "general";
  queryValue: string | null;
  entityIds: string[];
  exactEntityIds: string[];
  alternativeEntityIds: string[];
  establishedAt: string;
};

export type GeographicDiagnostics = {
  geographicQueryType: CatalogContext["queryType"] | null;
  geographicQueryValue: string | null;
  exactMatchEntityIds: string[];
  alternativeEntityIds: string[];
  excludedEntityIds: string[];
  exclusionReasons: Record<string, string>;
  countryMatchType: string | null;
  destinationMatchType: string | null;
  catalogContradictionDetected: boolean;
  selectedEntityId: string | null;
  selectedEntityValid: boolean;
  requestedPeriodType: string | null;
  requestedPeriodStart: string | null;
  requestedPeriodEnd: string | null;
  requestedPeriodMonth: number | null;
  requestedPeriodYear: number | null;
  requestedPeriodTimezone: string | null;
  matchingDepartureDates: string[];
  excludedDepartureDates: string[];
  scheduleGrounded: boolean;
  priceSourceField: string | null;
};

export type SelectedEntity = {
  entityId: string;
  entityType: "product" | "service";
  displayName: string;
  selectionSource: SelectedEntitySource;
  selectedAt: string;
};

export type VerifiedFact = {
  field: string;
  value: string;
  sourceId: string;
  sourceType: "product" | "knowledge" | "document";
};

export type AttachmentAction = {
  documentId: string;
  documentName: string;
  productId: string | null;
  required: boolean;
};

export type PlanTurnMetadata = {
  turnId: string;
  latestMessageTextHash: string;
  previousTurnId: string | null;
  planCreatedAt: string;
  previousSelectedEntity: SelectedEntity | null;
  selectionOverrideReason: import("@/modules/ai/response-planner/resolve-selection-override").SelectionOverrideReason;
  latestMessageIntent: RequestType;
  runtimeVersions: import("@/modules/ai/runtime/runtime-versions").RuntimeVersions;
};

export type ResponsePlan = {
  requestType: RequestType;
  answerability: Answerability;
  selectedEntity: SelectedEntity | null;
  catalogResults: CatalogResult[];
  catalogContext: CatalogContext | null;
  verifiedFacts: VerifiedFact[];
  unsupportedFields: string[];
  missingCustomerInformation: string[];
  responseAction: ResponseAction;
  attachmentAction: AttachmentAction | null;
  followUpQuestion: string | null;
  followUpQuestionKey: QuestionSemanticKey | null;
  answeredQuestionKeys: QuestionSemanticKey[];
  newlyCollectedInformationKeys: string[];
  handoffRequired: boolean;
  handoffReason: string | null;
  directAnswerRequired: boolean;
  directAnswerTemplate: string | null;
  sourceIds: string[];
  groundedSourceCount: number;
  interpretedPeriod: string | null;
  greetingAllowed: boolean;
  greetingType: import("@/modules/ai/conversation-state/types").GreetingType;
  companyNameUsed: string | null;
  catalogQueryType: CatalogContext["queryType"] | null;
  catalogQueryValue: string | null;
  selectionConfidence: number | null;
  destinationMatchType: string | null;
  priceFieldsFound: number;
  geographicDiagnostics: GeographicDiagnostics | null;
  turn: PlanTurnMetadata;
};

export type PlanningMode = "live" | "playground";

export type NormalizedPlanningInput = {
  workspaceId: string;
  mode: PlanningMode;
  latestMessage: string;
  recentHistory: WhatsAppConversationTurn[];
  intent: string;
  conversationState: {
    greetingSent: boolean;
    collectedInformation: CollectedInformationMap;
    questionsAsked: QuestionSemanticKey[];
    selectedEntity: SelectedEntity | null;
    catalogContext: CatalogContext | null;
    currentIntent: string | null;
    handoffRequested: boolean;
  } | null;
  conversationStateContext: ConversationStatePromptContext | null;
  publishedBusinessBrain: BusinessBrainContext;
  retrievedContext: RetrievedBusinessBrainContext;
  customerContext: {
    memory: ConversationMemoryMap;
    qualification: LeadQualificationSnapshot | null;
  };
  includeDraft: boolean;
  timezone?: string | null;
  turn?: PlanTurnMetadata | null;
};

export type PlanValidationResult = {
  passed: boolean;
  directAnswerPresent: boolean;
  unsupportedClaimDetected: boolean;
  unsupportedClaimType: string | null;
  handoffPreserved: boolean;
  attachmentPreserved: boolean;
  answerFirstPassed: boolean;
  violations: string[];
  fallbackReply: string | null;
  usedDeterministicFallback: boolean;
  catalogContradictionDetected: boolean;
  geographicViolationDetected: boolean;
};

export type PlanObservabilityMetadata = {
  requestType: RequestType;
  selectedEntityId: string | null;
  selectedEntityType: string | null;
  selectedEntitySource: SelectedEntitySource | null;
  answerability: Answerability;
  responseAction: ResponseAction;
  verifiedFactFields: string[];
  missingFactFields: string[];
  attachmentIds: string[];
  groundedSourceIds: string[];
  answerFirstPassed: boolean;
  unsupportedClaimDetected: boolean;
  unsupportedClaimType: string | null;
  deterministicFallbackUsed: boolean;
  handoffReason: string | null;
  followUpQuestionIncluded: boolean;
  followUpQuestionKey: string | null;
  greetingAllowed: boolean;
  greetingType: string | null;
  companyNameUsed: string | null;
  catalogQueryType: string | null;
  catalogQueryValue: string | null;
  catalogResultCount: number;
  catalogEntityIds: string[];
  selectionConfidence: number | null;
  destinationMatchType: string | null;
  hospitalityPassed: boolean;
  interrogationDetected: boolean;
  wrongEntityDetected: boolean;
  geographicDiagnostics?: GeographicDiagnostics | null;
};
