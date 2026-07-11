import type { CatalogContext, SelectedEntity } from "@/modules/ai/response-planner/types";
import type { WhatsappAiState } from "@/types/whatsapp-inbox";

export const CONVERSATION_AI_STATE_VERSION = "2026.07.11";

export const CONVERSATION_PHASES = [
  "NEW",
  "ENGAGED",
  "QUALIFYING",
  "READY_FOR_HANDOFF",
  "HANDED_OFF",
  "HUMAN_ACTIVE",
  "AI_PAUSED",
  "CLOSED",
] as const;

export type ConversationPhase = (typeof CONVERSATION_PHASES)[number];

export const COLLECTED_INFORMATION_KEYS = [
  "requestedService",
  "preferredDate",
  "preferredTime",
  "participantCount",
  "scope",
  "location",
  "budgetRange",
  "urgency",
  "contactPreference",
  "notes",
] as const;

export type CollectedInformationKey = (typeof COLLECTED_INFORMATION_KEYS)[number];

export const QUESTION_SEMANTIC_KEYS = [
  "requested_service",
  "preferred_date",
  "preferred_time",
  "participant_count",
  "budget_range",
  "location",
  "urgency",
  "contact_preference",
  "scope",
  "notes",
] as const;

export type QuestionSemanticKey = (typeof QUESTION_SEMANTIC_KEYS)[number];

export const MAX_QUESTIONS_ASKED = 20;
export const MAX_COLLECTED_INFORMATION_ENTRIES = 10;

export type CollectedInformationEntry = {
  value: string;
  sourceMessageId: string | null;
  updatedAt: string;
};

export type CollectedInformationMap = Partial<
  Record<CollectedInformationKey, CollectedInformationEntry>
>;

export type ConversationAiStateRecord = {
  id: string;
  workspaceId: string;
  conversationId: string;
  greetingSent: boolean;
  businessIntroductionSent: boolean;
  customerName: string | null;
  currentIntent: string | null;
  currentPhase: ConversationPhase;
  qualificationStage: string | null;
  collectedInformation: CollectedInformationMap;
  questionsAsked: QuestionSemanticKey[];
  selectedEntity: SelectedEntity | null;
  catalogContext: CatalogContext | null;
  handoffRequested: boolean;
  handoffReason: string | null;
  handoffAt: string | null;
  aiPaused: boolean;
  lastAiReplyAt: string | null;
  lastCustomerMessageAt: string | null;
  lastStateTransitionAt: string;
  stateVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type ConversationAiStateSnapshot = Pick<
  ConversationAiStateRecord,
  | "greetingSent"
  | "businessIntroductionSent"
  | "customerName"
  | "currentIntent"
  | "currentPhase"
  | "qualificationStage"
  | "collectedInformation"
  | "questionsAsked"
  | "selectedEntity"
  | "catalogContext"
  | "handoffRequested"
  | "handoffReason"
  | "handoffAt"
  | "aiPaused"
  | "lastAiReplyAt"
  | "lastCustomerMessageAt"
  | "stateVersion"
>;

export type GreetingType = "indonesian" | "english" | "islamic" | "formal" | "generic" | null;

export type GreetingDecision = {
  allowed: boolean;
  reason: string;
  greetingType: GreetingType;
};

export type GreetingGuardResult = {
  reply: string;
  greetingDetected: boolean;
  greetingRemoved: boolean;
  usedFallback: boolean;
  changes: string[];
};

export type ConversationStatePromptContext = {
  conversationState: ConversationAiStateSnapshot;
  greetingAllowed: boolean;
  greetingReason: string;
  currentPhase: ConversationPhase;
  collectedInformation: CollectedInformationMap;
  questionsAsked: QuestionSemanticKey[];
  answeredQuestionKeys: QuestionSemanticKey[];
  unansweredQuestionKeys: QuestionSemanticKey[];
  handoffState: "none" | "requested" | "completed";
  aiPaused: boolean;
  hasPriorBusinessReplies: boolean;
};

export type StateTransitionResult = {
  ok: boolean;
  from: ConversationPhase;
  to: ConversationPhase;
  reason?: string;
};

export type InitializeConversationStateInput = {
  workspaceId: string;
  conversationId: string;
  customerId?: string | null;
  customerName?: string | null;
  aiState: WhatsappAiState;
  historyMessages: Array<{ direction: string; sender_type: string | null; text: string | null }>;
  now?: Date;
};

export type UpdateConversationStateAfterReplyInput = {
  state: ConversationAiStateRecord;
  intent: string;
  replyText: string;
  greetingAllowed: boolean;
  greetingWasSent: boolean;
  collectedInformation?: CollectedInformationMap;
  newQuestionKeys?: QuestionSemanticKey[];
  selectedEntity?: SelectedEntity | null;
  catalogContext?: CatalogContext | null;
  messageId?: string | null;
  now?: Date;
};

export type UpdateConversationStateAfterHandoffInput = {
  state: ConversationAiStateRecord;
  handoffReason: string;
  succeeded: boolean;
  now?: Date;
};
