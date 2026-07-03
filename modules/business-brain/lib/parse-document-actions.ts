import type { BusinessBrainContext } from "@/modules/business-brain/types/context";
import type { PlaygroundDocumentActionDisplay } from "@/modules/business-brain/types/playground";
import type { WhatsAppDocumentAction } from "@/modules/business-brain/types/prompt";

function normalizeActionConfidence(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  const normalized = value > 1 ? value / 100 : value;
  return Math.max(0, Math.min(1, Number(normalized.toFixed(2))));
}

export function parseDocumentActions(value: unknown): WhatsAppDocumentAction[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const actions: WhatsAppDocumentAction[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }

    const record = item as Record<string, unknown>;
    const documentId =
      typeof record.documentId === "string" ? record.documentId.trim() : "";
    const action = record.action === "SEND_DOCUMENT" ? "SEND_DOCUMENT" : null;
    const reason = typeof record.reason === "string" ? record.reason.trim() : "";

    if (!documentId || !action || !reason) {
      continue;
    }

    actions.push({
      documentId,
      action,
      reason,
      confidence: normalizeActionConfidence(record.confidence),
    });
  }

  return actions;
}

export function resolveDocumentActionDisplays(
  context: BusinessBrainContext,
  documentActions: WhatsAppDocumentAction[],
): PlaygroundDocumentActionDisplay[] {
  return documentActions.map((item) => {
    const document = context.documents.find((entry) => entry.id === item.documentId);
    return {
      documentId: item.documentId,
      documentName: document?.name?.trim() || item.documentId,
      action: item.action,
      reason: item.reason,
      confidence: item.confidence,
    };
  });
}
