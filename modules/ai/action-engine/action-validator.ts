import { getActionDefinition } from "@/modules/ai/action-engine/action-registry";
import { validateFollowUpMessage } from "@/modules/ai/action-engine/follow-up-message-validator";
import {
  checkActionPermission,
  mergeRequiresApproval,
} from "@/modules/ai/action-engine/action-permission-check";
import {
  type ActionEngineContext,
  type ActionValidationResult,
  type AIAction,
} from "@/modules/ai/action-engine/types";
import { isConversationMemoryKey } from "@/modules/ai/types/memory";
import { resolveWhatsappAiState } from "@/lib/whatsapp-inbox/ai/constants";

type BrainDocumentRow = {
  id: string;
  business_brain_id: string;
  name: string;
  status: string;
  auto_send_enabled: boolean;
};

async function loadPublishedDocument(
  context: ActionEngineContext,
  documentId: string,
): Promise<BrainDocumentRow | null> {
  const { data, error } = await context.supabase
    .from("brain_documents")
    .select("id, business_brain_id, name, status, auto_send_enabled")
    .eq("id", documentId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as BrainDocumentRow;
}

async function documentBelongsToWorkspace(
  context: ActionEngineContext,
  businessBrainId: string,
): Promise<boolean> {
  const { data, error } = await context.supabase
    .from("business_brains")
    .select("id")
    .eq("id", businessBrainId)
    .eq("organization_id", context.workspaceId)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}

function requireAiActive(context: ActionEngineContext): ActionValidationResult {
  const state = resolveWhatsappAiState(context.conversation.ai_state);
  if (state !== "AI_ACTIVE") {
    return {
      approved: false,
      reason: "AI auto-reply is not active for this conversation",
      code: "ai_not_active",
    };
  }
  return { approved: true, requiresApproval: false };
}

async function validateSendDocument(
  action: AIAction,
  context: ActionEngineContext,
): Promise<ActionValidationResult> {
  const active = requireAiActive(context);
  if (!active.approved) return active;

  const documentId =
    typeof action.payload.documentId === "string"
      ? action.payload.documentId.trim()
      : "";

  if (!documentId) {
    return {
      approved: false,
      reason: "documentId is required",
      code: "missing_document_id",
    };
  }

  const document = await loadPublishedDocument(context, documentId);
  if (!document) {
    return {
      approved: false,
      reason: "Document does not exist",
      code: "document_not_found",
    };
  }

  if (document.status !== "published") {
    return {
      approved: false,
      reason: "Document is not published",
      code: "not_published",
    };
  }

  const belongs = await documentBelongsToWorkspace(
    context,
    document.business_brain_id,
  );
  if (!belongs) {
    return {
      approved: false,
      reason: "Document does not belong to this workspace",
      code: "workspace_mismatch",
    };
  }

  return {
    approved: true,
    // Document-level auto-send still gates automatic execution.
    requiresApproval: !document.auto_send_enabled,
  };
}

function validateHandover(
  _action: AIAction,
  context: ActionEngineContext,
): ActionValidationResult {
  const state = resolveWhatsappAiState(context.conversation.ai_state);

  if (state === "HUMAN_ONLY" || state === "HUMAN_ASSISTED") {
    return {
      approved: false,
      reason: "Conversation is already owned by a human",
      code: "already_human_owned",
    };
  }

  if (state === "READY_FOR_HUMAN") {
    return {
      approved: false,
      reason: "Handover already triggered",
      code: "already_ready_for_human",
    };
  }

  return { approved: true, requiresApproval: false };
}

function validateCreateLeadNote(action: AIAction): ActionValidationResult {
  const note =
    typeof action.payload.note === "string" ? action.payload.note.trim() : "";

  if (!note) {
    return {
      approved: false,
      reason: "Note text is required",
      code: "missing_note",
    };
  }

  return { approved: true, requiresApproval: false };
}

function validateUpdateMemory(action: AIAction): ActionValidationResult {
  const memoryKey =
    typeof action.payload.memoryKey === "string"
      ? action.payload.memoryKey.trim()
      : "";
  const memoryValue =
    typeof action.payload.memoryValue === "string"
      ? action.payload.memoryValue.trim()
      : "";

  if (!memoryKey || !isConversationMemoryKey(memoryKey)) {
    return {
      approved: false,
      reason: "Valid memoryKey is required",
      code: "invalid_memory_key",
    };
  }

  if (!memoryValue) {
    return {
      approved: false,
      reason: "memoryValue is required",
      code: "missing_memory_value",
    };
  }

  return { approved: true, requiresApproval: false };
}

function validateUpdateLeadProgress(action: AIAction): ActionValidationResult {
  const fields = action.payload.fields;
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
    return {
      approved: false,
      reason: "fields object is required",
      code: "missing_fields",
    };
  }

  return { approved: true, requiresApproval: false };
}

function validateSoftAction(): ActionValidationResult {
  return { approved: true, requiresApproval: false };
}

async function validateActionType(
  action: AIAction,
  context: ActionEngineContext,
): Promise<ActionValidationResult> {
  switch (action.type) {
    case "SEND_DOCUMENT":
      return validateSendDocument(action, context);
    case "HANDOVER":
      return validateHandover(action, context);
    case "CREATE_LEAD_NOTE":
      return validateCreateLeadNote(action);
    case "UPDATE_MEMORY":
      return validateUpdateMemory(action);
    case "UPDATE_LEAD_PROGRESS":
      return validateUpdateLeadProgress(action);
    case "SUGGEST_PACKAGE":
    case "ASK_QUALIFICATION":
      return validateSoftAction();
    case "FOLLOW_UP_MESSAGE":
      return validateFollowUpMessage(action, context);
    case "NO_ACTION":
      return { approved: true, requiresApproval: false };
    default:
      return {
        approved: false,
        reason: `Unsupported action type: ${(action as AIAction).type}`,
        code: "unsupported_action",
      };
  }
}

export async function validateAction(
  action: AIAction,
  context: ActionEngineContext,
): Promise<ActionValidationResult> {
  if (action.type === "NO_ACTION") {
    return { approved: true, requiresApproval: false };
  }

  const permissionResult = await checkActionPermission(action, context);
  if (!permissionResult.approved) {
    return permissionResult;
  }

  const typeResult = await validateActionType(action, context);
  if (!typeResult.approved) {
    return typeResult;
  }

  return {
    approved: true,
    requiresApproval: mergeRequiresApproval(
      permissionResult.requiresApproval,
      typeResult.requiresApproval,
    ),
  };
}

// Re-export for tests and callers that need action metadata.
export { getActionDefinition };
