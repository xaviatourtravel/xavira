import { z } from "zod";

export const BRAIN_IDS = ["desklabs", "kreatifpedia", "piatur", "founder"] as const;
export type BrainId = (typeof BRAIN_IDS)[number];

export const MEETING_MODES = ["ask", "raise_hand", "checkpoint"] as const;
export type MeetingMode = (typeof MEETING_MODES)[number];

export type TranscriptEntry = {
  id: string;
  speaker: string;
  text: string;
  createdAt: string;
};

/**
 * Strict Structured Outputs schema.
 * All properties are required (empty string / empty arrays allowed).
 * Nullable string fields use .nullable() for OpenAI strict JSON Schema.
 */
export const meetingCheckpointSchema = z.object({
  responseText: z.string(),
  summary: z.string(),
  decisions: z.array(z.string()),
  actionItems: z.array(
    z.object({
      task: z.string(),
      pic: z.string().nullable(),
      deadline: z.string().nullable(),
    }),
  ),
  unresolvedIssues: z.array(z.string()),
  memoryCandidates: z.array(z.string()),
});

export type MeetingInsight = z.infer<typeof meetingCheckpointSchema>;

export const meetingAnalyzeBodySchema = z.object({
  brainId: z.string(),
  mode: z.enum(MEETING_MODES),
  question: z.string().max(2000).optional(),
  transcript: z
    .array(
      z.object({
        id: z.string(),
        speaker: z.string().min(1).max(80),
        text: z.string().min(1).max(10000),
        createdAt: z.string(),
      }),
    )
    .max(500),
});

export type MeetingAnalyzeBody = z.infer<typeof meetingAnalyzeBodySchema>;

export function isBrainId(value: unknown): value is BrainId {
  return typeof value === "string" && BRAIN_IDS.includes(value as BrainId);
}

export function isMeetingMode(value: unknown): value is MeetingMode {
  return typeof value === "string" && MEETING_MODES.includes(value as MeetingMode);
}

function modeInstructions(mode: MeetingMode): string {
  switch (mode) {
    case "ask":
      return [
        "Mode: ask",
        "responseText WAJIB menjawab pertanyaan pengguna secara langsung berdasarkan transcript dan konteks brain.",
        "Jika pertanyaan kosong, jawab pertanyaan implisit terbaik dari konteks transcript.",
        "summary/decisions/actionItems/unresolvedIssues/memoryCandidates tetap diisi bila relevan; boleh string/array kosong.",
      ].join("\n");
    case "raise_hand":
      return [
        "Mode: raise_hand",
        "responseText WAJIB berupa intervensi singkat dan langsung dalam Bahasa Indonesia.",
        "Angkat tangan hanya jika ada risiko material, kontradiksi, asumsi yang belum teruji, atau keputusan penting yang belum dibuat.",
        "Jika tidak ada intervensi material yang beralasan, responseText harus mengatakan itu dengan jelas dalam Bahasa Indonesia natural.",
        "Jangan hanya merangkum rapat.",
      ].join("\n");
    case "checkpoint":
      return [
        "Mode: checkpoint",
        "responseText harus memperkenalkan checkpoint secara singkat.",
        "Lengkapi summary, decisions, actionItems, unresolvedIssues, dan memoryCandidates dari transcript.",
      ].join("\n");
  }
}

export function buildMeetingPrompt(input: {
  brainId: BrainId;
  mode: MeetingMode;
  transcript: TranscriptEntry[];
  question?: string;
}) {
  const transcript = input.transcript
    .map((item) => `[${item.speaker}] ${item.text}`)
    .join("\n");

  return [
    `Anda adalah AI Team Member "${input.brainId}" yang terisolasi.`,
    "Jangan pernah menggunakan pengetahuan, memori, atau konteks dari brain lain.",
    "Pisahkan keputusan terkonfirmasi dari usulan. Jangan mengubah usulan menjadi keputusan final.",
    "Keluarkan objek yang memenuhi schema meeting_checkpoint.",
    "Semua nilai teks WAJIB dalam Bahasa Indonesia yang natural untuk konteks rapat.",
    "Jangan menerjemahkan nama orang, nama produk, merek, atau istilah teknis resmi.",
    "Nama properti JSON/schema tetap dalam bahasa Inggris dan tidak boleh diubah.",
    modeInstructions(input.mode),
    input.question?.trim()
      ? `Pertanyaan / instruksi pengguna: ${input.question.trim()}`
      : "Tidak ada pertanyaan tambahan dari pengguna.",
    `Transcript:\n${transcript || "(empty)"}`,
  ].join("\n\n");
}

export function normalizeMeetingInsight(value: unknown): MeetingInsight {
  const data =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const strings = (item: unknown) =>
    Array.isArray(item)
      ? item.filter((entry): entry is string => typeof entry === "string")
      : [];
  const actionItems = Array.isArray(data.actionItems)
    ? data.actionItems.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        if (typeof row.task !== "string") return [];
        return [
          {
            task: row.task,
            pic: typeof row.pic === "string" ? row.pic : null,
            deadline: typeof row.deadline === "string" ? row.deadline : null,
          },
        ];
      })
    : [];

  return {
    responseText:
      typeof data.responseText === "string" ? data.responseText : "",
    summary: typeof data.summary === "string" ? data.summary : "",
    decisions: strings(data.decisions),
    actionItems,
    unresolvedIssues: strings(data.unresolvedIssues),
    memoryCandidates: strings(data.memoryCandidates),
  };
}
