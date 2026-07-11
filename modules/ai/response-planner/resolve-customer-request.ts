import type { RequestType } from "@/modules/ai/response-planner/types";
import {
  extractCountryQuery,
  extractDestinationQuery,
  isCountryQuery,
} from "@/modules/ai/response-planner/resolve-destination-match";

const PRICE_PATTERNS = [
  /\b(harga|berapa|price|cost|biaya|tarif)\b/i,
  /\b(berapa\s+total|how\s+much)\b/i,
];
const SCHEDULE_PATTERNS = [
  /\b(keberangkatan|jadwal|schedule|departure|tanggal|bulan\s+\w+|agustus|september|oktober)\b/i,
  /\b(ada\s+keberangkatan|when\s+depart)\b/i,
];
const AVAILABILITY_PATTERNS = [
  /\b(tersedia|available|masih\s+ada|slot|seat)\b/i,
  /\b(ada\s+.*\?|bisa\s+berangkat)\b/i,
];
const ITINERARY_PATTERNS = [
  /\b(itinerary|itinerari|jadwal\s+perjalanan|brosur|brochure|pdf|dokumen|kirim\s+itinerary)\b/i,
];
const HUMAN_PATTERNS = [/\b(human|manusia|sales|agent|bicara\s+dengan|talk\s+to)\b/i];
const COMPLAINT_PATTERNS = [/\b(komplain|complaint|kecewa|buruk|rusak)\b/i];
const BOOKING_PATTERNS = [/\b(booking|book|pesan|reservasi|appointment|janji)\b/i];
const PAYMENT_PATTERNS = [/\b(payment|bayar|transfer|invoice|dp|deposit)\b/i];
const COMPARISON_PATTERNS = [/\b(bandingkan|compare|perbandingan|beda|vs|versus)\b/i];
const CATALOG_PATTERNS = [
  /\bada\s+(produk|paket|layanan|trip|tour)\s+(apa|mana)\b/i,
  /\b(paket|produk|layanan)\s+ke\s+mana\b/i,
  /\bada\s+paket\s+ke\s+mana\b/i,
  /\blayanan\s+(yang\s+)?tersedia\b/i,
  /\bada\s+apa\s+aja\b/i,
  /\bwhat\s+(products|packages|services)\b/i,
  /\bwhich\s+(destinations|packages)\b/i,
];
const GREETING_PATTERNS = [
  /^(halo|hallo|hai|hi|hey|hello|selamat\s+(pagi|siang|sore|malam)|assalamu['’]?alaikum|salam)(?:\s+(kak|ka))?[\s!.,?]*$/i,
  /^(pagi|siang|sore|malam)\s+(kak|ka)[\s!.,?]*$/i,
];
const GENERAL_SERVICE_PATTERNS = [
  /\b(layanan|service|tanya\s+layanan|help\s+with\s+service)\b/i,
  /\b(mau\s+nanya\s+layanan|mau\s+tanya\s+layanan)\b/i,
];
const PRODUCT_INFO_PATTERNS = [/\b(paket|package|produk|product|tour|trip)\b/i];

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function isPrimarilyGreeting(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (matchesAny(trimmed, GREETING_PATTERNS)) return true;

  const withoutGreeting = trimmed
    .replace(/^(halo|hallo|hai|hi|hey|hello|selamat\s+(pagi|siang|sore|malam)|assalamu['’]?alaikum|salam)\b\s*/i, "")
    .replace(/\b(kak|ka)\b/gi, "")
    .trim();

  return withoutGreeting.length === 0;
}

export function resolveCustomerRequestType(
  message: string,
  intent: string,
): RequestType {
  const normalizedIntent = intent.trim().toUpperCase();
  const text = message.trim();

  if (normalizedIntent.includes("HUMAN") || matchesAny(text, HUMAN_PATTERNS)) {
    return "HUMAN_REQUEST";
  }
  if (normalizedIntent === "COMPLAINT" || matchesAny(text, COMPLAINT_PATTERNS)) {
    return "COMPLAINT";
  }
  if (normalizedIntent === "PAYMENT" || matchesAny(text, PAYMENT_PATTERNS)) {
    return "PAYMENT";
  }
  if (normalizedIntent === "BOOKING" || matchesAny(text, BOOKING_PATTERNS)) {
    return "BOOKING_OR_APPOINTMENT";
  }
  if (matchesAny(text, ITINERARY_PATTERNS) || normalizedIntent === "BROCHURE_REQUEST" || normalizedIntent === "ITINERARY_REQUEST") {
    return "ITINERARY_OR_DOCUMENT";
  }
  if (matchesAny(text, PRICE_PATTERNS) || normalizedIntent === "PRICE_INQUIRY") {
    return "PRICE";
  }
  if (matchesAny(text, SCHEDULE_PATTERNS) || normalizedIntent === "DEPARTURE_DATE") {
    return "SCHEDULE_OR_DEPARTURE";
  }
  if (matchesAny(text, AVAILABILITY_PATTERNS)) {
    return "AVAILABILITY";
  }
  if (matchesAny(text, COMPARISON_PATTERNS)) {
    return "PRODUCT_COMPARISON";
  }
  if (matchesAny(text, CATALOG_PATTERNS)) {
    return "CATALOG_DISCOVERY";
  }

  if (matchesAny(text, GENERAL_SERVICE_PATTERNS) && !matchesAny(text, PRODUCT_INFO_PATTERNS)) {
    return "GENERAL_SERVICE_INQUIRY";
  }

  const destinationQuery = extractDestinationQuery(text);
  const countryQuery = extractCountryQuery(text);
  if ((destinationQuery && !/^(layanan|service|tanya|nanya)$/i.test(destinationQuery)) || countryQuery) {
    if (destinationQuery && isCountryQuery(destinationQuery)) {
      return "DESTINATION_DISCOVERY";
    }
    if (countryQuery || destinationQuery) {
      return "DESTINATION_DISCOVERY";
    }
  }

  if (isPrimarilyGreeting(text)) {
    return "GREETING";
  }

  if (matchesAny(text, PRODUCT_INFO_PATTERNS) || normalizedIntent.includes("PACKAGE")) {
    return "PRODUCT_INFORMATION";
  }

  return "UNKNOWN";
}
