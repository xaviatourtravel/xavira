import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { resolveMeetingModelConfig } from "./meeting-config";
import { createInMemoryApprovedMemoryRepository } from "./meeting-memory-repository";
import {
  assertNoPermanentApiKeyInPayload,
  buildRealtimeSessionConfig,
  createRealtimeClientSecret,
  toClientRealtimeSessionPayload,
  type RealtimeClientSecretsClient,
} from "./meeting-realtime";
import {
  extractRealtimeTranscriptEvent,
  mergeFinalRealtimeTranscript,
  parseRealtimeDataChannelEvent,
} from "./meeting-realtime-events";

const permanentKey = "sk-permanent-test-key-never-return";

function testConfig() {
  return {
    askModel: "gpt-ask",
    raiseHandModel: "gpt-ask",
    checkpointModel: "gpt-checkpoint",
    webSearchEnabled: false,
    ttsModel: "gpt-4o-mini-tts-2025-12-15",
    ttsVoice: "marin",
    realtimeModel: "gpt-realtime-2.1",
    realtimeVoice: "marin",
    realtimeMaxMinutes: 20,
  };
}

function mockClient(
  overrides?: Partial<{
    value: string;
    createBody: unknown;
    createHeaders: unknown;
  }>,
): RealtimeClientSecretsClient {
  return {
    realtime: {
      clientSecrets: {
        create: async (body, options) => {
          overrides && ((overrides.createBody = body), (overrides.createHeaders = options?.headers));
          return {
            value: overrides?.value ?? "ek_ephemeral_test",
            expires_at: 1_700_000_000,
            session: { id: "sess_test", model: "gpt-realtime-2.1" },
          };
        },
      },
    },
  };
}

test("realtime env defaults for model, voice, and max minutes", () => {
  const config = resolveMeetingModelConfig({});
  assert.equal(config.ok, true);
  if (!config.ok) return;
  assert.equal(config.config.realtimeModel, "gpt-realtime-2.1");
  assert.equal(config.config.realtimeVoice, "marin");
  assert.equal(config.config.realtimeMaxMinutes, 20);
  assert.equal(config.config.ttsModel, "gpt-4o-mini-tts-2025-12-15");
});

test("realtime env overrides are respected without silent model fallback", () => {
  const config = resolveMeetingModelConfig({
    AI_TEAM_MEMBER_REALTIME_MODEL: "gpt-realtime-2.1",
    AI_TEAM_MEMBER_REALTIME_VOICE: "cedar",
    AI_TEAM_MEMBER_REALTIME_MAX_MINUTES: "15",
    AI_TEAM_MEMBER_TTS_MODEL: "gpt-4o-mini-tts-2025-12-15",
  });
  assert.equal(config.ok, true);
  if (!config.ok) return;
  assert.equal(config.config.realtimeModel, "gpt-realtime-2.1");
  assert.equal(config.config.realtimeVoice, "cedar");
  assert.equal(config.config.realtimeMaxMinutes, 15);
});

test("semantic VAD and interruption configuration matches verified session shape", () => {
  const session = buildRealtimeSessionConfig({
    model: "gpt-realtime-2.1",
    voice: "marin",
    instructions: "test",
  });
  assert.equal(session.type, "realtime");
  assert.equal(session.model, "gpt-realtime-2.1");
  assert.deepEqual(session.output_modalities, ["audio"]);
  assert.equal(session.audio.output.voice, "marin");
  assert.equal(session.audio.input.turn_detection.type, "semantic_vad");
  assert.equal(session.audio.input.turn_detection.eagerness, "auto");
  assert.equal(session.audio.input.turn_detection.create_response, true);
  assert.equal(session.audio.input.turn_detection.interrupt_response, true);
  assert.equal(
    session.audio.input.transcription.model,
    "gpt-4o-mini-transcribe",
  );
});

test("createRealtimeClientSecret rejects invalid brain ownership", async () => {
  const result = await createRealtimeClientSecret({
    client: mockClient(),
    organizationId: "org-a",
    brainId: "other-org-brain",
    config: testConfig(),
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "validation");
});

test("createRealtimeClientSecret isolates same-org same-brain memories", async () => {
  const capture: { createBody?: unknown } = {};
  const repo = createInMemoryApprovedMemoryRepository([
    {
      id: "1",
      organizationId: "org-a",
      brainId: "desklabs",
      text: "Allowed memory for desklabs",
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

  const result = await createRealtimeClientSecret({
    client: mockClient(capture),
    organizationId: "org-a",
    brainId: "desklabs",
    memoryRepository: repo,
    config: testConfig(),
  });
  assert.equal(result.ok, true);
  const body = capture.createBody as {
    session: { instructions: string; model: string };
  };
  assert.match(body.session.instructions, /Allowed memory for desklabs/);
  assert.doesNotMatch(body.session.instructions, /Should not leak across org/);
  assert.doesNotMatch(
    body.session.instructions,
    /Should not leak across brain/,
  );
  assert.match(body.session.instructions, /UNTRUSTED CONTEXT/);
  assert.equal(body.session.model, "gpt-realtime-2.1");
});

test("ephemeral credential response never includes permanent API key", async () => {
  const result = await createRealtimeClientSecret({
    client: mockClient({ value: "ek_short_lived" }),
    organizationId: "org-a",
    brainId: "desklabs",
    config: testConfig(),
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const payload = toClientRealtimeSessionPayload(result);
  assert.equal(payload.clientSecret, "ek_short_lived");
  assert.equal(payload.model, "gpt-realtime-2.1");
  assert.equal(payload.voice, "marin");
  assert.equal(payload.maxMinutes, 20);
  assert.equal(payload.warningAtMinutes, 18);
  assert.equal(
    assertNoPermanentApiKeyInPayload(payload, permanentKey),
    true,
  );
  assert.equal(
    assertNoPermanentApiKeyInPayload(
      { ...payload, leak: permanentKey },
      permanentKey,
    ),
    false,
  );
  assert.doesNotMatch(JSON.stringify(payload), /sk-/);
});

test("partial transcript events are not persisted as final turns", () => {
  const partial = extractRealtimeTranscriptEvent({
    type: "response.output_audio_transcript.delta",
    payload: { delta: "Halo", item_id: "item-1" },
  });
  assert.equal(partial?.status, "partial");
  const merged = mergeFinalRealtimeTranscript([], partial!, "Irfan");
  assert.equal(merged.length, 0);
});

test("final transcript events are deduplicated and marked realtime", () => {
  const event = extractRealtimeTranscriptEvent({
    type: "conversation.item.input_audio_transcription.completed",
    payload: { transcript: "Halo tim", item_id: "item-user-1" },
  });
  assert.equal(event?.status, "final");
  const once = mergeFinalRealtimeTranscript([], event!, "Irfan");
  const twice = mergeFinalRealtimeTranscript(once, event!, "Irfan");
  assert.equal(once.length, 1);
  assert.equal(twice.length, 1);
  assert.equal(once[0]?.source, "realtime");
  assert.equal(once[0]?.speaker, "Irfan");
});

test("realtime transcript turns remain isolated by brain arrays", () => {
  const event = extractRealtimeTranscriptEvent({
    type: "conversation.item.input_audio_transcription.completed",
    payload: { transcript: "Hanya untuk desklabs", item_id: "item-iso" },
  });
  const desklabs = mergeFinalRealtimeTranscript([], event!, "Irfan");
  const founder: typeof desklabs = [];
  assert.equal(desklabs.length, 1);
  assert.equal(founder.length, 0);
  assert.equal(desklabs[0]?.text, "Hanya untuk desklabs");
});

test("parseRealtimeDataChannelEvent rejects invalid payloads", () => {
  assert.equal(parseRealtimeDataChannelEvent("not-json"), null);
  assert.equal(parseRealtimeDataChannelEvent("{}"), null);
  assert.deepEqual(parseRealtimeDataChannelEvent('{"type":"response.done"}'), {
    type: "response.done",
    payload: { type: "response.done" },
  });
});

test("realtime session route enforces auth, ownership, and no permanent key", () => {
  const routeSource = readFileSync(
    path.join(
      process.cwd(),
      "app/api/ai-team-member/realtime/session/route.ts",
    ),
    "utf8",
  );
  assert.match(routeSource, /requireOrganizationProfile/);
  assert.match(routeSource, /createRealtimeClientSecret/);
  assert.match(routeSource, /assertNoPermanentApiKeyInPayload/);
  assert.match(routeSource, /Cache-Control.*no-store/);
  assert.match(routeSource, /realtime-session/);
  assert.doesNotMatch(routeSource, /OPENAI_API_KEY.*NextResponse/);
});

test("workspace requires explicit start and never auto-starts realtime", () => {
  const source = readFileSync(
    path.join(
      process.cwd(),
      "modules/ai-team-member/components/ai-team-member-workspace.tsx",
    ),
    "utf8",
  );
  assert.match(source, /startVoiceCall/);
  assert.match(source, /aiTeamMemberUi\.startVoiceCall/);
  assert.doesNotMatch(source, /useEffect\(\(\) => \{\s*void startVoiceCall/);
  assert.match(source, /callActiveBrainLock/);
  assert.match(source, /aiTeamMemberUi\.callRealtimeDisclosure/);
  assert.match(source, /pagehide/);
});

test("client production bundle must not contain server secret patterns in source modules", () => {
  const client = readFileSync(
    path.join(
      process.cwd(),
      "modules/ai-team-member/lib/meeting-realtime-client.ts",
    ),
    "utf8",
  );
  const events = readFileSync(
    path.join(
      process.cwd(),
      "modules/ai-team-member/lib/meeting-realtime-events.ts",
    ),
    "utf8",
  );
  const workspace = readFileSync(
    path.join(
      process.cwd(),
      "modules/ai-team-member/components/ai-team-member-workspace.tsx",
    ),
    "utf8",
  );
  assert.doesNotMatch(client, /OPENAI_API_KEY/);
  assert.doesNotMatch(events, /OPENAI_API_KEY/);
  assert.doesNotMatch(workspace, /OPENAI_API_KEY/);
  assert.doesNotMatch(workspace, /meeting-realtime"/);
  assert.doesNotMatch(workspace, /from ["'].*meeting-realtime["']/);
  assert.doesNotMatch(client, /sk-[a-zA-Z0-9]{10,}/);
  assert.doesNotMatch(workspace, /sk-[a-zA-Z0-9]{10,}/);
});
