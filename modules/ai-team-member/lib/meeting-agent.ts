import { zodTextFormat } from "openai/helpers/zod";
import {
  isWebSearchAllowed,
  resolveMeetingModelConfig,
  resolveModelForMode,
  type MeetingModelConfig,
} from "@/modules/ai-team-member/lib/meeting-config";
import { buildMeetingContextBundle } from "@/modules/ai-team-member/lib/meeting-context";
import {
  isBrainId,
  meetingCheckpointSchema,
  type BrainId,
  type MeetingAnalyzeBody,
} from "@/modules/ai-team-member/lib/meeting-domain";
import type { ApprovedMemoryRepository } from "@/modules/ai-team-member/lib/meeting-memory-repository";
import { createEmptyApprovedMemoryRepository } from "@/modules/ai-team-member/lib/meeting-memory-repository";
import {
  MEETING_CLIENT_ERROR_MESSAGES,
  requestMeetingCheckpoint,
  type MeetingOpenAiResult,
  type MeetingResponsesParseClient,
} from "@/modules/ai-team-member/lib/meeting-response";

export type RunMeetingAgentParams = {
  organizationId: string;
  body: MeetingAnalyzeBody;
  client: MeetingResponsesParseClient;
  memoryRepository?: ApprovedMemoryRepository;
  config?: MeetingModelConfig;
  workspaceName?: string;
  currentUser?: string;
  textFormat?: unknown;
};

export async function runMeetingAgent(
  params: RunMeetingAgentParams,
): Promise<MeetingOpenAiResult> {
  if (!isBrainId(params.body.brainId)) {
    return {
      ok: false,
      code: "config",
      message: "Invalid meeting payload.",
    };
  }

  const brainId: BrainId = params.body.brainId;
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
  const model = resolveModelForMode(config, params.body.mode);
  const requestedWebSearch = Boolean(params.body.useWebSearch);
  const useWebSearch = isWebSearchAllowed({
    mode: params.body.mode,
    requested: requestedWebSearch,
    configEnabled: config.webSearchEnabled,
  });

  if (
    requestedWebSearch &&
    params.body.mode === "ask" &&
    !config.webSearchEnabled
  ) {
    return {
      ok: false,
      code: "config",
      message:
        "Pencarian web belum diaktifkan di lingkungan ini (AI_TEAM_MEMBER_WEB_SEARCH).",
    };
  }

  const context = await buildMeetingContextBundle({
    organizationId: params.organizationId,
    brainId,
    mode: params.body.mode,
    transcript: params.body.transcript,
    conversationHistory: params.body.conversationHistory,
    question: params.body.question,
    memoryRepository:
      params.memoryRepository ?? createEmptyApprovedMemoryRepository(),
    workspaceName: params.workspaceName,
    currentUser: params.currentUser,
  });

  return requestMeetingCheckpoint({
    client: params.client,
    body: {
      ...params.body,
      brainId,
    },
    model,
    textFormat:
      params.textFormat ??
      zodTextFormat(meetingCheckpointSchema, "meeting_checkpoint"),
    context,
    useWebSearch,
  });
}

export function mapMeetingAgentErrorStatus(
  code: "refused" | "incomplete" | "missing_parsed" | "upstream" | "config",
): number {
  switch (code) {
    case "refused":
      return 422;
    case "config":
      return 503;
    case "incomplete":
    case "missing_parsed":
    case "upstream":
    default:
      return 502;
  }
}

export { MEETING_CLIENT_ERROR_MESSAGES };
