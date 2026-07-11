import {
  resolveAnsweredQuestionKeys,
  resolveUnansweredQuestionKeys,
  inferQuestionKeysFromReply,
} from "@/modules/ai/conversation-state/collected-information";
import { getGreetingDecision } from "@/modules/ai/conversation-state/greeting-decision";
import { detectOpeningGreeting } from "@/modules/ai/conversation-state/greeting-guard";
import { mergeQuestionKeys } from "@/modules/ai/conversation-state/question-tracking";
import type { ConversationStatePromptContext } from "@/modules/ai/conversation-state/types";
import type { NormalizedPlanningInput } from "@/modules/ai/response-planner/types";
import type { ResponsePlan } from "@/modules/ai/response-planner/types";
import type { BusinessBrainContext } from "@/modules/business-brain/types/context";
import type {
  PlaygroundPersistedConversationState,
} from "@/modules/business-brain/types/playground-session-state";
import type { RetrievedBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import type { ConversationMemoryMap } from "@/modules/ai/types/memory";
import type { LeadQualificationSnapshot } from "@/modules/ai/types/lead-qualification";
import type { WhatsAppConversationTurn } from "@/modules/business-brain/types/prompt";

export type PlaygroundSessionState = PlaygroundPersistedConversationState & {
  workspaceId: string;
  sessionId: string;
};

export function toPlaygroundSessionState(input: {
  workspaceId: string;
  sessionId: string;
  state: PlaygroundPersistedConversationState;
}): PlaygroundSessionState {
  return {
    workspaceId: input.workspaceId,
    sessionId: input.sessionId,
    ...input.state,
  };
}

export function buildPlaygroundStatePromptContext(input: {
  session: PlaygroundSessionState;
  hasPriorBusinessReplies: boolean;
  incomingMessage: string;
  qualification: LeadQualificationSnapshot | null;
}): ConversationStatePromptContext {
  const snapshot = {
    greetingSent: input.session.greetingSent,
    businessIntroductionSent: false,
    customerName: null,
    currentIntent: input.session.currentIntent,
    currentPhase: input.hasPriorBusinessReplies || input.session.greetingSent ? "QUALIFYING" as const : "NEW" as const,
    qualificationStage: null,
    collectedInformation: input.session.collectedInformation,
    questionsAsked: input.session.questionsAsked,
    selectedEntity: input.session.selectedEntity,
    catalogContext: input.session.catalogContext,
    handoffRequested: input.session.handoffRequested,
    handoffReason: null,
    handoffAt: null,
    aiPaused: false,
    lastAiReplyAt: null,
    lastCustomerMessageAt: null,
    stateVersion: 1,
  };

  const greetingDecision = getGreetingDecision({
    conversationState: snapshot,
    hasPriorBusinessReplies: input.hasPriorBusinessReplies,
    incomingMessage: input.incomingMessage,
    aiState: "AI_ACTIVE",
  });

  const answeredQuestionKeys = resolveAnsweredQuestionKeys({
    collectedInformation: input.session.collectedInformation,
    qualification: input.qualification,
  });

  const unansweredQuestionKeys = resolveUnansweredQuestionKeys({
    answeredQuestionKeys,
    questionsAsked: input.session.questionsAsked,
    qualification: input.qualification,
  });

  return {
    conversationState: snapshot,
    greetingAllowed: greetingDecision.allowed,
    greetingReason: greetingDecision.reason,
    currentPhase: snapshot.currentPhase,
    collectedInformation: input.session.collectedInformation,
    questionsAsked: input.session.questionsAsked,
    answeredQuestionKeys,
    unansweredQuestionKeys,
    handoffState: input.session.handoffRequested ? "requested" : "none",
    aiPaused: false,
    hasPriorBusinessReplies: input.hasPriorBusinessReplies,
  };
}

export function updatePlaygroundSessionAfterReply(input: {
  session: PlaygroundSessionState;
  intent: string;
  replyText: string;
  responsePlan: ResponsePlan | null;
  usePlanQuestionKeys: boolean;
  customerMemory?: ConversationMemoryMap;
  simulatedAttachments?: PlaygroundSessionState["simulatedAttachments"];
}): PlaygroundSessionState {
  return {
    ...input.session,
    currentIntent: input.intent,
    selectedEntity: input.responsePlan?.selectedEntity ?? input.session.selectedEntity,
    catalogContext: input.responsePlan?.catalogContext ?? input.session.catalogContext,
    questionsAsked:
      input.usePlanQuestionKeys && input.responsePlan?.followUpQuestionKey
        ? mergeQuestionKeys(input.session.questionsAsked, [input.responsePlan.followUpQuestionKey])
        : mergeQuestionKeys(
            input.session.questionsAsked,
            inferQuestionKeysFromReply(input.replyText),
          ),
    greetingSent: input.session.greetingSent || detectOpeningGreeting(input.replyText),
    handoffRequested: input.responsePlan?.handoffRequired ?? input.session.handoffRequested,
    customerMemory: input.customerMemory ?? input.session.customerMemory,
    simulatedAttachments: input.simulatedAttachments ?? input.session.simulatedAttachments,
  };
}

export function buildPlaygroundPlanningInput(input: {
  workspaceId: string;
  session: PlaygroundSessionState;
  latestMessage: string;
  recentHistory: WhatsAppConversationTurn[];
  intent: string;
  conversationStateContext: ConversationStatePromptContext | null;
  publishedBusinessBrain: BusinessBrainContext;
  retrievedContext: RetrievedBusinessBrainContext;
  memory: ConversationMemoryMap;
  qualification: LeadQualificationSnapshot | null;
  timezone?: string | null;
}): NormalizedPlanningInput {
  return {
    workspaceId: input.workspaceId,
    mode: "playground",
    latestMessage: input.latestMessage,
    recentHistory: input.recentHistory,
    intent: input.intent,
    conversationState: {
      greetingSent: input.session.greetingSent,
      collectedInformation: input.session.collectedInformation,
      questionsAsked: input.session.questionsAsked,
      selectedEntity: input.session.selectedEntity,
      catalogContext: input.session.catalogContext,
      currentIntent: input.session.currentIntent,
      handoffRequested: input.session.handoffRequested,
    },
    conversationStateContext: input.conversationStateContext,
    publishedBusinessBrain: input.publishedBusinessBrain,
    retrievedContext: input.retrievedContext,
    customerContext: {
      memory: input.memory,
      qualification: input.qualification,
    },
    includeDraft: true,
    timezone: input.timezone,
  };
}

export function buildLivePlanningInput(input: {
  workspaceId: string;
  latestMessage: string;
  recentHistory: WhatsAppConversationTurn[];
  intent: string;
  conversationState: import("@/modules/ai/conversation-state/types").ConversationAiStateRecord | null;
  conversationStateContext: ConversationStatePromptContext | null;
  selectedEntity: import("@/modules/ai/response-planner/types").SelectedEntity | null;
  publishedBusinessBrain: BusinessBrainContext;
  retrievedContext: RetrievedBusinessBrainContext;
  memory: ConversationMemoryMap;
  qualification: LeadQualificationSnapshot | null;
  timezone?: string | null;
}): NormalizedPlanningInput {
  return {
    workspaceId: input.workspaceId,
    mode: "live",
    latestMessage: input.latestMessage,
    recentHistory: input.recentHistory,
    intent: input.intent,
    conversationState: input.conversationState
      ? {
          greetingSent: input.conversationState.greetingSent,
          collectedInformation: input.conversationState.collectedInformation,
          questionsAsked: input.conversationState.questionsAsked,
          selectedEntity: input.selectedEntity,
          catalogContext: input.conversationState?.catalogContext ?? null,
          currentIntent: input.conversationState.currentIntent,
          handoffRequested: input.conversationState.handoffRequested,
        }
      : null,
    conversationStateContext: input.conversationStateContext,
    publishedBusinessBrain: input.publishedBusinessBrain,
    retrievedContext: input.retrievedContext,
    customerContext: {
      memory: input.memory,
      qualification: input.qualification,
    },
    includeDraft: false,
    timezone: input.timezone,
  };
}
