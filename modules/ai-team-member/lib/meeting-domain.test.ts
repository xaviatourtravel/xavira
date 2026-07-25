import assert from "node:assert/strict";
import test from "node:test";
import { buildMeetingPrompt, isBrainId, normalizeMeetingInsight } from "./meeting-domain";

test("brain allowlist prevents cross-brain identifiers", () => {
  assert.equal(isBrainId("desklabs"), true);
  assert.equal(isBrainId("global"), false);
});
test("prompt enforces brain isolation and decision discipline", () => {
  const prompt = buildMeetingPrompt({ brainId: "founder", transcript: [] });
  assert.match(prompt, /Never use knowledge or memory from another brain/);
  assert.match(prompt, /Never promote a proposal into a decision/);
});
test("normalizer drops malformed insight fields", () => {
  const result = normalizeMeetingInsight({ summary: "Checkpoint", decisions: ["Ship MVP", 42], actionItems: [{ task: "Test mic", pic: "Irfan" }, { nope: true }] });
  assert.deepEqual(result.decisions, ["Ship MVP"]);
  assert.equal(result.actionItems.length, 1);
});
