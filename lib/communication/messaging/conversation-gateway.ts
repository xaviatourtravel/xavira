import type {
  EngineMessage,
  MessageChannel,
} from "@/lib/communication/messaging/types";
import type { MessageDeliveryStatus } from "@/lib/communication/messaging/delivery";
import type { Profile } from "@/types/app-types";
import type { createClient } from "@/utils/supabase/server";

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Channel-neutral view of a conversation, just enough for the engine to route a
// message and authorise the sender. Each gateway maps its native conversation
// row into this shape.
export type GatewayConversation = {
  id: string;
  channel: MessageChannel;
  /** Recipient address handed to the adapter (phone number, handle, …). */
  recipient: string;
  /** Provider instance / account identifier. */
  instance: string | null;
  assignedUserId: string | null;
};

// A ConversationGateway owns persistence for a channel: where conversations and
// messages live, how permission is decided, and how a conversation's summary is
// kept fresh. The adapter handles the provider; the gateway handles our DB.
export interface ConversationGateway {
  readonly channel: MessageChannel;

  loadConversation(
    supabase: SupabaseServerClient,
    organizationId: string,
    conversationId: string,
  ): Promise<GatewayConversation | null>;

  canReply(profile: Profile, conversation: GatewayConversation): boolean;

  insertPendingMessage(
    supabase: SupabaseServerClient,
    conversation: GatewayConversation,
    text: string,
  ): Promise<EngineMessage>;

  loadMessage(
    supabase: SupabaseServerClient,
    messageId: string,
  ): Promise<EngineMessage | null>;

  updateMessageStatus(
    supabase: SupabaseServerClient,
    messageId: string,
    status: MessageDeliveryStatus,
    providerMessageId?: string | null,
  ): Promise<EngineMessage>;

  updateConversationSummary(
    supabase: SupabaseServerClient,
    organizationId: string,
    conversationId: string,
    text: string,
    at: string,
  ): Promise<void>;
}
