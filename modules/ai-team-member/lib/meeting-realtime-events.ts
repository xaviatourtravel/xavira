import {
  MEETING_LIMITS,
  type TranscriptEntry,
  type TranscriptEntrySourceLink,
  type TranscriptEvidenceKind,
} from "@/modules/ai-team-member/lib/meeting-domain";

/** Browser WebRTC SDP exchange endpoint (ephemeral client secret auth). */
export const REALTIME_CALLS_URL = "https://api.openai.com/v1/realtime/calls";

export type RealtimeTranscriptEvent = {
  id: string;
  role: "user" | "assistant";
  text: string;
  status: "partial" | "final";
  itemId?: string;
};

export type RealtimeFunctionCallRequest = {
  callId: string;
  name: string;
  arguments: string;
};

/**
 * Keep only final transcript turns and dedupe by item id / text.
 */
export function mergeFinalRealtimeTranscript(
  current: TranscriptEntry[],
  event: RealtimeTranscriptEvent,
  speaker: string,
  extras?: {
    sources?: TranscriptEntrySourceLink[];
    evidenceKinds?: TranscriptEvidenceKind[];
  },
): TranscriptEntry[] {
  if (event.status !== "final") return current;
  const text = event.text.trim();
  if (!text) return current;

  const dedupeKey = event.itemId || `${event.role}:${text}`;
  const already = current.some(
    (item) =>
      item.source === "realtime" &&
      (item.id === dedupeKey ||
        (item.text === text &&
          item.speaker ===
            (event.role === "assistant" ? "AI Team Member" : speaker))),
  );
  if (already) return current;

  const next: TranscriptEntry = {
    id: dedupeKey,
    speaker: event.role === "assistant" ? "AI Team Member" : speaker,
    text,
    createdAt: new Date().toISOString(),
    source: "realtime",
    sources:
      event.role === "assistant" && extras?.sources?.length
        ? extras.sources
        : undefined,
    evidenceKinds:
      event.role === "assistant" && extras?.evidenceKinds?.length
        ? extras.evidenceKinds
        : undefined,
  };

  return [...current, next].slice(-MEETING_LIMITS.transcriptEntries);
}

export function attachSourcesToLatestAssistantTurn(
  current: TranscriptEntry[],
  sources: TranscriptEntrySourceLink[],
  evidenceKinds: TranscriptEvidenceKind[],
): TranscriptEntry[] {
  if (!sources.length && !evidenceKinds.length) return current;
  for (let index = current.length - 1; index >= 0; index -= 1) {
    const item = current[index];
    if (item?.source === "realtime" && item.speaker === "AI Team Member") {
      const next = [...current];
      next[index] = {
        ...item,
        sources: [...(item.sources ?? []), ...sources].slice(
          0,
          MEETING_LIMITS.sourceMax,
        ),
        evidenceKinds: [
          ...new Set([...(item.evidenceKinds ?? []), ...evidenceKinds]),
        ],
      };
      return next;
    }
  }
  return current;
}

export function parseRealtimeDataChannelEvent(
  raw: string,
): { type: string; payload: Record<string, unknown> } | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed.type !== "string") return null;
    return { type: parsed.type, payload: parsed };
  } catch {
    return null;
  }
}

export function extractRealtimeFunctionCall(
  event: { type: string; payload: Record<string, unknown> },
): RealtimeFunctionCallRequest | null {
  if (event.type === "response.function_call_arguments.done") {
    const callId =
      typeof event.payload.call_id === "string" ? event.payload.call_id : "";
    const name =
      typeof event.payload.name === "string" ? event.payload.name : "";
    const args =
      typeof event.payload.arguments === "string"
        ? event.payload.arguments
        : JSON.stringify(event.payload.arguments ?? {});
    if (!callId || !name) return null;
    return { callId, name, arguments: args };
  }

  if (event.type === "response.done") {
    const response = event.payload.response as
      | { output?: Array<Record<string, unknown>> }
      | undefined;
    const item = response?.output?.find(
      (entry) => entry.type === "function_call",
    );
    if (!item) return null;
    const callId = typeof item.call_id === "string" ? item.call_id : "";
    const name = typeof item.name === "string" ? item.name : "";
    const args =
      typeof item.arguments === "string"
        ? item.arguments
        : JSON.stringify(item.arguments ?? {});
    if (!callId || !name) return null;
    return { callId, name, arguments: args };
  }

  return null;
}

export function extractRealtimeTranscriptEvent(
  event: { type: string; payload: Record<string, unknown> },
): RealtimeTranscriptEvent | null {
  const payload = event.payload;
  const itemId =
    typeof payload.item_id === "string"
      ? payload.item_id
      : typeof (payload.item as { id?: string } | undefined)?.id === "string"
        ? (payload.item as { id: string }).id
        : undefined;

  if (
    event.type === "conversation.item.input_audio_transcription.completed" ||
    event.type === "conversation.item.input_audio_transcription.done"
  ) {
    const text =
      typeof payload.transcript === "string"
        ? payload.transcript
        : typeof payload.text === "string"
          ? payload.text
          : "";
    return {
      id: itemId || `user-${text}`,
      role: "user",
      text,
      status: "final",
      itemId,
    };
  }

  if (
    event.type === "response.output_audio_transcript.done" ||
    event.type === "response.audio_transcript.done"
  ) {
    const text =
      typeof payload.transcript === "string"
        ? payload.transcript
        : typeof payload.text === "string"
          ? payload.text
          : "";
    return {
      id: itemId || `assistant-${text}`,
      role: "assistant",
      text,
      status: "final",
      itemId,
    };
  }

  if (
    event.type === "conversation.item.input_audio_transcription.delta" ||
    event.type === "response.output_audio_transcript.delta" ||
    event.type === "response.audio_transcript.delta"
  ) {
    const text =
      typeof payload.delta === "string"
        ? payload.delta
        : typeof payload.transcript === "string"
          ? payload.transcript
          : "";
    return {
      id: itemId || `partial-${Date.now()}`,
      role: event.type.includes("input_audio") ? "user" : "assistant",
      text,
      status: "partial",
      itemId,
    };
  }

  return null;
}

export function mapRealtimeCallState(eventType: string):
  | "listening"
  | "thinking"
  | "speaking"
  | "disconnected"
  | null {
  switch (eventType) {
    case "input_audio_buffer.speech_started":
      return "listening";
    case "input_audio_buffer.speech_stopped":
    case "response.created":
    case "response.function_call_arguments.delta":
    case "response.function_call_arguments.done":
      return "thinking";
    case "response.output_audio.delta":
    case "response.audio.delta":
    case "output_audio_buffer.started":
      return "speaking";
    case "response.done":
    case "output_audio_buffer.stopped":
      return "listening";
    case "error":
      return "disconnected";
    default:
      return null;
  }
}

export function extractCallIdFromLocation(
  location: string | null,
): string | null {
  if (!location) return null;
  const parts = location.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  return last || null;
}

export function mapToolNameToUiStatus(
  name: string,
):
  | "checking_brain"
  | "searching_web"
  | "analyzing"
  | "checking_memory"
  | "idle" {
  switch (name) {
    case "search_web":
      return "searching_web";
    case "reason_deeply":
      return "analyzing";
    case "search_approved_memories":
      return "checking_memory";
    case "search_business_brain":
      return "checking_brain";
    default:
      return "idle";
  }
}
