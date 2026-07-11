import type { AIAction } from "@/modules/ai/action-engine/types";
import type { WhatsAppSalesLlmOutputContract } from "@/modules/business-brain/types/prompt";
import { parseAiActions } from "@/modules/business-brain/lib/parse-ai-actions";
import { parseDocumentActions } from "@/modules/business-brain/lib/parse-document-actions";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function normalizeConfidence(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  const normalized = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function documentActionsToAiActions(
  documentActions: WhatsAppSalesLlmOutputContract["documentActions"],
): AIAction[] {
  return documentActions.map((item) => ({
    type: "SEND_DOCUMENT" as const,
    payload: { documentId: item.documentId },
    confidence: item.confidence,
    reason: item.reason,
  }));
}

export function parseWhatsAppSalesLlmResponse(
  data: unknown,
): WhatsAppSalesLlmOutputContract | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const record = data as Record<string, unknown>;
  const replyText =
    typeof record.reply === "string"
      ? record.reply
      : typeof record.replyText === "string"
        ? record.replyText
        : "";
  if (!replyText.trim()) {
    return null;
  }

  const legacyDocumentActions = parseDocumentActions(record.documentActions);
  const parsedActions = parseAiActions(record.actions);

  // Prefer explicit `actions`; fall back to legacy documentActions.
  const actions =
    parsedActions.length > 0
      ? parsedActions
      : documentActionsToAiActions(legacyDocumentActions);

  // Keep documentActions in sync for playground / safety validators.
  const documentActionsFromActions = actions
    .filter((action) => action.type === "SEND_DOCUMENT")
    .map((action) => {
      const documentId =
        typeof action.payload.documentId === "string"
          ? action.payload.documentId.trim()
          : "";
      return {
        documentId,
        action: "SEND_DOCUMENT" as const,
        reason: action.reason,
        confidence: action.confidence,
      };
    })
    .filter((item) => item.documentId);

  const documentActions =
    legacyDocumentActions.length > 0
      ? legacyDocumentActions
      : documentActionsFromActions;

  return {
    reply: replyText.trim(),
    handoffRequired: record.handoffRequired === true,
    handoffReason:
      typeof record.handoffReason === "string" ? record.handoffReason.trim() || null : null,
    confidence: normalizeConfidence(record.confidence),
    suggestedActions: asStringArray(record.suggestedActions),
    usedSources: asStringArray(record.usedSources),
    missingInformation: asStringArray(record.missingInformation),
    suggestedNextStep:
      typeof record.suggestedNextStep === "string"
        ? record.suggestedNextStep.trim() || null
        : null,
    intent: typeof record.intent === "string" ? record.intent.trim() : "",
    documentActions,
    actions,
    directAnswer:
      typeof record.directAnswer === "string" ? record.directAnswer.trim() || null : null,
    supportingExplanation:
      typeof record.supportingExplanation === "string"
        ? record.supportingExplanation.trim() || null
        : null,
    followUpQuestion:
      typeof record.followUpQuestion === "string"
        ? record.followUpQuestion.trim() || null
        : null,
    followUpQuestionKey:
      typeof record.followUpQuestionKey === "string"
        ? record.followUpQuestionKey.trim() || null
        : null,
    requestType: typeof record.requestType === "string" ? record.requestType.trim() || null : null,
    answerability:
      typeof record.answerability === "string" ? record.answerability.trim() || null : null,
    responseAction:
      typeof record.responseAction === "string" ? record.responseAction.trim() || null : null,
    attachmentIds: asStringArray(record.attachmentIds),
  };
}
