import { createHash } from "node:crypto";
import { z } from "zod";
import { buildMeetingContextBundle } from "@/modules/ai-team-member/lib/meeting-context";
import {
  resolveMeetingModelConfig,
  type MeetingModelConfig,
  type RealtimeReasoningEffort,
} from "@/modules/ai-team-member/lib/meeting-config";
import {
  isBrainId,
  MEETING_LIMITS,
  type BrainId,
  type TranscriptEntry,
} from "@/modules/ai-team-member/lib/meeting-domain";
import type { ApprovedMemoryRepository } from "@/modules/ai-team-member/lib/meeting-memory-repository";
import { createEmptyApprovedMemoryRepository } from "@/modules/ai-team-member/lib/meeting-memory-repository";
import { REALTIME_CALLS_URL } from "@/modules/ai-team-member/lib/meeting-realtime-events";
import {
  buildCompactRealtimeStartupContext,
  buildRealtimePersonalityPrompt,
} from "@/modules/ai-team-member/lib/meeting-realtime-prompt";
import { buildRealtimeToolDefinitions } from "@/modules/ai-team-member/lib/meeting-realtime-tools";

export { REALTIME_CALLS_URL };

export const realtimeSessionBodySchema = z.object({
  brainId: z.string(),
});

export type RealtimeSessionBody = z.infer<typeof realtimeSessionBodySchema>;

export type RealtimeClientSecretsClient = {
  realtime: {
    clientSecrets: {
      create: (
        body: {
          expires_after?: { anchor?: "created_at"; seconds?: number };
          session?: Record<string, unknown>;
        },
        options?: {
          headers?: Record<string, string>;
        },
      ) => PromiseLike<{
        value: string;
        expires_at: number;
        session?: { id?: string; model?: string } | null;
      }>;
    };
  };
};

export type RealtimeSessionSuccess = {
  ok: true;
  clientSecret: string;
  expiresAt: number;
  sessionId: string | null;
  model: string;
  voice: string;
  maxMinutes: number;
  warningAtMinutes: number;
  reasoningEffort: RealtimeReasoningEffort;
  toolsEnabled: string[];
};

export type RealtimeSessionFailure = {
  ok: false;
  code: "validation" | "config" | "upstream";
  message: string;
};

export type RealtimeSessionResult = RealtimeSessionSuccess | RealtimeSessionFailure;

export function hashForDiagnostics(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

/**
 * @deprecated Prefer buildRealtimePersonalityPrompt — kept for call-site clarity.
 */
export function buildRealtimeInstructions(params: {
  brainId: BrainId;
  compactContext: string;
}): string {
  return buildRealtimePersonalityPrompt(params);
}

export function buildRealtimeSessionConfig(params: {
  model: string;
  voice: string;
  instructions: string;
  reasoningEffort: RealtimeReasoningEffort;
  webSearchEnabled: boolean;
}) {
  return {
    type: "realtime" as const,
    model: params.model,
    output_modalities: ["audio"] as Array<"audio">,
    instructions: params.instructions,
    reasoning: {
      effort: params.reasoningEffort,
    },
    tools: buildRealtimeToolDefinitions({
      webSearchEnabled: params.webSearchEnabled,
    }),
    tool_choice: "auto" as const,
    audio: {
      input: {
        transcription: {
          model: "gpt-4o-mini-transcribe",
          language: "id",
        },
        turn_detection: {
          type: "semantic_vad" as const,
          eagerness: "auto" as const,
          create_response: true,
          interrupt_response: true,
        },
        noise_reduction: {
          type: "near_field" as const,
        },
      },
      output: {
        voice: params.voice,
      },
    },
  };
}

export function toClientRealtimeSessionPayload(
  result: RealtimeSessionSuccess,
): Record<string, unknown> {
  return {
    clientSecret: result.clientSecret,
    expiresAt: result.expiresAt,
    sessionId: result.sessionId,
    model: result.model,
    voice: result.voice,
    maxMinutes: result.maxMinutes,
    warningAtMinutes: result.warningAtMinutes,
    reasoningEffort: result.reasoningEffort,
    toolsEnabled: result.toolsEnabled,
    callsUrl: REALTIME_CALLS_URL,
    architecture: "server_mediated_tools",
  };
}

export function assertNoPermanentApiKeyInPayload(
  payload: Record<string, unknown>,
  apiKey: string,
): boolean {
  const serialized = JSON.stringify(payload);
  return !serialized.includes(apiKey);
}

export async function createRealtimeClientSecret(params: {
  client: RealtimeClientSecretsClient;
  organizationId: string;
  brainId: string;
  userId?: string;
  transcript?: TranscriptEntry[];
  memoryRepository?: ApprovedMemoryRepository;
  config?: MeetingModelConfig;
  workspaceName?: string;
  currentUser?: string;
}): Promise<RealtimeSessionResult> {
  if (!isBrainId(params.brainId)) {
    return {
      ok: false,
      code: "validation",
      message: "Brain tidak valid untuk organisasi ini.",
    };
  }

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

  const config = configResult.config;
  // Compact startup only — detailed retrieval happens via tools.
  const context = await buildMeetingContextBundle({
    organizationId: params.organizationId,
    brainId: params.brainId,
    mode: "ask",
    transcript: (params.transcript ?? []).slice(
      -MEETING_LIMITS.conversationTurns,
    ),
    memoryRepository:
      params.memoryRepository ?? createEmptyApprovedMemoryRepository(),
    workspaceName: params.workspaceName,
    currentUser: params.currentUser,
  });

  const companyLabel =
    context.businessContextText
      .split("\n")
      .find((line) => line.startsWith("Company:"))
      ?.replace(/^Company:\s*/, "") || undefined;

  const compactContext = buildCompactRealtimeStartupContext({
    brainId: params.brainId,
    context,
    companyLabel,
  });

  const instructions = buildRealtimePersonalityPrompt({
    brainId: params.brainId,
    compactContext,
  });

  const startedAt = Date.now();
  try {
    const safetyIdentifier = hashForDiagnostics(
      params.userId || params.organizationId,
    );
    const sessionConfig = buildRealtimeSessionConfig({
      model: config.realtimeModel,
      voice: config.realtimeVoice,
      instructions,
      reasoningEffort: config.realtimeReasoningEffort,
      webSearchEnabled: config.webSearchEnabled,
    });

    const created = await params.client.realtime.clientSecrets.create(
      {
        expires_after: {
          anchor: "created_at",
          seconds: 600,
        },
        session: sessionConfig,
      },
      {
        headers: {
          "OpenAI-Safety-Identifier": safetyIdentifier,
        },
      },
    );

    if (!created.value || typeof created.value !== "string") {
      return {
        ok: false,
        code: "upstream",
        message: "Gagal membuat kredensial sesi Realtime.",
      };
    }

    const warningAtMinutes = Math.max(1, config.realtimeMaxMinutes - 2);

    console.info("[ai-team-member] realtime session created", {
      organizationHash: hashForDiagnostics(params.organizationId),
      brainHash: hashForDiagnostics(params.brainId),
      selectedModel: config.realtimeModel,
      reasoningEffort: config.realtimeReasoningEffort,
      toolsCount: sessionConfig.tools.length,
      sessionStatus: "created",
      latencyMs: Date.now() - startedAt,
      hasClientSecret: true,
      clientSecretLength: created.value.length,
    });

    return {
      ok: true,
      clientSecret: created.value,
      expiresAt: created.expires_at,
      sessionId: created.session?.id ?? null,
      model: config.realtimeModel,
      voice: config.realtimeVoice,
      maxMinutes: config.realtimeMaxMinutes,
      warningAtMinutes,
      reasoningEffort: config.realtimeReasoningEffort,
      toolsEnabled: sessionConfig.tools.map((tool) => tool.name),
    };
  } catch (error) {
    console.error("[ai-team-member] realtime session upstream failure", {
      organizationHash: hashForDiagnostics(params.organizationId),
      brainHash: hashForDiagnostics(params.brainId),
      selectedModel: config.realtimeModel,
      latencyMs: Date.now() - startedAt,
      errorName: error instanceof Error ? error.name : "unknown",
      errorCategory: "upstream",
    });
    return {
      ok: false,
      code: "upstream",
      message: "Layanan Voice Call sedang gagal. Coba lagi sebentar.",
    };
  }
}
