/**
 * Hard-block terms for AI auto-reply. Messages matching these must not receive
 * a safe FAQ reply (handoff or skip only).
 */
export const AI_AUTO_REPLY_BLOCKED_TERMS = [
  "transfer",
  "bukti bayar",
  "bukti transfer",
  "invoice",
  "refund",
  "komplain",
  "keluhan",
  "diskon",
  "nego",
  "negosiasi",
  "telepon",
  "telpon",
  "telfon",
  "call",
  "booking",
] as const;

function normalizeForSafetyCheck(text: string) {
  return text.trim().toLowerCase();
}

/** Standalone "dp" token (e.g. "minta dp", "dp 5jt") without matching unrelated words. */
function containsDpToken(text: string) {
  return /\bdp\b/.test(text);
}

export function containsBlockedSafetyTerms(messageText: string): boolean {
  const text = normalizeForSafetyCheck(messageText);

  if (!text) {
    return false;
  }

  if (containsDpToken(text)) {
    return true;
  }

  return AI_AUTO_REPLY_BLOCKED_TERMS.some((term) => text.includes(term));
}
