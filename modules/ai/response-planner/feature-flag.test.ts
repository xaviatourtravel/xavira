import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

import {
  isAnswerFirstV1Enabled,
  parseAnswerFirstV1Flag,
} from "@/modules/ai/response-planner/feature-flag";

describe("parseAnswerFirstV1Flag", () => {
  it("returns false when unset", () => {
    assert.equal(parseAnswerFirstV1Flag(undefined), false);
  });

  it("returns false for empty string", () => {
    assert.equal(parseAnswerFirstV1Flag(""), false);
    assert.equal(parseAnswerFirstV1Flag("   "), false);
  });

  it("returns true for true", () => {
    assert.equal(parseAnswerFirstV1Flag("true"), true);
    assert.equal(parseAnswerFirstV1Flag("TRUE"), true);
  });

  it("returns true for 1", () => {
    assert.equal(parseAnswerFirstV1Flag("1"), true);
  });

  it("returns true for on", () => {
    assert.equal(parseAnswerFirstV1Flag("on"), true);
    assert.equal(parseAnswerFirstV1Flag("ON"), true);
  });

  it("returns true for yes", () => {
    assert.equal(parseAnswerFirstV1Flag("yes"), true);
    assert.equal(parseAnswerFirstV1Flag("YES"), true);
  });

  it("returns false for false", () => {
    assert.equal(parseAnswerFirstV1Flag("false"), false);
    assert.equal(parseAnswerFirstV1Flag("FALSE"), false);
  });

  it("returns false for 0", () => {
    assert.equal(parseAnswerFirstV1Flag("0"), false);
  });

  it("returns false for off", () => {
    assert.equal(parseAnswerFirstV1Flag("off"), false);
    assert.equal(parseAnswerFirstV1Flag("OFF"), false);
  });

  it("returns false for no", () => {
    assert.equal(parseAnswerFirstV1Flag("no"), false);
    assert.equal(parseAnswerFirstV1Flag("NO"), false);
  });

  it("returns false for unknown value", () => {
    assert.equal(parseAnswerFirstV1Flag("enabled"), false);
    assert.equal(parseAnswerFirstV1Flag("maybe"), false);
  });
});

describe("isAnswerFirstV1Enabled", () => {
  const original = process.env.DESKLABS_AI_ANSWER_FIRST_V1;

  it("reads env flag", () => {
    process.env.DESKLABS_AI_ANSWER_FIRST_V1 = "true";
    assert.equal(isAnswerFirstV1Enabled(), true);
    process.env.DESKLABS_AI_ANSWER_FIRST_V1 = "false";
    assert.equal(isAnswerFirstV1Enabled(), false);
  });

  after(() => {
    if (original === undefined) {
      delete process.env.DESKLABS_AI_ANSWER_FIRST_V1;
    } else {
      process.env.DESKLABS_AI_ANSWER_FIRST_V1 = original;
    }
  });
});
