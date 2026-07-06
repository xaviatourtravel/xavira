import {
  AI_ACTION_TYPES,
  isAIActionType,
  type AIActionStatus,
  type AIActionType,
} from "@/modules/ai/action-engine/types";
import { resolveWhatsappContactDisplay } from "@/lib/whatsapp-inbox/display";
import type { WhatsappSupabaseClient } from "@/lib/whatsapp-inbox/repository";

import {
  type InboxAiActionItem,
  mapAiActionRows,
  readPayloadString,
} from "@/modules/inbox/lib/load-ai-actions";

export type WorkspaceAiActionTab =
  | "pending"
  | "scheduled"
  | "executed"
  | "rejected"
  | "failed"
  | "all";

export type WorkspaceAiActionFilters = {
  tab?: WorkspaceAiActionTab;
  actionType?: AIActionType | "all";
  confidenceMin?: number;
  createdFrom?: string;
  createdTo?: string;
  limit?: number;
};

export type WorkspaceAiActionConversation = {
  id: string;
  customerName: string;
  phoneLabel: string | null;
  profilePictureUrl: string | null;
  leadId: string | null;
};

export type WorkspaceAiActionItem = InboxAiActionItem & {
  conversation: WorkspaceAiActionConversation;
  workspaceName: string | null;
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
  metadata: Record<string, unknown> | null;
  scheduled_for: string | null;
  executed_by_job: boolean | null;
  executed_at: string | null;
  created_at: string;
};

type ConversationRow = {
  id: string;
  contact_name: string | null;
  phone_number: string;
  profile_picture_url: string | null;
  customer_id: string | null;
};

const TAB_STATUS_MAP: Record<
  Exclude<WorkspaceAiActionTab, "all">,
  AIActionStatus
> = {
  pending: "PENDING",
  scheduled: "SCHEDULED",
  executed: "EXECUTED",
  rejected: "REJECTED",
  failed: "FAILED",
};

function isActionStatus(value: string): value is AIActionStatus {
  return (
    value === "PENDING" ||
    value === "APPROVED" ||
    value === "REJECTED" ||
    value === "EXECUTED" ||
    value === "FAILED" ||
    value === "SCHEDULED"
  );
}

function parseDateStart(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const date = new Date(`${value.trim()}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseDateEnd(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const date = new Date(`${value.trim()}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function parseWorkspaceAiActionFilters(input: {
  tab?: string;
  actionType?: string;
  confidenceMin?: string;
  createdFrom?: string;
  createdTo?: string;
}): WorkspaceAiActionFilters {
  const tab = input.tab?.trim().toLowerCase();
  const validTab: WorkspaceAiActionTab =
    tab === "scheduled" ||
    tab === "executed" ||
    tab === "rejected" ||
    tab === "failed" ||
    tab === "all"
      ? tab
      : "pending";

  const actionTypeRaw = input.actionType?.trim();
  const actionType =
    actionTypeRaw &&
    actionTypeRaw !== "all" &&
    isAIActionType(actionTypeRaw)
      ? actionTypeRaw
      : "all";

  const confidenceParsed = Number(input.confidenceMin);
  const confidenceMin =
    Number.isFinite(confidenceParsed) && confidenceParsed >= 0
      ? Math.min(1, confidenceParsed)
      : undefined;

  return {
    tab: validTab,
    actionType,
    confidenceMin,
    createdFrom: input.createdFrom?.trim() || undefined,
    createdTo: input.createdTo?.trim() || undefined,
  };
}

export function formatPayloadPreview(
  payload: Record<string, unknown>,
  maxLength = 240,
): string {
  if (!payload || Object.keys(payload).length === 0) {
    return "—";
  }

  try {
    const text = JSON.stringify(payload, null, 2);
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength).trimEnd()}…`;
  } catch {
    return "—";
  }
}

export async function loadWorkspaceAiActions(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  filters: WorkspaceAiActionFilters = {},
): Promise<WorkspaceAiActionItem[]> {
  const limit = filters.limit ?? 100;
  const tab = filters.tab ?? "pending";

  let query = supabase
    .from("ai_actions")
    .select(
      "id, workspace_id, conversation_id, action_type, status, confidence, reason, payload, metadata, scheduled_for, executed_by_job, executed_at, created_at",
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (tab !== "all") {
    query = query.eq("status", TAB_STATUS_MAP[tab]);
  }

  if (filters.actionType && filters.actionType !== "all") {
    query = query.eq("action_type", filters.actionType);
  }

  if (filters.confidenceMin !== undefined && filters.confidenceMin > 0) {
    query = query.gte("confidence", filters.confidenceMin);
  }

  const createdFrom = parseDateStart(filters.createdFrom);
  if (createdFrom) {
    query = query.gte("created_at", createdFrom);
  }

  const createdTo = parseDateEnd(filters.createdTo);
  if (createdTo) {
    query = query.lte("created_at", createdTo);
  }

  const [{ data, error }, { data: organization }] = await Promise.all([
    query,
    supabase.from("organizations").select("name").eq("id", workspaceId).maybeSingle(),
  ]);

  if (error) {
    console.error("[AI_ACTIONS] failed to load workspace actions", {
      workspaceId,
      error: error.message,
    });
    return [];
  }

  const rows = (data ?? []) as AiActionRow[];
  if (rows.length === 0) {
    return [];
  }

  const conversationIds = [...new Set(rows.map((row) => row.conversation_id))];
  const { data: conversations } = await supabase
    .from("whatsapp_conversations")
    .select("id, contact_name, phone_number, profile_picture_url, customer_id")
    .eq("workspace_id", workspaceId)
    .in("id", conversationIds);

  const conversationMap = new Map<string, ConversationRow>();
  for (const conversation of (conversations ?? []) as ConversationRow[]) {
    conversationMap.set(conversation.id, conversation);
  }

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

  const mappedActions = mapAiActionRows(rows, documentNames);
  const workspaceName = organization?.name?.trim() || null;

  return mappedActions.map((action) => {
    const conversation = conversationMap.get(action.conversationId);
    const contact = conversation
      ? resolveWhatsappContactDisplay(conversation)
      : {
          primaryName: "Unknown customer",
          secondaryLabel: null,
          avatarName: "?",
        };

    return {
      ...action,
      workspaceName,
      conversation: {
        id: action.conversationId,
        customerName: contact.primaryName,
        phoneLabel: contact.secondaryLabel,
        profilePictureUrl: conversation?.profile_picture_url ?? null,
        leadId: conversation?.customer_id ?? null,
      },
    };
  });
}

export function getWorkspaceAiActionTypeOptions(): Array<{
  value: AIActionType | "all";
  label: string;
}> {
  return [
    { value: "all", label: "All action types" },
    ...AI_ACTION_TYPES.filter((type) => type !== "NO_ACTION").map((type) => ({
      value: type,
      label: type
        .split("_")
        .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
        .join(" "),
    })),
  ];
}
