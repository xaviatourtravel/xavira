import { detectOpeningGreeting, detectBusinessIntroduction } from "@/modules/ai/conversation-state/greeting-guard";
import { resolvePhaseFromAiState } from "@/modules/ai/conversation-state/state-machine";
import type {
  CollectedInformationMap,
  ConversationAiStateRecord,
  ConversationPhase,
  InitializeConversationStateInput,
  QuestionSemanticKey,
} from "@/modules/ai/conversation-state/types";

function isBusinessOutgoingMessage(message: {
  direction: string;
  sender_type: string | null;
}) {
  return (
    message.direction === "outgoing" &&
    (message.sender_type === "ai" || message.sender_type === "human")
  );
}

export function inferGreetingSentFromHistory(
  historyMessages: InitializeConversationStateInput["historyMessages"],
): boolean {
  for (const message of historyMessages) {
    if (!isBusinessOutgoingMessage(message)) continue;
    const text = message.text?.trim() ?? "";
    if (!text) continue;
    if (detectOpeningGreeting(text)) {
      return true;
    }
  }

  return false;
}

export function inferBusinessIntroductionSentFromHistory(
  historyMessages: InitializeConversationStateInput["historyMessages"],
): boolean {
  for (const message of historyMessages) {
    if (!isBusinessOutgoingMessage(message)) continue;
    const text = message.text?.trim() ?? "";
    if (!text) continue;
    if (detectBusinessIntroduction(text)) {
      return true;
    }
  }

  return false;
}

export function hasPriorBusinessRepliesFromHistory(
  historyMessages: InitializeConversationStateInput["historyMessages"],
): boolean {
  return historyMessages.some(isBusinessOutgoingMessage);
}

export function buildInitialConversationState(
  input: InitializeConversationStateInput,
): Omit<
  ConversationAiStateRecord,
  "id" | "createdAt" | "updatedAt" | "lastStateTransitionAt"
> {
  const now = (input.now ?? new Date()).toISOString();
  const hasPriorReplies = hasPriorBusinessRepliesFromHistory(input.historyMessages);
  const inferredGreeting = inferGreetingSentFromHistory(input.historyMessages);
  const inferredIntroduction = inferBusinessIntroductionSentFromHistory(
    input.historyMessages,
  );

  let currentPhase: ConversationPhase = "NEW";
  if (input.aiState === "READY_FOR_HUMAN") {
    currentPhase = "READY_FOR_HANDOFF";
  } else if (input.aiState === "HUMAN_ASSISTED" || input.aiState === "HUMAN_ONLY") {
    currentPhase = "HUMAN_ACTIVE";
  } else if (hasPriorReplies) {
    currentPhase = "ENGAGED";
  }

  return {
    workspaceId: input.workspaceId,
    conversationId: input.conversationId,
    greetingSent: hasPriorReplies ? inferredGreeting || true : inferredGreeting,
    businessIntroductionSent: inferredIntroduction,
    customerName: input.customerName?.trim() || null,
    currentIntent: null,
    currentPhase,
    qualificationStage: null,
    collectedInformation: {} as CollectedInformationMap,
    questionsAsked: [] as QuestionSemanticKey[],
    selectedEntity: null,
    catalogContext: null,
    handoffRequested: input.aiState === "READY_FOR_HUMAN",
    handoffReason: null,
    handoffAt: null,
    aiPaused: input.aiState === "HUMAN_ONLY",
    lastAiReplyAt: null,
    lastCustomerMessageAt: now,
    stateVersion: 1,
  };
}

export function resolveInitialPhaseFromOwnership(aiState: string): ConversationPhase {
  return resolvePhaseFromAiState(aiState);
}
