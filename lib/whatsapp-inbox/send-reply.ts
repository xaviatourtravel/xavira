import { sendWhatsAppTextMessage } from "@/lib/integrations/whatsapp/evolution-client";
import {
  EvolutionServiceUnavailableError,
  EvolutionConnectError,
} from "@/lib/integrations/whatsapp/evolution-client";
import { canReplyToOmnichannelConversation } from "@/lib/omnichannel-inbox/permissions";
import {
  findWhatsappConversationById,
  insertWhatsappMessage,
  updateWhatsappConversationById,
} from "@/lib/whatsapp-inbox/repository";
import type { Profile } from "@/types/app-types";
import type { WhatsappMessageRow } from "@/types/whatsapp-inbox";
import type { createClient } from "@/utils/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export class WhatsappSendReplyError extends Error {
  readonly code:
    | "permission_denied"
    | "conversation_not_found"
    | "invalid_message"
    | "service_unavailable"
    | "send_failed"
    | "unknown";

  constructor(code: WhatsappSendReplyError["code"], message: string) {
    super(message);
    this.name = "WhatsappSendReplyError";
    this.code = code;
  }
}

function mapWhatsappMessageStatus(
  status: string | null | undefined,
): "pending" | "sent" | "delivered" | "failed" | null {
  const normalized = status?.trim().toLowerCase() ?? "";
  if (normalized === "pending") return "pending";
  if (normalized === "sent") return "sent";
  if (normalized === "delivered" || normalized === "read") return "delivered";
  if (normalized === "failed") return "failed";
  return null;
}

export function getWhatsappMessageDeliveryStatus(message: WhatsappMessageRow) {
  return mapWhatsappMessageStatus(message.status);
}

export async function sendWhatsappConversationReply(
  supabase: SupabaseClient,
  organizationId: string,
  profile: Profile,
  conversationId: string,
  messageText: string,
): Promise<WhatsappMessageRow> {
  const trimmed = messageText.trim();

  if (!trimmed) {
    throw new WhatsappSendReplyError(
      "invalid_message",
      "Pesan tidak boleh kosong.",
    );
  }

  const conversation = await findWhatsappConversationById(
    supabase,
    organizationId,
    conversationId,
  );

  if (!conversation) {
    throw new WhatsappSendReplyError(
      "conversation_not_found",
      "Conversation tidak ditemukan.",
    );
  }

  if (
    !canReplyToOmnichannelConversation(profile, {
      assigned_user_id: conversation.assigned_user_id,
    })
  ) {
    const message = conversation.assigned_user_id
      ? "Izin ditolak. Anda hanya dapat membalas conversation yang di-assign ke Anda."
      : "Izin ditolak. Assign conversation ini sebelum membalas.";

    throw new WhatsappSendReplyError("permission_denied", message);
  }

  const now = new Date().toISOString();
  const pendingMessage = await insertWhatsappMessage(supabase, {
    conversation_id: conversation.id,
    direction: "outgoing",
    message_type: "text",
    text: trimmed,
    status: "pending",
    timestamp: now,
    raw_payload: {},
  });

  try {
    const result = await sendWhatsAppTextMessage(
      conversation.phone_number,
      trimmed,
      conversation.instance_name,
    );

    const sentMessage = await supabase
      .from("whatsapp_messages")
      .update({
        status: "sent",
        external_message_id: result.messageId,
      })
      .eq("id", pendingMessage.id)
      .select(
        "id, conversation_id, direction, message_type, text, media_url, status, timestamp, raw_payload, external_message_id, created_at",
      )
      .single();

    if (sentMessage.error || !sentMessage.data) {
      throw new WhatsappSendReplyError(
        "send_failed",
        sentMessage.error?.message ?? "Gagal menyimpan pesan terkirim.",
      );
    }

    await updateWhatsappConversationById(
      supabase,
      organizationId,
      conversation.id,
      {
        last_message: trimmed,
        last_message_at: now,
      },
    );

    return sentMessage.data as WhatsappMessageRow;
  } catch (error) {
    await supabase
      .from("whatsapp_messages")
      .update({ status: "failed" })
      .eq("id", pendingMessage.id);

    if (
      error instanceof EvolutionServiceUnavailableError ||
      error instanceof EvolutionConnectError
    ) {
      throw new WhatsappSendReplyError(
        "service_unavailable",
        error.message,
      );
    }

    if (error instanceof WhatsappSendReplyError) {
      throw error;
    }

    throw new WhatsappSendReplyError(
      "send_failed",
      error instanceof Error
        ? error.message
        : "Gagal mengirim pesan WhatsApp.",
    );
  }
}

export async function retryWhatsappConversationReply(
  supabase: SupabaseClient,
  organizationId: string,
  profile: Profile,
  messageId: string,
): Promise<WhatsappMessageRow> {
  const { data: message, error } = await supabase
    .from("whatsapp_messages")
    .select(
      "id, conversation_id, direction, message_type, text, media_url, status, timestamp, raw_payload, external_message_id, created_at",
    )
    .eq("id", messageId)
    .maybeSingle();

  if (error || !message) {
    throw new WhatsappSendReplyError(
      "conversation_not_found",
      "Pesan tidak ditemukan.",
    );
  }

  if (message.direction !== "outgoing" || message.status !== "failed") {
    throw new WhatsappSendReplyError(
      "invalid_message",
      "Hanya pesan gagal yang dapat dicoba ulang.",
    );
  }

  const text = message.text?.trim();
  if (!text) {
    throw new WhatsappSendReplyError(
      "invalid_message",
      "Pesan tidak valid untuk dicoba ulang.",
    );
  }

  const conversation = await findWhatsappConversationById(
    supabase,
    organizationId,
    message.conversation_id,
  );

  if (!conversation) {
    throw new WhatsappSendReplyError(
      "conversation_not_found",
      "Conversation tidak ditemukan.",
    );
  }

  if (
    !canReplyToOmnichannelConversation(profile, {
      assigned_user_id: conversation.assigned_user_id,
    })
  ) {
    throw new WhatsappSendReplyError(
      "permission_denied",
      "Izin ditolak untuk mengirim ulang pesan ini.",
    );
  }

  await supabase
    .from("whatsapp_messages")
    .update({ status: "pending" })
    .eq("id", messageId);

  try {
    const result = await sendWhatsAppTextMessage(
      conversation.phone_number,
      text,
      conversation.instance_name,
    );

    const sentMessage = await supabase
      .from("whatsapp_messages")
      .update({
        status: "sent",
        external_message_id: result.messageId,
        timestamp: new Date().toISOString(),
      })
      .eq("id", messageId)
      .select(
        "id, conversation_id, direction, message_type, text, media_url, status, timestamp, raw_payload, external_message_id, created_at",
      )
      .single();

    if (sentMessage.error || !sentMessage.data) {
      throw new WhatsappSendReplyError(
        "send_failed",
        sentMessage.error?.message ?? "Gagal menyimpan pesan terkirim.",
      );
    }

    return sentMessage.data as WhatsappMessageRow;
  } catch (retryError) {
    await supabase
      .from("whatsapp_messages")
      .update({ status: "failed" })
      .eq("id", messageId);

    if (
      retryError instanceof EvolutionServiceUnavailableError ||
      retryError instanceof EvolutionConnectError
    ) {
      throw new WhatsappSendReplyError(
        "service_unavailable",
        retryError.message,
      );
    }

    if (retryError instanceof WhatsappSendReplyError) {
      throw retryError;
    }

    throw new WhatsappSendReplyError(
      "send_failed",
      retryError instanceof Error
        ? retryError.message
        : "Gagal mengirim ulang pesan WhatsApp.",
    );
  }
}

export function getWhatsappSendReplyErrorMessage(error: unknown) {
  if (error instanceof WhatsappSendReplyError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Gagal mengirim balasan WhatsApp.";
}
