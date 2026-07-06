import type { WhatsappAiState, WhatsappConversationRow } from "@/types/whatsapp-inbox";
import type { AiWorkspaceProfile } from "@/lib/whatsapp-inbox/ai/workspace-profile";

export type AiEventType =
  | "AI_INTENT_CLASSIFIED"
  | "AI_REPLY_SENT"
  | "AI_HANDOFF_TRIGGERED"
  | "AI_SKIPPED"
  | "AI_STATE_CHANGED"
  | "AI_LLM_REPLY_STARTED"
  | "AI_LLM_REPLY_SENT"
  | "AI_LLM_HANDOFF"
  | "AI_LLM_FAILED"
  | "AI_LLM_SKIPPED"
  | "AI_DOCUMENT_SEND_ATTEMPTED"
  | "AI_DOCUMENT_SENT"
  | "AI_DOCUMENT_FAILED"
  | "AI_DOCUMENT_SKIPPED"
  | "AI_VALIDATION_PASSED"
  | "AI_VALIDATION_FAILED"
  | "AI_RESPONSE_SANITIZED"
  | "AI_REPLY_QUALITY_CHANGED"
  | "AI_REPLY_QUALITY_PASSED"
  | "CONTEXT_RETRIEVED"
  | "MEMORY_CREATED"
  | "MEMORY_UPDATED"
  | "MEMORY_USED"
  | "MEMORY_EXTRACTION_STARTED"
  | "MEMORY_EXTRACTION_COMPLETED"
  | "MEMORY_EXTRACTION_SKIPPED"
  | "LEAD_QUALIFICATION_UPDATED"
  | "ACTION_RECOMMENDED"
  | "ACTION_APPROVED"
  | "ACTION_REJECTED"
  | "ACTION_EXECUTED"
  | "ACTION_FAILED"
  | "ACTION_MANUALLY_APPROVED"
  | "ACTION_MANUALLY_REJECTED"
  | "ACTION_EXECUTED_AFTER_APPROVAL"
  | "ACTION_PERMISSION_BLOCKED"
  | "ACTION_PERMISSION_APPROVED"
  | "ACTION_RETRY_ATTEMPTED"
  | "ACTION_RETRY_SUCCEEDED"
  | "ACTION_RETRY_FAILED"
  | "ACTION_SCHEDULED"
  | "ACTION_SCHEDULE_EXECUTED"
  | "ACTION_SCHEDULE_CANCELLED"
  | "ACTION_EXECUTED_NOW"
  | "AI_FOLLOW_UP_SCHEDULED"
  | "AI_FOLLOW_UP_CANCELLED"
  | "AI_FOLLOW_UP_SENT"
  | "AI_FOLLOW_UP_SKIPPED";

export type AiIntentClassification = {
  intent: string;
  requiresHuman: boolean;
  reason?: string;
  confidence: number;
  category: string;
};

export type AiCustomerContext = {
  displayName: string;
  phoneNumber: string;
  leadId: string | null;
};

export type AiReplyInput = {
  intent: string;
  messageText: string;
  conversation: WhatsappConversationRow;
  customer: AiCustomerContext;
  workspace: AiWorkspaceProfile | null;
};

export type ShouldAutoReplyResult =
  | {
      allowed: true;
      conversation: WhatsappConversationRow;
    }
  | {
      allowed: false;
      reason: string;
      code: string;
      conversation?: WhatsappConversationRow;
    };

export type AiHandoffInput = {
  workspaceId: string;
  conversation: WhatsappConversationRow;
  incomingMessageId: string;
  intent: string;
  confidence: number;
  reason: string;
  handoffText?: string;
};

export type AiPipelineInput = {
  workspaceId: string;
  conversationId: string;
  incomingMessageIds: string[];
};

export type AiStateUpdateOptions = {
  handoffReason?: string | null;
  changedBy?: "system" | "user";
  userId?: string | null;
  source?: string;
};

export type { WhatsappAiState };
