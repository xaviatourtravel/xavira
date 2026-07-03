import type { ConversationMemoryKey } from "@/modules/ai/types/memory";

export type ExtractMemoryFromMessageParams = {
  messageText: string;
  conversationId: string;
  workspaceId: string;
  customerId?: string | null;
};

export type ExtractedMessageMemory = {
  key: string;
  value: string;
  confidence: number;
  source: "customer_message";
};

export type ExtractMemoryFromMessageResult = {
  memories: ExtractedMessageMemory[];
};

export type MemoryExtractionInput = {
  customerMessage: string;
  aiReply?: string | null;
  productDestinations?: string[];
};

const MONTH_BY_NUMBER: Record<number, string> = {
  1: "Januari",
  2: "Februari",
  3: "Maret",
  4: "April",
  5: "Mei",
  6: "Juni",
  7: "Juli",
  8: "Agustus",
  9: "September",
  10: "Oktober",
  11: "November",
  12: "Desember",
};

const MONTH_ALIASES: Record<string, string> = {
  januari: "Januari",
  jan: "Januari",
  january: "Januari",
  februari: "Februari",
  feb: "Februari",
  february: "Februari",
  maret: "Maret",
  mar: "Maret",
  march: "Maret",
  april: "April",
  apr: "April",
  mei: "Mei",
  may: "Mei",
  juni: "Juni",
  jun: "Juni",
  june: "Juni",
  juli: "Juli",
  jul: "Juli",
  july: "Juli",
  agustus: "Agustus",
  aug: "Agustus",
  august: "Agustus",
  september: "September",
  sep: "September",
  sept: "September",
  oktober: "Oktober",
  oct: "Oktober",
  october: "Oktober",
  november: "November",
  nov: "November",
  desember: "Desember",
  dec: "Desember",
  december: "Desember",
};

const BER_NUMBER_ALIASES: Record<string, number> = {
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
};

const WORD_NUMBERS: Record<string, number> = {
  satu: 1,
  se: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
  sebelas: 11,
  duabelas: 12,
};

const COMMON_DESTINATIONS: Array<{ pattern: RegExp; value: string }> = [
  { pattern: /\bumroh\b|\bumrah\b/i, value: "Umroh" },
  { pattern: /\bhaji\b/i, value: "Haji" },
  { pattern: /\bjepang\b|\bjapan\b/i, value: "Jepang" },
  { pattern: /\bkorea\b/i, value: "Korea" },
  { pattern: /\bsingapura\b|\bsingapore\b/i, value: "Singapura" },
  { pattern: /\bturki\b|\bturkey\b/i, value: "Turki" },
  { pattern: /\byunnan\b/i, value: "Yunnan" },
  { pattern: /\bchina\b/i, value: "China" },
  { pattern: /\bthailand\b|\bthai\b/i, value: "Thailand" },
  { pattern: /\bbali\b/i, value: "Bali" },
  { pattern: /\bdubai\b/i, value: "Dubai" },
  { pattern: /\beuropa\b|\beurope\b/i, value: "Eropa" },
  { pattern: /\bmakkah\b|\bmekah\b|\bmecca\b/i, value: "Makkah" },
  { pattern: /\bmadinah\b|\bmedina\b/i, value: "Madinah" },
];

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function addMemory(
  items: ExtractedMessageMemory[],
  seen: Set<string>,
  key: ConversationMemoryKey,
  value: string,
  confidence: number,
) {
  if (seen.has(key)) return;
  const trimmed = normalizeText(value);
  if (!trimmed) return;
  seen.add(key);
  items.push({
    key,
    value: trimmed,
    confidence,
    source: "customer_message",
  });
}

function extractPassengerCount(text: string): string | null {
  const digitWithOrang = text.match(
    /(?:^|\s)(\d{1,2})\s*(?:orang|pax|person|people|tamu|peserta|jiwa|passenger)/i,
  );
  if (digitWithOrang?.[1]) {
    return digitWithOrang[1];
  }

  const digitPaxOnly = text.match(/(?:^|\s)(\d{1,2})\s*pax\b/i);
  if (digitPaxOnly?.[1]) {
    return digitPaxOnly[1];
  }

  const familyMatch = text.match(
    /(?:sekeluarga|keluarga|kami)\s+(\d{1,2})\s*(?:pax|orang)?/i,
  );
  if (familyMatch?.[1]) {
    return familyMatch[1];
  }

  const untukMatch = text.match(/(?:untuk|for)\s+(\d{1,2})\s*(?:orang|pax|person|people)?/i);
  if (untukMatch?.[1]) {
    return untukMatch[1];
  }

  const berMatch = text.match(/\bber(dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh)\b/i);
  if (berMatch?.[1]) {
    const count = BER_NUMBER_ALIASES[berMatch[1].toLowerCase()];
    if (count) return String(count);
  }

  for (const [word, number] of Object.entries(WORD_NUMBERS)) {
    const pattern = new RegExp(`\\b${word}\\s+(?:orang|pax|person|people|tamu|peserta)\\b`, "i");
    if (pattern.test(text)) {
      return String(number);
    }
  }

  return null;
}

function extractDepartureMonth(text: string): string | null {
  if (/\blebaran\b/i.test(text)) {
    return "Lebaran";
  }

  if (/\bakhir\s+tahun\b/i.test(text)) {
    return "Akhir tahun";
  }

  if (/\bbulan\s+depan\b/i.test(text)) {
    return "Bulan depan";
  }

  const bulanNumberMatch = text.match(/\bbulan\s+(\d{1,2})\b/i);
  if (bulanNumberMatch?.[1]) {
    const monthNumber = Number(bulanNumberMatch[1]);
    if (MONTH_BY_NUMBER[monthNumber]) {
      return MONTH_BY_NUMBER[monthNumber];
    }
  }

  const bulanNameMatch = text.match(/\bbulan\s+([a-z]+)(?:\s+\d{4})?\b/i);
  if (bulanNameMatch?.[1]) {
    const normalized = MONTH_ALIASES[bulanNameMatch[1].toLowerCase()];
    if (normalized) return normalized;
  }

  for (const [alias, label] of Object.entries(MONTH_ALIASES)) {
    const pattern = new RegExp(`\\b${alias}\\b(?:\\s+\\d{4})?`, "i");
    if (pattern.test(text)) {
      return label;
    }
  }

  return null;
}

function extractBudget(text: string): string | null {
  const underMatch = text.match(
    /(?:under|di\s+bawah|kurang\s+dari)\s+(\d+(?:[.,]\d+)?)\s*(?:juta|jt|jtr)\b/i,
  );
  if (underMatch?.[1]) {
    return `under ${underMatch[1].replace(",", ".")} juta`;
  }

  const sekitarMatch = text.match(/sekitar\s+(\d+(?:[.,]\d+)?)\s*(?:juta|jt|jtr)\b/i);
  if (sekitarMatch?.[1]) {
    return `sekitar ${sekitarMatch[1].replace(",", ".")} juta`;
  }

  const budgetLabelMatch = text.match(
    /\bbudget\s+(\d+(?:[.,]\d+)?)\s*(?:juta|jt|jtr)\b/i,
  );
  if (budgetLabelMatch?.[1]) {
    return `${budgetLabelMatch[1].replace(",", ".")} juta`;
  }

  const jutaMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:juta|jt|jtr|million|mio)\b/i);
  if (jutaMatch?.[1]) {
    return `${jutaMatch[1].replace(",", ".")} juta`;
  }

  const milyarMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:milyar|miliar|billion)\b/i);
  if (milyarMatch?.[1]) {
    return `${milyarMatch[1].replace(",", ".")} milyar`;
  }

  const ribuMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:ribu|rb|rbu)\b/i);
  if (ribuMatch?.[1]) {
    return `${ribuMatch[1].replace(",", ".")} ribu`;
  }

  return null;
}

function extractDestination(text: string, productDestinations: string[] = []): string | null {
  const lowered = text.toLowerCase();

  for (const destination of productDestinations) {
    const trimmed = destination.trim();
    if (!trimmed) continue;
    if (lowered.includes(trimmed.toLowerCase())) {
      return trimmed;
    }
  }

  for (const { pattern, value } of COMMON_DESTINATIONS) {
    if (pattern.test(text)) {
      return value;
    }
  }

  const keMatch = text.match(/\b(?:mau\s+)?ke\s+([A-Za-z][A-Za-z\s]{2,30})\b/i);
  if (keMatch?.[1]) {
    const candidate = normalizeText(keMatch[1]);
    if (candidate.length >= 3 && candidate.length <= 40) {
      return candidate.charAt(0).toUpperCase() + candidate.slice(1);
    }
  }

  const paketMatch = text.match(/\bpaket\s+([A-Za-z][A-Za-z\s]{2,30})\b/i);
  if (paketMatch?.[1]) {
    const candidate = normalizeText(paketMatch[1]);
    if (candidate.length >= 3 && candidate.length <= 40) {
      return candidate.charAt(0).toUpperCase() + candidate.slice(1);
    }
  }

  return null;
}

function extractTripType(text: string): string | null {
  if (/\bprivate\s+trip\b/i.test(text)) return "Private trip";
  if (/\bopen\s+trip\b/i.test(text)) return "Open trip";
  if (/\bgroup\s+tour\b/i.test(text)) return "Group tour";
  if (/\bumroh\b|\bumrah\b/i.test(text)) return "Umroh";
  if (/\bfamily\s+trip\b|\bliburan\s+keluarga\b/i.test(text)) return "Family trip";
  if (/\bhaji\b/i.test(text)) return "Haji";
  return null;
}

function extractPrivateOrGroup(text: string): string | null {
  if (/\bprivate\s+trip\b|\bprivate\b|\bsendiri\b|\bexclusive\b/i.test(text)) {
    return "Private";
  }
  if (/\bopen\s+trip\b/i.test(text)) return "Open trip";
  if (/\bgroup\s+tour\b|\bgrup\b|\bgroup\b/i.test(text)) return "Group";
  if (/\bkeluarga\b|\bfamily\b/i.test(text)) return "Family";
  return null;
}

function extractSpecialRequest(text: string): string | null {
  const requests: string[] = [];

  if (/\bhalal\b/i.test(text)) requests.push("Halal");
  if (/\bbawa\s+anak\b|\bada\s+anak\b/i.test(text)) requests.push("Bawa anak");
  if (/\blansia\b/i.test(text)) requests.push("Lansia");
  if (/\bwheelchair\b|\bkursi\s+roda\b/i.test(text)) requests.push("Wheelchair");
  if (/\bhoneymoon\b/i.test(text)) requests.push("Honeymoon");

  if (requests.length > 0) {
    return requests.join(", ");
  }

  const needsMatch = text.match(
    /(?:kebutuhan\s+khusus|special\s+request|butuh)\s*:?\s*([^.!?\n]{3,120})/i,
  );
  if (needsMatch?.[1]) {
    return normalizeText(needsMatch[1]);
  }

  return null;
}

function extractFromMessageText(
  text: string,
  productDestinations: string[],
  items: ExtractedMessageMemory[],
  seen: Set<string>,
) {
  const passengerCount = extractPassengerCount(text);
  if (passengerCount) {
    addMemory(items, seen, "passenger_count", passengerCount, 0.9);
  }

  const departureMonth = extractDepartureMonth(text);
  if (departureMonth) {
    addMemory(items, seen, "departure_month", departureMonth, 0.88);
  }

  const budget = extractBudget(text);
  if (budget) {
    addMemory(items, seen, "budget", budget, 0.86);
  }

  const destination = extractDestination(text, productDestinations);
  if (destination) {
    addMemory(items, seen, "destination", destination, 0.84);
  }

  const tripType = extractTripType(text);
  if (tripType) {
    addMemory(items, seen, "trip_type", tripType, 0.82);
  }

  const privateOrGroup = extractPrivateOrGroup(text);
  if (privateOrGroup) {
    addMemory(items, seen, "private_or_group", privateOrGroup, 0.8);
  }

  const specialRequest = extractSpecialRequest(text);
  if (specialRequest) {
    addMemory(items, seen, "special_request", specialRequest, 0.78);
  }
}

export function extractMemoryFromMessage(
  params: ExtractMemoryFromMessageParams,
  options?: { productDestinations?: string[] },
): ExtractMemoryFromMessageResult {
  const items: ExtractedMessageMemory[] = [];
  const seen = new Set<string>();
  const productDestinations = (options?.productDestinations ?? []).filter(Boolean);

  extractFromMessageText(params.messageText, productDestinations, items, seen);

  return { memories: items };
}

/** @deprecated Use extractMemoryFromMessage for WhatsApp pipeline extraction. */
export function extractMemoryFromMessages(input: MemoryExtractionInput): Array<{
  memoryKey: ConversationMemoryKey;
  memoryValue: string;
  confidence: number;
  source: "customer_message" | "ai_reply";
}> {
  const customerResult = extractMemoryFromMessage(
    {
      messageText: input.customerMessage,
      conversationId: "legacy",
      workspaceId: "legacy",
    },
    { productDestinations: input.productDestinations },
  );

  const items: Array<{
    memoryKey: ConversationMemoryKey;
    memoryValue: string;
    confidence: number;
    source: "customer_message" | "ai_reply";
  }> = customerResult.memories.map((memory) => ({
    memoryKey: memory.key as ConversationMemoryKey,
    memoryValue: memory.value,
    confidence: memory.confidence,
    source: memory.source,
  }));

  if (input.aiReply?.trim()) {
    const aiItems: ExtractedMessageMemory[] = [];
    const seen = new Set(items.map((item) => item.memoryKey));
    extractFromMessageText(input.aiReply, input.productDestinations ?? [], aiItems, seen);
    for (const memory of aiItems) {
      items.push({
        memoryKey: memory.key as ConversationMemoryKey,
        memoryValue: memory.value,
        confidence: memory.confidence,
        source: "ai_reply",
      });
    }
  }

  return items;
}
