import type {
  BrainId,
  MeetingAnalyzeBody,
  MeetingInsight,
} from "@/modules/ai-team-member/lib/meeting-domain";
import {
  buildMeetingPrompt,
  meetingCheckpointSchema,
} from "@/modules/ai-team-member/lib/meeting-domain";

export type MeetingOpenAiFailureCode =
  | "refused"
  | "incomplete"
  | "missing_parsed"
  | "upstream";

export type MeetingOpenAiFailure = {
  ok: false;
  code: MeetingOpenAiFailureCode;
  message: string;
};

export type MeetingOpenAiSuccess = {
  ok: true;
  insight: MeetingInsight;
};

export type MeetingOpenAiResult = MeetingOpenAiSuccess | MeetingOpenAiFailure;

/** Minimal shape used by diagnostics — never log content text. */
export type MeetingParsedResponseLike = {
  status?: string | null;
  incomplete_details?: { reason?: string } | null;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string }>;
  }>;
  output_parsed?: unknown;
  output_text?: string | null;
};

export const MEETING_CLIENT_ERROR_MESSAGES: Record<
  MeetingOpenAiFailureCode,
  string
> = {
  refused: "AI menolak menghasilkan jawaban untuk permintaan ini.",
  incomplete: "Respons AI tidak lengkap. Coba lagi.",
  missing_parsed: "AI tidak mengembalikan keluaran terstruktur yang valid.",
  upstream: "Layanan AI sedang gagal. Coba lagi sebentar.",
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

/**
 * Safe diagnostics for server logs only.
 * Never include transcript, model text, or secrets.
 */
export function buildMeetingResponseDiagnostics(
  response: MeetingParsedResponseLike,
): Record<string, unknown> {
  return {
    status: response.status ?? null,
    incompleteReason: response.incomplete_details?.reason ?? null,
    hasRefusal: hasRefusalContent(response),
    outputContentTypes: collectOutputContentTypes(response),
    hasOutputParsed: response.output_parsed != null,
    hasOutputText: Boolean(response.output_text),
    outputTextLength: response.output_text?.length ?? 0,
  };
}

/**
 * Classify a Structured Outputs Responses API result without reading free-form text.
 */
export function resolveMeetingCheckpointFromParsedResponse(
  response: MeetingParsedResponseLike,
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

  return { ok: true, insight: parsed.data };
}

export type MeetingResponsesParseClient = {
  responses: {
    // Intentionally loose so production OpenAI client and unit mocks both fit.
    // Runtime always uses responses.parse + zodTextFormat Structured Outputs.
    parse: (body: {
      model: string;
      input: string;
      text: { format: unknown };
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
}): Promise<MeetingOpenAiResult> {
  try {
    const response = await params.client.responses.parse({
      model: params.model,
      input: buildMeetingPrompt({
        brainId: params.body.brainId,
        mode: params.body.mode,
        transcript: params.body.transcript,
        question: params.body.question,
      }),
      text: {
        format: params.textFormat,
      },
    });

    const result = resolveMeetingCheckpointFromParsedResponse(response);
    if (!result.ok) {
      console.error("[ai-team-member] structured response failure", {
        brainId: params.body.brainId,
        mode: params.body.mode,
        code: result.code,
        ...buildMeetingResponseDiagnostics(response),
      });
    }
    return result;
  } catch (error) {
    console.error("[ai-team-member] upstream OpenAI request failure", {
      brainId: params.body.brainId,
      mode: params.body.mode,
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return {
      ok: false,
      code: "upstream",
      message: MEETING_CLIENT_ERROR_MESSAGES.upstream,
    };
  }
}
