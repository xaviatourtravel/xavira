import type { ConversationPhase, StateTransitionResult } from "@/modules/ai/conversation-state/types";

const ALLOWED_TRANSITIONS: Record<ConversationPhase, ConversationPhase[]> = {
  NEW: ["ENGAGED", "HUMAN_ACTIVE", "AI_PAUSED", "CLOSED"],
  ENGAGED: [
    "QUALIFYING",
    "READY_FOR_HANDOFF",
    "HANDED_OFF",
    "HUMAN_ACTIVE",
    "AI_PAUSED",
    "CLOSED",
  ],
  QUALIFYING: [
    "READY_FOR_HANDOFF",
    "HANDED_OFF",
    "HUMAN_ACTIVE",
    "AI_PAUSED",
    "CLOSED",
  ],
  READY_FOR_HANDOFF: ["HANDED_OFF", "HUMAN_ACTIVE", "AI_PAUSED", "CLOSED"],
  HANDED_OFF: ["HUMAN_ACTIVE", "AI_PAUSED", "CLOSED"],
  HUMAN_ACTIVE: ["ENGAGED", "QUALIFYING", "AI_PAUSED", "CLOSED"],
  AI_PAUSED: ["ENGAGED", "QUALIFYING", "HUMAN_ACTIVE", "CLOSED"],
  CLOSED: [],
};

export function canTransitionConversationPhase(
  from: ConversationPhase,
  to: ConversationPhase,
): boolean {
  if (from === to) {
    return true;
  }

  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function transitionConversationPhase(
  from: ConversationPhase,
  to: ConversationPhase,
): StateTransitionResult {
  if (from === to) {
    return { ok: true, from, to };
  }

  if (!canTransitionConversationPhase(from, to)) {
    return {
      ok: false,
      from,
      to,
      reason: `invalid_transition:${from}->${to}`,
    };
  }

  return { ok: true, from, to };
}

export function resolvePhaseFromAiState(aiState: string): ConversationPhase {
  switch (aiState) {
    case "READY_FOR_HUMAN":
      return "READY_FOR_HANDOFF";
    case "HUMAN_ASSISTED":
    case "HUMAN_ONLY":
      return "HUMAN_ACTIVE";
    case "AI_ACTIVE":
    default:
      return "ENGAGED";
  }
}

export function resolveNextPhaseAfterInbound(
  currentPhase: ConversationPhase,
  hasPriorBusinessReplies: boolean,
): ConversationPhase {
  if (currentPhase === "NEW") {
    return hasPriorBusinessReplies ? "ENGAGED" : "ENGAGED";
  }

  return currentPhase;
}

export function resolveNextPhaseAfterReply(input: {
  currentPhase: ConversationPhase;
  handoffRequired: boolean;
  qualificationStage?: string | null;
}): ConversationPhase {
  if (input.handoffRequired) {
    return "READY_FOR_HANDOFF";
  }

  if (input.qualificationStage === "QUALIFYING" || input.qualificationStage === "QUALIFIED") {
    return input.currentPhase === "NEW" ? "QUALIFYING" : "QUALIFYING";
  }

  if (input.currentPhase === "NEW") {
    return "ENGAGED";
  }

  return input.currentPhase;
}
