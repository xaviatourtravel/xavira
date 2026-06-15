import { getEffectiveLeadTemperature } from "@/lib/leads/lead-temperature";
import { formatLeadSourceLabel } from "@/lib/leads/source-tracking";

export const LEAD_INTELLIGENCE_CACHE_KEY = "ai_lead_intelligence_v1";

export const LEAD_INTELLIGENCE_NEXT_ACTIONS = [
  "Follow up today",
  "Send itinerary",
  "Offer alternative package",
  "Re-engage",
  "Escalate to sales manager",
] as const;

export type LeadIntelligenceCategory = "hot" | "warm" | "cold";

export type LeadIntelligenceResult = {
  summary: string;
  score: number;
  category: LeadIntelligenceCategory;
  reasoning: string[];
  nextBestAction: string;
  insufficientData: boolean;
  generatedAt: string;
  cached: boolean;
};

export type LeadIntelligenceCacheEntry = {
  fingerprint: string;
  summary: string;
  score: number;
  reasoning: string[];
  nextBestAction: string;
  insufficientData: boolean;
  generatedAt: string;
};

export type LeadIntelligenceLead = {
  full_name: string;
  source: string;
  status: string;
  package_interest: string | null;
  notes: string | null;
  lead_temperature: string | null;
  updated_at: string;
};

export type LeadIntelligenceActivity = {
  activity_type: string;
  title: string | null;
  body: string | null;
  occurred_at: string;
};

export type LeadIntelligenceFollowUpTask = {
  title: string;
  description: string | null;
  due_date: string;
  status: string;
};

export type LeadIntelligencePromptInput = {
  lead: LeadIntelligenceLead;
  activities: LeadIntelligenceActivity[];
  followUpTasks: LeadIntelligenceFollowUpTask[];
};

export function getLeadIntelligenceCategory(
  score: number,
): LeadIntelligenceCategory {
  if (score >= 80) {
    return "hot";
  }

  if (score >= 50) {
    return "warm";
  }

  return "cold";
}

export function getLeadIntelligenceCategoryLabel(
  category: LeadIntelligenceCategory,
) {
  switch (category) {
    case "hot":
      return "Hot";
    case "warm":
      return "Warm";
    case "cold":
      return "Cold";
  }
}

export function getLeadIntelligenceBadgeClassName(
  category: LeadIntelligenceCategory,
) {
  switch (category) {
    case "hot":
      return "bg-orange-100 text-orange-800";
    case "warm":
      return "bg-yellow-100 text-yellow-800";
    case "cold":
      return "bg-slate-100 text-slate-700";
  }
}

export function buildLeadIntelligenceFingerprint(input: {
  updatedAt: string;
  status: string;
  notes: string | null;
  leadTemperature: string | null;
  packageInterest: string | null;
  activityCount: number;
  latestActivityAt: string | null;
  followUpPendingCount: number;
  followUpCompletedCount: number;
}) {
  return [
    input.updatedAt,
    input.status,
    input.notes ?? "",
    input.leadTemperature ?? "",
    input.packageInterest ?? "",
    String(input.activityCount),
    input.latestActivityAt ?? "",
    String(input.followUpPendingCount),
    String(input.followUpCompletedCount),
  ].join("|");
}

function formatActivities(activities: LeadIntelligenceActivity[]) {
  if (activities.length === 0) {
    return "- Belum ada aktivitas tercatat";
  }

  return activities
    .map(
      (activity) =>
        `- ${activity.occurred_at}: ${activity.activity_type} | ${activity.title ?? ""} ${activity.body ?? ""}`.trim(),
    )
    .join("\n");
}

function formatFollowUpTasks(tasks: LeadIntelligenceFollowUpTask[]) {
  if (tasks.length === 0) {
    return "- Belum ada follow up terjadwal";
  }

  return tasks
    .map(
      (task) =>
        `- ${task.due_date} [${task.status}] ${task.title}${task.description ? ` — ${task.description}` : ""}`,
    )
    .join("\n");
}

export function buildLeadIntelligencePrompt({
  lead,
  activities,
  followUpTasks,
}: LeadIntelligencePromptInput) {
  const temperature = getEffectiveLeadTemperature({
    lead_temperature: lead.lead_temperature,
    status: lead.status,
    updated_at: lead.updated_at,
  });

  return `
Kamu menganalisis kualitas lead travel Umroh/Halal Tour untuk membantu sales memahami situasi lead dan langkah berikutnya.

Berdasarkan data berikut, buat analisis lead dalam format JSON saja (tanpa markdown, tanpa penjelasan di luar JSON).

Struktur JSON wajib:
{
  "summary": "ringkasan 2-5 kalimat dalam Bahasa Indonesia",
  "score": angka 0-100,
  "reasoning": ["alasan 1", "alasan 2", "alasan 3"],
  "nextBestAction": "salah satu dari daftar aksi",
  "insufficientData": true atau false
}

Aturan analisis:
- summary: ringkas, faktual, 2-5 kalimat, Bahasa Indonesia.
- score: 0-100 (Hot 80-100, Warm 50-79, Cold 0-49) berdasarkan kesiapan beli dan engagement.
- reasoning: 2-5 poin singkat seperti contoh ("Asked about price", "No response for 7 days") — tulis dalam Bahasa Indonesia natural.
- nextBestAction: pilih tepat satu dari:
  - Follow up today
  - Send itinerary
  - Offer alternative package
  - Re-engage
  - Escalate to sales manager
- insufficientData: true jika data lead terlalu sedikit untuk analisis kuat.
- Jangan mengarang detail paket, harga, diskon, atau ketersediaan seat.
- Jangan menyebut kata AI atau otomatis di summary/reasoning.
- Gunakan hanya fakta dari data yang tersedia.

Data lead:
- Nama: ${lead.full_name}
- Sumber lead: ${formatLeadSourceLabel(lead.source)}
- Status pipeline: ${lead.status}
- Suhu lead: ${temperature.value}${temperature.isSuggested ? " (suggested)" : ""}
- Paket diminati: ${lead.package_interest ?? "belum dipilih"}
- Catatan: ${lead.notes?.trim() || "-"}

Aktivitas terakhir:
${formatActivities(activities)}

Follow up:
${formatFollowUpTasks(followUpTasks)}
`.trim();
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function normalizeNextBestAction(value: unknown) {
  if (typeof value !== "string") {
    return LEAD_INTELLIGENCE_NEXT_ACTIONS[0];
  }

  const trimmed = value.trim();
  const match = LEAD_INTELLIGENCE_NEXT_ACTIONS.find(
    (action) => action.toLowerCase() === trimmed.toLowerCase(),
  );

  return match ?? LEAD_INTELLIGENCE_NEXT_ACTIONS[0];
}

export function parseLeadIntelligenceResponse(raw: string): {
  success: true;
  data: Omit<
    LeadIntelligenceResult,
    "category" | "generatedAt" | "cached"
  >;
} | {
  success: false;
  message: string;
} {
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()
    : trimmed;

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    const summary =
      typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const scoreValue =
      typeof parsed.score === "number"
        ? parsed.score
        : Number.parseInt(String(parsed.score ?? ""), 10);
    const score = Number.isFinite(scoreValue)
      ? Math.min(100, Math.max(0, Math.round(scoreValue)))
      : 0;
    const reasoning = normalizeStringArray(parsed.reasoning);
    const nextBestAction = normalizeNextBestAction(parsed.nextBestAction);
    const insufficientData = parsed.insufficientData === true;

    if (!summary) {
      return {
        success: false,
        message: "Gagal memproses hasil analisis lead.",
      };
    }

    return {
      success: true,
      data: {
        summary,
        score,
        reasoning:
          reasoning.length > 0
            ? reasoning
            : ["Data lead masih terbatas untuk analisis mendalam."],
        nextBestAction,
        insufficientData,
      },
    };
  } catch {
    return {
      success: false,
      message: "Gagal memproses hasil analisis lead.",
    };
  }
}

export function toLeadIntelligenceResult(
  entry: LeadIntelligenceCacheEntry,
  cached: boolean,
): LeadIntelligenceResult {
  return {
    summary: entry.summary,
    score: entry.score,
    category: getLeadIntelligenceCategory(entry.score),
    reasoning: entry.reasoning,
    nextBestAction: entry.nextBestAction,
    insufficientData: entry.insufficientData,
    generatedAt: entry.generatedAt,
    cached,
  };
}

export function readLeadIntelligenceCache(
  metadata: Record<string, unknown> | null | undefined,
  fingerprint: string,
): LeadIntelligenceCacheEntry | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const raw = metadata[LEAD_INTELLIGENCE_CACHE_KEY];
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const entry = raw as Partial<LeadIntelligenceCacheEntry>;
  if (
    entry.fingerprint !== fingerprint ||
    typeof entry.summary !== "string" ||
    typeof entry.score !== "number" ||
    !Array.isArray(entry.reasoning) ||
    typeof entry.nextBestAction !== "string" ||
    typeof entry.generatedAt !== "string"
  ) {
    return null;
  }

  return {
    fingerprint: entry.fingerprint,
    summary: entry.summary,
    score: Math.min(100, Math.max(0, Math.round(entry.score))),
    reasoning: normalizeStringArray(entry.reasoning),
    nextBestAction: normalizeNextBestAction(entry.nextBestAction),
    insufficientData: entry.insufficientData === true,
    generatedAt: entry.generatedAt,
  };
}

export function buildLeadIntelligenceCacheEntry(
  fingerprint: string,
  data: Omit<
    LeadIntelligenceResult,
    "category" | "generatedAt" | "cached"
  >,
): LeadIntelligenceCacheEntry {
  return {
    fingerprint,
    summary: data.summary,
    score: data.score,
    reasoning: data.reasoning,
    nextBestAction: data.nextBestAction,
    insufficientData: data.insufficientData,
    generatedAt: new Date().toISOString(),
  };
}

export function resolveLeadIntelligenceFromLeadData({
  metadata,
  updatedAt,
  status,
  notes,
  leadTemperature,
  packageInterest,
  activities,
  followUpTasks,
}: {
  metadata: Record<string, unknown> | null | undefined;
  updatedAt: string;
  status: string;
  notes: string | null;
  leadTemperature: string | null;
  packageInterest: string | null;
  activities: LeadIntelligenceActivity[];
  followUpTasks: LeadIntelligenceFollowUpTask[];
}): LeadIntelligenceResult | null {
  const effectiveTemperature = getEffectiveLeadTemperature({
    lead_temperature: leadTemperature,
    status,
    updated_at: updatedAt,
  });
  const fingerprint = buildLeadIntelligenceFingerprint({
    updatedAt,
    status,
    notes,
    leadTemperature: effectiveTemperature.value,
    packageInterest,
    activityCount: activities.length,
    latestActivityAt: activities[0]?.occurred_at ?? null,
    followUpPendingCount: followUpTasks.filter((task) => task.status === "pending")
      .length,
    followUpCompletedCount: followUpTasks.filter(
      (task) => task.status === "completed",
    ).length,
  });
  const cached = readLeadIntelligenceCache(metadata, fingerprint);

  return cached ? toLeadIntelligenceResult(cached, true) : null;
}
