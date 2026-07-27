import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  createMeetingAudioPlayback,
  fetchMeetingSpeechAudio,
  pickIndonesianVoice,
  pickMeetingSpeechText,
  revokeMeetingObjectUrl,
  speakWithBrowserFallback,
  stopMeetingAudio,
} from "./speech";
import {
  MEETING_TTS_INSTRUCTIONS,
  synthesizeMeetingSpeech,
  validateMeetingSpeechBody,
} from "./meeting-tts";
import { MEETING_LIMITS } from "./meeting-domain";

test("speech chooses Indonesian voice when available", () => {
  const voices = [
    { name: "US Voice", lang: "en-US" },
    { name: "Bahasa", lang: "id-ID" },
  ];
  assert.equal(pickIndonesianVoice(voices)?.lang, "id-ID");
  assert.equal(pickIndonesianVoice([{ name: "EN", lang: "en-US" }]), null);
});

test("responseText is used for speech", () => {
  const insight = {
    responseText: "Saya angkat tangan: asumsi harga belum diuji.",
    summary: "Ada risiko biaya membengkak jika asumsi harga tidak diuji.",
    decisions: ["Lanjut uji asumsi harga hari ini."],
    actionItems: [
      { task: "Validasi harga vendor", pic: "Irfan", deadline: null },
    ],
    unresolvedIssues: ["Margin belum final."],
    memoryCandidates: [],
    sources: [],
  };
  assert.equal(
    pickMeetingSpeechText(insight),
    "Saya angkat tangan: asumsi harga belum diuji.",
  );
});

test("speech ignores summary when responseText is empty", () => {
  const insight = {
    responseText: "   ",
    summary: "Ringkasan yang tidak boleh dibacakan.",
    decisions: ["Keputusan yang tidak boleh dibacakan."],
    actionItems: [],
    unresolvedIssues: ["Isu yang tidak boleh dibacakan."],
    memoryCandidates: [],
    sources: [],
  };
  assert.equal(pickMeetingSpeechText(insight), "");
});

test("TTS body validation and maximum length", () => {
  assert.equal(validateMeetingSpeechBody({ text: "Halo" }).ok, true);
  assert.equal(validateMeetingSpeechBody({ text: "" }).ok, false);
  assert.equal(
    validateMeetingSpeechBody({
      text: "x".repeat(MEETING_LIMITS.ttsInputChars + 1),
    }).ok,
    false,
  );
});

test("TTS uses configured model and voice", async () => {
  let capturedModel = "";
  let capturedVoice = "";
  let capturedInstructions = "";
  const result = await synthesizeMeetingSpeech({
    text: "Halo tim",
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
    },
    client: {
      audio: {
        speech: {
          create: async (body) => {
            capturedModel = body.model;
            capturedVoice = body.voice;
            capturedInstructions = body.instructions ?? "";
            return {
              arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
              headers: { get: () => "audio/mpeg" },
            };
          },
        },
      },
    },
  });

  assert.equal(result.ok, true);
  assert.equal(capturedModel, "gpt-4o-mini-tts");
  assert.equal(capturedVoice, "marin");
  assert.equal(capturedInstructions, MEETING_TTS_INSTRUCTIONS);
  if (result.ok) {
    assert.equal(result.contentType, "audio/mpeg");
    assert.deepEqual([...result.bytes], [1, 2, 3]);
  }
});

test("TTS failure returns safe error", async () => {
  const result = await synthesizeMeetingSpeech({
    text: "Halo",
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
    },
    client: {
      audio: {
        speech: {
          create: async () => {
            throw new Error("boom");
          },
        },
      },
    },
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "upstream");
    assert.match(result.message, /suara AI/i);
  }
});

test("browser fallback works only after TTS failure path", async () => {
  const speech = await fetchMeetingSpeechAudio({
    text: "Halo",
    fetchImpl: (async () =>
      new Response(JSON.stringify({ error: "down" }), {
        status: 502,
        headers: { "content-type": "application/json" },
      })) as typeof fetch,
  });
  assert.equal(speech.ok, false);

  let spoke = false;
  const ok = speakWithBrowserFallback({
    text: "Halo",
    speechSynthesis: {
      cancel() {},
      getVoices() {
        return [{ name: "Bahasa", lang: "id-ID" }];
      },
      speak() {
        spoke = true;
      },
    } as unknown as SpeechSynthesis,
    SpeechSynthesisUtterance: class {
      lang = "";
      voice: SpeechSynthesisVoice | null = null;
      constructor(public text: string) {}
    } as unknown as typeof SpeechSynthesisUtterance,
  });
  assert.equal(ok, true);
  assert.equal(spoke, true);
});

test("object URL cleanup", () => {
  let revoked: string[] = [];
  const playback = createMeetingAudioPlayback(new Blob(["abc"]), {
    createObjectUrl: () => "blob:test-url",
    createAudio: () =>
      ({
        pause() {},
        removeAttribute() {},
        load() {},
      }) as unknown as HTMLAudioElement,
  });
  assert.equal(playback.objectUrl, "blob:test-url");

  const originalRevoke = URL.revokeObjectURL;
  URL.revokeObjectURL = (url: string) => {
    revoked.push(url);
  };
  try {
    stopMeetingAudio(playback);
    revokeMeetingObjectUrl("blob:extra");
    assert.deepEqual(revoked, ["blob:test-url", "blob:extra"]);
  } finally {
    URL.revokeObjectURL = originalRevoke;
  }
});

test("workspace speaks responseText with OpenAI speech route and modes", () => {
  const source = readFileSync(
    path.join(
      process.cwd(),
      "modules/ai-team-member/components/ai-team-member-workspace.tsx",
    ),
    "utf8",
  );
  const speechRoute = readFileSync(
    path.join(process.cwd(), "app/api/ai-team-member/speech/route.ts"),
    "utf8",
  );
  assert.match(source, /askAi\("ask"\)/);
  assert.match(source, /askAi\("raise_hand"\)/);
  assert.match(source, /useWebSearch/);
  assert.match(source, /fetchMeetingSpeechAudio/);
  assert.match(source, /speakWithBrowserFallback/);
  assert.match(source, /pickMeetingSpeechText\(nextInsight\)/);
  assert.match(source, /aiTeamMemberUi\.voiceDisclosure/);
  assert.match(speechRoute, /requireOrganizationProfile/);
  assert.match(speechRoute, /synthesizeMeetingSpeech/);
  assert.match(speechRoute, /Cache-Control.*no-store/);
});
