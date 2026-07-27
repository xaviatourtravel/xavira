import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  buildMeetingPrompt,
  isBrainId,
  meetingAnalyzeBodySchema,
  meetingCheckpointSchema,
  normalizeMeetingInsight,
} from "./meeting-domain";

const sampleTranscript = [
  {
    id: "1",
    speaker: "Irfan",
    text: "Kita perlu validasi harga vendor sebelum closing.",
    createdAt: "2026-07-27T00:00:00.000Z",
  },
];

test("brain allowlist prevents cross-brain identifiers", () => {
  assert.equal(isBrainId("desklabs"), true);
  assert.equal(isBrainId("global"), false);
});

test("body mode validation accepts ask, raise_hand, and checkpoint", () => {
  for (const mode of ["ask", "raise_hand", "checkpoint"] as const) {
    const parsed = meetingAnalyzeBodySchema.safeParse({
      brainId: "desklabs",
      mode,
      transcript: sampleTranscript,
    });
    assert.equal(parsed.success, true);
  }
});

test("body mode validation rejects missing or unknown mode", () => {
  assert.equal(
    meetingAnalyzeBodySchema.safeParse({
      brainId: "desklabs",
      transcript: sampleTranscript,
    }).success,
    false,
  );
  assert.equal(
    meetingAnalyzeBodySchema.safeParse({
      brainId: "desklabs",
      mode: "summarize",
      transcript: sampleTranscript,
    }).success,
    false,
  );
});

test("prompt contract for ask answers the user question directly", () => {
  const prompt = buildMeetingPrompt({
    brainId: "desklabs",
    mode: "ask",
    transcript: sampleTranscript,
    question: "Apa risiko terbesar?",
  });
  assert.match(prompt, /Mode: ask/);
  assert.match(prompt, /responseText WAJIB menjawab pertanyaan pengguna secara langsung/);
  assert.match(prompt, /Apa risiko terbesar\?/);
  assert.match(prompt, /Semua nilai teks WAJIB dalam Bahasa Indonesia/);
  assert.match(prompt, /Jangan pernah menggunakan pengetahuan, memori, atau konteks dari brain lain/);
});

test("prompt contract for raise_hand requires concise Indonesian intervention", () => {
  const prompt = buildMeetingPrompt({
    brainId: "founder",
    mode: "raise_hand",
    transcript: sampleTranscript,
  });
  assert.match(prompt, /Mode: raise_hand/);
  assert.match(prompt, /intervensi singkat dan langsung dalam Bahasa Indonesia/);
  assert.match(prompt, /Jika tidak ada intervensi material yang beralasan/);
  assert.doesNotMatch(prompt, /Mode: ask/);
});

test("prompt contract for checkpoint introduces the checkpoint", () => {
  const prompt = buildMeetingPrompt({
    brainId: "piatur",
    mode: "checkpoint",
    transcript: sampleTranscript,
  });
  assert.match(prompt, /Mode: checkpoint/);
  assert.match(prompt, /responseText harus memperkenalkan checkpoint secara singkat/);
  assert.match(prompt, /Jangan mengubah usulan menjadi keputusan final/);
});

test("strict output schema accepts complete valid output", () => {
  const parsed = meetingCheckpointSchema.safeParse({
    responseText: "Risiko terbesar adalah asumsi harga yang belum diuji.",
    summary: "Tim membahas validasi harga.",
    decisions: ["Validasi harga hari ini."],
    actionItems: [
      { task: "Cek vendor", pic: "Irfan", deadline: "hari ini" },
      { task: "Update brief", pic: null, deadline: null },
    ],
    unresolvedIssues: ["Margin belum final."],
    memoryCandidates: ["Prefer vendor lokal."],
  });
  assert.equal(parsed.success, true);
});

test("strict output schema rejects missing required fields", () => {
  assert.equal(
    meetingCheckpointSchema.safeParse({
      summary: "Ringkas",
      decisions: [],
      actionItems: [],
      unresolvedIssues: [],
      memoryCandidates: [],
    }).success,
    false,
  );
  assert.equal(
    meetingCheckpointSchema.safeParse({
      responseText: "Jawaban",
      summary: "Ringkas",
      decisions: [],
      // actionItems missing
      unresolvedIssues: [],
      memoryCandidates: [],
    }).success,
    false,
  );
});

test("normalizer fills missing responseText and drops malformed fields", () => {
  const result = normalizeMeetingInsight({
    summary: "Checkpoint",
    decisions: ["Ship MVP", 42],
    actionItems: [{ task: "Test mic", pic: "Irfan" }, { nope: true }],
  });
  assert.equal(result.responseText, "");
  assert.deepEqual(result.decisions, ["Ship MVP"]);
  assert.equal(result.actionItems.length, 1);
  assert.equal(result.actionItems[0]?.deadline, null);
});

test("source contract confirms Structured Outputs parse path", () => {
  const routeSource = readFileSync(
    path.join(process.cwd(), "app/api/ai-team-member/analyze/route.ts"),
    "utf8",
  );
  const helperSource = readFileSync(
    path.join(process.cwd(), "modules/ai-team-member/lib/meeting-response.ts"),
    "utf8",
  );
  assert.match(routeSource, /from "openai\/helpers\/zod"/);
  assert.match(routeSource, /zodTextFormat\(meetingCheckpointSchema,\s*"meeting_checkpoint"\)/);
  assert.match(helperSource, /params\.client\.responses\.parse/);
  assert.match(helperSource, /output_parsed/);
  assert.match(helperSource, /resolveMeetingCheckpointFromParsedResponse/);
  assert.doesNotMatch(routeSource, /parseMeetingInsightFromModelOutput/);
  assert.doesNotMatch(routeSource, /responses\.create\(/);
  assert.doesNotMatch(helperSource, /responses\.create\(/);
  assert.doesNotMatch(helperSource, /output_text\s*as|parseMeetingInsightFromModelOutput/);
});
