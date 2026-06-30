import type { ChannelAdapter } from "@/lib/communication/adapters/types";
import { whatsAppAdapter } from "@/lib/communication/adapters/whatsapp-adapter";
import {
  MessagingError,
  type MessageChannel,
} from "@/lib/communication/messaging/types";

// Channel → adapter registry. Register a new adapter here (and a gateway in the
// messaging layer) and the rest of the engine works without further changes.
const ADAPTERS: Partial<Record<MessageChannel, ChannelAdapter>> = {
  whatsapp: whatsAppAdapter,
};

export function getChannelAdapter(channel: MessageChannel): ChannelAdapter {
  const adapter = ADAPTERS[channel];

  if (!adapter) {
    throw new MessagingError(
      "unsupported",
      `Channel "${channel}" belum didukung.`,
    );
  }

  return adapter;
}

export function hasChannelAdapter(channel: MessageChannel): boolean {
  return Boolean(ADAPTERS[channel]);
}
