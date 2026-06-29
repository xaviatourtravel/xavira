import type { ConversationContext } from "@/lib/intelligence/context/types";
import type { CustomerIntent } from "@/lib/intelligence/intent/types";
import type { EmotionSignal } from "@/lib/intelligence/emotion/types";

export type TravelHints = {
  destination: string;
  city: string;
  budget: string;
  pax: string;
  intent: CustomerIntent;
  emotion: EmotionSignal;
};

export function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function detectTravelHints(text: string, seed: number): TravelHints {
  const normalized = text.toLowerCase();

  if (normalized.includes("batal") || normalized.includes("cancel")) {
    return baseHints("Paket Travel", seed, "cancellation", "negative");
  }

  if (normalized.includes("komplain") || normalized.includes("kecewa")) {
    return baseHints("Paket Travel", seed, "complaint", "negative");
  }

  if (normalized.includes("book") || normalized.includes("pesan")) {
    return baseHints("Yunnan Halal Tour", seed, "booking", "positive");
  }

  if (
    normalized.includes("harga") ||
    normalized.includes("berapa") ||
    normalized.includes("price")
  ) {
    return baseHints("Yunnan Halal Tour", seed, "price_inquiry", "neutral");
  }

  if (normalized.includes("umrah") || normalized.includes("haji")) {
    return {
      destination: "Paket Umrah",
      city: "Jakarta",
      budget: "35000000",
      pax: "2",
      intent: "ready_to_buy",
      emotion: "positive",
    };
  }

  if (
    normalized.includes("yunnan") ||
    normalized.includes("china") ||
    normalized.includes("cina")
  ) {
    return {
      destination: "Yunnan Halal Tour",
      city: "Surabaya",
      budget: "28000000",
      pax: "4",
      intent: seed % 2 === 0 ? "price_inquiry" : "ready_to_buy",
      emotion: seed % 3 === 0 ? "urgent" : "positive",
    };
  }

  if (
    normalized.includes("jepang") ||
    normalized.includes("japan") ||
    normalized.includes("tokyo")
  ) {
    return {
      destination: "Japan Muslim-Friendly Tour",
      city: "Bandung",
      budget: "42000000",
      pax: "3",
      intent: "browsing",
      emotion: "neutral",
    };
  }

  return baseHints("Halal Tour Package", seed, "browsing", "neutral");
}

function baseHints(
  destination: string,
  seed: number,
  intent: CustomerIntent,
  emotion: EmotionSignal,
): TravelHints {
  return {
    destination,
    city: seed % 2 === 0 ? "Jakarta" : "Surabaya",
    budget: String(22_000_000 + (seed % 8) * 2_500_000),
    pax: String(2 + (seed % 3)),
    intent,
    emotion,
  };
}

export function resolveScoreLabel(score: number) {
  if (score >= 80) {
    return "Hot";
  }
  if (score >= 65) {
    return "Warm";
  }
  return "Cool";
}

export function buildSummary(
  context: ConversationContext,
  hints: TravelHints,
) {
  const name = context.customerName.split(" ")[0] || "Pelanggan";
  return `${name} menghubungi via ${context.channelLabel} untuk menanyakan ${hints.destination.toLowerCase()}. Sinyal intent: ${hints.intent.replace(/_/g, " ")}. Belum ada konfirmasi tanggal keberangkatan, namun percakapan menunjukkan minat aktif.`;
}

export function buildSuggestedReply(
  context: ConversationContext,
  hints: TravelHints,
) {
  const name = context.customerName.split(" ")[0] || "Kak";
  return `Halo ${name}! Terima kasih sudah menghubungi Desklabs 🙏

Kami punya paket ${hints.destination} dengan hotel halal-friendly. Untuk ${hints.pax} orang, estimasi budget mulai Rp ${Number(hints.budget).toLocaleString("id-ID")}.

Boleh info tanggal rencana berangkatnya? Nanti tim kami siapkan opsi terbaik.`;
}
