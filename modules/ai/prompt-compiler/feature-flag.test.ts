import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isPromptCompilerV2Enabled,
  parsePromptCompilerV2Flag,
} from "@/modules/ai/prompt-compiler/feature-flag";

describe("parsePromptCompilerV2Flag", () => {
  it("returns false when unset", () => {
    assert.equal(parsePromptCompilerV2Flag(undefined), false);
  });

  it("returns false for empty string", () => {
    assert.equal(parsePromptCompilerV2Flag(""), false);
    assert.equal(parsePromptCompilerV2Flag("   "), false);
  });

  it("returns true for true", () => {
    assert.equal(parsePromptCompilerV2Flag("true"), true);
    assert.equal(parsePromptCompilerV2Flag("TRUE"), true);
  });

  it("returns true for 1", () => {
    assert.equal(parsePromptCompilerV2Flag("1"), true);
  });

  it("returns true for on", () => {
    assert.equal(parsePromptCompilerV2Flag("on"), true);
    assert.equal(parsePromptCompilerV2Flag("ON"), true);
  });

  it("returns true for yes", () => {
    assert.equal(parsePromptCompilerV2Flag("yes"), true);
    assert.equal(parsePromptCompilerV2Flag("YES"), true);
  });

  it("returns false for false", () => {
    assert.equal(parsePromptCompilerV2Flag("false"), false);
    assert.equal(parsePromptCompilerV2Flag("FALSE"), false);
  });

  it("returns false for 0", () => {
    assert.equal(parsePromptCompilerV2Flag("0"), false);
  });

  it("returns false for off", () => {
    assert.equal(parsePromptCompilerV2Flag("off"), false);
    assert.equal(parsePromptCompilerV2Flag("OFF"), false);
  });

  it("returns false for no", () => {
    assert.equal(parsePromptCompilerV2Flag("no"), false);
    assert.equal(parsePromptCompilerV2Flag("NO"), false);
  });

  it("returns false for unknown value", () => {
    assert.equal(parsePromptCompilerV2Flag("enabled"), false);
    assert.equal(parsePromptCompilerV2Flag("maybe"), false);
  });
});

describe("isPromptCompilerV2Enabled", () => {
  const originalValue = process.env.DESKLABS_AI_PROMPT_COMPILER_V2;

  it("reads the environment variable through the centralized parser", () => {
    process.env.DESKLABS_AI_PROMPT_COMPILER_V2 = "true";
    assert.equal(isPromptCompilerV2Enabled(), true);

    delete process.env.DESKLABS_AI_PROMPT_COMPILER_V2;
    assert.equal(isPromptCompilerV2Enabled(), false);
  });

  if (originalValue === undefined) {
    delete process.env.DESKLABS_AI_PROMPT_COMPILER_V2;
  } else {
    process.env.DESKLABS_AI_PROMPT_COMPILER_V2 = originalValue;
  }
});
