import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAIContext } from "@/modules/ai/context/build-ai-context";
import { buildRuntimeContext } from "@/modules/ai/context/runtime/build-runtime-context";
import { buildWorkspaceContext } from "@/modules/ai/context/workspace/build-workspace-context";

const FIXED_NOW = new Date("2026-07-07T07:37:00.000Z");

describe("buildRuntimeContext (context slice)", () => {
  it("returns date, time, timezone, and locale", () => {
    const context = buildRuntimeContext({ now: FIXED_NOW, locale: "en" });

    assert.equal(context.date, "2026-07-07");
    assert.equal(context.time, "14:37");
    assert.equal(context.timezone, "Asia/Jakarta");
    assert.equal(context.locale, "en");
  });
});

describe("buildWorkspaceContext", () => {
  it("returns workspace defaults and overrides", () => {
    const defaults = buildWorkspaceContext();
    assert.equal(defaults.workspaceName, "Workspace");
    assert.equal(defaults.language, "id");
    assert.equal(defaults.currency, "IDR");
    assert.equal(defaults.timezone, "Asia/Jakarta");

    const custom = buildWorkspaceContext({
      workspaceName: "Xavia Tour",
      language: "en",
      currency: "USD",
      timezone: "America/New_York",
    });

    assert.equal(custom.workspaceName, "Xavia Tour");
    assert.equal(custom.language, "en");
    assert.equal(custom.currency, "USD");
    assert.equal(custom.timezone, "America/New_York");
  });
});

describe("buildAIContext", () => {
  it("orchestrates all context builders", () => {
    const context = buildAIContext({
      runtime: { now: FIXED_NOW, locale: "en" },
      workspace: {
        workspaceName: "Xavia Tour",
        language: "en",
        currency: "IDR",
      },
      customer: {
        customerId: "cust-1",
        displayName: "Julpa",
      },
      crm: { leadId: "lead-1" },
      product: { productId: "prod-1", productName: "Umrah Reguler" },
      conversation: { conversationId: "conv-1", channel: "whatsapp" },
      businessBrain: { workspaceId: "org-1" },
    });

    assert.equal(context.runtime.date, "2026-07-07");
    assert.equal(context.workspace.workspaceName, "Xavia Tour");
    assert.equal(context.customer.displayName, "Julpa");
    assert.equal(context.crm.leadId, "lead-1");
    assert.equal(context.product.productName, "Umrah Reguler");
    assert.equal(context.conversation.channel, "whatsapp");
    assert.equal(context.businessBrain.workspaceId, "org-1");
  });

  it("returns placeholder slices when input is omitted", () => {
    const context = buildAIContext();

    assert.equal(context.customer.available, false);
    assert.equal(context.crm.available, false);
    assert.equal(context.product.available, false);
    assert.equal(context.conversation.available, false);
    assert.equal(context.businessBrain.available, false);
    assert.ok(context.runtime.date);
    assert.ok(context.workspace.workspaceName);
  });
});
