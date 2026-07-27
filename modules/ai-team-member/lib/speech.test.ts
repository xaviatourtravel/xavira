import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { pickIndonesianVoice, pickMeetingSpeechText } from "./speech";

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
    actionItems: [{ task: "Validasi harga vendor", pic: "Irfan", deadline: null }],
    unresolvedIssues: ["Margin belum final."],
    memoryCandidates: [],
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
  };
  assert.equal(pickMeetingSpeechText(insight), "");
});

test("workspace speaks responseText with id-ID utterance and explicit modes", () => {
  const source = readFileSync(
    path.join(
      process.cwd(),
      "modules/ai-team-member/components/ai-team-member-workspace.tsx",
    ),
    "utf8",
  );
  assert.match(source, /askAi\("ask"\)/);
  assert.match(source, /askAi\("raise_hand"\)/);
  assert.match(source, /mode,/);
  assert.match(source, /pickMeetingSpeechText\(payload\.insight\)/);
  assert.match(source, /utterance\.lang\s*=\s*"id-ID"/);
  assert.match(source, /pickIndonesianVoice/);
  assert.match(source, /insight\.responseText/);
});
