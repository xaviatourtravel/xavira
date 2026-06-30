import type {
  MessageChannel,
  MessagingErrorCode,
} from "@/lib/communication/messaging/types";

// Konfigurasi composer yang sadar kanal. UI composer membaca dari sini sehingga
// kanal baru cukup menambah entri di bawah, bukan komponen baru.

const PLACEHOLDERS: Partial<Record<MessageChannel, string>> = {
  whatsapp: "Tulis balasan...",
  instagram: "Tulis balasan...",
  facebook: "Tulis balasan...",
  email: "Tulis email...",
  telegram: "Tulis balasan...",
};

export function getComposerPlaceholder(
  channel: MessageChannel | undefined,
): string {
  if (channel && PLACEHOLDERS[channel]) {
    return PLACEHOLDERS[channel] as string;
  }

  return "Tulis balasan...";
}

// Kegagalan yang artinya pesan sudah tersimpan sebagai "failed" oleh engine
// (sehingga timeline menampilkan bubble gagal + tombol coba lagi). Selain ini,
// pesan tidak pernah mencapai adapter sehingga composer mengembalikan draft.
const PERSISTED_FAILURE_CODES: ReadonlySet<MessagingErrorCode | string> =
  new Set<MessagingErrorCode>([
    "service_unavailable",
    "instance_disconnected",
    "send_failed",
  ]);

export function isPersistedFailureCode(code: string): boolean {
  return PERSISTED_FAILURE_CODES.has(code);
}

type ComposerToastCopy = {
  title: string;
  description?: string;
};

// Pesan toast berbahasa Indonesia untuk setiap jenis kegagalan kirim.
export function resolveSendErrorToast(
  code: string,
  fallbackDescription?: string,
): ComposerToastCopy {
  switch (code) {
    case "service_unavailable":
      return {
        title: "WhatsApp belum terhubung",
        description: "Pastikan koneksi WhatsApp aktif.",
      };
    case "instance_disconnected":
      return {
        title: "Nomor WhatsApp terputus",
        description: "Hubungkan ulang di Pengaturan.",
      };
    case "permission_denied":
      return {
        title: "Tidak diizinkan",
        description: fallbackDescription,
      };
    case "conversation_not_found":
      return {
        title: "Conversation tidak ditemukan",
        description: fallbackDescription,
      };
    default:
      return {
        title: "Gagal mengirim pesan",
        description: fallbackDescription ?? "Silakan coba lagi.",
      };
  }
}
