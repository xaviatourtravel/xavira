import type { ChannelAdapter } from "@/lib/communication/adapters/types";
import {
  MessagingError,
  type SendMessageInput,
  type SendMessageResult,
} from "@/lib/communication/messaging/types";
import {
  EvolutionConnectError,
  EvolutionServiceUnavailableError,
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
      "Nomor WhatsApp terputus. Hubungkan ulang di Pengaturan.",
    );
  }

  return new MessagingError(
    "send_failed",
    error instanceof Error ? error.message : "Gagal mengirim pesan WhatsApp.",
  );
}

export const whatsAppAdapter: ChannelAdapter = {
  channel: "whatsapp",

  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    try {
      const result = await sendWhatsAppTextMessage(
        input.recipientPhone,
        input.text,
        input.instanceName ?? undefined,
      );

      return { providerMessageId: result.messageId };
    } catch (error) {
      throw toMessagingError(error);
    }
  },
};
