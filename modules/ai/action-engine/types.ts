import type { LeadQualificationSnapshot } from "@/modules/ai/types/lead-qualification";
import type { ConversationMemoryMap } from "@/modules/ai/types/memory";
import type { WhatsappConversationRow } from "@/types/whatsapp-inbox";
import type { WhatsappSupabaseClient } from "@/lib/whatsapp-inbox/repository";

export const AI_ACTION_TYPES = [
  "SEND_DOCUMENT",
  "HANDOVER",
  "CREATE_LEAD_NOTE",
  "UPDATE_MEMORY",
  "UPDATE_LEAD_PROGRESS",
  "SUGGEST_PACKAGE",
  "ASK_QUALIFICATION",
  "NO_ACTION",
] as const;

export type AIActionType = (typeof AI_ACTION_TYPES)[number];

export type AIAction = {
  type: AIActionType;
  payload: Record<string, unknown>;
  confidence: number;
  reason: string;
};

export const AI_ACTION_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXECUTED",
  "FAILED",
] as const;

export type AIActionStatus = (typeof AI_ACTION_STATUSES)[number];

export type AIActionRecord = {
  id: string;
  workspaceId: string;
  conversationId: string;
  actionType: AIActionType;
  status: AIActionStatus;
  confidence: number;
  reason: string | null;
  payload: Record<string, unknown>;
  executedAt: string | null;
  createdAt: string;
};

export type ActionValidationResult =
  | { approved: true; requiresApproval: boolean }
  | { approved: false; reason: string; code: string };

export type ActionExecutionResult =
  | { success: true; metadata?: Record<string, unknown> }
  | { success: false; reason: string; code: string };

export type ActionEngineContext = {
  supabase: WhatsappSupabaseClient;
  workspaceId: string;
  conversation: WhatsappConversationRow;
  incomingMessageId?: string | null;
  messageText?: string | null;
  leadQualification?: LeadQualificationSnapshot | null;
  conversationMemory?: ConversationMemoryMap | null;
  /** Optional handoff message override (e.g. qualification handoff copy). */
  handoffText?: string | null;
};

export type ActionProcessResult = {
  action: AIAction;
  actionId: string | null;
  status: AIActionStatus;
  validationReason?: string;
  executionMetadata?: Record<string, unknown>;
  error?: string;
};

export function isAIActionType(value: string): value is AIActionType {
  return (AI_ACTION_TYPES as readonly string[]).includes(value);
}

export function normalizeActionConfidence(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return value > 1 ? value / 100 : value;
}
