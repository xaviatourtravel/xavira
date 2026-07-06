import { validateAction } from "@/modules/ai/action-engine/action-validator";
import { executeAction } from "@/modules/ai/action-engine/action-executor";
import {
  isScheduledInFuture,
  resolveScheduledFor,
} from "@/modules/ai/action-engine/schedule-utils";
import {
  isAIActionType,
  type ActionEngineContext,
  type AIAction,
  type AIActionStatus,
} from "@/modules/ai/action-engine/types";
import { insertAiEvent } from "@/lib/whatsapp-inbox/ai/event-log";
import { resolveWhatsappAiState } from "@/lib/whatsapp-inbox/ai/constants";
import { findWhatsappConversationById } from "@/lib/whatsapp-inbox/repository";
import { leadQualificationService } from "@/modules/ai/services/lead-qualification-service";
import { memoryService } from "@/modules/ai/services/memory-service";
import type { WhatsappSupabaseClient } from "@/lib/whatsapp-inbox/repository";
import type { Json } from "@/types/database";

const LOG = "[AI_SCHEDULED_ACTIONS]";

type ScheduledActionRow = {
  id: string;
  workspace_id: string;
  conversation_id: string;
  action_type: string;
  status: string;
  confidence: number;
  reason: string | null;
  payload: Record<string, unknown> | null;
  scheduled_for: string | null;
  created_at: string;
};

function rowToAction(row: ScheduledActionRow): AIAction | null {
  if (!isAIActionType(row.action_type)) {
    return null;
  }

  return {
    type: row.action_type,
    payload: row.payload ?? {},
    confidence: Number(row.confidence) || 0,
    reason: row.reason?.trim() || row.action_type,
  };
}

async function buildContext(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversationId: string,
) {
  const conversation = await findWhatsappConversationById(
    supabase,
    workspaceId,
    conversationId,
  );

  if (!conversation) {
    return null;
  }

  const [leadQualification, conversationMemory] = await Promise.all([
    leadQualificationService.getQualification(supabase, conversation.id),
    memoryService.getMemory(supabase, conversation.id),
  ]);

  return {
    supabase,
    workspaceId,
    conversation,
    leadQualification,
    conversationMemory,
  } satisfies ActionEngineContext;
}

async function logFollowUpEvent(
  supabase: WhatsappSupabaseClient,
  input: {
    workspaceId: string;
    conversationId: string;
    eventType:
      | "AI_FOLLOW_UP_SCHEDULED"
      | "AI_FOLLOW_UP_CANCELLED"
      | "AI_FOLLOW_UP_SENT"
      | "AI_FOLLOW_UP_SKIPPED";
    action: AIAction;
    actionId: string;
    metadata?: Record<string, unknown>;
  },
) {
  await insertAiEvent(supabase, {
    workspaceId: input.workspaceId,
    conversationId: input.conversationId,
    eventType: input.eventType,
    confidence: input.action.confidence,
    reason: input.action.reason,
    metadata: {
      actionType: input.action.type,
      actionId: input.actionId,
      payload: input.action.payload,
      ...input.metadata,
    },
  });
}

async function customerRepliedAfter(
  supabase: WhatsappSupabaseClient,
  conversationId: string,
  createdAt: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("direction", "incoming")
    .gt("created_at", createdAt)
    .limit(1);

  if (error) {
    console.error(`${LOG} failed to check customer replies`, {
      conversationId,
      error: error.message,
    });
    return false;
  }

  return (data?.length ?? 0) > 0;
}

async function cancelScheduledRow(
  supabase: WhatsappSupabaseClient,
  row: ScheduledActionRow,
  action: AIAction,
  reason: string,
  skipCode: string,
) {
  await supabase
    .from("ai_actions")
    .update({
      status: "REJECTED",
      reason,
      executed_by_job: true,
    })
    .eq("id", row.id)
    .eq("workspace_id", row.workspace_id);

  if (action.type === "FOLLOW_UP_MESSAGE") {
    await logFollowUpEvent(supabase, {
      workspaceId: row.workspace_id,
      conversationId: row.conversation_id,
      eventType: "AI_FOLLOW_UP_CANCELLED",
      action,
      actionId: row.id,
      metadata: { skipCode, cancellationReason: reason },
    });
  }

  await insertAiEvent(supabase, {
    workspaceId: row.workspace_id,
    conversationId: row.conversation_id,
    eventType: "AI_FOLLOW_UP_SKIPPED",
    confidence: action.confidence,
    reason,
    metadata: {
      actionId: row.id,
      actionType: action.type,
      skipCode,
    },
  });
}

async function processScheduledRow(
  supabase: WhatsappSupabaseClient,
  row: ScheduledActionRow,
): Promise<"executed" | "failed" | "cancelled" | "skipped"> {
  const action = rowToAction(row);
  if (!action) {
    await supabase
      .from("ai_actions")
      .update({ status: "FAILED", reason: "Unsupported action type" })
      .eq("id", row.id);
    return "failed";
  }

  const context = await buildContext(
    supabase,
    row.workspace_id,
    row.conversation_id,
  );

  if (!context) {
    await cancelScheduledRow(
      supabase,
      row,
      action,
      "Conversation no longer exists",
      "conversation_missing",
    );
    return "cancelled";
  }

  if (await customerRepliedAfter(supabase, row.conversation_id, row.created_at)) {
    await cancelScheduledRow(
      supabase,
      row,
      action,
      "Customer replied before follow-up was due",
      "customer_replied",
    );
    return "cancelled";
  }

  const aiState = resolveWhatsappAiState(context.conversation.ai_state);
  if (aiState !== "AI_ACTIVE") {
    await cancelScheduledRow(
      supabase,
      row,
      action,
      "Conversation is no longer AI-active",
      "ai_not_active",
    );
    return "cancelled";
  }

  const validation = await validateAction(action, context);
  if (!validation.approved) {
    await supabase
      .from("ai_actions")
      .update({
        status: "FAILED",
        reason: validation.reason,
        executed_by_job: true,
      })
      .eq("id", row.id);

    if (action.type === "FOLLOW_UP_MESSAGE") {
      await logFollowUpEvent(supabase, {
        workspaceId: row.workspace_id,
        conversationId: row.conversation_id,
        eventType: "AI_FOLLOW_UP_SKIPPED",
        action,
        actionId: row.id,
        metadata: { code: validation.code, reason: validation.reason },
      });
    }

    return "failed";
  }

  const execution = await executeAction(action, context);
  if (!execution.success) {
    await supabase
      .from("ai_actions")
      .update({
        status: "FAILED",
        reason: execution.reason,
        executed_by_job: true,
      })
      .eq("id", row.id);

    if (action.type === "FOLLOW_UP_MESSAGE") {
      await logFollowUpEvent(supabase, {
        workspaceId: row.workspace_id,
        conversationId: row.conversation_id,
        eventType: "AI_FOLLOW_UP_SKIPPED",
        action,
        actionId: row.id,
        metadata: { code: execution.code, reason: execution.reason },
      });
    }

    return "failed";
  }

  const executedAt = new Date().toISOString();
  await supabase
    .from("ai_actions")
    .update({
      status: "EXECUTED",
      executed_at: executedAt,
      executed_by_job: true,
    })
    .eq("id", row.id);

  await insertAiEvent(supabase, {
    workspaceId: row.workspace_id,
    conversationId: row.conversation_id,
    eventType: "ACTION_SCHEDULE_EXECUTED",
    confidence: action.confidence,
    reason: action.reason,
    metadata: {
      actionId: row.id,
      actionType: action.type,
      executedByJob: true,
      ...execution.metadata,
    },
  });

  if (action.type === "FOLLOW_UP_MESSAGE") {
    await logFollowUpEvent(supabase, {
      workspaceId: row.workspace_id,
      conversationId: row.conversation_id,
      eventType: "AI_FOLLOW_UP_SENT",
      action,
      actionId: row.id,
      metadata: execution.metadata,
    });
  }

  return "executed";
}

export type ProcessScheduledAIActionsResult = {
  processed: number;
  executed: number;
  failed: number;
  cancelled: number;
};

export async function processScheduledAIActions(
  supabase: WhatsappSupabaseClient,
): Promise<ProcessScheduledAIActionsResult> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("ai_actions")
    .select(
      "id, workspace_id, conversation_id, action_type, status, confidence, reason, payload, scheduled_for, created_at",
    )
    .eq("status", "SCHEDULED")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(50);

  if (error) {
    console.error(`${LOG} failed to load due scheduled actions`, {
      error: error.message,
    });
    return { processed: 0, executed: 0, failed: 0, cancelled: 0 };
  }

  const rows = (data ?? []) as ScheduledActionRow[];
  const result: ProcessScheduledAIActionsResult = {
    processed: rows.length,
    executed: 0,
    failed: 0,
    cancelled: 0,
  };

  for (const row of rows) {
    const outcome = await processScheduledRow(supabase, row);
    if (outcome === "executed") result.executed += 1;
    if (outcome === "failed") result.failed += 1;
    if (outcome === "cancelled" || outcome === "skipped") result.cancelled += 1;
  }

  if (rows.length > 0) {
    console.log(`${LOG} processed scheduled actions`, result);
  }

  return result;
}

export async function cancelScheduledAction(
  actionId: string,
  context: ActionEngineContext,
  options?: { cancelledByUserId?: string | null; reason?: string | null },
): Promise<void> {
  const { data, error } = await context.supabase
    .from("ai_actions")
    .select("id, action_type, status, confidence, reason, payload, conversation_id")
    .eq("id", actionId)
    .eq("workspace_id", context.workspaceId)
    .eq("conversation_id", context.conversation.id)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Scheduled action not found.");
  }

  if (data.status !== "SCHEDULED") {
    throw new Error("Only scheduled actions can be cancelled.");
  }

  const action = rowToAction(data as ScheduledActionRow);
  if (!action) {
    throw new Error("Unsupported action type.");
  }

  const reason = options?.reason?.trim() || "Cancelled by teammate";

  await context.supabase
    .from("ai_actions")
    .update({ status: "REJECTED", reason })
    .eq("id", actionId)
    .eq("workspace_id", context.workspaceId);

  await insertAiEvent(context.supabase, {
    workspaceId: context.workspaceId,
    conversationId: context.conversation.id,
    eventType: "ACTION_SCHEDULE_CANCELLED",
    confidence: action.confidence,
    reason,
    metadata: {
      actionId,
      actionType: action.type,
      cancelledByUserId: options?.cancelledByUserId ?? null,
    },
  });

  if (action.type === "FOLLOW_UP_MESSAGE") {
    await logFollowUpEvent(context.supabase, {
      workspaceId: context.workspaceId,
      conversationId: context.conversation.id,
      eventType: "AI_FOLLOW_UP_CANCELLED",
      action,
      actionId,
      metadata: {
        cancelledByUserId: options?.cancelledByUserId ?? null,
        cancellationReason: reason,
      },
    });
  }
}

export async function executeScheduledActionNow(
  actionId: string,
  context: ActionEngineContext,
  options?: { executedByUserId?: string | null },
): Promise<{ status: AIActionStatus; error?: string }> {
  const { data, error } = await context.supabase
    .from("ai_actions")
    .select(
      "id, workspace_id, conversation_id, action_type, status, confidence, reason, payload, scheduled_for, created_at",
    )
    .eq("id", actionId)
    .eq("workspace_id", context.workspaceId)
    .eq("conversation_id", context.conversation.id)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Scheduled action not found.");
  }

  if (data.status !== "SCHEDULED") {
    throw new Error("Only scheduled actions can be executed now.");
  }

  const row = data as ScheduledActionRow;
  const action = rowToAction(row);
  if (!action) {
    throw new Error("Unsupported action type.");
  }

  const validation = await validateAction(action, context);
  if (!validation.approved) {
    await context.supabase
      .from("ai_actions")
      .update({ status: "FAILED", reason: validation.reason })
      .eq("id", actionId);

    return { status: "FAILED", error: validation.reason };
  }

  const execution = await executeAction(action, context);
  if (!execution.success) {
    await context.supabase
      .from("ai_actions")
      .update({ status: "FAILED", reason: execution.reason })
      .eq("id", actionId);

    return { status: "FAILED", error: execution.reason };
  }

  const executedAt = new Date().toISOString();
  await context.supabase
    .from("ai_actions")
    .update({
      status: "EXECUTED",
      executed_at: executedAt,
      scheduled_for: null,
    })
    .eq("id", actionId);

  await insertAiEvent(context.supabase, {
    workspaceId: context.workspaceId,
    conversationId: context.conversation.id,
    eventType: "ACTION_EXECUTED_NOW",
    confidence: action.confidence,
    reason: action.reason,
    metadata: {
      actionId,
      actionType: action.type,
      executedByUserId: options?.executedByUserId ?? null,
      ...execution.metadata,
    },
  });

  if (action.type === "FOLLOW_UP_MESSAGE") {
    await logFollowUpEvent(context.supabase, {
      workspaceId: context.workspaceId,
      conversationId: context.conversation.id,
      eventType: "AI_FOLLOW_UP_SENT",
      action,
      actionId,
      metadata: {
        executedByUserId: options?.executedByUserId ?? null,
        ...execution.metadata,
      },
    });
  }

  return { status: "EXECUTED" };
}

export { isScheduledInFuture, resolveScheduledFor };
