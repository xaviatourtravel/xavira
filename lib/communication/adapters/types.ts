import type {
  MessageChannel,
  SendMessageInput,
  SendMessageResult,
} from "@/lib/communication/messaging/types";

// ChannelAdapter adalah satu-satunya lapisan yang berbicara dengan provider
// eksternal (Evolution, Meta Graph, SMTP, Telegram Bot API, ...). Menambah
// kanal baru cukup dengan "implementasikan interface ini + daftarkan".
//
// Untuk sprint ini hanya sendMessage yang diimplementasikan. Method lain
// disiapkan sebagai opsional agar adapter masa depan dapat menambahkannya tanpa
// mengubah kontrak.

export type AdapterAttachmentInput = {
  workspaceId: string;
  conversationId: string;
  recipientPhone: string;
  instanceName: string | null;
  fileName: string;
  mimeType: string;
  data: ArrayBuffer | Uint8Array | string;
  caption?: string;
};

export type AdapterAttachmentResult = {
  providerMessageId: string | null;
  mediaUrl: string | null;
};

export type AdapterPresenceInput = {
  recipientPhone: string;
  instanceName: string | null;
};

export type AdapterReadInput = {
  recipientPhone: string;
  instanceName: string | null;
  externalMessageId?: string | null;
};

export type AdapterRetryInput = SendMessageInput & {
  messageId: string;
};

export interface ChannelAdapter {
  readonly channel: MessageChannel;

  sendMessage(input: SendMessageInput): Promise<SendMessageResult>;

  // Disiapkan untuk sprint berikutnya.
  retryMessage?(input: AdapterRetryInput): Promise<SendMessageResult>;
  uploadAttachment?(
    input: AdapterAttachmentInput,
  ): Promise<AdapterAttachmentResult>;
  typing?(input: AdapterPresenceInput): Promise<void>;
  markAsRead?(input: AdapterReadInput): Promise<void>;
}
