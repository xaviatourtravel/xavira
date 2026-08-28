/**
 * Inbox server-side observability (INBOX-001).
 * Logs structured failures for Vercel without leaking message bodies or secrets.
 */

export type InboxLogStage =
  | "resolve_context"
  | "validate_conversation_id"
  | "load_conversation"
  | "load_messages"
  | "load_notes"
  | "load_tags"
  | "load_assignment_history"
  | "load_customer"
  | "load_channel_identity"
  | "load_profile_picture"
  | "load_ai_state"
  | "build_view_model";

export type InboxLogOperation =
  | "load_inbox"
  | "load_conversation"
  | "load_conversation_list";

export type InboxObservabilityEvent = {
  scope: "inbox";
  operation: InboxLogOperation;
  stage: InboxLogStage;
  diagnosticId: string;
  conversationId?: string | null;
  organizationId?: string | null;
  channel?: string | null;
  errorCode?: string | null;
  errorName?: string | null;
  message: string;
};

const SENSITIVE_KEY_PATTERN =
  /(content|body|text|message|phone|email|token|secret|password|credential|payload|transcript|authorization|api[_-]?key)/i;

export function createInboxDiagnosticId(now = Date.now()): string {
  const random = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .toUpperCase()
    .padStart(6, "0");
  // Mix time nibble so IDs are unique enough across a short window without crypto deps.
  const timeNibble = (now % 0xfff).toString(16).toUpperCase().padStart(3, "0");
  return `INB-${random.slice(0, 3)}${timeNibble.slice(0, 3)}`.slice(0, 10);
}

const CONVERSATION_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidConversationIdShape(value: string): boolean {
  return CONVERSATION_UUID_RE.test(value.trim());
}

export function extractSafeErrorFields(error: unknown): {
  errorCode: string | null;
  errorName: string | null;
  message: string;
} {
  if (error instanceof Error) {
    return {
      errorCode:
        "code" in error && typeof (error as { code?: unknown }).code === "string"
          ? (error as { code: string }).code
          : null,
      errorName: error.name || "Error",
      message: sanitizeErrorMessage(error.message),
    };
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const rawMessage =
      typeof record.message === "string"
        ? record.message
        : typeof record.error === "string"
          ? record.error
          : "Unknown error";
    return {
      errorCode: typeof record.code === "string" ? record.code : null,
      errorName: typeof record.name === "string" ? record.name : "Error",
      message: sanitizeErrorMessage(rawMessage),
    };
  }

  return {
    errorCode: null,
    errorName: "Error",
    message: sanitizeErrorMessage(String(error ?? "Unknown error")),
  };
}

/** Strip obvious PII / provider payloads from free-form error messages. */
export function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/\b[\w.+-]+@[\w.-]+\.\w+\b/g, "[redacted-email]")
    .replace(/\+?\d[\d\s()-]{7,}\d/g, "[redacted-phone]")
    .replace(
      /\b(eyJ[A-Za-z0-9_-]{10,}|sk-[A-Za-z0-9]{10,}|Bearer\s+\S+)/gi,
      "[redacted-token]",
    )
    .slice(0, 400);
}

export function sanitizeLogPayload(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      out[key] = "[redacted]";
      continue;
    }
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      out[key] = sanitizeLogPayload(entry as Record<string, unknown>);
      continue;
    }
    if (typeof entry === "string" && entry.length > 200) {
      out[key] = `${entry.slice(0, 120)}…[truncated]`;
      continue;
    }
    out[key] = entry;
  }
  return out;
}

export function logInboxFailure(
  event: Omit<InboxObservabilityEvent, "scope" | "message"> & {
    message?: string;
    error?: unknown;
  },
): InboxObservabilityEvent {
  const safe = extractSafeErrorFields(event.error ?? event.message ?? "Error");
  const payload: InboxObservabilityEvent = {
    scope: "inbox",
    operation: event.operation,
    stage: event.stage,
    diagnosticId: event.diagnosticId,
    conversationId: event.conversationId ?? null,
    organizationId: event.organizationId ?? null,
    channel: event.channel ?? null,
    errorCode: event.errorCode ?? safe.errorCode,
    errorName: event.errorName ?? safe.errorName,
    message: event.message ? sanitizeErrorMessage(event.message) : safe.message,
  };

  console.error("[inbox]", sanitizeLogPayload({ ...payload }));
  return payload;
}

export function logInboxWarning(
  event: Omit<InboxObservabilityEvent, "scope" | "message"> & {
    message: string;
    error?: unknown;
  },
): void {
  const safe = extractSafeErrorFields(event.error ?? event.message);
  console.warn(
    "[inbox]",
    sanitizeLogPayload({
      scope: "inbox",
      operation: event.operation,
      stage: event.stage,
      diagnosticId: event.diagnosticId,
      conversationId: event.conversationId ?? null,
      organizationId: event.organizationId ?? null,
      channel: event.channel ?? null,
      errorCode: event.errorCode ?? safe.errorCode,
      errorName: event.errorName ?? safe.errorName,
      message: sanitizeErrorMessage(event.message),
    }),
  );
}

export type SafeConversationLoadResult =
  | { status: "none" }
  | { status: "invalid_id"; diagnosticId: string }
  | { status: "not_found"; diagnosticId: string }
  | {
      status: "error";
      diagnosticId: string;
    }
  | {
      status: "ok";
      // Keep generic so callers pass their detail type.
      detail: unknown;
    };
