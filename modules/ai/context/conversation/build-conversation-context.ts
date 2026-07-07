export type BuildConversationContextInput = {
  conversationId?: string | null;
  channel?: string | null;
};

export type ConversationContext = {
  available: boolean;
  conversationId: string | null;
  channel: string | null;
};

export function buildConversationContext(
  input?: BuildConversationContextInput,
): ConversationContext {
  const conversationId = input?.conversationId?.trim() || null;
  const channel = input?.channel?.trim() || null;

  return {
    available: Boolean(conversationId),
    conversationId,
    channel,
  };
}
