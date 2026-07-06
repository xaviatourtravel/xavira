import {
  cancelScheduledAction,
  executeScheduledActionNow,
  processScheduledAIActions,
} from "@/modules/ai/action-engine/scheduled-action-processor";
import { validateAction } from "@/modules/ai/action-engine/action-validator";
import { isPermissionBlockedCode } from "@/modules/ai/action-engine/action-permission-check";
import { executeAction } from "@/modules/ai/action-engine/action-executor";
import { parseRetryMetadata } from "@/modules/ai/action-engine/retry-metadata";
import {
  isScheduledInFuture,
  resolveScheduledFor,
} from "@/modules/ai/action-engine/schedule-utils";
import {
  isAIActionType,
  normalizeActionConfidence,
  type ActionEngineContext,
  type ActionProcessResult,
  type AIAction,
  type AIActionRetryMetadata,
  type AIActionStatus,
  type AIActionType,
} from "@/modules/ai/action-engine/types";
import {
  QUALIFICATION_HANDOFF_REASON,
  type LeadQualificationSnapshot,
} from "@/modules/ai/types/lead-qualification";
import type { WhatsAppDocumentAction } from "@/modules/business-brain/types/prompt";
import { insertAiEvent } from "@/lib/whatsapp-inbox/ai/event-log";
import type { Json } from "@/types/database";

const LOG = "[AI_ACTION_ENGINE]";

function logEngine(message: string, data?: Record<string, unknown>) {
  if (data) {
    console.log(`${LOG} ${message}`, data);
  } else {
    console.log(`${LOG} ${message}`);
  }
}

async function persistAction(
  context: ActionEngineContext,
  action: AIAction,
  status: AIActionStatus,
  options?: { executedAt?: string | null },
): Promise<string | null> {
  const { data, error } = await context.supabase
    .from("ai_actions")
    .insert({
      workspace_id: context.workspaceId,
      conversation_id: context.conversation.id,
      action_type: action.type,
      status,
      confidence: normalizeActionConfidence(action.confidence),
      reason: action.reason,
      payload: action.payload as Json,
      executed_at: options?.executedAt ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`${LOG} failed to persist ai_action`, {
      actionType: action.type,
      status,
      error: error.message,
    });
    return null;
  }

  return data.id as string;
}

async function updateActionStatus(
  context: ActionEngineContext,
  actionId: string | null,
  status: AIActionStatus,
  options?: {
    executedAt?: string | null;
    reason?: string | null;
    metadata?: AIActionRetryMetadata;
    scheduledFor?: string | null;
    executedByJob?: boolean;
  },
) {
  if (!actionId) return;

  const patch: {
    status: AIActionStatus;
    executed_at?: string | null;
    reason?: string | null;
    metadata?: Json;
    scheduled_for?: string | null;
    executed_by_job?: boolean;
  } = { status };

  if (options?.executedAt !== undefined) {
    patch.executed_at = options.executedAt;
  }
  if (options?.reason !== undefined) {
    patch.reason = options.reason;
  }
  if (options?.metadata !== undefined) {
    patch.metadata = options.metadata as Json;
  }
  if (options?.scheduledFor !== undefined) {
    patch.scheduled_for = options.scheduledFor;
  }
  if (options?.executedByJob !== undefined) {
    patch.executed_by_job = options.executedByJob;
  }

  const { error } = await context.supabase
    .from("ai_actions")
    .update(patch)
    .eq("id", actionId)
    .eq("workspace_id", context.workspaceId);

  if (error) {
    console.error(`${LOG} failed to update ai_action`, {
      actionId,
      status,
      error: error.message,
    });
  }
}

async function logActionEvent(
  context: ActionEngineContext,
  eventType:
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
    | "ACTION_EXECUTED_NOW",
  action: AIAction,
  metadata?: Record<string, unknown>,
) {
  await insertAiEvent(context.supabase, {
    workspaceId: context.workspaceId,
    conversationId: context.conversation.id,
    messageId: context.incomingMessageId ?? null,
    eventType,
    confidence: normalizeActionConfidence(action.confidence),
    reason: action.reason,
    metadata: {
      actionType: action.type,
      payload: action.payload,
      ...metadata,
    },
  });
}

async function runExecution(
  action: AIAction,
  context: ActionEngineContext,
  actionId: string | null,
  options?: { afterManualApproval?: boolean },
): Promise<ActionProcessResult> {
  const execution = await executeAction(action, context);

  if (!execution.success) {
    await updateActionStatus(context, actionId, "FAILED", {
      reason: execution.reason,
    });
    await logActionEvent(context, "ACTION_FAILED", action, {
      actionId,
      code: execution.code,
      failureReason: execution.reason,
      afterManualApproval: options?.afterManualApproval ?? false,
    });
    logEngine("ACTION_FAILED", {
      conversationId: context.conversation.id,
      actionType: action.type,
      code: execution.code,
      reason: execution.reason,
    });

    return {
      action,
      actionId,
      status: "FAILED",
      error: execution.reason,
    };
  }

  const executedAt = new Date().toISOString();
  await updateActionStatus(context, actionId, "EXECUTED", { executedAt });
  await logActionEvent(
    context,
    options?.afterManualApproval
      ? "ACTION_EXECUTED_AFTER_APPROVAL"
      : "ACTION_EXECUTED",
    action,
    {
      actionId,
      ...execution.metadata,
    },
  );
  logEngine(
    options?.afterManualApproval
      ? "ACTION_EXECUTED_AFTER_APPROVAL"
      : "ACTION_EXECUTED",
    {
      conversationId: context.conversation.id,
      actionType: action.type,
      metadata: execution.metadata,
    },
  );

  return {
    action,
    actionId,
    status: "EXECUTED",
    executionMetadata: execution.metadata,
  };
}

function rowToAction(row: {
  action_type: string;
  confidence: number;
  reason: string | null;
  payload: Record<string, unknown> | null;
}): AIAction | null {
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

export async function processAction(
  action: AIAction,
  context: ActionEngineContext,
): Promise<ActionProcessResult> {
  const actionId = await persistAction(context, action, "PENDING");

  await logActionEvent(context, "ACTION_RECOMMENDED", action, { actionId });
  logEngine("ACTION_RECOMMENDED", {
    conversationId: context.conversation.id,
    actionType: action.type,
    confidence: action.confidence,
  });

  const validation = await validateAction(action, context);

  if (!validation.approved) {
    await updateActionStatus(context, actionId, "REJECTED", {
      reason: validation.reason,
    });

    if (isPermissionBlockedCode(validation.code)) {
      await logActionEvent(context, "ACTION_PERMISSION_BLOCKED", action, {
        actionId,
        code: validation.code,
        rejectionReason: validation.reason,
      });
    }

    await logActionEvent(context, "ACTION_REJECTED", action, {
      actionId,
      code: validation.code,
      rejectionReason: validation.reason,
    });
    logEngine("ACTION_REJECTED", {
      conversationId: context.conversation.id,
      actionType: action.type,
      code: validation.code,
      reason: validation.reason,
    });

    return {
      action,
      actionId,
      status: "REJECTED",
      validationReason: validation.reason,
    };
  }

  // Valid but needs a human — leave PENDING for manual approval.
  if (validation.requiresApproval) {
    await logActionEvent(context, "ACTION_PERMISSION_APPROVED", action, {
      actionId,
      requiresManualApproval: true,
    });
    logEngine("ACTION_AWAITING_APPROVAL", {
      conversationId: context.conversation.id,
      actionType: action.type,
      actionId,
    });

    return {
      action,
      actionId,
      status: "PENDING",
    };
  }

  const scheduledFor = resolveScheduledFor(action);
  const shouldSchedule =
    action.type === "FOLLOW_UP_MESSAGE" || isScheduledInFuture(action);

  if (shouldSchedule && scheduledFor) {
    await updateActionStatus(context, actionId, "SCHEDULED", {
      scheduledFor: scheduledFor.toISOString(),
    });
    await logActionEvent(context, "ACTION_SCHEDULED", action, {
      actionId,
      scheduledFor: scheduledFor.toISOString(),
    });

    if (action.type === "FOLLOW_UP_MESSAGE") {
      await insertAiEvent(context.supabase, {
        workspaceId: context.workspaceId,
        conversationId: context.conversation.id,
        messageId: context.incomingMessageId ?? null,
        eventType: "AI_FOLLOW_UP_SCHEDULED",
        confidence: normalizeActionConfidence(action.confidence),
        reason: action.reason,
        metadata: {
          actionId,
          actionType: action.type,
          scheduledFor: scheduledFor.toISOString(),
          payload: action.payload,
        },
      });
    }

    logEngine("ACTION_SCHEDULED", {
      conversationId: context.conversation.id,
      actionType: action.type,
      actionId,
      scheduledFor: scheduledFor.toISOString(),
    });

    return {
      action,
      actionId,
      status: "SCHEDULED",
    };
  }

  await updateActionStatus(context, actionId, "APPROVED");
  await logActionEvent(context, "ACTION_PERMISSION_APPROVED", action, {
    actionId,
    requiresManualApproval: false,
  });
  await logActionEvent(context, "ACTION_APPROVED", action, { actionId });
  logEngine("ACTION_APPROVED", {
    conversationId: context.conversation.id,
    actionType: action.type,
  });

  return runExecution(action, context, actionId);
}

export async function approveActionManually(
  actionId: string,
  context: ActionEngineContext,
  options?: { approvedByUserId?: string | null },
): Promise<ActionProcessResult> {
  const { data, error } = await context.supabase
    .from("ai_actions")
    .select(
      "id, action_type, status, confidence, reason, payload, conversation_id",
    )
    .eq("id", actionId)
    .eq("workspace_id", context.workspaceId)
    .eq("conversation_id", context.conversation.id)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Action not found.");
  }

  if (data.status !== "PENDING") {
    throw new Error("Only pending actions can be approved.");
  }

  const action = rowToAction(data);
  if (!action) {
    throw new Error("Unsupported action type.");
  }

  const validation = await validateAction(action, context);
  if (!validation.approved) {
    await updateActionStatus(context, actionId, "REJECTED", {
      reason: validation.reason,
    });

    if (isPermissionBlockedCode(validation.code)) {
      await logActionEvent(context, "ACTION_PERMISSION_BLOCKED", action, {
        actionId,
        code: validation.code,
        rejectionReason: validation.reason,
      });
    }

    await logActionEvent(context, "ACTION_REJECTED", action, {
      actionId,
      code: validation.code,
      rejectionReason: validation.reason,
    });
    return {
      action,
      actionId,
      status: "REJECTED",
      validationReason: validation.reason,
    };
  }

  await updateActionStatus(context, actionId, "APPROVED");
  await logActionEvent(context, "ACTION_MANUALLY_APPROVED", action, {
    actionId,
    approvedByUserId: options?.approvedByUserId ?? null,
  });
  logEngine("ACTION_MANUALLY_APPROVED", {
    conversationId: context.conversation.id,
    actionType: action.type,
    actionId,
  });

  return runExecution(action, context, actionId, { afterManualApproval: true });
}

export async function rejectActionManually(
  actionId: string,
  context: ActionEngineContext,
  options?: {
    rejectionReason?: string | null;
    rejectedByUserId?: string | null;
  },
): Promise<ActionProcessResult> {
  const { data, error } = await context.supabase
    .from("ai_actions")
    .select(
      "id, action_type, status, confidence, reason, payload, conversation_id",
    )
    .eq("id", actionId)
    .eq("workspace_id", context.workspaceId)
    .eq("conversation_id", context.conversation.id)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Action not found.");
  }

  if (data.status !== "PENDING") {
    throw new Error("Only pending actions can be rejected.");
  }

  const action = rowToAction(data);
  if (!action) {
    throw new Error("Unsupported action type.");
  }

  const rejectionReason =
    options?.rejectionReason?.trim() || "Rejected by sales";

  await updateActionStatus(context, actionId, "REJECTED", {
    reason: rejectionReason,
  });
  await logActionEvent(context, "ACTION_MANUALLY_REJECTED", action, {
    actionId,
    rejectionReason,
    rejectedByUserId: options?.rejectedByUserId ?? null,
  });
  logEngine("ACTION_MANUALLY_REJECTED", {
    conversationId: context.conversation.id,
    actionType: action.type,
    actionId,
    rejectionReason,
  });

  return {
    action: { ...action, reason: rejectionReason },
    actionId,
    status: "REJECTED",
    validationReason: rejectionReason,
  };
}

export async function retryFailedAction(
  actionId: string,
  context: ActionEngineContext,
  options?: { retriedByUserId?: string | null },
): Promise<ActionProcessResult> {
  const { data, error } = await context.supabase
    .from("ai_actions")
    .select(
      "id, action_type, status, confidence, reason, payload, conversation_id, metadata",
    )
    .eq("id", actionId)
    .eq("workspace_id", context.workspaceId)
    .eq("conversation_id", context.conversation.id)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Action not found.");
  }

  if (data.status !== "FAILED") {
    throw new Error("Only failed actions can be retried.");
  }

  const action = rowToAction(data);
  if (!action) {
    throw new Error("Unsupported action type.");
  }

  const currentMetadata = parseRetryMetadata(data.metadata);
  const nextRetryCount = currentMetadata.retryCount + 1;
  const retriedAt = new Date().toISOString();
  const retriedByUserId = options?.retriedByUserId ?? null;

  await logActionEvent(context, "ACTION_RETRY_ATTEMPTED", action, {
    actionId,
    retryCount: nextRetryCount,
    retriedByUserId,
  });
  logEngine("ACTION_RETRY_ATTEMPTED", {
    conversationId: context.conversation.id,
    actionType: action.type,
    actionId,
    retryCount: nextRetryCount,
  });

  const validation = await validateAction(action, context);
  if (!validation.approved) {
    const metadata: AIActionRetryMetadata = {
      retryCount: nextRetryCount,
      lastRetryAt: retriedAt,
      lastRetryBy: retriedByUserId,
      lastRetryError: validation.reason,
    };

    await updateActionStatus(context, actionId, "FAILED", {
      reason: validation.reason,
      metadata,
    });
    await logActionEvent(context, "ACTION_RETRY_FAILED", action, {
      actionId,
      code: validation.code,
      ...metadata,
    });
    logEngine("ACTION_RETRY_FAILED", {
      conversationId: context.conversation.id,
      actionType: action.type,
      actionId,
      code: validation.code,
      reason: validation.reason,
    });

    return {
      action,
      actionId,
      status: "FAILED",
      validationReason: validation.reason,
      error: validation.reason,
    };
  }

  const execution = await executeAction(action, context);

  if (!execution.success) {
    const metadata: AIActionRetryMetadata = {
      retryCount: nextRetryCount,
      lastRetryAt: retriedAt,
      lastRetryBy: retriedByUserId,
      lastRetryError: execution.reason,
    };

    await updateActionStatus(context, actionId, "FAILED", {
      reason: execution.reason,
      metadata,
    });
    await logActionEvent(context, "ACTION_RETRY_FAILED", action, {
      actionId,
      code: execution.code,
      failureReason: execution.reason,
      ...metadata,
    });
    logEngine("ACTION_RETRY_FAILED", {
      conversationId: context.conversation.id,
      actionType: action.type,
      actionId,
      code: execution.code,
      reason: execution.reason,
    });

    return {
      action,
      actionId,
      status: "FAILED",
      error: execution.reason,
    };
  }

  const executedAt = new Date().toISOString();
  const metadata: AIActionRetryMetadata = {
    retryCount: nextRetryCount,
    lastRetryAt: retriedAt,
    lastRetryBy: retriedByUserId,
    lastRetryError: null,
  };

  await updateActionStatus(context, actionId, "EXECUTED", {
    executedAt,
    metadata,
  });
  await logActionEvent(context, "ACTION_RETRY_SUCCEEDED", action, {
    actionId,
    ...metadata,
    ...execution.metadata,
  });
  logEngine("ACTION_RETRY_SUCCEEDED", {
    conversationId: context.conversation.id,
    actionType: action.type,
    actionId,
    retryCount: nextRetryCount,
  });

  return {
    action,
    actionId,
    status: "EXECUTED",
    executionMetadata: execution.metadata,
  };
}

export async function processActions(
  actions: AIAction[],
  context: ActionEngineContext,
): Promise<ActionProcessResult[]> {
  const results: ActionProcessResult[] = [];

  for (const action of actions) {
    const result = await processAction(action, context);
    results.push(result);

    // Stop after a successful handover — conversation is no longer AI-owned.
    if (action.type === "HANDOVER" && result.status === "EXECUTED") {
      break;
    }
  }

  return results;
}

function mapSuggestedAction(suggestion: string, confidence: number): AIAction | null {
  const normalized = suggestion.trim().toLowerCase();
  if (!normalized) return null;

  if (
    normalized.includes("ask") ||
    normalized.includes("budget") ||
    normalized.includes("qualification") ||
    normalized.includes("passenger") ||
    normalized.includes("departure")
  ) {
    return {
      type: "ASK_QUALIFICATION",
      payload: { suggestion },
      confidence,
      reason: suggestion,
    };
  }

  if (
    normalized.includes("package") ||
    normalized.includes("recommend") ||
    normalized.includes("brochure")
  ) {
    return {
      type: "SUGGEST_PACKAGE",
      payload: { suggestion },
      confidence,
      reason: suggestion,
    };
  }

  if (normalized.includes("note")) {
    return {
      type: "CREATE_LEAD_NOTE",
      payload: { note: suggestion },
      confidence,
      reason: suggestion,
    };
  }

  if (normalized.includes("handover") || normalized.includes("hand over") || normalized.includes("take over")) {
    return {
      type: "HANDOVER",
      payload: { handoffReason: suggestion },
      confidence,
      reason: suggestion,
    };
  }

  return null;
}

/**
 * Convert LLM recommendations into Action Engine actions.
 * The LLM never executes side effects — only recommends.
 *
 * Prefer structured `actions` from the LLM contract. Fall back to legacy
 * documentActions / suggestedActions / handoffRequired fields.
 */
export function recommendActionsFromLlm(input: {
  actions?: AIAction[];
  documentActions?: WhatsAppDocumentAction[];
  handoffRequired?: boolean;
  handoffReason?: string | null;
  confidence?: number;
  suggestedActions?: string[];
}): AIAction[] {
  const confidence = normalizeActionConfidence(input.confidence ?? 0.8);

  if (input.handoffRequired) {
    return [
      {
        type: "HANDOVER",
        payload: {
          handoffReason: input.handoffReason ?? "LLM requested handoff",
        },
        confidence,
        reason: input.handoffReason ?? "LLM requested handoff",
      },
    ];
  }

  const recommended: AIAction[] = [];

  if (input.actions && input.actions.length > 0) {
    for (const action of input.actions) {
      if (action.type === "NO_ACTION") continue;
      recommended.push({
        ...action,
        confidence: normalizeActionConfidence(action.confidence),
        payload: action.payload ?? {},
        reason: action.reason?.trim() || action.type,
      });
    }
  } else {
    for (const documentAction of input.documentActions ?? []) {
      if (documentAction.action !== "SEND_DOCUMENT") continue;

      recommended.push({
        type: "SEND_DOCUMENT",
        payload: { documentId: documentAction.documentId },
        confidence: normalizeActionConfidence(documentAction.confidence),
        reason: documentAction.reason,
      });
    }

    for (const suggestion of input.suggestedActions ?? []) {
      const mapped = mapSuggestedAction(suggestion, confidence);
      if (mapped) {
        recommended.push(mapped);
      }
    }
  }

  if (recommended.length === 0) {
    return [
      {
        type: "NO_ACTION",
        payload: {},
        confidence: 1,
        reason: "No actions recommended",
      },
    ];
  }

  return recommended;
}

export function recommendQualificationHandoverAction(
  leadQualification: LeadQualificationSnapshot,
): AIAction {
  return {
    type: "HANDOVER",
    payload: {
      handoffType: "qualification",
      handoffReason: QUALIFICATION_HANDOFF_REASON,
      completionScore: leadQualification.completionScore,
      qualificationStatus: leadQualification.qualificationStatus,
    },
    confidence: 1,
    reason: QUALIFICATION_HANDOFF_REASON,
  };
}

export function createAction(
  type: AIActionType,
  payload: Record<string, unknown>,
  options?: { confidence?: number; reason?: string },
): AIAction {
  if (!isAIActionType(type)) {
    throw new Error(`Unsupported action type: ${type}`);
  }

  return {
    type,
    payload,
    confidence: options?.confidence ?? 1,
    reason: options?.reason ?? type,
  };
}

export const actionEngine = {
  processAction,
  processActions,
  approveActionManually,
  rejectActionManually,
  retryFailedAction,
  processScheduledAIActions,
  cancelScheduledAction,
  executeScheduledActionNow,
  recommendActionsFromLlm,
  recommendQualificationHandoverAction,
  createAction,
};
