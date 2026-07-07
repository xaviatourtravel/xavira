import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildRuntimeContext,
  buildRuntimePrompt,
  withRuntimeContext,
} from "@/modules/ai/runtime/build-runtime-context";

const FIXED_NOW = new Date("2026-07-07T07:32:00.000Z");

describe("temporal compatibility wrappers", () => {
  it("buildRuntimeContext matches legacy expectations", () => {
    const context = buildRuntimeContext({ now: FIXED_NOW, locale: "en" });

    assert.equal(context.isoDate, "2026-07-07");
    assert.equal(context.currentTime, "14:32");
    assert.equal(context.month, "July");
    assert.equal(context.year, "2026");
    assert.equal(context.isoTimestamp, FIXED_NOW.toISOString());
  });

  it("withRuntimeContext prepends runtime prompt", () => {
    const prompt = withRuntimeContext("Answer the user.", {
      now: FIXED_NOW,
      locale: "en",
    });

    assert.ok(prompt.startsWith("Runtime Context"));
    assert.match(prompt, /Never assume another date/);
    assert.ok(prompt.endsWith("Answer the user."));
  });

  it("buildRuntimePrompt includes ISO fields", () => {
    const prompt = buildRuntimePrompt(
      buildRuntimeContext({ now: FIXED_NOW, locale: "en" }),
    );

    assert.match(prompt, /2026-07-07/);
    assert.match(prompt, /ISO timestamp:/);
  });
});
