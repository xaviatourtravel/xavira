import {
  MEETING_LIMITS,
  meetingSpeechBodySchema,
  type MeetingSpeechBody,
} from "@/modules/ai-team-member/lib/meeting-domain";
import {
  resolveMeetingModelConfig,
  type MeetingModelConfig,
} from "@/modules/ai-team-member/lib/meeting-config";

export const MEETING_TTS_INSTRUCTIONS =
  "Bicara dalam Bahasa Indonesia yang natural, hangat, percaya diri, dan conversational seperti rekan kerja cerdas. Gunakan tempo sedang, jeda alami, artikulasi jelas, dan jangan terdengar seperti membaca dokumen.";

export type MeetingTtsClient = {
  audio: {
    speech: {
      create: (body: {
        model: string;
        voice: string;
        input: string;
        instructions?: string;
        response_format?: "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm";
      }) => PromiseLike<{
        arrayBuffer: () => PromiseLike<ArrayBuffer>;
        headers?: { get?: (name: string) => string | null };
      }>;
    };
  };
};

export type MeetingTtsSuccess = {
  ok: true;
  bytes: Uint8Array;
  contentType: string;
  model: string;
  voice: string;
};

export type MeetingTtsFailure = {
  ok: false;
  code: "validation" | "config" | "upstream";
  message: string;
};

export type MeetingTtsResult = MeetingTtsSuccess | MeetingTtsFailure;

export function validateMeetingSpeechBody(
  value: unknown,
): { ok: true; body: MeetingSpeechBody } | MeetingTtsFailure {
  const parsed = meetingSpeechBodySchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      code: "validation",
      message: `Teks suara tidak valid atau melebihi ${MEETING_LIMITS.ttsInputChars} karakter.`,
    };
  }
  return { ok: true, body: parsed.data };
}

export async function synthesizeMeetingSpeech(params: {
  client: MeetingTtsClient;
  text: string;
  config?: MeetingModelConfig;
}): Promise<MeetingTtsResult> {
  const configResult = params.config
    ? { ok: true as const, config: params.config }
    : resolveMeetingModelConfig();
  if (!configResult.ok) {
    return {
      ok: false,
      code: "config",
      message: configResult.message,
    };
  }

  const text = params.text.trim();
  if (!text || text.length > MEETING_LIMITS.ttsInputChars) {
    return {
      ok: false,
      code: "validation",
      message: `Teks suara tidak valid atau melebihi ${MEETING_LIMITS.ttsInputChars} karakter.`,
    };
  }

  try {
    const response = await params.client.audio.speech.create({
      model: configResult.config.ttsModel,
      voice: configResult.config.ttsVoice,
      input: text,
      instructions: MEETING_TTS_INSTRUCTIONS,
      response_format: "mp3",
    });
    const buffer = await response.arrayBuffer();
    const contentType =
      response.headers?.get?.("content-type") || "audio/mpeg";

    return {
      ok: true,
      bytes: new Uint8Array(buffer),
      contentType,
      model: configResult.config.ttsModel,
      voice: configResult.config.ttsVoice,
    };
  } catch (error) {
    console.error("[ai-team-member] tts upstream failure", {
      errorName: error instanceof Error ? error.name : "unknown",
      model: configResult.config.ttsModel,
      voice: configResult.config.ttsVoice,
      textLength: text.length,
    });
    return {
      ok: false,
      code: "upstream",
      message: "Layanan suara AI sedang gagal. Coba lagi sebentar.",
    };
  }
}
