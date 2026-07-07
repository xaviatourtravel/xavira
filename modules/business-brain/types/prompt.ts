import type { AIAction } from "@/modules/ai/action-engine/types";
import type { LeadQualificationSnapshot } from "@/modules/ai/types/lead-qualification";
import type { RetrievedBusinessBrainContext } from "@/modules/ai/types/context-retrieval";
import type { ConversationMemoryPromptItem } from "@/modules/ai/types/memory";

export type { ConversationMemoryPromptItem };
export type { AIAction };

export type WhatsAppConversationTurn = {
  sender: "customer" | "human" | "ai";
  text: string;
  createdAt?: string;
};

export type WhatsAppSalesPromptParams = {
  workspaceName: string;
  customerMessage: string;
  conversationHistory: WhatsAppConversationTurn[];
  retrievedContext: RetrievedBusinessBrainContext;
  conversationMemory?: ConversationMemoryPromptItem[];
  leadQualification?: LeadQualificationSnapshot | null;
  timezone?: string | null;
};

export type WhatsAppDocumentActionType = "SEND_DOCUMENT";

export type WhatsAppDocumentAction = {
  documentId: string;
  action: WhatsAppDocumentActionType;
  reason: string;
  confidence: number;
};

export type WhatsAppSalesLlmOutputContract = {
  reply: string;
  handoffRequired: boolean;
  handoffReason: string | null;
  confidence: number;
  suggestedActions: string[];
  usedSources: string[];
  /** @deprecated Prefer `actions`. Kept for backward-compatible parsing. */
  documentActions: WhatsAppDocumentAction[];
  /** Recommended actions for the Action Engine (LLM never executes these). */
  actions: AIAction[];
};

export type WhatsAppSalesPromptBundle = {
  systemPrompt: string;
  userPrompt: string;
  sanitizedContext: RetrievedBusinessBrainContext;
  usedSourceCatalog: string[];
  outputContract: WhatsAppSalesLlmOutputContract;
};
