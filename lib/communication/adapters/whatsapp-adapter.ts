import type { ChannelAdapter } from "@/lib/communication/adapters/types";
import {
  MessagingError,
  type SendMessageInput,
  type SendMessageResult,
} from "@/lib/communication/messaging/types";
import { WHATSAPP_INSTANCE_DISCONNECTED_MESSAGE } from "@/lib/integrations/whatsapp/constants";
import {
  EvolutionConnectError,
  EvolutionServiceUnavailableError,
  isEvolutionDisconnectedError,
  logWhatsAppSendFailure,
  sendWhatsAppTextMessage,
} from "@/lib/integrations/whatsapp/evolution-client";

// Adapter kanal WhatsApp, ditenagai Evolution API. Ini satu-satunya tempat di
// codebase yang boleh berbicara dengan Evolution untuk pengiriman pesan.
//
// Sprint ini hanya mengimplementasikan pengiriman teks (sendMessage). Lampiran,
// voice note, indikator mengetik, dan tanda dibaca belum diimplementasikan.

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
    error instanceof Error ? error.message : "Gagal mengirim pesan WhatsApp.",
  );
}

export const whatsAppAdapter: ChannelAdapter = {
  channel: "whatsapp",

  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    const instanceName = input.instanceName ?? undefined;
    const evolutionEndpoint = `/message/sendText/${encodeURIComponent(
      instanceName ?? "unknown",
    )}`;

    try {
      const result = await sendWhatsAppTextMessage(
        input.recipientPhone,
        input.text,
        instanceName,
      );

      return { providerMessageId: result.messageId };
    } catch (error) {
      logWhatsAppSendFailure({
        workspaceId: input.workspaceId,
        conversationId: input.conversationId,
        instanceName: input.instanceName,
        recipientPhone: input.recipientPhone,
        evolutionEndpoint,
        error,
      });
      throw toMessagingError(error);
    }
  },
};
