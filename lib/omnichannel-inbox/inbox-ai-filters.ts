import { resolveWhatsappAiState } from "@/lib/whatsapp-inbox/ai/constants";
import type { OmnichannelConversationListItem, OmnichannelInboxFilter } from "@/lib/omnichannel-inbox/queries";
import type { WhatsappAiState } from "@/types/whatsapp-inbox";

export const WHATSAPP_AI_INBOX_FILTERS = [
  "ready_for_human",
  "ai_active",
  "human_assisted",
  "human_only",
] as const;

export type WhatsappAiInboxFilter = (typeof WHATSAPP_AI_INBOX_FILTERS)[number];

export function isWhatsappAiInboxFilter(
  filter: OmnichannelInboxFilter,
): filter is WhatsappAiInboxFilter {
  return (WHATSAPP_AI_INBOX_FILTERS as readonly string[]).includes(filter);
}

export function getAiStateForInboxFilter(
  filter: WhatsappAiInboxFilter,
): WhatsappAiState {
  switch (filter) {
    case "ready_for_human":
      return "READY_FOR_HUMAN";
    case "ai_active":
      return "AI_ACTIVE";
    case "human_assisted":
      return "HUMAN_ASSISTED";
    case "human_only":
      return "HUMAN_ONLY";
  }
}

export function countWhatsappConversationsByAiState(
  conversations: OmnichannelConversationListItem[],
  state: WhatsappAiState,
): number {
  return conversations.filter(
    (conversation) =>
      conversation.channel === "whatsapp" &&
      resolveWhatsappAiState(conversation.aiState) === state,
  ).length;
}

export function sortReadyForHumanConversations(
  conversations: OmnichannelConversationListItem[],
): OmnichannelConversationListItem[] {
  return [...conversations].sort((left, right) => {
    const leftHandoff = left.aiLastActionAt ? Date.parse(left.aiLastActionAt) : 0;
    const rightHandoff = right.aiLastActionAt ? Date.parse(right.aiLastActionAt) : 0;

    if (rightHandoff !== leftHandoff) {
      return rightHandoff - leftHandoff;
    }

    const leftMessage = left.lastMessageAt ? Date.parse(left.lastMessageAt) : 0;
    const rightMessage = right.lastMessageAt ? Date.parse(right.lastMessageAt) : 0;

    return rightMessage - leftMessage;
  });
}
