import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMeetingResponseDiagnostics,
  MEETING_CLIENT_ERROR_MESSAGES,
  requestMeetingCheckpoint,
  resolveMeetingCheckpointFromParsedResponse,
} from "./meeting-response";
import type { MeetingInsight } from "./meeting-domain";

const validInsight: MeetingInsight = {
  responseText: "Jawaban langsung untuk pertanyaan Anda.",
  summary: "Ringkasan singkat.",
  decisions: ["Lanjut uji harga."],
  actionItems: [{ task: "Cek vendor", pic: "Irfan", deadline: null }],
  unresolvedIssues: [],
  memoryCandidates: [],
};

test("diagnostics omit content and report status signals", () => {
  const diagnostics = buildMeetingResponseDiagnostics({
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
  });

  assert.equal(diagnostics.status, "incomplete");
  assert.equal(diagnostics.incompleteReason, "max_output_tokens");
  assert.equal(diagnostics.hasRefusal, true);
  assert.deepEqual(diagnostics.outputContentTypes, ["message", "output_text", "refusal"]);
  assert.equal(diagnostics.hasOutputParsed, false);
  assert.equal(diagnostics.hasOutputText, true);
  assert.equal(diagnostics.outputTextLength, "SECRET MODEL TEXT SHOULD NOT APPEAR".length);
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
