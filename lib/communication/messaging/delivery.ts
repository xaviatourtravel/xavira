import type { MessageDeliveryStatus } from "@/types/omnichannel-inbox";

export type { MessageDeliveryStatus };

// Status yang disimpan di basis data untuk pesan keluar.
export type StoredMessageStatus = "sending" | "sent" | "failed";

export const MESSAGE_STATUS = {
  sending: "sending",
  sent: "sent",
  failed: "failed",
} as const satisfies Record<StoredMessageStatus, StoredMessageStatus>;

// Label berbahasa Indonesia untuk setiap status pengiriman yang ditampilkan di UI.
export const DELIVERY_STATUS_LABELS: Record<MessageDeliveryStatus, string> = {
  pending: "Mengirim...",
  sent: "Terkirim",
  delivered: "Terkirim",
  failed: "Gagal dikirim",
};

/** Compact labels for outgoing bubble metadata (HH:mm • Status). */
export const DELIVERY_STATUS_BUBBLE_LABELS: Record<MessageDeliveryStatus, string> = {
  pending: "Mengirim",
  sent: "Terkirim",
  delivered: "Terkirim",
  failed: "Gagal",
};

export function getOutgoingBubbleDeliveryStatusLabel(
  deliveryStatus: MessageDeliveryStatus | null | undefined,
  options?: { isOptimistic?: boolean },
): string | null {
  if (options?.isOptimistic || deliveryStatus === "pending") {
    return DELIVERY_STATUS_BUBBLE_LABELS.pending;
  }

  if (!deliveryStatus) {
    return null;
  }

  return DELIVERY_STATUS_BUBBLE_LABELS[deliveryStatus] ?? null;
}

// Normalisasi status mentah dari provider menjadi salah satu dari empat status
// yang dipahami UI. Setiap adapter melaporkan status provider; lapisan ini
// menyatukannya agar composer dan timeline tidak perlu logika per kanal.
export function mapProviderDeliveryStatus(
  status: string | null | undefined,
): MessageDeliveryStatus | null {
  const normalized = status?.trim().toLowerCase() ?? "";

  if (normalized === "pending" || normalized === "sending") return "pending";
  if (normalized === "sent") return "sent";
  if (normalized === "delivered" || normalized === "read") return "delivered";
  if (normalized === "failed" || normalized === "error") return "failed";

  return null;
}

export function getDeliveryStatusLabel(
  status: MessageDeliveryStatus | null | undefined,
): string {
  if (!status) {
    return "";
  }

  return DELIVERY_STATUS_LABELS[status];
}

export function isFailedDeliveryStatus(
  status: string | null | undefined,
): boolean {
  return mapProviderDeliveryStatus(status) === "failed";
}
