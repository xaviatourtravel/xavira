import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMeetingPrompt,
  extractMeetingInsightJson,
  isBrainId,
  normalizeMeetingInsight,
  parseMeetingInsightFromModelOutput,
} from "./meeting-domain";

test("brain allowlist prevents cross-brain identifiers", () => {
  assert.equal(isBrainId("desklabs"), true);
  assert.equal(isBrainId("global"), false);
});
test("prompt enforces brain isolation and decision discipline", () => {
  const prompt = buildMeetingPrompt({ brainId: "founder", transcript: [] });
  assert.match(prompt, /Jangan pernah menggunakan pengetahuan, memori, atau konteks dari brain lain/);
  assert.match(prompt, /Jangan mengubah usulan menjadi keputusan final/);
  assert.match(prompt, /Semua nilai teks WAJIB dalam Bahasa Indonesia/);
});
test("normalizer drops malformed insight fields", () => {
  const result = normalizeMeetingInsight({ summary: "Checkpoint", decisions: ["Ship MVP", 42], actionItems: [{ task: "Test mic", pic: "Irfan" }, { nope: true }] });
  assert.deepEqual(result.decisions, ["Ship MVP"]);
  assert.equal(result.actionItems.length, 1);
});
test("extractor accepts plain and fenced JSON", () => {
  const plain = '{"summary":"ok","decisions":[],"actionItems":[],"unresolvedIssues":[],"memoryCandidates":[]}';
  const fenced = `\`\`\`json\n${plain}\n\`\`\``;
  assert.equal(extractMeetingInsightJson(plain), plain);
  assert.equal(extractMeetingInsightJson(fenced), plain);
});
test("parser normalizes valid output and rejects malformed output", () => {
  const plain = '{"summary":"Ringkas","decisions":["Setuju"],"actionItems":[{"task":"Cek","pic":"Irfan"}],"unresolvedIssues":[],"memoryCandidates":[]}';
  const parsed = parseMeetingInsightFromModelOutput(plain);
  assert.ok(parsed);
  assert.equal(parsed?.summary, "Ringkas");
  assert.equal(parsed?.actionItems[0]?.deadline, null);
  assert.equal(parseMeetingInsightFromModelOutput("not-json"), null);
  assert.equal(parseMeetingInsightFromModelOutput('{"unexpected":"shape"}'), null);
});
test("raise hand prompt requires concise Indonesian intervention", () => {
  const prompt = buildMeetingPrompt({
    brainId: "desklabs",
    transcript: [],
    question:
      "Angkat tangan hanya jika ada risiko material, kontradiksi, asumsi yang belum teruji, atau keputusan penting yang belum dibuat.",
  });
  assert.match(prompt, /Mode Angkat Tangan/);
  assert.match(prompt, /intervensi singkat, langsung, dan actionable/i);
});
