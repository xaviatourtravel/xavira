import {
  MetaMessagingError,
  resolveMetaMessagingCredentials,
  sendMetaChannelMessage,
} from "@/lib/omnichannel-inbox/meta-messaging";
import { canReplyToOmnichannelConversation } from "@/lib/omnichannel-inbox/permissions";
import { findConversationById, insertMessage } from "@/lib/omnichannel-inbox/repository";
import { OmnichannelInboxError } from "@/lib/omnichannel-inbox/service";
import type { Profile } from "@/types/app-types";
import type { MessageRow } from "@/types/omnichannel-inbox";
import type { createClient } from "@/utils/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export class OmnichannelSendReplyError extends Error {
  readonly code:
    | "permission_denied"
    | "conversation_not_found"
    | "invalid_message"
    | "integration_missing"
    | "channel_not_supported"
    | "meta_api_failed"
    | "recipient_missing"
    | "unknown";

  constructor(
    code: OmnichannelSendReplyError["code"],
    message: string,
  ) {
    super(message);
    this.name = "OmnichannelSendReplyError";
    this.code = code;
  }
}

function mapMetaMessagingError(error: MetaMessagingError): OmnichannelSendReplyError {
  return new OmnichannelSendReplyError(error.code, error.message);
}

export async function sendConversationReply(
  supabase: SupabaseClient,
  organizationId: string,
  profile: Profile,
  conversationId: string,
  messageText: string,
): Promise<MessageRow> {
  const trimmed = messageText.trim();

  if (!trimmed) {
    throw new OmnichannelSendReplyError(
      "invalid_message",
      "Message text cannot be empty.",
    );
  }

  const conversation = await findConversationById(
    supabase,
    organizationId,
    conversationId,
  );

  if (!conversation) {
    throw new OmnichannelSendReplyError(
      "conversation_not_found",
      "Conversation not found.",
    );
  }

  if (
    !canReplyToOmnichannelConversation(profile, {
      assigned_user_id: conversation.assigned_user_id,
    })
  ) {
    const message = conversation.assigned_user_id
      ? "Permission denied. You can only reply to conversations assigned to you."
      : "Permission denied. Assign this conversation before replying.";

    throw new OmnichannelSendReplyError("permission_denied", message);
  }

  if (!conversation.external_user_id?.trim()) {
    throw new OmnichannelSendReplyError(
      "recipient_missing",
      "Recipient ID missing for this conversation. Wait for a new inbound message or reconnect Meta integration.",
    );
  }

  if (conversation.channel === "whatsapp") {
    throw new OmnichannelSendReplyError(
      "channel_not_supported",
      "Channel not supported. WhatsApp replies are not enabled yet.",
    );
  }

  let credentials;
  try {
    credentials = await resolveMetaMessagingCredentials(
      supabase,
      organizationId,
      conversation.channel,
    );
  } catch (error) {
    if (error instanceof MetaMessagingError) {
      throw mapMetaMessagingError(error);
    }
    throw error;
  }

  let metaResult;
  try {
    metaResult = await sendMetaChannelMessage({
      pageId: credentials.pageId,
      pageAccessToken: credentials.pageAccessToken,
      recipientId: conversation.external_user_id,
      messageText: trimmed,
      channel: conversation.channel,
      conversationId: conversation.id,
    });
  } catch (error) {
    if (error instanceof MetaMessagingError) {
      throw mapMetaMessagingError(error);
    }
    throw new OmnichannelSendReplyError(
      "meta_api_failed",
      error instanceof Error
        ? `Meta API send failed: ${error.message}`
        : "Meta API send failed.",
    );
  }

  try {
    return await insertMessage(supabase, {
      conversation_id: conversation.id,
      direction: "outgoing",
      external_message_id: metaResult.messageId,
      message_text: trimmed,
      attachments_json: [],
      sent_by_user_id: profile.id,
    });
  } catch (error) {
    throw new OmnichannelInboxError(
      error instanceof Error
        ? error.message
        : "Message sent to Meta but failed to save locally.",
    );
  }
}

export function getOmnichannelSendReplyErrorMessage(error: unknown) {
  if (error instanceof OmnichannelSendReplyError) {
    return error.message;
  }

  if (error instanceof MetaMessagingError) {
    return error.message;
  }

  if (error instanceof OmnichannelInboxError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to send reply.";
}
