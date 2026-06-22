import type { AuditMetadata } from "./types";

const BLOCKED_METADATA_KEYS = new Set([
  "token",
  "access_token",
  "refresh_token",
  "page_access_token",
  "api_key",
  "apikey",
  "secret",
  "password",
  "authorization",
  "message_text",
  "message_body",
  "reply_body",
  "notes_body",
  "credential",
  "credentials",
  "webhook_secret",
  "app_secret",
]);

function isBlockedKey(key: string) {
  const normalized = key.toLowerCase();
  return (
    BLOCKED_METADATA_KEYS.has(normalized) ||
    normalized.includes("token") ||
    normalized.includes("secret") ||
    normalized.includes("password") ||
    normalized.includes("credential") ||
    normalized.includes("meta_")
  );
}

export function sanitizeAuditMetadata(
  metadata: AuditMetadata | null | undefined,
): AuditMetadata {
  if (!metadata) {
    return {};
  }

  const sanitized: AuditMetadata = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (isBlockedKey(key)) {
      continue;
    }

    if (typeof value === "string" && value.length > 500) {
      sanitized[key] = `${value.slice(0, 500)}…`;
      continue;
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
