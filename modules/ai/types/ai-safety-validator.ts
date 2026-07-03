import type { AIAction } from "@/modules/ai/action-engine/types";
import type { WhatsAppDocumentAction } from "@/modules/business-brain/types/prompt";
import type { BusinessBrainContext } from "@/modules/business-brain/types/context";

export type ValidateAIResponseParams = {
  reply: string;
  handoffRequired: boolean;
  handoffReason?: string | null;
  documentActions?: WhatsAppDocumentAction[];
  actions?: AIAction[];
  businessBrainContext: BusinessBrainContext;
  customerMessage: string;
  /** True when the conversation already has prior AI or human outgoing messages. */
  hasPriorBusinessReplies?: boolean;
  customerName?: string;
  companyName?: string;
};

export type ValidateAIResponseResult = {
  allowed: boolean;
  reason?: string;
  sanitizedReply?: string;
  forceHandoff?: boolean;
  sanitized?: boolean;
};

export const MAX_AI_REPLY_CHARACTERS = 800;
