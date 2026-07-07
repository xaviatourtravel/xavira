import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildRuntimeContext,
  buildRuntimePrompt,
  prependRuntimePrompt,
  resolveLocaleFromCommunicationLanguage,
} from "@/modules/ai/runtime/build-runtime-context";

const FIXED_NOW = new Date("2026-07-07T07:37:00.000Z");

describe("buildRuntimeContext", () => {
  it("uses Asia/Jakarta by default with Indonesian locale", () => {
    const context = buildRuntimeContext({ now: FIXED_NOW });

    assert.equal(context.timezone, "Asia/Jakarta");
    assert.equal(context.locale, "id");
    assert.equal(context.isoDate, "2026-07-07");
    assert.equal(context.currentTime, "14:37");
    assert.match(context.currentDate, /7 Juli 2026/);
    assert.equal(context.month, "Juli");
    assert.equal(context.year, "2026");
    assert.equal(context.workspaceName, "Workspace");
    assert.equal(context.currentUser, "System");
  });

  it("formats English locale dates", () => {
    const context = buildRuntimeContext({
      now: FIXED_NOW,
      locale: "en",
    });

    assert.equal(context.locale, "en");
    assert.match(context.currentDate, /Tuesday, July 7, 2026/);
    assert.equal(context.month, "July");
    assert.equal(context.resolved.thisMonth, "July 2026");
    assert.equal(context.resolved.nextMonth, "August 2026");
  });

  it("includes workspace and user metadata", () => {
    const context = buildRuntimeContext({
      now: FIXED_NOW,
      workspaceId: "org-1",
      workspaceName: "Xavia Tour",
      currentUser: "Julpa",
      businessName: "Travel Agency",
      environment: "Production",
    });

    assert.equal(context.workspaceId, "org-1");
    assert.equal(context.workspaceName, "Xavia Tour");
    assert.equal(context.currentUser, "Julpa");
    assert.equal(context.businessName, "Travel Agency");
    assert.equal(context.environment, "Production");
  });

  it("resolves relative phrases from runtime date", () => {
    const context = buildRuntimeContext({ now: FIXED_NOW, locale: "en" });

    assert.equal(context.resolved.today, "2026-07-07");
    assert.equal(context.resolved.tomorrow, "2026-07-08");
    assert.match(context.resolved.tomorrowLabel, /July 8, 2026/);
    assert.equal(context.resolved.thisMonth, "July 2026");
    assert.equal(context.resolved.nextMonth, "August 2026");
  });

  it("builds a fresh timestamp on each call", () => {
    const first = buildRuntimeContext().isoTimestamp;
    const second = buildRuntimeContext().isoTimestamp;

    assert.ok(first);
    assert.ok(second);
  });
});

describe("buildRuntimePrompt", () => {
  it("includes runtime context and temporal rules", () => {
    const context = buildRuntimeContext({
      now: FIXED_NOW,
      locale: "en",
      workspaceName: "Xavia Tour",
      currentUser: "Julpa",
      businessName: "Travel Agency",
      environment: "Production",
    });
    const prompt = buildRuntimePrompt(context);

    assert.match(prompt, /^Runtime Context/);
    assert.match(prompt, /Workspace:\nXavia Tour/);
    assert.match(prompt, /Current user:\nJulpa/);
    assert.match(prompt, /Business:\nTravel Agency/);
    assert.match(prompt, /Environment:\nProduction/);
    assert.match(prompt, /"this month" means July 2026/);
    assert.match(prompt, /"next month" means August 2026/);
    assert.match(prompt, /Never assume another date/);
  });
});

describe("prependRuntimePrompt", () => {
  it("prepends runtime prompt before downstream content", () => {
    const prompt = prependRuntimePrompt("Business Brain context", {
      now: FIXED_NOW,
      locale: "en",
    });

    assert.ok(prompt.startsWith("Runtime Context"));
    assert.ok(prompt.endsWith("Business Brain context"));
  });
});

describe("resolveLocaleFromCommunicationLanguage", () => {
  it("maps company DNA language to runtime locale", () => {
    assert.equal(resolveLocaleFromCommunicationLanguage("english"), "en");
    assert.equal(resolveLocaleFromCommunicationLanguage("indonesian"), "id");
    assert.equal(resolveLocaleFromCommunicationLanguage("mixed"), "id");
  });
});
