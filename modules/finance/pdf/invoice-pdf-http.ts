/** Safe HTTP helpers for invoice PDF routes (no stack traces, cache policy). */

export function invoicePdfCacheControl(params: {
  kind: "draft_preview" | "issued_ready" | "not_ready" | "error";
}): string {
  switch (params.kind) {
    case "draft_preview":
      return "no-store";
    case "not_ready":
    case "error":
      return "no-store";
    case "issued_ready":
      // Private browser cache only — never public/CDN shared caching.
      return "private, max-age=3600";
    default:
      return "no-store";
  }
}

export function sanitizeClientPdfError(message: unknown): string {
  const raw =
    message instanceof Error
      ? message.message
      : typeof message === "string"
        ? message
        : "Unable to load invoice PDF";
  // Strip stack-like content and newlines
  return raw
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+at\s+\S+/g, "")
    .slice(0, 200);
}

export function safePdfErrorCode(code: unknown): string {
  const raw = typeof code === "string" ? code.trim() : "";
  if (!raw || raw.length > 64) return "RENDER_FAILED";
  if (/(stack|exception|Error:)/i.test(raw)) return "RENDER_FAILED";
  if (!/^[A-Z0-9_]+$/i.test(raw)) return "RENDER_FAILED";
  return raw.slice(0, 64);
}
