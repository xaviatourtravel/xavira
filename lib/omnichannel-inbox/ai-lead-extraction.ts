import {
  loadOmnichannelSuggestReplyContext,
  type OmnichannelSuggestReplyContext,
} from "@/lib/omnichannel-inbox/ai-suggest-reply";
import { withTemporalContext } from "@/lib/ai/temporal-context";

export const EXTRACTION_CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;

export type ExtractionConfidence = (typeof EXTRACTION_CONFIDENCE_LEVELS)[number];

export type ExtractedLeadField<T = string | null> = {
  value: T;
  confidence: ExtractionConfidence;
};

export type InboxLeadExtractionData = {
  fullName: ExtractedLeadField<string | null>;
  phone: ExtractedLeadField<string | null>;
  email: ExtractedLeadField<string | null>;
  destinationInterest: ExtractedLeadField<string | null>;
  travelDate: ExtractedLeadField<string | null>;
  partySize: ExtractedLeadField<number | null>;
  budgetIdr: ExtractedLeadField<number | null>;
  packageInterest: ExtractedLeadField<string | null>;
  urgencyIntent: ExtractedLeadField<string | null>;
  notesSummary: ExtractedLeadField<string | null>;
};

export type ConvertLeadFormPrefill = {
  fullName: string;
  phone: string;
  email: string;
  packageInterest: string;
  travelDatePreference: string;
  partySize: string;
  budgetIdr: string;
  notes: string;
};

const EXTRACTION_JSON_SCHEMA = `
{
  "full_name": { "value": string | null, "confidence": "high" | "medium" | "low" },
  "phone": { "value": string | null, "confidence": "high" | "medium" | "low" },
  "email": { "value": string | null, "confidence": "high" | "medium" | "low" },
  "destination_interest": { "value": string | null, "confidence": "high" | "medium" | "low" },
  "travel_date": { "value": string | null, "confidence": "high" | "medium" | "low" },
  "party_size": { "value": number | null, "confidence": "high" | "medium" | "low" },
  "budget_idr": { "value": number | null, "confidence": "high" | "medium" | "low" },
  "package_interest": { "value": string | null, "confidence": "high" | "medium" | "low" },
  "urgency_intent": { "value": string | null, "confidence": "high" | "medium" | "low" },
  "notes_summary": { "value": string | null, "confidence": "high" | "medium" | "low" }
}
`.trim();

function formatRecentMessagesForExtraction(
  messages: OmnichannelSuggestReplyContext["recentMessages"],
) {
  if (messages.length === 0) {
    return "Belum ada pesan dalam thread ini.";
  }

  return messages
    .map((message) => {
      const speaker =
        message.direction === "incoming" ? "Pelanggan" : "Tim Desklabs";
      return `[${speaker}]\n${message.text.trim()}`;
    })
    .join("\n\n");
}

export function buildOmnichannelLeadExtractionPrompt(
  context: OmnichannelSuggestReplyContext,
  timezone?: string | null,
) {
  const leadHints = context.leadId
    ? `
Data lead CRM yang sudah terhubung (hanya sebagai referensi, prioritaskan pesan percakapan):
- Nama: ${context.salesContext.lead.full_name}
- Paket diminati: ${context.salesContext.lead.package_interest ?? "-"}
- Budget: ${context.salesContext.lead.budget_idr ?? "-"}
- Tanggal: ${context.salesContext.lead.travel_date_preference ?? "-"}
- Pax: ${context.salesContext.lead.party_size ?? "-"}
`
    : "";

  return withTemporalContext(
    `
Kamu mengekstrak informasi lead travel dari percakapan ${context.channelLabel} Desklabs/Xavira.

Tugas: baca pesan percakapan dan ekstrak HANYA informasi yang jelas disebutkan pelanggan.
Jangan mengarang data yang tidak ada di percakapan.

Pahami istilah Bahasa Indonesia travel:
- pax, orang = jumlah peserta
- berangkat, tanggal, bulan = preferensi jadwal
- budget = anggaran (konversi ke IDR jika disebut, mis. "50 juta" = 50000000)
- paket, halal tour, umrah, China, Yunnan, Jepang, Korea, Vietnam = minat destinasi/paket

Aturan ekstraksi:
- Jika tidak yakin atau tidak disebut, set value ke null dan confidence "low".
- confidence "high" = disebut eksplisit dan jelas.
- confidence "medium" = implisit tapi masuk akal dari konteks.
- confidence "low" = tidak ditemukan / sangat tidak pasti.
- phone: format nomor Indonesia jika ada (628xx).
- travel_date: gunakan YYYY-MM-DD jika tanggal pasti; jika hanya bulan/tahun, tulis teks singkat di value.
- party_size: angka bulat.
- budget_idr: angka integer IDR tanpa titik/koma.
- urgency_intent: ringkas (mis. "ingin booking cepat", "masih riset", "tanya harga dulu").
- notes_summary: ringkasan 1-3 kalimat intent pelanggan dari percakapan.

Nama pelanggan dari profil: ${context.customerName}
${leadHints}

Percakapan terbaru:
"""
${formatRecentMessagesForExtraction(context.recentMessages)}
"""

Output JSON saja tanpa markdown dengan struktur:
${EXTRACTION_JSON_SCHEMA}
`.trim(),
    { timezone },
  );
}

function normalizeConfidence(value: unknown): ExtractionConfidence {
  if (typeof value !== "string") {
    return "low";
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "high" || normalized === "medium" || normalized === "low") {
    return normalized;
  }

  return "low";
}

function normalizeStringField(value: unknown): ExtractedLeadField<string | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { value: null, confidence: "low" };
  }

  const record = value as Record<string, unknown>;
  const raw =
    typeof record.value === "string"
      ? record.value.trim()
      : record.value == null
        ? ""
        : String(record.value).trim();

  return {
    value: raw || null,
    confidence: normalizeConfidence(record.confidence),
  };
}

function normalizeNumberField(value: unknown): ExtractedLeadField<number | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { value: null, confidence: "low" };
  }

  const record = value as Record<string, unknown>;
  let parsed: number | null = null;

  if (typeof record.value === "number" && Number.isFinite(record.value)) {
    parsed = Math.round(record.value);
  } else if (typeof record.value === "string" && record.value.trim()) {
    const digits = record.value.replace(/\D/g, "");
    parsed = digits ? Number.parseInt(digits, 10) : null;
  }

  return {
    value: parsed,
    confidence: normalizeConfidence(record.confidence),
  };
}

export function parseInboxLeadExtractionResponse(raw: string):
  | { success: true; data: InboxLeadExtractionData }
  | { success: false; message: string } {
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()
    : trimmed;

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;

    return {
      success: true,
      data: {
        fullName: normalizeStringField(parsed.full_name),
        phone: normalizeStringField(parsed.phone),
        email: normalizeStringField(parsed.email),
        destinationInterest: normalizeStringField(parsed.destination_interest),
        travelDate: normalizeStringField(parsed.travel_date),
        partySize: normalizeNumberField(parsed.party_size),
        budgetIdr: normalizeNumberField(parsed.budget_idr),
        packageInterest: normalizeStringField(parsed.package_interest),
        urgencyIntent: normalizeStringField(parsed.urgency_intent),
        notesSummary: normalizeStringField(parsed.notes_summary),
      },
    };
  } catch {
    return {
      success: false,
      message: "AI extraction failed. Please try again.",
    };
  }
}

const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function resolveTravelDateForForm(travelDate: ExtractedLeadField<string | null>) {
  if (!travelDate.value) {
    return "";
  }

  if (DATE_INPUT_PATTERN.test(travelDate.value)) {
    return travelDate.value;
  }

  return "";
}

function buildPackageInterestValue(
  destination: ExtractedLeadField<string | null>,
  packageInterest: ExtractedLeadField<string | null>,
) {
  const parts = [destination.value, packageInterest.value]
    .filter((part): part is string => Boolean(part?.trim()))
    .map((part) => part.trim());

  return [...new Set(parts)].join(" · ");
}

function buildNotesValue(
  notesSummary: ExtractedLeadField<string | null>,
  urgencyIntent: ExtractedLeadField<string | null>,
  travelDate: ExtractedLeadField<string | null>,
  travelDateForForm: string,
) {
  const lines: string[] = [];

  if (notesSummary.value) {
    lines.push(notesSummary.value);
  }

  if (urgencyIntent.value) {
    lines.push(`Intent: ${urgencyIntent.value}`);
  }

  if (travelDate.value && !travelDateForForm) {
    lines.push(`Travel preference: ${travelDate.value}`);
  }

  return lines.join("\n");
}

export function mapExtractionToConvertFormPrefill(
  extraction: InboxLeadExtractionData,
  fallbackName: string,
): ConvertLeadFormPrefill {
  const travelDateForForm = resolveTravelDateForForm(extraction.travelDate);

  return {
    fullName: extraction.fullName.value ?? fallbackName,
    phone: extraction.phone.value ?? "",
    email: extraction.email.value ?? "",
    packageInterest: buildPackageInterestValue(
      extraction.destinationInterest,
      extraction.packageInterest,
    ),
    travelDatePreference: travelDateForForm,
    partySize:
      extraction.partySize.value != null
        ? String(extraction.partySize.value)
        : "",
    budgetIdr:
      extraction.budgetIdr.value != null
        ? String(extraction.budgetIdr.value)
        : "",
    notes: buildNotesValue(
      extraction.notesSummary,
      extraction.urgencyIntent,
      extraction.travelDate,
      travelDateForForm,
    ),
  };
}

export function formatExtractionConfidenceLabel(
  confidence: ExtractionConfidence,
) {
  switch (confidence) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    default:
      return "Low";
  }
}

export function getExtractionConfidenceClassName(
  confidence: ExtractionConfidence,
) {
  switch (confidence) {
    case "high":
      return "bg-emerald-100 text-emerald-800";
    case "medium":
      return "bg-amber-100 text-amber-900";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export async function loadOmnichannelLeadExtractionContext(
  supabase: Parameters<typeof loadOmnichannelSuggestReplyContext>[0],
  organizationId: string,
  conversationId: string,
) {
  return loadOmnichannelSuggestReplyContext(
    supabase,
    organizationId,
    conversationId,
  );
}
