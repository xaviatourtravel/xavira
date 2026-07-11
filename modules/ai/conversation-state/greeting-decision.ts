import type { WhatsappAiState } from "@/types/whatsapp-inbox";
import type {
  ConversationAiStateSnapshot,
  GreetingDecision,
  GreetingType,
} from "@/modules/ai/conversation-state/types";

export type GetGreetingDecisionInput = {
  conversationState: ConversationAiStateSnapshot;
  hasPriorBusinessReplies: boolean;
  incomingMessage: string;
  aiState: WhatsappAiState;
  currentTime?: Date;
};

const ENGLISH_GREETING_PATTERN =
  /^(hello|hi|hey|good\s+(morning|afternoon|evening)|dear)\b/i;
const INDONESIAN_GREETING_PATTERN =
  /^(halo|hai|selamat\s+(pagi|siang|sore|malam)|pagi\s+kak|siang\s+kak|sore\s+kak|malam\s+kak)\b/i;
const ISLAMIC_GREETING_PATTERN = /^(assalamu['’]?alaikum|salam)\b/i;

export function detectGreetingType(messageText: string): GreetingType {
  const normalized = messageText.trim();
  if (!normalized) {
    return null;
  }

  if (ISLAMIC_GREETING_PATTERN.test(normalized)) {
    return "islamic";
  }
  if (ENGLISH_GREETING_PATTERN.test(normalized)) {
    return "english";
  }
  if (INDONESIAN_GREETING_PATTERN.test(normalized)) {
    return "indonesian";
  }

  return "generic";
}

/**
 * Deterministic greeting eligibility.
 * Once greeting_sent or prior business replies exist, greeting is blocked.
 */
export function getGreetingDecision(input: GetGreetingDecisionInput): GreetingDecision {
  const { conversationState, hasPriorBusinessReplies, aiState } = input;

  if (conversationState.greetingSent) {
    return { allowed: false, reason: "greeting_already_sent", greetingType: null };
  }

  if (hasPriorBusinessReplies) {
    return { allowed: false, reason: "prior_business_reply_exists", greetingType: null };
  }

  if (conversationState.businessIntroductionSent) {
    return {
      allowed: false,
      reason: "business_introduction_already_sent",
      greetingType: null,
    };
  }

  if (conversationState.handoffRequested || conversationState.currentPhase === "HANDED_OFF") {
    return { allowed: false, reason: "handoff_active", greetingType: null };
  }

  if (
    conversationState.currentPhase === "HUMAN_ACTIVE" ||
    conversationState.currentPhase === "AI_PAUSED" ||
    conversationState.aiPaused
  ) {
    return { allowed: false, reason: "human_or_paused_state", greetingType: null };
  }

  if (aiState === "READY_FOR_HUMAN" || aiState === "HUMAN_ASSISTED" || aiState === "HUMAN_ONLY") {
    return { allowed: false, reason: "ownership_not_ai_active", greetingType: null };
  }

  if (conversationState.currentPhase !== "NEW") {
    return { allowed: false, reason: "conversation_already_engaged", greetingType: null };
  }

  return {
    allowed: true,
    reason: "first_interaction",
    greetingType: detectGreetingType(input.incomingMessage),
  };
}
