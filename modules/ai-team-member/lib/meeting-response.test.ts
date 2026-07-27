import assert from "node:assert/strict";
import test from "node:test";
import {
  isWebSearchAllowed,
  resolveMeetingModelConfig,
  resolveModelForMode,
} from "./meeting-config";
import { runMeetingAgent } from "./meeting-agent";
import type { MeetingInsight } from "./meeting-domain";
import { createInMemoryApprovedMemoryRepository } from "./meeting-memory-repository";
import {
  buildMeetingResponseDiagnostics,
  extractSourcesFromParsedResponse,
  MEETING_CLIENT_ERROR_MESSAGES,
  requestMeetingCheckpoint,
  resolveMeetingCheckpointFromParsedResponse,
} from "./meeting-response";

const validInsight: MeetingInsight = {
  responseText: "Jawaban langsung untuk pertanyaan Anda.",
  summary: "Ringkasan singkat.",
  decisions: ["Lanjut uji harga."],
  actionItems: [{ task: "Cek vendor", pic: "Irfan", deadline: null }],
  unresolvedIssues: [],
  memoryCandidates: ["Keputusan: lanjut uji harga."],
  sources: [],
};

test("ask/raise_hand/checkpoint model routing", () => {
  const config = resolveMeetingModelConfig({
    AI_TEAM_MEMBER_MODEL: "gpt-ask",
    AI_TEAM_MEMBER_CHECKPOINT_MODEL: "gpt-checkpoint",
  });
  assert.equal(config.ok, true);
  if (!config.ok) return;
  assert.equal(resolveModelForMode(config.config, "ask"), "gpt-ask");
  assert.equal(resolveModelForMode(config.config, "raise_hand"), "gpt-ask");
  assert.equal(
    resolveModelForMode(config.config, "checkpoint"),
    "gpt-checkpoint",
  );
});

test("web search allowed only for ask", () => {
  assert.equal(
    isWebSearchAllowed({
      mode: "ask",
      requested: true,
      configEnabled: true,
    }),
    true,
  );
  assert.equal(
    isWebSearchAllowed({
      mode: "raise_hand",
      requested: true,
      configEnabled: true,
    }),
    false,
  );
  assert.equal(
    isWebSearchAllowed({
      mode: "checkpoint",
      requested: true,
      configEnabled: true,
    }),
    false,
  );
  assert.equal(
    isWebSearchAllowed({
      mode: "ask",
      requested: true,
      configEnabled: false,
    }),
    false,
  );
});

test("diagnostics omit content and report status signals", () => {
  const diagnostics = buildMeetingResponseDiagnostics(
    {
      status: "incomplete",
      incomplete_details: { reason: "max_output_tokens" },
      output: [
        {
          type: "message",
          content: [{ type: "output_text" }, { type: "refusal" }],
        },
      ],
      output_parsed: null,
      output_text: "SECRET MODEL TEXT SHOULD NOT APPEAR",
    },
    { selectedModel: "gpt-ask", webSearchEnabled: true },
  );

  assert.equal(diagnostics.status, "incomplete");
  assert.equal(diagnostics.incompleteReason, "max_output_tokens");
  assert.equal(diagnostics.hasRefusal, true);
  assert.equal(diagnostics.selectedModel, "gpt-ask");
  assert.equal(
    JSON.stringify(diagnostics).includes("SECRET MODEL TEXT SHOULD NOT APPEAR"),
    false,
  );
});

test("resolve accepts mocked OpenAI response with output_parsed", () => {
  const result = resolveMeetingCheckpointFromParsedResponse({
    status: "completed",
    output_parsed: validInsight,
    output: [{ type: "message", content: [{ type: "output_text" }] }],
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.insight.responseText, validInsight.responseText);
  }
});

test("resolve returns refused for refusal content", () => {
  const result = resolveMeetingCheckpointFromParsedResponse({
    status: "completed",
    output_parsed: validInsight,
    output: [{ type: "message", content: [{ type: "refusal" }] }],
  });
  assert.deepEqual(result, {
    ok: false,
    code: "refused",
    message: MEETING_CLIENT_ERROR_MESSAGES.refused,
  });
});

test("resolve returns incomplete for incomplete status", () => {
  const result = resolveMeetingCheckpointFromParsedResponse({
    status: "incomplete",
    incomplete_details: { reason: "max_output_tokens" },
    output_parsed: null,
  });
  assert.deepEqual(result, {
    ok: false,
    code: "incomplete",
    message: MEETING_CLIENT_ERROR_MESSAGES.incomplete,
  });
});

test("resolve returns missing_parsed when structured output is absent", () => {
  const result = resolveMeetingCheckpointFromParsedResponse({
    status: "completed",
    output_parsed: null,
    output_text: '{"summary":"legacy free form"}',
  });
  assert.deepEqual(result, {
    ok: false,
    code: "missing_parsed",
    message: MEETING_CLIENT_ERROR_MESSAGES.missing_parsed,
  });
});

test("extracts and prefers tool sources for web search", () => {
  const sources = extractSourcesFromParsedResponse({
    output: [
      {
        type: "web_search_call",
        action: {
          type: "search",
          sources: [
            { type: "url", url: "https://news.example.com/a" },
            { type: "url", url: "https://news.example.com/a" },
          ],
        },
      },
    ],
  });
  assert.deepEqual(sources, [
    { title: "news.example.com", url: "https://news.example.com/a" },
  ]);

  const resolved = resolveMeetingCheckpointFromParsedResponse(
    {
      status: "completed",
      output_parsed: {
        ...validInsight,
        sources: [{ title: "Ignored", url: "https://ignored.example.com" }],
      },
      output: [
        {
          type: "web_search_call",
          action: {
            type: "search",
            sources: [{ type: "url", url: "https://tool.example.com" }],
          },
        },
      ],
    },
    { usedWebSearch: true, preferToolSources: true },
  );
  assert.equal(resolved.ok, true);
  if (resolved.ok) {
    assert.deepEqual(resolved.insight.sources, [
      { title: "tool.example.com", url: "https://tool.example.com" },
    ]);
    assert.equal(resolved.usedWebSearch, true);
  }
});

test("route helper returns insight from mocked responses.parse output_parsed", async () => {
  const result = await requestMeetingCheckpoint({
    client: {
      responses: {
        parse: async () => ({
          status: "completed",
          output_parsed: validInsight,
          output: [{ type: "message", content: [{ type: "output_text" }] }],
        }),
      },
    },
    body: {
      brainId: "desklabs",
      mode: "ask",
      transcript: [
        {
          id: "1",
          speaker: "Irfan",
          text: "Mari bahas harga.",
          createdAt: "2026-07-27T00:00:00.000Z",
        },
      ],
      question: "Apa risikonya?",
    },
    model: "gpt-4.1-mini",
    textFormat: { type: "json_schema" },
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.insight.responseText, validInsight.responseText);
  }
});

test("route helper maps incomplete and refusal responses", async () => {
  const incomplete = await requestMeetingCheckpoint({
    client: {
      responses: {
        parse: async () => ({
          status: "incomplete",
          incomplete_details: { reason: "max_output_tokens" },
          output_parsed: null,
        }),
      },
    },
    body: {
      brainId: "desklabs",
      mode: "checkpoint",
      transcript: [
        {
          id: "1",
          speaker: "Irfan",
          text: "Checkpoint sekarang.",
          createdAt: "2026-07-27T00:00:00.000Z",
        },
      ],
    },
    model: "gpt-4.1-mini",
    textFormat: { type: "json_schema" },
  });
  assert.equal(incomplete.ok, false);
  if (!incomplete.ok) assert.equal(incomplete.code, "incomplete");

  const refused = await requestMeetingCheckpoint({
    client: {
      responses: {
        parse: async () => ({
          status: "completed",
          output: [{ type: "message", content: [{ type: "refusal" }] }],
          output_parsed: null,
        }),
      },
    },
    body: {
      brainId: "desklabs",
      mode: "raise_hand",
      transcript: [
        {
          id: "1",
          speaker: "Irfan",
          text: "Intervensi?",
          createdAt: "2026-07-27T00:00:00.000Z",
        },
      ],
    },
    model: "gpt-4.1-mini",
    textFormat: { type: "json_schema" },
  });
  assert.equal(refused.ok, false);
  if (!refused.ok) assert.equal(refused.code, "refused");
});

test("route helper returns upstream on OpenAI request throw", async () => {
  const result = await requestMeetingCheckpoint({
    client: {
      responses: {
        parse: async () => {
          throw new Error("network down");
        },
      },
    },
    body: {
      brainId: "desklabs",
      mode: "ask",
      transcript: [
        {
          id: "1",
          speaker: "Irfan",
          text: "Halo",
          createdAt: "2026-07-27T00:00:00.000Z",
        },
      ],
    },
    model: "gpt-4.1-mini",
    textFormat: { type: "json_schema" },
  });
  assert.deepEqual(result, {
    ok: false,
    code: "upstream",
    message: MEETING_CLIENT_ERROR_MESSAGES.upstream,
  });
});

test("brain and organization isolation for approved memories", async () => {
  const repo = createInMemoryApprovedMemoryRepository([
    {
      id: "1",
      organizationId: "org-a",
      brainId: "desklabs",
      text: "Keputusan: fokus enterprise.",
      createdAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "2",
      organizationId: "org-b",
      brainId: "desklabs",
      text: "Should not leak across org",
      createdAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "3",
      organizationId: "org-a",
      brainId: "founder",
      text: "Should not leak across brain",
      createdAt: "2026-07-27T00:00:00.000Z",
    },
  ]);

  let capturedInput = "";
  const result = await runMeetingAgent({
    organizationId: "org-a",
    body: {
      brainId: "desklabs",
      mode: "ask",
      question: "Apa fokusensi kita?",
      transcript: [
        {
          id: "1",
          speaker: "Irfan",
          text: "Diskusi preferensi.",
          createdAt: "2026-07-27T00:00:00.000Z",
        },
      ],
    },
    memoryRepository: repo,
    config: {
      askModel: "gpt-ask",
      raiseHandModel: "gpt-ask",
      checkpointModel: "gpt-checkpoint",
      webSearchEnabled: false,
      ttsModel: "gpt-4o-mini-tts",
      ttsVoice: "marin",
      realtimeModel: "gpt-realtime-2.1",
      realtimeVoice: "marin",
      realtimeMaxMinutes: 20,
      realtimeReasoningEffort: "low",
    },
    textFormat: { type: "json_schema" },
    client: {
      responses: {
        parse: async (body) => {
          capturedInput = body.input;
          return {
            status: "completed",
            output_parsed: validInsight,
            output: [],
          };
        },
      },
    },
  });

  assert.equal(result.ok, true);
  assert.match(capturedInput, /fokus enterprise/);
  assert.doesNotMatch(capturedInput, /Should not leak across org/);
  assert.doesNotMatch(capturedInput, /Should not leak across brain/);
});

test("agent enables web_search tools only for ask when requested", async () => {
  let askedTools: unknown;
  await runMeetingAgent({
    organizationId: "org-a",
    body: {
      brainId: "desklabs",
      mode: "ask",
      useWebSearch: true,
      question: "Berapa harga emas hari ini?",
      transcript: sample(),
    },
    config: {
      askModel: "gpt-ask",
      raiseHandModel: "gpt-ask",
      checkpointModel: "gpt-checkpoint",
      webSearchEnabled: true,
      ttsModel: "gpt-4o-mini-tts",
      ttsVoice: "marin",
      realtimeModel: "gpt-realtime-2.1",
      realtimeVoice: "marin",
      realtimeMaxMinutes: 20,
      realtimeReasoningEffort: "low",
    },
    textFormat: { type: "json_schema" },
    client: {
      responses: {
        parse: async (body) => {
          askedTools = body.tools;
          return {
            status: "completed",
            output_parsed: validInsight,
            output: [],
          };
        },
      },
    },
  });
  assert.deepEqual(askedTools, [{ type: "web_search" }]);

  let raiseTools: unknown = "unset";
  await runMeetingAgent({
    organizationId: "org-a",
    body: {
      brainId: "desklabs",
      mode: "raise_hand",
      transcript: sample(),
    },
    config: {
      askModel: "gpt-ask",
      raiseHandModel: "gpt-ask",
      checkpointModel: "gpt-checkpoint",
      webSearchEnabled: true,
      ttsModel: "gpt-4o-mini-tts",
      ttsVoice: "marin",
      realtimeModel: "gpt-realtime-2.1",
      realtimeVoice: "marin",
      realtimeMaxMinutes: 20,
      realtimeReasoningEffort: "low",
    },
    textFormat: { type: "json_schema" },
    client: {
      responses: {
        parse: async (body) => {
          raiseTools = body.tools;
          return {
            status: "completed",
            output_parsed: validInsight,
            output: [],
          };
        },
      },
    },
  });
  assert.equal(raiseTools, undefined);
});

function sample() {
  return [
    {
      id: "1",
      speaker: "Irfan",
      text: "Mari bahas.",
      createdAt: "2026-07-27T00:00:00.000Z",
    },
  ];
}
