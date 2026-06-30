import { handleSendMessageRequest } from "@/lib/communication/messaging/route-handler";

// Legacy WhatsApp send endpoint, kept for backwards compatibility. It is a thin
// wrapper over the channel-agnostic Messaging Service with the channel pinned
// to WhatsApp — Evolution is never exposed to the client.
export async function POST(request: Request) {
  return handleSendMessageRequest(request, { forcedChannel: "whatsapp" });
}
