import type { AiEventType } from "@/lib/whatsapp-inbox/ai/types";
import type { WhatsappSupabaseClient } from "@/lib/whatsapp-inbox/repository";

export type AiActivityFilter =
  | "all"
  | "replies"
  | "handoffs"
  | "skipped"
  | "documents"
  | "errors";

export type AiActivityEventCategory =
  | "reply"
  | "handoff"
  | "skipped"
  | "document"
  | "error"
  | "state"
  | "other";

export type WhatsappAiAuditEvent = {
  id: string;
  eventType: AiEventType;
  category: AiActivityEventCategory;
  label: string;
  detail?: string;
  reason?: string;
  confidence?: number;
  usedSources?: string[];
  documentAction?: string;
  intent?: string;
  previousState?: string;
  nextState?: string;
  timestamp: string;
};

/** @deprecated Use WhatsappAiAuditEvent */
export type WhatsappAiActivityEvent = WhatsappAiAuditEvent;

const AUDIT_EVENT_TYPES: AiEventType[] = [
  "AI_INTENT_CLASSIFIED",
  "AI_REPLY_SENT",
  "AI_HANDOFF_TRIGGERED",
  "AI_SKIPPED",
  "AI_STATE_CHANGED",
  "AI_LLM_REPLY_STARTED",
  "AI_LLM_REPLY_SENT",
  "AI_LLM_HANDOFF",
  "AI_LLM_FAILED",
  "AI_LLM_SKIPPED",
  "AI_DOCUMENT_SEND_ATTEMPTED",
  "AI_DOCUMENT_SENT",
  "AI_DOCUMENT_FAILED",
  "AI_DOCUMENT_SKIPPED",
  "AI_VALIDATION_PASSED",
  "AI_VALIDATION_FAILED",
  "AI_RESPONSE_SANITIZED",
  "AI_REPLY_QUALITY_CHANGED",
  "AI_REPLY_QUALITY_PASSED",
  "CONTEXT_RETRIEVED",
  "MEMORY_CREATED",
  "MEMORY_UPDATED",
  "MEMORY_USED",
  "MEMORY_EXTRACTION_STARTED",
  "MEMORY_EXTRACTION_COMPLETED",
  "MEMORY_EXTRACTION_SKIPPED",
  "LEAD_QUALIFICATION_UPDATED",
  "ACTION_RECOMMENDED",
  "ACTION_APPROVED",
  "ACTION_REJECTED",
  "ACTION_EXECUTED",
  "ACTION_FAILED",
  "ACTION_MANUALLY_APPROVED",
  "ACTION_MANUALLY_REJECTED",
  "ACTION_EXECUTED_AFTER_APPROVAL",
  "ACTION_PERMISSION_BLOCKED",
  "ACTION_PERMISSION_APPROVED",
  "ACTION_RETRY_ATTEMPTED",
  "ACTION_RETRY_SUCCEEDED",
  "ACTION_RETRY_FAILED",
  "ACTION_SCHEDULED",
  "ACTION_SCHEDULE_EXECUTED",
  "ACTION_SCHEDULE_CANCELLED",
  "ACTION_EXECUTED_NOW",
  "AI_FOLLOW_UP_SCHEDULED",
  "AI_FOLLOW_UP_CANCELLED",
  "AI_FOLLOW_UP_SENT",
  "AI_FOLLOW_UP_SKIPPED",
];

const AI_EVENT_LABELS: Record<AiEventType, string> = {
  AI_INTENT_CLASSIFIED: "Intent classified",
  AI_REPLY_SENT: "AI reply sent",
  AI_HANDOFF_TRIGGERED: "AI handoff triggered",
  AI_SKIPPED: "AI skipped",
  AI_STATE_CHANGED: "AI state changed",
  AI_LLM_REPLY_STARTED: "AI generating reply",
  AI_LLM_REPLY_SENT: "AI reply sent",
  AI_LLM_HANDOFF: "AI handoff triggered",
  AI_LLM_FAILED: "AI reply failed",
  AI_LLM_SKIPPED: "AI skipped",
  AI_DOCUMENT_SEND_ATTEMPTED: "Document send attempted",
  AI_DOCUMENT_SENT: "AI document sent",
  AI_DOCUMENT_FAILED: "Document send failed",
  AI_DOCUMENT_SKIPPED: "Document send skipped",
  AI_VALIDATION_PASSED: "AI validation passed",
  AI_VALIDATION_FAILED: "AI validation failed",
  AI_RESPONSE_SANITIZED: "AI response sanitized",
  AI_REPLY_QUALITY_CHANGED: "AI reply quality improved",
  AI_REPLY_QUALITY_PASSED: "AI reply quality passed",
  CONTEXT_RETRIEVED: "Context retrieved",
  MEMORY_CREATED: "Memory created",
  MEMORY_UPDATED: "Memory updated",
  MEMORY_USED: "Memory used",
  MEMORY_EXTRACTION_STARTED: "Memory extraction started",
  MEMORY_EXTRACTION_COMPLETED: "Memory extraction completed",
  MEMORY_EXTRACTION_SKIPPED: "Memory extraction skipped",
  LEAD_QUALIFICATION_UPDATED: "Lead qualification updated",
  ACTION_RECOMMENDED: "Action recommended",
  ACTION_APPROVED: "Action approved",
  ACTION_REJECTED: "Action rejected",
  ACTION_EXECUTED: "Action executed",
  ACTION_FAILED: "Action failed",
  ACTION_MANUALLY_APPROVED: "Action manually approved",
  ACTION_MANUALLY_REJECTED: "Action manually rejected",
  ACTION_EXECUTED_AFTER_APPROVAL: "Action executed after approval",
  ACTION_PERMISSION_BLOCKED: "Action blocked by permission",
  ACTION_PERMISSION_APPROVED: "Action passed permission check",
  ACTION_RETRY_ATTEMPTED: "Action retry attempted",
  ACTION_RETRY_SUCCEEDED: "Action retry succeeded",
  ACTION_RETRY_FAILED: "Action retry failed",
  ACTION_SCHEDULED: "Action scheduled",
  ACTION_SCHEDULE_EXECUTED: "Scheduled action executed",
  ACTION_SCHEDULE_CANCELLED: "Scheduled action cancelled",
  ACTION_EXECUTED_NOW: "Scheduled action executed now",
  AI_FOLLOW_UP_SCHEDULED: "AI follow-up scheduled",
  AI_FOLLOW_UP_CANCELLED: "AI follow-up cancelled",
  AI_FOLLOW_UP_SENT: "AI follow-up sent",
  AI_FOLLOW_UP_SKIPPED: "AI follow-up skipped",
};

const REPLY_EVENT_TYPES = new Set<AiEventType>([
  "AI_REPLY_SENT",
  "AI_LLM_REPLY_SENT",
  "AI_VALIDATION_PASSED",
  "AI_REPLY_QUALITY_PASSED",
  "AI_REPLY_QUALITY_CHANGED",
  "AI_RESPONSE_SANITIZED",
  "AI_LLM_REPLY_STARTED",
]);

const HANDOFF_EVENT_TYPES = new Set<AiEventType>([
  "AI_HANDOFF_TRIGGERED",
  "AI_LLM_HANDOFF",
]);

const SKIPPED_EVENT_TYPES = new Set<AiEventType>([
  "AI_SKIPPED",
  "AI_LLM_SKIPPED",
]);

const DOCUMENT_EVENT_TYPES = new Set<AiEventType>([
  "AI_DOCUMENT_SEND_ATTEMPTED",
  "AI_DOCUMENT_SENT",
  "AI_DOCUMENT_FAILED",
  "AI_DOCUMENT_SKIPPED",
]);

const ERROR_EVENT_TYPES = new Set<AiEventType>([
  "AI_VALIDATION_FAILED",
  "AI_LLM_FAILED",
  "AI_DOCUMENT_FAILED",
]);

export function getAiActivityEventCategory(
  eventType: AiEventType,
): AiActivityEventCategory {
  if (REPLY_EVENT_TYPES.has(eventType)) return "reply";
  if (HANDOFF_EVENT_TYPES.has(eventType)) return "handoff";
  if (SKIPPED_EVENT_TYPES.has(eventType)) return "skipped";
  if (DOCUMENT_EVENT_TYPES.has(eventType)) return "document";
  if (ERROR_EVENT_TYPES.has(eventType)) return "error";
  if (eventType === "AI_STATE_CHANGED") return "state";
  return "other";
}

export function matchesAiActivityFilter(
  event: WhatsappAiAuditEvent,
  filter: AiActivityFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "replies") return event.category === "reply";
  if (filter === "handoffs") {
    return event.category === "handoff" || event.category === "state";
  }
  if (filter === "skipped") return event.category === "skipped";
  if (filter === "documents") return event.category === "document";
  if (filter === "errors") return event.category === "error";
  return true;
}

function readMetadataString(
  metadata: Record<string, unknown>,
  key: string,
): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readMetadataStringArray(
  metadata: Record<string, unknown>,
  key: string,
): string[] {
  const value = metadata[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

function readMetadataNumber(
  metadata: Record<string, unknown>,
  key: string,
): number | null {
  const value = metadata[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatConfidence(value: number | null | undefined): number | undefined {
  if (value == null || !Number.isFinite(value)) {
    return undefined;
  }

  return value > 1 ? value / 100 : value;
}

function formatDocumentAction(metadata: Record<string, unknown>): string | undefined {
  const documentName = readMetadataString(metadata, "documentName");
  const action = readMetadataString(metadata, "action");
  const reason = readMetadataString(metadata, "reason");

  if (documentName && action) {
    return `${action}: ${documentName}${reason ? ` (${reason})` : ""}`;
  }

  if (documentName) {
    return `Document: ${documentName}`;
  }

  const documentActions = metadata.documentActions;
  if (!Array.isArray(documentActions) || documentActions.length === 0) {
    return undefined;
  }

  const summaries = documentActions
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const record = item as Record<string, unknown>;
      const docAction = readMetadataString(record, "action");
      const docId = readMetadataString(record, "documentId");
      const docReason = readMetadataString(record, "reason");

      if (docAction && docId) {
        return `${docAction} · ${docId.slice(0, 8)}${docReason ? ` (${docReason})` : ""}`;
      }

      return null;
    })
    .filter((item): item is string => item !== null);

  return summaries.length > 0 ? summaries.join("; ") : undefined;
}

function buildDetailPreview(metadata: Record<string, unknown>): string | undefined {
  return (
    readMetadataString(metadata, "replyPreview") ??
    readMetadataString(metadata, "improvedPreview") ??
    readMetadataString(metadata, "sanitizedPreview") ??
    readMetadataString(metadata, "originalPreview") ??
    readMetadataString(metadata, "validationReason") ??
    readMetadataString(metadata, "error") ??
    readMetadataString(metadata, "code") ??
    undefined
  );
}

function resolveUsedSources(
  metadata: Record<string, unknown>,
): string[] | undefined {
  const sources = readMetadataStringArray(metadata, "usedSources");
  return sources.length > 0 ? sources : undefined;
}

function resolveConfidence(
  rowConfidence: number | null,
  metadata: Record<string, unknown>,
): number | undefined {
  const fromRow = formatConfidence(rowConfidence);
  if (fromRow != null) {
    return fromRow;
  }

  const fromMetadata =
    formatConfidence(readMetadataNumber(metadata, "confidence")) ??
    formatConfidence(readMetadataNumber(metadata, "llmConfidence"));

  return fromMetadata;
}

export function formatWhatsappAiAuditEvent(input: {
  id: string;
  eventType: string;
  intent: string | null;
  confidence: number | null;
  previousState: string | null;
  nextState: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}): WhatsappAiAuditEvent | null {
  if (!AUDIT_EVENT_TYPES.includes(input.eventType as AiEventType)) {
    return null;
  }

  const eventType = input.eventType as AiEventType;
  const metadata = input.metadata;
  const documentAction = formatDocumentAction(metadata);
  const usedSources = resolveUsedSources(metadata);
  const confidence = resolveConfidence(input.confidence, metadata);

  let label = AI_EVENT_LABELS[eventType];
  let reason = input.reason?.trim() || undefined;
  let detail = buildDetailPreview(metadata);

  if (eventType === "AI_DOCUMENT_SENT") {
    const documentName = readMetadataString(metadata, "documentName") ?? "document";
    label = `AI document sent: ${documentName}`;
    reason = reason ?? readMetadataString(metadata, "reason") ?? undefined;
  }

  if (eventType === "AI_DOCUMENT_FAILED") {
    const documentName = readMetadataString(metadata, "documentName") ?? "document";
    label = `Document send failed: ${documentName}`;
    reason = reason ?? readMetadataString(metadata, "error") ?? undefined;
  }

  if (eventType === "AI_DOCUMENT_SKIPPED") {
    const documentName = readMetadataString(metadata, "documentName");
    label = documentName
      ? `Document send skipped: ${documentName}`
      : "Document send skipped";
    reason = reason ?? readMetadataString(metadata, "code") ?? undefined;
  }

  if (eventType === "AI_STATE_CHANGED" && input.previousState && input.nextState) {
    label = `AI state: ${input.previousState} → ${input.nextState}`;
  }

  if (eventType === "AI_LLM_SKIPPED" || eventType === "AI_SKIPPED") {
    reason = reason ?? readMetadataString(metadata, "code") ?? undefined;
  }

  if (eventType === "AI_REPLY_QUALITY_CHANGED") {
    const changes = readMetadataStringArray(metadata, "changes");
    if (changes.length > 0) {
      reason = changes.join(", ");
    }
  }

  if (eventType === "CONTEXT_RETRIEVED") {
    const productCount = readMetadataNumber(metadata, "productCount");
    const articleCount = readMetadataNumber(metadata, "articleCount");
    const documentCount = readMetadataNumber(metadata, "documentCount");
    const keywords = readMetadataStringArray(metadata, "matchedKeywords");
    label = "Context retrieved";
    reason =
      productCount != null && articleCount != null && documentCount != null
        ? `Products ${productCount}, articles ${articleCount}, documents ${documentCount}`
        : undefined;
    if (keywords.length > 0) {
      detail = `Keywords: ${keywords.join(", ")}`;
    }
  }

  if (eventType === "MEMORY_CREATED" || eventType === "MEMORY_UPDATED") {
    const memoryKey = readMetadataString(metadata, "memoryKey");
    const memoryValue = readMetadataString(metadata, "memoryValue");
    if (memoryKey && memoryValue) {
      detail = `${memoryKey}: ${memoryValue}`;
    }
  }

  if (eventType === "MEMORY_USED") {
    const memoryKeys = readMetadataStringArray(metadata, "memoryKeys");
    if (memoryKeys.length > 0) {
      detail = `Keys: ${memoryKeys.join(", ")}`;
    }
  }

  if (eventType === "MEMORY_EXTRACTION_COMPLETED") {
    const memoryKeys = readMetadataStringArray(metadata, "memoryKeys");
    const extractedCount = readMetadataNumber(metadata, "extractedCount");
    if (memoryKeys.length > 0) {
      detail = `Extracted: ${memoryKeys.join(", ")}`;
    }
    if (extractedCount != null) {
      reason = `${extractedCount} item(s)`;
    }
  }

  if (eventType === "MEMORY_EXTRACTION_SKIPPED") {
    reason = readMetadataString(metadata, "reason") ?? "No memories extracted";
  }

  if (eventType === "LEAD_QUALIFICATION_UPDATED") {
    const completionScore = readMetadataNumber(metadata, "completionScore");
    const qualificationStatus = readMetadataString(metadata, "qualificationStatus");
    const missingFields = readMetadataStringArray(metadata, "missingFields");
    if (completionScore != null) {
      reason = `${completionScore}% · ${qualificationStatus ?? "UNKNOWN"}`;
    }
    if (missingFields.length > 0) {
      detail = `Missing: ${missingFields.join(", ")}`;
    }
  }

  return {
    id: input.id,
    eventType,
    category: getAiActivityEventCategory(eventType),
    label,
    detail,
    reason,
    confidence,
    usedSources,
    documentAction,
    intent: input.intent?.trim() || undefined,
    previousState: input.previousState?.trim() || undefined,
    nextState: input.nextState?.trim() || undefined,
    timestamp: input.createdAt,
  };
}

/** @deprecated Use formatWhatsappAiAuditEvent */
export function formatWhatsappAiActivityEvent(
  input: Parameters<typeof formatWhatsappAiAuditEvent>[0],
): WhatsappAiAuditEvent | null {
  return formatWhatsappAiAuditEvent(input);
}

export async function loadWhatsappAiActivityEvents(
  supabase: WhatsappSupabaseClient,
  conversationId: string,
  limit = 50,
): Promise<WhatsappAiAuditEvent[]> {
  const { data, error } = await supabase
    .from("ai_events")
    .select(
      "id, event_type, intent, confidence, previous_state, next_state, reason, metadata, created_at",
    )
    .eq("conversation_id", conversationId)
    .in("event_type", AUDIT_EVENT_TYPES)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[WA_AI] failed to load ai activity events", {
      conversationId,
      error: error.message,
    });
    return [];
  }

  return (data ?? [])
    .map((row) =>
      formatWhatsappAiAuditEvent({
        id: row.id,
        eventType: row.event_type,
        intent: row.intent,
        confidence: row.confidence,
        previousState: row.previous_state,
        nextState: row.next_state,
        reason: row.reason,
        metadata:
          row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
            ? (row.metadata as Record<string, unknown>)
            : {},
        createdAt: row.created_at,
      }),
    )
    .filter((item): item is WhatsappAiAuditEvent => item !== null);
}
