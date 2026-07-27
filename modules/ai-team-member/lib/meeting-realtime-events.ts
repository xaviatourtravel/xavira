import {
  MEETING_LIMITS,
  type TranscriptEntry,
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

/**
 * Keep only final transcript turns and dedupe by item id / text.
 */
export function mergeFinalRealtimeTranscript(
  current: TranscriptEntry[],
  event: RealtimeTranscriptEvent,
  speaker: string,
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
  };

  return [...current, next].slice(-MEETING_LIMITS.transcriptEntries);
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
