import type { ConversationGateway } from "@/lib/communication/messaging/conversation-gateway";
import {
  MessagingError,
  type MessageChannel,
} from "@/lib/communication/messaging/types";
import { whatsAppConversationGateway } from "@/lib/communication/messaging/whatsapp-gateway";

const GATEWAYS: Partial<Record<MessageChannel, ConversationGateway>> = {
  whatsapp: whatsAppConversationGateway,
};

export function getConversationGateway(
  channel: MessageChannel,
): ConversationGateway {
  const gateway = GATEWAYS[channel];

  if (!gateway) {
    throw new MessagingError(
      "unsupported",
      `Channel "${channel}" belum memiliki penyimpanan percakapan.`,
    );
  }

  return gateway;
}
