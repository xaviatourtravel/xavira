import type { MessageDeliveryStatus } from "@/lib/communication/messaging/delivery";

// Kanal yang dapat dimodelkan oleh Messaging Engine. Hanya "whatsapp" yang
// memiliki adapter konkret saat ini; sisanya disiapkan agar tipe sudah
// mengakomodasi kanal yang akan ditambahkan lewat adapter baru.
export type MessageChannel =
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "email"
  | "telegram";

export type MessageDirection = "incoming" | "outgoing";

// Representasi pesan tersimpan yang netral kanal. Adapter dan gateway
// menerjemahkan baris native mereka ke bentuk ini sehingga sisa aplikasi tidak
// pernah menyentuh struktur spesifik provider.
export type EngineMessage = {
  id: string;
  conversationId: string;
  channel: MessageChannel;
  direction: MessageDirection;
  text: string | null;
  status: MessageDeliveryStatus;
  externalMessageId: string | null;
  timestamp: string;
  createdAt: string;
};

// Input netral kanal yang diteruskan ke adapter saat mengirim pesan.
export type SendMessageInput = {
  workspaceId: string;
  conversationId: string;
  channel: MessageChannel;
  recipientPhone: string;
  text: string;
  instanceName: string | null;
  userId: string;
};

export type SendMessageResult = {
  providerMessageId: string | null;
};

export type MessagingErrorCode =
  | "permission_denied"
  | "conversation_not_found"
  | "message_not_found"
  | "invalid_message"
  | "service_unavailable"
  | "instance_disconnected"
  | "send_failed"
  | "unsupported"
  | "unknown";

export class MessagingError extends Error {
  readonly code: MessagingErrorCode;

  constructor(code: MessagingErrorCode, message: string) {
    super(message);
    this.name = "MessagingError";
    this.code = code;
  }
}

export function getMessagingErrorMessage(error: unknown): string {
  if (error instanceof MessagingError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Gagal mengirim pesan.";
}

export function getMessagingErrorCode(error: unknown): MessagingErrorCode {
  return error instanceof MessagingError ? error.code : "unknown";
}
