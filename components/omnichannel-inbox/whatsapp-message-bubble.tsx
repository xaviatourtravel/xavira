"use client";

import type { MessageRow } from "@/types/omnichannel-inbox";

import { ConversationMessageBubble } from "@/components/omnichannel-inbox/conversation-message-bubble";

type WhatsappMessageBubbleProps = {
  message: MessageRow;
  onRetry?: () => Promise<void>;
  isGroupChat?: boolean;
};

/** @deprecated Use ConversationMessageThread + ConversationMessageBubble */
export function WhatsappMessageBubble({
  message,
  onRetry,
}: WhatsappMessageBubbleProps) {
  return <ConversationMessageBubble message={message} onRetry={onRetry} />;
}
