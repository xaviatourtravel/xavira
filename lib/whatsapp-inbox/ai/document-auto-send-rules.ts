import type { BrainDocumentTrigger } from "@/modules/business-brain/types/documents";
import { inferDocumentTypeFromMime } from "@/modules/business-brain/types/documents";
import type { WhatsAppDocumentAction } from "@/modules/business-brain/types/prompt";

export const MIN_DOCUMENT_AUTO_SEND_CONFIDENCE = 0.85;
export const MAX_DOCUMENTS_PER_AI_RESPONSE = 2;

const TRIGGER_KEYWORDS: Record<BrainDocumentTrigger, string[]> = {
  customer_asks_itinerary: [
    "itinerary",
    "itinerari",
    "rute",
    "jadwal harian",
    "program hari",
  ],
  customer_asks_brochure: ["brochure", "brosur", "katalog"],
  customer_asks_package_details: [
    "detail",
    "details",
    "paket",
    "packing list",
    "packing",
    "daftar barang",
  ],
  customer_asks_visa: ["visa", "visa guide", "panduan visa"],
  customer_asks_payment: ["payment", "pembayaran", "cara bayar", "metode bayar"],
  customer_asks_company_profile: [
    "company profile",
    "profil perusahaan",
    "profil company",
    "profil kantor",
  ],
};

export type DocumentAutoSendSkipCode =
  | "ai_not_active"
  | "handoff_required"
  | "human_required_intent"
  | "no_document_actions"
  | "invalid_action"
  | "low_confidence"
  | "document_not_found"
  | "workspace_mismatch"
  | "not_published"
  | "auto_send_disabled"
  | "missing_media_source"
  | "trigger_mismatch"
  | "no_triggers_configured"
  | "max_documents_reached";

export function normalizeDocumentActionConfidence(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return value > 1 ? value / 100 : value;
}

export function customerMessageMatchesDocumentTrigger(
  customerMessage: string,
  actionReason: string,
  triggers: BrainDocumentTrigger[],
): boolean {
  if (triggers.length === 0) {
    return false;
  }

  const haystack = `${customerMessage} ${actionReason}`.trim().toLowerCase();

  return triggers.some((trigger) =>
    TRIGGER_KEYWORDS[trigger].some((keyword) => haystack.includes(keyword)),
  );
}

export function selectDocumentActionsForAutoSend(
  documentActions: WhatsAppDocumentAction[],
): WhatsAppDocumentAction[] {
  return [...documentActions]
    .filter(
      (action) =>
        action.action === "SEND_DOCUMENT" &&
        normalizeDocumentActionConfidence(action.confidence) >=
          MIN_DOCUMENT_AUTO_SEND_CONFIDENCE,
    )
    .sort(
      (left, right) =>
        normalizeDocumentActionConfidence(right.confidence) -
        normalizeDocumentActionConfidence(left.confidence),
    )
    .slice(0, MAX_DOCUMENTS_PER_AI_RESPONSE);
}

export function resolveWhatsAppMediaType(
  documentType: string,
  mimeType: string | null,
): "image" | "video" | "document" {
  if (documentType === "image" || mimeType?.startsWith("image/")) {
    return "image";
  }

  if (documentType === "video" || mimeType?.startsWith("video/")) {
    return "video";
  }

  return "document";
}

export function resolveDocumentMimeType(
  documentType: string,
  mimeType: string | null,
): string {
  if (mimeType?.trim()) {
    return mimeType.trim();
  }

  if (documentType === "image") return "image/jpeg";
  if (documentType === "video") return "video/mp4";
  if (documentType === "url") return "application/pdf";
  return "application/pdf";
}

export function resolveDocumentMessageType(
  mediatype: "image" | "video" | "document",
): string {
  if (mediatype === "image") return "image";
  if (mediatype === "video") return "video";
  return "document";
}

export function inferDocumentTypeFromRecord(
  documentType: string,
  mimeType: string | null,
): "pdf" | "image" | "video" | "url" {
  if (documentType === "image" || documentType === "video" || documentType === "url") {
    return documentType;
  }

  if (mimeType) {
    return inferDocumentTypeFromMime(mimeType);
  }

  return "pdf";
}
