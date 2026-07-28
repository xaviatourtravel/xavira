import type {
  BrainId,
  MeetingAnalyzeBody,
  MeetingInsight,
  MeetingSource,
} from "@/modules/ai-team-member/lib/meeting-domain";
import {
  buildMeetingPrompt,
  filterMemoryCandidates,
  meetingCheckpointSchema,
  normalizeMeetingSources,
} from "@/modules/ai-team-member/lib/meeting-domain";
import type { MeetingContextBundle } from "@/modules/ai-team-member/lib/meeting-context";

export type MeetingOpenAiFailureCode =
  | "refused"
  | "incomplete"
  | "missing_parsed"
  | "upstream"
  | "config";

export type MeetingOpenAiFailure = {
  ok: false;
  code: MeetingOpenAiFailureCode;
  message: string;
};

export type MeetingOpenAiSuccess = {
  ok: true;
  insight: MeetingInsight;
  usedWebSearch: boolean;
  usedBrainContext: boolean;
};

export type MeetingOpenAiResult = MeetingOpenAiSuccess | MeetingOpenAiFailure;

/** Minimal shape used by diagnostics — never log content text. */
export type MeetingParsedResponseLike = {
  status?: string | null;
  incomplete_details?: { reason?: string } | null;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      annotations?: Array<{ type?: string; url?: string; title?: string }>;
    }>;
    action?: {
      type?: string;
      sources?: Array<{ type?: string; url?: string }>;
      url?: string | null;
    };
  }>;
  output_parsed?: unknown;
  output_text?: string | null;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  } | null;
};

export const MEETING_CLIENT_ERROR_MESSAGES: Record<
  MeetingOpenAiFailureCode,
  string
> = {
  refused: "AI menolak menghasilkan jawaban untuk permintaan ini.",
  incomplete: "Respons AI tidak lengkap. Coba lagi.",
  missing_parsed: "AI tidak mengembalikan keluaran terstruktur yang valid.",
  upstream: "Layanan AI sedang gagal. Coba lagi sebentar.",
  config: "Konfigurasi AI Team Member belum siap. Periksa variabel lingkungan.",
};

export function collectOutputContentTypes(
  response: MeetingParsedResponseLike,
): string[] {
  const types = new Set<string>();
  for (const item of response.output ?? []) {
    if (item.type) types.add(item.type);
    for (const part of item.content ?? []) {
      if (part.type) types.add(part.type);
    }
  }
  return [...types];
}

export function hasRefusalContent(response: MeetingParsedResponseLike): boolean {
  return collectOutputContentTypes(response).includes("refusal");
}

export function extractSourcesFromParsedResponse(
  response: MeetingParsedResponseLike,
): MeetingSource[] {
  const collected: MeetingSource[] = [];

  for (const item of response.output ?? []) {
    if (item.type === "web_search_call") {
      const sources = item.action?.sources ?? [];
      for (const source of sources) {
        if (typeof source.url === "string") {
          collected.push({ title: "", url: source.url });
        }
      }
      if (item.action?.type === "open_page" && typeof item.action.url === "string") {
        collected.push({ title: "", url: item.action.url });
      }
    }

    for (const part of item.content ?? []) {
      for (const annotation of part.annotations ?? []) {
        if (
          (annotation.type === "url_citation" || annotation.type === "url") &&
          typeof annotation.url === "string"
        ) {
          collected.push({
            title:
              typeof annotation.title === "string" ? annotation.title : "",
            url: annotation.url,
          });
        }
      }
    }
  }

  return normalizeMeetingSources(collected);
}

/**
 * Safe diagnostics for server logs only.
 * Never include transcript, model text, or secrets.
 */
export function buildMeetingResponseDiagnostics(
  response: MeetingParsedResponseLike,
  extras?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    status: response.status ?? null,
    incompleteReason: response.incomplete_details?.reason ?? null,
    hasRefusal: hasRefusalContent(response),
    outputContentTypes: collectOutputContentTypes(response),
    hasOutputParsed: response.output_parsed != null,
    hasOutputText: Boolean(response.output_text),
    outputTextLength: response.output_text?.length ?? 0,
    inputTokens: response.usage?.input_tokens ?? null,
    outputTokens: response.usage?.output_tokens ?? null,
    totalTokens: response.usage?.total_tokens ?? null,
    ...extras,
  };
}

/**
 * Classify a Structured Outputs Responses API result without reading free-form text.
 */
export function resolveMeetingCheckpointFromParsedResponse(
  response: MeetingParsedResponseLike,
  options?: {
    usedWebSearch?: boolean;
    usedBrainContext?: boolean;
    preferToolSources?: boolean;
  },
): MeetingOpenAiResult {
  if (hasRefusalContent(response)) {
    return {
      ok: false,
      code: "refused",
      message: MEETING_CLIENT_ERROR_MESSAGES.refused,
    };
  }

  if (response.status === "incomplete") {
    return {
      ok: false,
      code: "incomplete",
      message: MEETING_CLIENT_ERROR_MESSAGES.incomplete,
    };
  }

  const parsed = meetingCheckpointSchema.safeParse(response.output_parsed);
  if (!parsed.success) {
    return {
      ok: false,
      code: "missing_parsed",
      message: MEETING_CLIENT_ERROR_MESSAGES.missing_parsed,
    };
  }

  const toolSources = extractSourcesFromParsedResponse(response);
  const schemaSources = normalizeMeetingSources(parsed.data.sources);
  const sources =
    options?.preferToolSources && toolSources.length
      ? toolSources
      : schemaSources.length
        ? schemaSources
        : toolSources;

  const insight: MeetingInsight = {
    ...parsed.data,
    memoryCandidates: filterMemoryCandidates(parsed.data.memoryCandidates),
    sources: options?.usedWebSearch ? sources : [],
  };

  return {
    ok: true,
    insight,
    usedWebSearch: Boolean(options?.usedWebSearch && insight.sources.length > 0),
    usedBrainContext: Boolean(options?.usedBrainContext),
  };
}

export type MeetingResponsesParseClient = {
  responses: {
    // Intentionally loose so production OpenAI client and unit mocks both fit.
    parse: (body: {
      model: string;
      input: string;
      text: { format: unknown };
      tools?: Array<{ type: string }>;
      include?: string[];
      tool_choice?: string;
    }) => PromiseLike<MeetingParsedResponseLike>;
  };
};

/**
 * Calls Responses API Structured Outputs (`responses.parse` + zodTextFormat)
 * and maps the result to a safe client-facing outcome.
 */
export async function requestMeetingCheckpoint(params: {
  client: MeetingResponsesParseClient;
  body: MeetingAnalyzeBody & { brainId: BrainId };
  model: string;
  textFormat: unknown;
  context?: MeetingContextBundle;
  useWebSearch?: boolean;
}): Promise<MeetingOpenAiResult> {
  const startedAt = Date.now();
  const useWebSearch = Boolean(params.useWebSearch);

  try {
    const response = await params.client.responses.parse({
      model: params.model,
      input: buildMeetingPrompt({
        brainId: params.body.brainId,
        mode: params.body.mode,
        transcript: params.context?.transcript ?? params.body.transcript,
        question: params.body.question,
        useWebSearch,
        conversationHistory:
          params.context?.conversationHistory ??
          params.body.conversationHistory,
        businessContextText: params.context?.businessContextText,
        approvedMemories: params.context?.approvedMemories,
        runtimeContextText: params.context?.runtimeContextText,
      }),
      text: {
        format: params.textFormat,
      },
      ...(useWebSearch
        ? {
            tools: [{ type: "web_search" }],
            include: ["web_search_call.action.sources"],
          }
        : {}),
    });

    const result = resolveMeetingCheckpointFromParsedResponse(response, {
      usedWebSearch: useWebSearch,
      usedBrainContext: params.context?.usedBrainContext,
      preferToolSources: useWebSearch,
    });

    if (!result.ok) {
      console.error("[ai-team-member] structured response failure", {
        brainId: params.body.brainId,
        mode: params.body.mode,
        code: result.code,
        selectedModel: params.model,
        webSearchEnabled: useWebSearch,
        latencyMs: Date.now() - startedAt,
        ...buildMeetingResponseDiagnostics(response),
      });
    }

    return result;
  } catch (error) {
    console.error("[ai-team-member] upstream OpenAI request failure", {
      brainId: params.body.brainId,
      mode: params.body.mode,
      selectedModel: params.model,
      webSearchEnabled: useWebSearch,
      latencyMs: Date.now() - startedAt,
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return {
      ok: false,
      code: "upstream",
      message: MEETING_CLIENT_ERROR_MESSAGES.upstream,
    };
  }
}
