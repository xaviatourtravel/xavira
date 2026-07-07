import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildTemporalContext,
  formatTemporalContextBlock,
  formatTemporalResolutionRules,
  withTemporalContext,
} from "@/lib/ai/temporal-context";

const FIXED_NOW = new Date("2026-07-07T07:32:00.000Z");

describe("buildTemporalContext", () => {
  it("uses Asia/Jakarta by default", () => {
    const context = buildTemporalContext({ now: FIXED_NOW });

    assert.equal(context.timezone, "Asia/Jakarta");
    assert.equal(context.isoDate, "2026-07-07");
    assert.equal(context.currentTime, "14:32");
    assert.equal(context.currentMonth, "July");
    assert.equal(context.currentYear, "2026");
    assert.equal(context.dayOfWeek, "Tuesday");
    assert.equal(context.friendlyDate, "Tuesday, 7 July 2026");
    assert.equal(context.isoTimestamp, FIXED_NOW.toISOString());
  });

  it("resolves relative phrases from runtime date", () => {
    const context = buildTemporalContext({ now: FIXED_NOW });

    assert.equal(context.resolved.today, "2026-07-07");
    assert.equal(context.resolved.tomorrow, "2026-07-08");
    assert.equal(context.resolved.yesterday, "2026-07-06");
    assert.equal(context.resolved.thisMonth, "July 2026");
    assert.equal(context.resolved.nextMonth, "August 2026");
    assert.equal(context.resolved.thisYear, "2026");
    assert.equal(context.resolved.nextYear, "2027");
  });

  it("respects workspace timezone override", () => {
    const context = buildTemporalContext({
      now: FIXED_NOW,
      timezone: "America/New_York",
    });

    assert.equal(context.timezone, "America/New_York");
    assert.equal(context.isoDate, "2026-07-07");
    assert.equal(context.currentTime, "03:32");
  });

  it("builds a fresh timestamp on each call", () => {
    const first = buildTemporalContext().isoTimestamp;
    const second = buildTemporalContext().isoTimestamp;

    assert.ok(first);
    assert.ok(second);
  });
});

describe("formatTemporalContextBlock", () => {
  it("includes required runtime fields", () => {
    const context = buildTemporalContext({ now: FIXED_NOW });
    const block = formatTemporalContextBlock(context);

    assert.match(block, /Current Date:/);
    assert.match(block, /2026-07-07/);
    assert.match(block, /Current Time:/);
    assert.match(block, /14:32/);
    assert.match(block, /Timezone:/);
    assert.match(block, /Asia\/Jakarta/);
    assert.match(block, /Current Month:/);
    assert.match(block, /July/);
    assert.match(block, /Current Year:/);
    assert.match(block, /2026/);
    assert.match(block, /Day of Week:/);
    assert.match(block, /Tuesday/);
    assert.match(block, /ISO Timestamp:/);
  });
});

describe("formatTemporalResolutionRules", () => {
  it("maps this month and next month correctly", () => {
    const context = buildTemporalContext({ now: FIXED_NOW });
    const rules = formatTemporalResolutionRules(context);

    assert.match(rules, /this month → July 2026/);
    assert.match(rules, /next month → August 2026/);
    assert.match(rules, /tomorrow → 2026-07-08/);
    assert.match(rules, /Never guess or assume today's date/);
  });
});

describe("withTemporalContext", () => {
  it("prepends runtime context before prompt content", () => {
    const prompt = withTemporalContext("Answer the user.", { now: FIXED_NOW });

    assert.ok(prompt.startsWith("Current datetime:"));
    assert.match(prompt, /Temporal awareness rules:/);
    assert.ok(prompt.endsWith("Answer the user."));
  });
});
