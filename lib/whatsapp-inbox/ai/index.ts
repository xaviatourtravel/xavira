export {
  WHATSAPP_AI_STATES,
  WHATSAPP_MANUAL_AI_STATES,
  DEFAULT_WHATSAPP_AI_STATE,
  WHATSAPP_HUMAN_REPLY_COOLDOWN_MS,
  WHATSAPP_AI_DEBOUNCE_MS,
  WHATSAPP_AI_STATE_LABELS,
  formatWhatsappAiStateLabel,
  parseWhatsappAiState,
  resolveWhatsappAiState,
  isWhatsappAiAutoReplyEnabled,
  parseWhatsappManualAiState,
} from "@/lib/whatsapp-inbox/ai/constants";

export {
  WHATSAPP_AI_HANDOFF_REPLY,
  aiReplyService,
} from "@/lib/whatsapp-inbox/ai/reply-service";
export {
  aiLLMReplyService,
  WHATSAPP_AI_LLM_FALLBACK_REPLY,
} from "@/lib/whatsapp-inbox/ai/llm-reply-service";
export type {
  GenerateWhatsAppReplyInput,
  GenerateWhatsAppReplyResult,
} from "@/lib/whatsapp-inbox/ai/llm-reply-service";
export {
  formatWhatsappConversationHistoryForAi,
  loadWhatsappConversationHistoryForAi,
  loadWhatsappConversationMessagesForGreeting,
  shouldUseGreeting,
  isCustomerGreetingMessage,
  WHATSAPP_AI_HISTORY_LIMIT,
  WHATSAPP_GREETING_INACTIVITY_MS,
} from "@/lib/whatsapp-inbox/ai/conversation-history";

export {
  getWorkspaceDisplayName,
  loadAiWorkspaceProfile,
  sanitizeAiReplyBranding,
  customerAskedAboutDesklabsPlatform,
} from "@/lib/whatsapp-inbox/ai/workspace-profile";
export type { AiWorkspaceProfile } from "@/lib/whatsapp-inbox/ai/workspace-profile";

export type {
  AiEventType,
  AiIntentClassification,
  AiCustomerContext,
  AiReplyInput,
  ShouldAutoReplyResult,
  AiHandoffInput,
  AiPipelineInput,
  AiStateUpdateOptions,
  WhatsappAiState,
} from "@/lib/whatsapp-inbox/ai/types";

export { insertAiEvent } from "@/lib/whatsapp-inbox/ai/event-log";
export { aiOwnershipService } from "@/lib/whatsapp-inbox/ai/ownership-service";
export { intentClassifierService } from "@/lib/whatsapp-inbox/ai/intent-classifier-service";
export { aiHandoffService } from "@/lib/whatsapp-inbox/ai/handoff-service";
export { sendAiWhatsappMessage } from "@/lib/whatsapp-inbox/ai/message-sender";
export {
  processWhatsappAiMessagePipeline,
  scheduleWhatsappAiMessagePipeline,
  scheduleWhatsappAiAutoReply,
} from "@/lib/whatsapp-inbox/ai/message-pipeline";
