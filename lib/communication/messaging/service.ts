import { getChannelAdapter } from "@/lib/communication/adapters/registry";
import type { SupabaseServerClient } from "@/lib/communication/messaging/conversation-gateway";
import { getConversationGateway } from "@/lib/communication/messaging/gateway-registry";
import {
  MessagingError,
  type EngineMessage,
  type MessageChannel,
  type SendMessageInput,
} from "@/lib/communication/messaging/types";
import {
  EvolutionConnectError,
  EvolutionServiceUnavailableError,
  getEvolutionErrorDetails,
  isEvolutionDisconnectedError,
} from "@/lib/integrations/whatsapp/evolution-client";
import { WHATSAPP_INSTANCE_DISCONNECTED_MESSAGE } from "@/lib/integrations/whatsapp/constants";
import type { Profile } from "@/types/app-types";

// Helper draft adalah bagian dari permukaan Messaging Service. Keduanya
// mendelegasikan ke draft store netral kanal (persistensi sisi klien), sehingga
// mengimpor service di sisi server tidak menarik React.
export {
  clearDraft,
  loadDraft,
  saveDraft,
} from "@/lib/communication/drafts/draft-storage";

type SendMessageArgs = {
  supabase: SupabaseServerClient;
  organizationId: string;
  profile: Profile;
  channel: MessageChannel;
  conversationId: string;
  text: string;
};

type RetryMessageArgs = {
  supabase: SupabaseServerClient;
  organizationId: string;
  profile: Profile;
  channel: MessageChannel;
  messageId: string;
};

function toMessagingError(error: unknown): MessagingError {
  if (error instanceof MessagingError) {
    return error;
  }

  if (error instanceof EvolutionServiceUnavailableError) {
    return new MessagingError(
      "service_unavailable",
      "WhatsApp belum terhubung. Pastikan koneksi WhatsApp aktif.",
    );
  }

  if (error instanceof EvolutionConnectError) {
    return new MessagingError(
      "instance_disconnected",
      WHATSAPP_INSTANCE_DISCONNECTED_MESSAGE,
    );
  }

  if (error instanceof Error) {
    const requestPayload =
      "payload" in error
        ? (error as { payload?: unknown }).payload
        : undefined;

    if (isEvolutionDisconnectedError(error.message, requestPayload)) {
      return new MessagingError(
        "instance_disconnected",
        WHATSAPP_INSTANCE_DISCONNECTED_MESSAGE,
      );
    }
  }

  return new MessagingError(
    "send_failed",
    error instanceof Error ? error.message : "Gagal mengirim pesan.",
  );
}

/**
 * Mengirim pesan keluar pada kanal apa pun: validasi -> otorisasi -> simpan
 * baris "sending" -> serahkan ke adapter kanal -> tandai sent/failed. Baris
 * disimpan sebelum panggilan provider sehingga timeline selalu mencerminkan
 * percobaan yang gagal (lengkap dengan tombol coba lagi) bahkan ketika provider
 * tidak dapat dijangkau.
 */
export async function sendMessage(args: SendMessageArgs): Promise<EngineMessage> {
  const { supabase, organizationId, profile, channel, conversationId } = args;
  const text = (args.text ?? "").trim();

  if (!text) {
    throw new MessagingError("invalid_message", "Pesan tidak boleh kosong.");
  }

  const gateway = getConversationGateway(channel);
  const adapter = getChannelAdapter(channel);

  const conversation = await gateway.loadConversation(
    supabase,
    organizationId,
    conversationId,
  );

  if (!conversation) {
    throw new MessagingError(
      "conversation_not_found",
      "Conversation tidak ditemukan.",
    );
  }

  if (!gateway.canReply(profile, conversation)) {
    const message = conversation.assignedUserId
      ? "Izin ditolak. Anda hanya dapat membalas conversation yang di-assign ke Anda."
      : "Izin ditolak. Assign conversation ini sebelum membalas.";
    throw new MessagingError("permission_denied", message);
  }

  const pending = await gateway.insertPendingMessage(
    supabase,
    conversation,
    text,
  );

  const sendInput: SendMessageInput = {
    workspaceId: organizationId,
    conversationId,
    channel,
    recipientPhone: conversation.recipient,
    text,
    instanceName: conversation.instance,
    userId: profile.id,
  };

  try {
    const result = await adapter.sendMessage(sendInput);

    const sent = await gateway.updateMessageStatus(
      supabase,
      pending.id,
      "sent",
      result.providerMessageId,
    );

    await gateway.updateConversationSummary(
      supabase,
      organizationId,
      conversationId,
      text,
      sent.timestamp,
    );

    return sent;
  } catch (error) {
    await gateway
      .updateMessageStatus(supabase, pending.id, "failed")
      .catch(() => undefined);
    throw toMessagingError(error);
  }
}

/** Mengirim ulang pesan keluar yang sebelumnya gagal. */
export async function retryMessage(
  args: RetryMessageArgs,
): Promise<EngineMessage> {
  const { supabase, organizationId, profile, channel, messageId } = args;

  const gateway = getConversationGateway(channel);
  const adapter = getChannelAdapter(channel);

  const message = await gateway.loadMessage(supabase, messageId);

  if (!message) {
    throw new MessagingError("message_not_found", "Pesan tidak ditemukan.");
  }

  if (message.direction !== "outgoing" || message.status !== "failed") {
    throw new MessagingError(
      "invalid_message",
      "Hanya pesan gagal yang dapat dicoba ulang.",
    );
  }

  const text = (message.text ?? "").trim();
  if (!text) {
    throw new MessagingError(
      "invalid_message",
      "Pesan tidak valid untuk dicoba ulang.",
    );
  }

  const conversation = await gateway.loadConversation(
    supabase,
    organizationId,
    message.conversationId,
  );

  if (!conversation) {
    throw new MessagingError(
      "conversation_not_found",
      "Conversation tidak ditemukan.",
    );
  }

  if (!gateway.canReply(profile, conversation)) {
    throw new MessagingError(
      "permission_denied",
      "Izin ditolak untuk mengirim ulang pesan ini.",
    );
  }

  await gateway.updateMessageStatus(supabase, messageId, "pending");

  const sendInput: SendMessageInput = {
    workspaceId: organizationId,
    conversationId: message.conversationId,
    channel,
    recipientPhone: conversation.recipient,
    text,
    instanceName: conversation.instance,
    userId: profile.id,
  };

  try {
    const result = await adapter.sendMessage(sendInput);

    return await gateway.updateMessageStatus(
      supabase,
      messageId,
      "sent",
      result.providerMessageId,
    );
  } catch (error) {
    await gateway
      .updateMessageStatus(supabase, messageId, "failed")
      .catch(() => undefined);
    throw toMessagingError(error);
  }
}

/** Menandai pesan tersimpan sebagai terkirim ke provider. */
export async function markAsSent(
  supabase: SupabaseServerClient,
  channel: MessageChannel,
  messageId: string,
  providerMessageId?: string | null,
): Promise<EngineMessage> {
  return getConversationGateway(channel).updateMessageStatus(
    supabase,
    messageId,
    "sent",
    providerMessageId,
  );
}

/** Menandai pesan tersimpan sebagai gagal. */
export async function markAsFailed(
  supabase: SupabaseServerClient,
  channel: MessageChannel,
  messageId: string,
): Promise<EngineMessage> {
  return getConversationGateway(channel).updateMessageStatus(
    supabase,
    messageId,
    "failed",
  );
}
