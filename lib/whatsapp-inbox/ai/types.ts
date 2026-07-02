import type { WhatsappAiState, WhatsappConversationRow } from "@/types/whatsapp-inbox";
import type { AiWorkspaceProfile } from "@/lib/whatsapp-inbox/ai/workspace-profile";

export type AiEventType =
  | "AI_INTENT_CLASSIFIED"
  | "AI_REPLY_SENT"
  | "AI_HANDOFF_TRIGGERED"
  | "AI_SKIPPED"
  | "AI_STATE_CHANGED";

export type AiIntentClassification = {
  intent: string;
  requiresHuman: boolean;
  reason?: string;
  confidence: number;
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
};

export type { WhatsappAiState };
