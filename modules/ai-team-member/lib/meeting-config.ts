import type { MeetingMode } from "@/modules/ai-team-member/lib/meeting-domain";

export type MeetingModelConfig = {
  askModel: string;
  raiseHandModel: string;
  checkpointModel: string;
  webSearchEnabled: boolean;
  ttsModel: string;
  ttsVoice: string;
  realtimeModel: string;
  realtimeVoice: string;
  realtimeMaxMinutes: number;
};

export type MeetingConfigError = {
  ok: false;
  code: "config";
  message: string;
};

export type MeetingConfigSuccess = {
  ok: true;
  config: MeetingModelConfig;
};

export type MeetingConfigResult = MeetingConfigSuccess | MeetingConfigError;

export function resolveMeetingModelConfig(
  env: Record<string, string | undefined> = process.env,
): MeetingConfigResult {
  const askModel = env.AI_TEAM_MEMBER_MODEL?.trim() || "gpt-5.6-sol";
  const checkpointModel =
    env.AI_TEAM_MEMBER_CHECKPOINT_MODEL?.trim() ||
    env.OPENAI_MODEL?.trim() ||
    "gpt-4.1-mini";
  // Official replacement for shut-down snapshot gpt-4o-mini-tts-2025-03-20.
  // Alias gpt-4o-mini-tts may still resolve, but pin the supported snapshot.
  const ttsModel =
    env.AI_TEAM_MEMBER_TTS_MODEL?.trim() || "gpt-4o-mini-tts-2025-12-15";
  const ttsVoice = env.AI_TEAM_MEMBER_TTS_VOICE?.trim() || "marin";
  const realtimeModel =
    env.AI_TEAM_MEMBER_REALTIME_MODEL?.trim() || "gpt-realtime-2.1";
  const realtimeVoice =
    env.AI_TEAM_MEMBER_REALTIME_VOICE?.trim() || "marin";
  const realtimeMaxMinutesRaw = Number(
    env.AI_TEAM_MEMBER_REALTIME_MAX_MINUTES?.trim() || "20",
  );
  const realtimeMaxMinutes =
    Number.isFinite(realtimeMaxMinutesRaw) && realtimeMaxMinutesRaw > 0
      ? Math.min(60, Math.floor(realtimeMaxMinutesRaw))
      : 20;
  const webSearchEnabled = env.AI_TEAM_MEMBER_WEB_SEARCH === "true";

  if (
    !askModel ||
    !checkpointModel ||
    !ttsModel ||
    !ttsVoice ||
    !realtimeModel ||
    !realtimeVoice
  ) {
    return {
      ok: false,
      code: "config",
      message:
        "Konfigurasi model AI Team Member tidak lengkap. Periksa variabel lingkungan.",
    };
  }

  return {
    ok: true,
    config: {
      askModel,
      raiseHandModel: askModel,
      checkpointModel,
      webSearchEnabled,
      ttsModel,
      ttsVoice,
      realtimeModel,
      realtimeVoice,
      realtimeMaxMinutes,
    },
  };
}

export function resolveModelForMode(
  config: MeetingModelConfig,
  mode: MeetingMode,
): string {
  switch (mode) {
    case "ask":
      return config.askModel;
    case "raise_hand":
      return config.raiseHandModel;
    case "checkpoint":
      return config.checkpointModel;
  }
}

export function isWebSearchAllowed(params: {
  mode: MeetingMode;
  requested: boolean;
  configEnabled: boolean;
}): boolean {
  return params.mode === "ask" && params.requested && params.configEnabled;
}

export function requireOpenAiApiKey(
  env: Record<string, string | undefined> = process.env,
): { ok: true; apiKey: string } | MeetingConfigError {
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      code: "config",
      message: "OPENAI_API_KEY is not configured.",
    };
  }
  return { ok: true, apiKey };
}
