/**
 * Normalize invoice item detail for persistence.
 * Preserves internal newlines; only trims ends and normalizes CRLF.
 */
export function normalizeInvoiceItemDetail(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  return normalized.length === 0 ? null : normalized;
}

/** Split persisted detail into PDF/UI lines. Empty lines stay as empty string. */
export function splitInvoiceItemDetailLines(
  detail: string | null | undefined,
): string[] {
  if (!detail) return [];
  return detail.split("\n");
}

/** True when detail contains at least one internal newline. */
export function invoiceItemDetailHasLineBreaks(
  detail: string | null | undefined,
): boolean {
  return typeof detail === "string" && detail.includes("\n");
}
