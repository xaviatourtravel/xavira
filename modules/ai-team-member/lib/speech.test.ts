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

test("speech chooses relevant intervention for raise-hand intent", () => {
  const insight = {
    summary: "Ada risiko biaya membengkak jika asumsi harga tidak diuji.",
    decisions: ["Lanjut uji asumsi harga hari ini."],
    actionItems: [{ task: "Validasi harga vendor", pic: "Irfan", deadline: null }],
    unresolvedIssues: [],
    memoryCandidates: [],
  };
  assert.match(
    pickMeetingSpeechText(
      insight,
      "Angkat tangan hanya jika ada risiko material, kontradiksi, asumsi yang belum teruji, atau keputusan penting yang belum dibuat.",
    ),
    /risiko biaya membengkak/i,
  );
});

test("workspace uses Indonesian raise-hand instruction and id-ID utterance", () => {
  const source = readFileSync(
    path.join(
      process.cwd(),
      "modules/ai-team-member/components/ai-team-member-workspace.tsx",
    ),
    "utf8",
  );
  assert.match(source, /Angkat tangan hanya jika ada risiko material/i);
  assert.match(source, /utterance\.lang\s*=\s*"id-ID"/);
  assert.match(source, /pickIndonesianVoice/);
});
