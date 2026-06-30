import { handleSendMessageRequest } from "@/lib/communication/messaging/route-handler";

// Route HTTP kanonik untuk Messaging Service. Menerima body netral kanal:
//   { conversationId, text }            -> kirim pesan baru (default WhatsApp)
//   { channel, conversationId, text }   -> kirim pesan pada kanal tertentu
//   { channel, messageId }              -> coba ulang pesan yang gagal
//
// Evolution API tidak pernah diekspos ke browser.
export async function POST(request: Request) {
  return handleSendMessageRequest(request);
}
