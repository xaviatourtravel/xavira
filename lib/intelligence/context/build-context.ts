import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { getConversationDisplayName } from "@/components/omnichannel-inbox/inbox-display";
import { mapConversationToWorkspace } from "@/lib/communication-workspace/map-conversation";
import type { ConversationContext } from "@/lib/intelligence/context/types";

export function buildConversationContext(
  conversation: OmnichannelConversationDetail,
  organizationId: string,
): ConversationContext {
  const workspace = mapConversationToWorkspace(conversation);
  const incomingMessages = conversation.messages.filter(
    (message) => message.direction === "incoming",
  );

  const lastIncoming = [...incomingMessages]
    .reverse()
    .find((message) => message.message_text?.trim());

  return {
    conversationId: conversation.id,
    organizationId,
    channel: workspace.channel,
    channelLabel: workspace.channelLabel,
    customerName: getConversationDisplayName(conversation),
    phone: workspace.phone,
    leadId: conversation.leadId,
    messageCount: conversation.messages.length,
    incomingMessageCount: incomingMessages.length,
    lastIncomingText: lastIncoming?.message_text?.trim() ?? null,
    hasLinkedLead: Boolean(conversation.leadId),
    createdAt: conversation.createdAt,
  };
}

export function hasConversationSignal(context: ConversationContext) {
  return context.incomingMessageCount > 0;
}
