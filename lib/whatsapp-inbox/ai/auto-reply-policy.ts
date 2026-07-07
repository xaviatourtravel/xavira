import type { WhatsappAiState } from "@/types/whatsapp-inbox";

export function shouldAllowWhatsappAutoReply(
  globalAutoReplyEnabled: boolean,
  conversationState: WhatsappAiState,
): boolean {
  const isManual = conversationState === "HUMAN_ONLY";
  const isAiActive = conversationState === "AI_ACTIVE";

  return (
    (globalAutoReplyEnabled && !isManual) ||
    (!globalAutoReplyEnabled && isAiActive)
  );
}
