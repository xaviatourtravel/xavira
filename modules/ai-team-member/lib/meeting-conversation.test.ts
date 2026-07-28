import assert from "node:assert/strict";
import test from "node:test";
import {
  appendConversationTurn,
  createEmptyConversationByBrain,
  getConversationForBrain,
} from "./meeting-conversation";
import { buildMeetingPrompt } from "./meeting-domain";
import { checkAiRateLimit, resetAiRateLimitStoreForTests } from "@/lib/ai/rate-limit";

test("conversation history isolation per brain", () => {
  let state = createEmptyConversationByBrain();
  state = appendConversationTurn({
    state,
    brainId: "desklabs",
    turn: { role: "user", text: "Kenapa harga naik?", mode: "ask" },
  });
  state = appendConversationTurn({
    state,
    brainId: "desklabs",
    turn: {
      role: "assistant",
      text: "Karena asumsi vendor belum diuji.",
      mode: "ask",
    },
  });
  state = appendConversationTurn({
    state,
    brainId: "founder",
    turn: { role: "user", text: "Apa fokus minggu ini?", mode: "ask" },
  });

  assert.equal(getConversationForBrain(state, "desklabs").length, 2);
  assert.equal(getConversationForBrain(state, "founder").length, 1);
  assert.equal(getConversationForBrain(state, "piatur").length, 0);
});

test("follow-up conversation context is included in prompt", () => {
  const prompt = buildMeetingPrompt({
    brainId: "desklabs",
    mode: "ask",
    transcript: [
      {
        id: "1",
        speaker: "Irfan",
        text: "Harga vendor naik.",
        createdAt: "2026-07-27T00:00:00.000Z",
      },
    ],
    question: "Kenapa?",
    conversationHistory: [
      {
        id: "u1",
        role: "user",
        text: "Apa risiko terbesar?",
        createdAt: "2026-07-27T00:00:00.000Z",
        mode: "ask",
      },
      {
        id: "a1",
        role: "assistant",
        text: "Asumsi harga belum diuji.",
        createdAt: "2026-07-27T00:00:01.000Z",
        mode: "ask",
      },
    ],
  });

  assert.match(prompt, /prior conversation/);
  assert.match(prompt, /Apa risiko terbesar\?/);
  assert.match(prompt, /Asumsi harga belum diuji/);
  assert.match(prompt, /Kenapa\?/);
});

test("rate limit boundary blocks after threshold", () => {
  resetAiRateLimitStoreForTests();
  const store = new Map();
  for (let index = 0; index < 3; index += 1) {
    const result = checkAiRateLimit(
      { organizationId: "org-1", route: "analyze", userId: "user-1" },
      { limit: 3, windowMs: 60_000, store, now: 1_000 },
    );
    assert.equal(result.ok, true);
  }
  const blocked = checkAiRateLimit(
    { organizationId: "org-1", route: "analyze", userId: "user-1" },
    { limit: 3, windowMs: 60_000, store, now: 1_000 },
  );
  assert.equal(blocked.ok, false);
  if (!blocked.ok) {
    assert.equal(blocked.code, "rate_limited");
  }
});
