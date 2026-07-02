export {
  WHATSAPP_AI_STATES,
  WHATSAPP_MANUAL_AI_STATES,
  DEFAULT_WHATSAPP_AI_STATE,
  WHATSAPP_HUMAN_REPLY_COOLDOWN_MS,
  WHATSAPP_AI_DEBOUNCE_MS,
  WHATSAPP_AI_STATE_LABELS,
  formatWhatsappAiStateLabel,
  parseWhatsappAiState,
  resolveWhatsappAiState,
  isWhatsappAiAutoReplyEnabled,
  parseWhatsappManualAiState,
} from "@/lib/whatsapp-inbox/ai/constants";
export { WHATSAPP_AI_HANDOFF_REPLY } from "@/lib/whatsapp-inbox/ai/reply-service";

import { resolveWhatsappAiState } from "@/lib/whatsapp-inbox/ai/constants";
import type { WhatsappAiState } from "@/types/whatsapp-inbox";

/** @deprecated Use isWhatsappAiAutoReplyEnabled */
export function isWhatsappAiAutoReplyEnabledLegacy(
  state: WhatsappAiState | null | undefined,
): boolean {
  return resolveWhatsappAiState(state) === "AI_ACTIVE";
}

/** @deprecated Use resolveWhatsappAiState + isWhatsappAiAutoReplyEnabled */
export function shouldSkipWhatsappAiAutoReply(
  state: WhatsappAiState | null | undefined,
): boolean {
  return resolveWhatsappAiState(state) !== "AI_ACTIVE";
}
