import {
  isAIActionType,
  type AIActionRecord,
  type AIActionStatus,
  type AIActionType,
} from "@/modules/ai/action-engine/types";
import type { WhatsappSupabaseClient } from "@/lib/whatsapp-inbox/repository";

export type InboxAiActionItem = AIActionRecord & {
  documentName: string | null;
  handoffReason: string | null;
  displayReason: string | null;
};

type AiActionRow = {
  id: string;
  workspace_id: string;
  conversation_id: string;
  action_type: string;
  status: string;
  confidence: number;
  reason: string | null;
  payload: Record<string, unknown> | null;
  executed_at: string | null;
  created_at: string;
};

const ACTION_TYPE_LABELS: Record<AIActionType, string> = {
  SEND_DOCUMENT: "Send Document",
  HANDOVER: "Handover",
  CREATE_LEAD_NOTE: "Create Lead Note",
  UPDATE_MEMORY: "Update Memory",
  UPDATE_LEAD_PROGRESS: "Update Lead Progress",
  SUGGEST_PACKAGE: "Suggest Package",
  ASK_QUALIFICATION: "Ask Qualification",
  NO_ACTION: "No Action",
};

function isActionStatus(value: string): value is AIActionStatus {
  return (
    value === "PENDING" ||
    value === "APPROVED" ||
    value === "REJECTED" ||
    value === "EXECUTED" ||
    value === "FAILED"
  );
}

function readPayloadString(
  payload: Record<string, unknown> | null,
  key: string,
): string | null {
  if (!payload) return null;
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function mapRow(row: AiActionRow, documentName: string | null): InboxAiActionItem {
  const actionType = isAIActionType(row.action_type)
    ? row.action_type
    : ("NO_ACTION" as AIActionType);
  const status = isActionStatus(row.status) ? row.status : "PENDING";
  const payload = row.payload ?? {};
  const handoffReason =
    actionType === "HANDOVER"
      ? readPayloadString(payload, "handoffReason")
      : null;

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    conversationId: row.conversation_id,
    actionType,
    status,
    confidence: Number(row.confidence) || 0,
    reason: row.reason,
    payload,
    executedAt: row.executed_at,
    createdAt: row.created_at,
    documentName,
    handoffReason,
    displayReason: row.reason,
  };
}

export function formatAiActionTypeLabel(type: AIActionType): string {
  return ACTION_TYPE_LABELS[type] ?? type;
}

export function formatAiActionConfidence(confidence: number): string {
  const normalized = confidence > 1 ? confidence : confidence * 100;
  return `${Math.round(normalized)}%`;
}

export async function loadConversationAiActions(
  supabase: WhatsappSupabaseClient,
  conversationId: string,
  limit = 30,
): Promise<InboxAiActionItem[]> {
  const { data, error } = await supabase
    .from("ai_actions")
    .select(
      "id, workspace_id, conversation_id, action_type, status, confidence, reason, payload, executed_at, created_at",
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[AI_ACTIONS] failed to load actions", {
      conversationId,
      error: error.message,
    });
    return [];
  }

  const rows = (data ?? []) as AiActionRow[];
  const documentIds = [
    ...new Set(
      rows
        .map((row) => {
          if (row.action_type !== "SEND_DOCUMENT") return null;
          return readPayloadString(row.payload, "documentId");
        })
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const documentNames = new Map<string, string>();

  if (documentIds.length > 0) {
    const { data: documents } = await supabase
      .from("brain_documents")
      .select("id, name")
      .in("id", documentIds);

    for (const document of documents ?? []) {
      documentNames.set(
        document.id,
        document.name?.trim() || "Untitled Document",
      );
    }
  }

  return rows.map((row) => {
    const documentId =
      row.action_type === "SEND_DOCUMENT"
        ? readPayloadString(row.payload, "documentId")
        : null;
    return mapRow(row, documentId ? documentNames.get(documentId) ?? null : null);
  });
}
