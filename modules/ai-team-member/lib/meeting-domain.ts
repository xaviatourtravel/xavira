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

export function buildMeetingPrompt(input: { brainId: BrainId; transcript: TranscriptEntry[]; question?: string }) {
  const transcript = input.transcript.map((item) => `[${item.speaker}] ${item.text}`).join("\n");
  return [
    `You are the isolated "${input.brainId}" AI team member.`,
    "Never use knowledge or memory from another brain.",
    "Separate confirmed decisions from proposals. Never promote a proposal into a decision.",
    "Return strict JSON with: summary, decisions, actionItems[{task,pic,deadline}], unresolvedIssues, memoryCandidates.",
    input.question ? `Current question: ${input.question}` : "Create the meeting checkpoint.",
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
