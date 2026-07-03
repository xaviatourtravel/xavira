import type { WhatsappAiState } from "@/types/whatsapp-inbox";

export const WHATSAPP_AI_STATES = [
  "AI_ACTIVE",
  "READY_FOR_HUMAN",
  "HUMAN_ASSISTED",
  "HUMAN_ONLY",
] as const satisfies readonly WhatsappAiState[];

/** States agents can set manually from the inbox / AI Command Center. */
export const WHATSAPP_MANUAL_AI_STATES = [
  "AI_ACTIVE",
  "READY_FOR_HUMAN",
  "HUMAN_ASSISTED",
  "HUMAN_ONLY",
] as const satisfies readonly WhatsappAiState[];

/** New conversations start with AI off until explicitly enabled. */
export const DEFAULT_WHATSAPP_AI_STATE: WhatsappAiState = "HUMAN_ONLY";

export const WHATSAPP_HUMAN_REPLY_COOLDOWN_MS = 10 * 60 * 1000;
/** Wait after the latest incoming message before processing a customer turn batch. */
export const WHATSAPP_AI_DEBOUNCE_MS = 2 * 1000;

export const WHATSAPP_AI_STATE_LABELS: Record<WhatsappAiState, string> = {
  AI_ACTIVE: "AI Active",
  READY_FOR_HUMAN: "Ready for Human",
  HUMAN_ASSISTED: "Human Assisted",
  HUMAN_ONLY: "Human Only",
};

export const WHATSAPP_AI_STATE_DESCRIPTIONS: Record<WhatsappAiState, string> = {
  AI_ACTIVE: "AI will auto-reply in this chat.",
  READY_FOR_HUMAN: "Waiting for a human teammate to take over.",
  HUMAN_ASSISTED: "AI can suggest, but will not auto-reply.",
  HUMAN_ONLY: "AI will not reply automatically.",
};

export function parseWhatsappAiState(
  value: string | null | undefined,
): WhatsappAiState | null {
  if (!value) {
    return null;
  }

  return WHATSAPP_AI_STATES.includes(value as WhatsappAiState)
    ? (value as WhatsappAiState)
    : null;
}

/** Null, empty, or invalid values are treated as HUMAN_ONLY. */
export function resolveWhatsappAiState(
  value: string | null | undefined,
): WhatsappAiState {
  return parseWhatsappAiState(value) ?? DEFAULT_WHATSAPP_AI_STATE;
}

export function formatWhatsappAiStateLabel(
  state: WhatsappAiState | null | undefined,
): string {
  return WHATSAPP_AI_STATE_LABELS[resolveWhatsappAiState(state)];
}

export function getWhatsappAiStateDescription(
  state: WhatsappAiState | null | undefined,
  handoffReason?: string | null,
): string {
  const resolved = resolveWhatsappAiState(state);

  if (resolved === "READY_FOR_HUMAN" && handoffReason?.trim()) {
    return handoffReason.trim();
  }

  return WHATSAPP_AI_STATE_DESCRIPTIONS[resolved];
}

export function parseWhatsappManualAiState(
  value: string | null | undefined,
): (typeof WHATSAPP_MANUAL_AI_STATES)[number] | null {
  if (!value) {
    return null;
  }

  return (WHATSAPP_MANUAL_AI_STATES as readonly string[]).includes(value)
    ? (value as (typeof WHATSAPP_MANUAL_AI_STATES)[number])
    : null;
}

export function isWhatsappAiAutoReplyEnabled(
  state: WhatsappAiState | null | undefined,
): boolean {
  return resolveWhatsappAiState(state) === "AI_ACTIVE";
}

