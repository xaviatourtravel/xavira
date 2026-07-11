export { CONVERSATION_AI_STATE_VERSION } from "@/modules/ai/conversation-state/types";
export type {
  ConversationAiStateRecord,
  ConversationAiStateSnapshot,
  ConversationPhase,
  ConversationStatePromptContext,
  GreetingDecision,
  GreetingGuardResult,
} from "@/modules/ai/conversation-state/types";
export {
  isConversationStateV1Enabled,
  parseConversationStateV1Flag,
} from "@/modules/ai/conversation-state/feature-flag";
export { getGreetingDecision } from "@/modules/ai/conversation-state/greeting-decision";
export {
  applyGreetingGuard,
  detectOpeningGreeting,
  stripForbiddenOpeningGreeting,
} from "@/modules/ai/conversation-state/greeting-guard";
export {
  canTransitionConversationPhase,
  transitionConversationPhase,
} from "@/modules/ai/conversation-state/state-machine";
export { conversationStateService } from "@/modules/ai/conversation-state/service";
