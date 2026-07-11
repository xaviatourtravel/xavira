import { conversationAiStateRepository } from "@/modules/ai/conversation-state/repository";
import { buildInitialConversationState } from "@/modules/ai/conversation-state/backfill";
import {
  buildCollectedInformationFromMemory,
  listCollectedInformationKeys,
  mergeCollectedInformation,
  resolveAnsweredQuestionKeys,
  resolveUnansweredQuestionKeys,
  inferQuestionKeysFromReply,
} from "@/modules/ai/conversation-state/collected-information";
import { getGreetingDecision } from "@/modules/ai/conversation-state/greeting-decision";
import { mergeQuestionKeys } from "@/modules/ai/conversation-state/question-tracking";
import {
  resolveNextPhaseAfterReply,
  transitionConversationPhase,
} from "@/modules/ai/conversation-state/state-machine";
import type {
  ConversationAiStateRecord,
  ConversationAiStateSnapshot,
  ConversationStatePromptContext,
  InitializeConversationStateInput,
  UpdateConversationStateAfterHandoffInput,
  UpdateConversationStateAfterReplyInput,
} from "@/modules/ai/conversation-state/types";
import {
  detectBusinessIntroduction,
  detectOpeningGreeting,
} from "@/modules/ai/conversation-state/greeting-guard";
import type { ResponsePlan } from "@/modules/ai/response-planner/types";
import type { SelectedEntity } from "@/modules/ai/response-planner/types";
import type { ConversationMemoryMap } from "@/modules/ai/types/memory";
import type { LeadQualificationSnapshot } from "@/modules/ai/types/lead-qualification";
import type { WhatsappAiState } from "@/types/whatsapp-inbox";
import type { WhatsappSupabaseClient } from "@/lib/whatsapp-inbox/repository";

function toSnapshot(state: ConversationAiStateRecord): ConversationAiStateSnapshot {
  return {
    greetingSent: state.greetingSent,
    businessIntroductionSent: state.businessIntroductionSent,
    customerName: state.customerName,
    currentIntent: state.currentIntent,
    currentPhase: state.currentPhase,
    qualificationStage: state.qualificationStage,
    collectedInformation: state.collectedInformation,
    questionsAsked: state.questionsAsked,
    selectedEntity: state.selectedEntity,
    catalogContext: state.catalogContext,
    handoffRequested: state.handoffRequested,
    handoffReason: state.handoffReason,
    handoffAt: state.handoffAt,
    aiPaused: state.aiPaused,
    lastAiReplyAt: state.lastAiReplyAt,
    lastCustomerMessageAt: state.lastCustomerMessageAt,
    stateVersion: state.stateVersion,
  };
}

export const conversationStateService = {
  async loadOrInitialize(
    supabase: WhatsappSupabaseClient,
    input: InitializeConversationStateInput,
  ): Promise<ConversationAiStateRecord> {
    const existing = await conversationAiStateRepository.findByConversation(
      supabase,
      input.workspaceId,
      input.conversationId,
    );

    if (existing) {
      return existing;
    }

    const initial = buildInitialConversationState(input);
    const persisted = await conversationAiStateRepository.upsert(supabase, initial);
    if (persisted) {
      return persisted;
    }

    return {
      id: "ephemeral",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastStateTransitionAt: new Date().toISOString(),
      ...initial,
    };
  },

  async touchInboundMessage(
    supabase: WhatsappSupabaseClient,
    state: ConversationAiStateRecord,
    now = new Date(),
  ): Promise<ConversationAiStateRecord> {
    const updated = {
      ...state,
      lastCustomerMessageAt: now.toISOString(),
    };

    const persisted = await conversationAiStateRepository.upsert(supabase, updated);
    return persisted ?? updated;
  },

  buildPromptContext(input: {
    state: ConversationAiStateRecord;
    hasPriorBusinessReplies: boolean;
    incomingMessage: string;
    aiState: WhatsappAiState;
    qualification?: LeadQualificationSnapshot | null;
  }): ConversationStatePromptContext {
    const greetingDecision = getGreetingDecision({
      conversationState: toSnapshot(input.state),
      hasPriorBusinessReplies: input.hasPriorBusinessReplies,
      incomingMessage: input.incomingMessage,
      aiState: input.aiState,
    });

    const answeredQuestionKeys = resolveAnsweredQuestionKeys({
      collectedInformation: input.state.collectedInformation,
      qualification: input.qualification,
    });

    const unansweredQuestionKeys = resolveUnansweredQuestionKeys({
      answeredQuestionKeys,
      questionsAsked: input.state.questionsAsked,
      qualification: input.qualification,
    });

    const handoffState = input.state.handoffRequested
      ? input.state.currentPhase === "HANDED_OFF"
        ? "completed"
        : "requested"
      : "none";

    return {
      conversationState: toSnapshot(input.state),
      greetingAllowed: greetingDecision.allowed,
      greetingReason: greetingDecision.reason,
      currentPhase: input.state.currentPhase,
      collectedInformation: input.state.collectedInformation,
      questionsAsked: input.state.questionsAsked,
      answeredQuestionKeys,
      unansweredQuestionKeys,
      handoffState,
      aiPaused: input.state.aiPaused,
      hasPriorBusinessReplies: input.hasPriorBusinessReplies,
    };
  },

  async updateAfterSuccessfulReply(
    supabase: WhatsappSupabaseClient,
    input: UpdateConversationStateAfterReplyInput & {
      responsePlan?: ResponsePlan | null;
      usePlanQuestionKeys?: boolean;
    },
  ): Promise<{
    state: ConversationAiStateRecord;
    transitionFrom: string;
    transitionTo: string;
    greetingSentBefore: boolean;
    greetingMarkedSent: boolean;
  }> {
    const now = input.now ?? new Date();
    const greetingSentBefore = input.state.greetingSent;
    const greetingMarkedSent =
      input.greetingAllowed &&
      (input.greetingWasSent ||
        detectOpeningGreeting(input.replyText) ||
        input.state.greetingSent);

    const mergedCollected = mergeCollectedInformation(
      input.state.collectedInformation,
      input.collectedInformation ?? {},
    );

    const nextPhase = resolveNextPhaseAfterReply({
      currentPhase: input.state.currentPhase,
      handoffRequired: false,
      qualificationStage: input.state.qualificationStage,
    });

    const transition = transitionConversationPhase(input.state.currentPhase, nextPhase);
    const targetPhase = transition.ok ? nextPhase : input.state.currentPhase;

    const questionKeys = input.usePlanQuestionKeys && input.responsePlan?.followUpQuestionKey
      ? mergeQuestionKeys(input.state.questionsAsked, [input.responsePlan.followUpQuestionKey])
      : mergeQuestionKeys(
          input.state.questionsAsked,
          input.newQuestionKeys ?? inferQuestionKeysFromReply(input.replyText),
        );

    const updated: ConversationAiStateRecord = {
      ...input.state,
      greetingSent: greetingMarkedSent || input.state.greetingSent,
      businessIntroductionSent:
        input.state.businessIntroductionSent ||
        detectBusinessIntroduction(input.replyText),
      currentIntent: input.intent,
      currentPhase: targetPhase,
      collectedInformation: mergedCollected,
      questionsAsked: questionKeys,
      selectedEntity: input.selectedEntity ?? input.responsePlan?.selectedEntity ?? input.state.selectedEntity,
      catalogContext:
        input.catalogContext ??
        input.responsePlan?.catalogContext ??
        input.state.catalogContext,
      lastAiReplyAt: now.toISOString(),
      lastStateTransitionAt: transition.ok && transition.from !== transition.to
        ? now.toISOString()
        : input.state.lastStateTransitionAt,
      stateVersion: input.state.stateVersion + 1,
      updatedAt: now.toISOString(),
    };

    const persisted = await conversationAiStateRepository.upsert(supabase, updated);

    return {
      state: persisted ?? updated,
      transitionFrom: input.state.currentPhase,
      transitionTo: targetPhase,
      greetingSentBefore,
      greetingMarkedSent: updated.greetingSent,
    };
  },

  async updateAfterHandoff(
    supabase: WhatsappSupabaseClient,
    input: UpdateConversationStateAfterHandoffInput,
  ): Promise<ConversationAiStateRecord> {
    const now = input.now ?? new Date();
    const targetPhase = input.succeeded ? "HANDED_OFF" : "READY_FOR_HANDOFF";
    const transition = transitionConversationPhase(input.state.currentPhase, targetPhase);
    const nextPhase = transition.ok ? targetPhase : input.state.currentPhase;

    const updated: ConversationAiStateRecord = {
      ...input.state,
      handoffRequested: true,
      handoffReason: input.handoffReason,
      handoffAt: now.toISOString(),
      currentPhase: nextPhase,
      lastStateTransitionAt:
        transition.ok && transition.from !== transition.to
          ? now.toISOString()
          : input.state.lastStateTransitionAt,
      stateVersion: input.state.stateVersion + 1,
      updatedAt: now.toISOString(),
    };

    const persisted = await conversationAiStateRepository.upsert(supabase, updated);
    return persisted ?? updated;
  },

  mergeMemoryIntoState(
    state: ConversationAiStateRecord,
    memory: ConversationMemoryMap,
    sourceMessageId: string | null,
    now = new Date(),
  ): ConversationAiStateRecord {
    const incoming = buildCollectedInformationFromMemory(memory, sourceMessageId, now);
    return {
      ...state,
      collectedInformation: mergeCollectedInformation(state.collectedInformation, incoming),
    };
  },

  buildObservabilityMetadata(input: {
    state: ConversationAiStateRecord;
    promptContext: ConversationStatePromptContext;
    greetingDetectedInGeneratedReply?: boolean;
    greetingRemoved?: boolean;
    transitionFrom?: string;
    transitionTo?: string;
  }) {
    return {
      conversationStateVersion: input.state.stateVersion,
      conversationPhase: input.state.currentPhase,
      greetingAllowed: input.promptContext.greetingAllowed,
      greetingReason: input.promptContext.greetingReason,
      greetingSentBefore: input.state.greetingSent,
      greetingDetectedInGeneratedReply: input.greetingDetectedInGeneratedReply ?? false,
      greetingRemoved: input.greetingRemoved ?? false,
      stateTransitionFrom: input.transitionFrom ?? null,
      stateTransitionTo: input.transitionTo ?? null,
      collectedInformationKeys: listCollectedInformationKeys(input.state.collectedInformation),
      questionKeysAsked: input.state.questionsAsked,
      handoffState: input.promptContext.handoffState,
    };
  },
};
