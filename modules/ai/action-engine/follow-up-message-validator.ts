import type { ActionEngineContext, ActionValidationResult, AIAction } from "@/modules/ai/action-engine/types";
import { normalizeActionConfidence } from "@/modules/ai/action-engine/types";
import { resolveScheduledFor } from "@/modules/ai/action-engine/schedule-utils";
import { resolveWhatsappAiState } from "@/lib/whatsapp-inbox/ai/constants";

export const FOLLOW_UP_MIN_CONFIDENCE = 0.85;
export const FOLLOW_UP_MAX_MESSAGE_LENGTH = 320;

const PRESSURE_PATTERNS: RegExp[] = [
  /\bsegera\b/i,
  /\bdeadline\b/i,
  /\bterakhir\b/i,
  /\bjangan\s+sampai\b/i,
  /\blimited\s+time\b/i,
  /\bhurry\b/i,
  /\burgent\b/i,
  /\bharus\s+segera\b/i,
  /\bwajib\s+segera\b/i,
  /\bsebelum\s+kehabisan\b/i,
  /\blast\s+chance\b/i,
  /\bact\s+now\b/i,
  /\bsekarang\s+juga\b/i,
  /\bjangan\s+tunggu\b/i,
];

function messageLooksPressuring(message: string): boolean {
  return PRESSURE_PATTERNS.some((pattern) => pattern.test(message));
}

async function countScheduledFollowUps(
  context: ActionEngineContext,
): Promise<number> {
  const { count, error } = await context.supabase
    .from("ai_actions")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", context.workspaceId)
    .eq("conversation_id", context.conversation.id)
    .eq("action_type", "FOLLOW_UP_MESSAGE")
    .eq("status", "SCHEDULED");

  if (error) {
    console.error("[AI_ACTION_ENGINE] failed to count scheduled follow-ups", {
      conversationId: context.conversation.id,
      error: error.message,
    });
    return 0;
  }

  return count ?? 0;
}

export async function validateFollowUpMessage(
  action: AIAction,
  context: ActionEngineContext,
): Promise<ActionValidationResult> {
  const state = resolveWhatsappAiState(context.conversation.ai_state);
  if (state !== "AI_ACTIVE") {
    return {
      approved: false,
      reason: "AI auto-reply is not active for this conversation",
      code: "ai_not_active",
    };
  }

  const confidence = normalizeActionConfidence(action.confidence);
  if (confidence < FOLLOW_UP_MIN_CONFIDENCE) {
    return {
      approved: false,
      reason: `Confidence ${confidence.toFixed(2)} is below minimum ${FOLLOW_UP_MIN_CONFIDENCE}`,
      code: "low_confidence",
    };
  }

  const scheduledFor = resolveScheduledFor(action);
  if (!scheduledFor || scheduledFor.getTime() <= Date.now()) {
    return {
      approved: false,
      reason: "scheduledFor must be a future ISO timestamp",
      code: "invalid_schedule_time",
    };
  }

  const message =
    typeof action.payload.message === "string"
      ? action.payload.message.trim()
      : "";

  if (!message) {
    return {
      approved: false,
      reason: "Follow-up message is required",
      code: "missing_message",
    };
  }

  if (message.length > FOLLOW_UP_MAX_MESSAGE_LENGTH) {
    return {
      approved: false,
      reason: `Follow-up message must be ${FOLLOW_UP_MAX_MESSAGE_LENGTH} characters or fewer`,
      code: "message_too_long",
    };
  }

  if (messageLooksPressuring(message)) {
    return {
      approved: false,
      reason: "Follow-up message sounds too pressuring",
      code: "pressuring_message",
    };
  }

  const existingScheduled = await countScheduledFollowUps(context);
  if (existingScheduled >= 1) {
    return {
      approved: false,
      reason: "A follow-up is already scheduled for this conversation",
      code: "follow_up_already_scheduled",
    };
  }

  return { approved: true, requiresApproval: false };
}
