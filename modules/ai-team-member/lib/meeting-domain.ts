export const BRAIN_IDS = ["desklabs", "kreatifpedia", "piatur", "founder"] as const;
export type BrainId = (typeof BRAIN_IDS)[number];
export type TranscriptEntry = { id: string; speaker: string; text: string; createdAt: string };
export type MeetingInsight = {
  summary: string;
  decisions: string[];
  actionItems: Array<{ task: string; pic: string | null; deadline: string | null }>;
  unresolvedIssues: string[];
  memoryCandidates: string[];
};

export function isBrainId(value: unknown): value is BrainId {
  return typeof value === "string" && BRAIN_IDS.includes(value as BrainId);
}

function isRaiseHandIntent(question?: string): boolean {
  if (!question) return false;
  return /(angkat tangan|raise hand|raise your hand|intervensi)/i.test(question);
}

export function buildMeetingPrompt(input: { brainId: BrainId; transcript: TranscriptEntry[]; question?: string }) {
  const transcript = input.transcript.map((item) => `[${item.speaker}] ${item.text}`).join("\n");
  const raiseHand = isRaiseHandIntent(input.question);
  return [
    `Anda adalah AI Team Member "${input.brainId}" yang terisolasi.`,
    "Jangan pernah menggunakan pengetahuan, memori, atau konteks dari brain lain.",
    "Pisahkan keputusan terkonfirmasi dari usulan. Jangan mengubah usulan menjadi keputusan final.",
    "Keluaran WAJIB berupa JSON valid dengan properti persis: summary, decisions, actionItems[{task,pic,deadline}], unresolvedIssues, memoryCandidates.",
    "Semua nilai teks WAJIB dalam Bahasa Indonesia yang natural untuk konteks rapat.",
    "Jangan menerjemahkan nama orang, nama produk, merek, atau istilah teknis resmi.",
    "Jangan tambahkan teks di luar JSON (tanpa markdown, tanpa code fence).",
    raiseHand
      ? "Mode Angkat Tangan: berikan intervensi singkat, langsung, dan actionable hanya jika ada risiko material, kontradiksi, asumsi belum teruji, atau keputusan penting belum dibuat."
      : "Mode Checkpoint: berikan ringkasan rapat yang presisi, keputusan, tindak lanjut, isu belum selesai, dan kandidat memori.",
    input.question ? `Pertanyaan saat ini: ${input.question}` : "Buat checkpoint rapat saat ini.",
    `Transcript:\n${transcript || "(empty)"}`,
  ].join("\n\n");
}

export function normalizeMeetingInsight(value: unknown): MeetingInsight {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const strings = (item: unknown) =>
    Array.isArray(item) ? item.filter((entry): entry is string => typeof entry === "string") : [];
  const actionItems = Array.isArray(data.actionItems)
    ? data.actionItems.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        if (typeof row.task !== "string") return [];
        return [{ task: row.task, pic: typeof row.pic === "string" ? row.pic : null, deadline: typeof row.deadline === "string" ? row.deadline : null }];
      })
    : [];
  return {
    summary: typeof data.summary === "string" ? data.summary : "",
    decisions: strings(data.decisions),
    actionItems,
    unresolvedIssues: strings(data.unresolvedIssues),
    memoryCandidates: strings(data.memoryCandidates),
  };
}

function stripJsonFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) return fenced[1].trim();
  return trimmed;
}

/**
 * Extract candidate JSON text from raw model output.
 * Accepts:
 * - strict JSON
 * - fenced ```json blocks
 * - text that wraps one JSON object
 */
export function extractMeetingInsightJson(raw: string): string | null {
  const plain = stripJsonFences(raw);
  if (plain.startsWith("{") && plain.endsWith("}")) return plain;
  const start = plain.indexOf("{");
  const end = plain.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return plain.slice(start, end + 1);
}

function hasAnyInsightContent(insight: MeetingInsight): boolean {
  return Boolean(
    insight.summary.trim() ||
      insight.decisions.length ||
      insight.actionItems.length ||
      insight.unresolvedIssues.length ||
      insight.memoryCandidates.length,
  );
}

/**
 * Parse model output safely into a normalized insight.
 * Returns null when output is missing/invalid so callers can fail clearly.
 */
export function parseMeetingInsightFromModelOutput(raw: string | null | undefined): MeetingInsight | null {
  if (!raw || !raw.trim()) return null;
  const candidate = extractMeetingInsightJson(raw);
  if (!candidate) return null;
  try {
    const parsed = JSON.parse(candidate);
    const normalized = normalizeMeetingInsight(parsed);
    return hasAnyInsightContent(normalized) ? normalized : null;
  } catch {
    return null;
  }
}
