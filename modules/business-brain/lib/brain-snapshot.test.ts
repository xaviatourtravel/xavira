import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildBrainSnapshot,
  parseBrainSnapshot,
  summarizeDraftChanges,
} from "@/modules/business-brain/lib/brain-snapshot";
import {
  canonicalizeProduct,
  sortKeysDeep,
  stableCanonicalString,
} from "@/modules/business-brain/lib/brain-snapshot-canonical";
import { mapSnapshotToBusinessBrainContext } from "@/modules/business-brain/lib/map-brain-context";

const PRODUCT_ID = "11111111-1111-1111-1111-111111111111";
const KNOWLEDGE_ID = "22222222-2222-2222-2222-222222222222";

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: PRODUCT_ID,
    business_brain_id: "brain-1",
    name: "Yunnan Tour",
    category: "group_tour",
    destination: "Yunnan",
    description: "Family friendly tour",
    highlights: ["Kunming", "Dali"],
    pricing: [{ label: "Adult", amount: 12000000, currency: "IDR" }],
    departures: [],
    included: ["Hotel"],
    excluded: ["Flight"],
    ai_notes: "Popular package",
    status: "draft",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

function makeKnowledge(overrides: Record<string, unknown> = {}) {
  return {
    id: KNOWLEDGE_ID,
    business_brain_id: "brain-1",
    title: "Refund Policy",
    category: "refund",
    content: "Refund within 30 days",
    keywords: ["refund"],
    visibility: "ai_only",
    status: "draft",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-03T00:00:00.000Z",
    ...overrides,
  };
}

describe("brain snapshot canonical diff", () => {
  it("treats identical content with different object key order as zero changes", () => {
    const current = buildBrainSnapshot({
      companyDna: null,
      products: [makeProduct() as never],
      knowledge: [],
      documents: [],
      behaviors: [],
    });

    const published = parseBrainSnapshot({
      capturedAt: current.capturedAt,
      companyDna: null,
      products: [
        {
          status: "draft",
          name: "Yunnan Tour",
          id: PRODUCT_ID,
          category: "group_tour",
          destination: "Yunnan",
          description: "Family friendly tour",
          highlights: ["Kunming", "Dali"],
          pricing: [{ currency: "IDR", amount: 12000000, label: "Adult" }],
          departures: [],
          included: ["Hotel"],
          excluded: ["Flight"],
          ai_notes: "Popular package",
          updated_at: "2099-01-01T00:00:00.000Z",
          created_at: "2099-01-02T00:00:00.000Z",
          business_brain_id: "brain-1",
        },
      ],
      knowledge: [],
      documents: [],
      behaviors: [],
    });

    const summary = summarizeDraftChanges(current, published);
    assert.equal(summary.totalChanges, 0);
    assert.equal(summary.hasUnpublishedChanges, false);
  });

  it("treats identical content after JSONB round-trip as zero changes", () => {
    const current = buildBrainSnapshot({
      companyDna: null,
      products: [],
      knowledge: [makeKnowledge() as never],
      documents: [],
      behaviors: [],
    });

    const roundTripped = parseBrainSnapshot(JSON.parse(JSON.stringify(current)));
    const summary = summarizeDraftChanges(current, roundTripped);
    assert.equal(summary.totalChanges, 0);
  });

  it("ignores draft versus published status-only differences", () => {
    const current = buildBrainSnapshot({
      companyDna: null,
      products: [],
      knowledge: [makeKnowledge({ status: "draft" }) as never],
      documents: [],
      behaviors: [],
    });

    const published = buildBrainSnapshot({
      companyDna: null,
      products: [],
      knowledge: [makeKnowledge({ status: "published" }) as never],
      documents: [],
      behaviors: [],
    });

    const summary = summarizeDraftChanges(current, published);
    assert.equal(summary.totalChanges, 0);
  });

  it("detects actual text changes as one edited entity", () => {
    const current = buildBrainSnapshot({
      companyDna: null,
      products: [],
      knowledge: [makeKnowledge({ content: "Refund within 14 days" }) as never],
      documents: [],
      behaviors: [],
    });

    const published = buildBrainSnapshot({
      companyDna: null,
      products: [],
      knowledge: [makeKnowledge({ content: "Refund within 30 days" }) as never],
      documents: [],
      behaviors: [],
    });

    const summary = summarizeDraftChanges(current, published);
    assert.equal(summary.totalChanges, 1);
    assert.equal(summary.sections.find((item) => item.section === "knowledge")?.edited, 1);
    assert.equal(summary.sections[2]?.changes[0]?.displayName, "Refund Policy");
  });

  it("detects added and removed entities with display names", () => {
    const current = buildBrainSnapshot({
      companyDna: null,
      products: [makeProduct() as never],
      knowledge: [],
      documents: [],
      behaviors: [],
    });

    const published = buildBrainSnapshot({
      companyDna: null,
      products: [],
      knowledge: [],
      documents: [],
      behaviors: [],
    });

    const summary = summarizeDraftChanges(current, published);
    assert.equal(summary.sections.find((item) => item.section === "products")?.added, 1);
    assert.equal(summary.sections[1]?.changes[0]?.displayName, "Yunnan Tour");
  });

  it("detects archived product changes", () => {
    const current = buildBrainSnapshot({
      companyDna: null,
      products: [makeProduct({ status: "archived" }) as never],
      knowledge: [],
      documents: [],
      behaviors: [],
    });

    const published = buildBrainSnapshot({
      companyDna: null,
      products: [makeProduct({ status: "published" }) as never],
      knowledge: [],
      documents: [],
      behaviors: [],
    });

    const summary = summarizeDraftChanges(current, published);
    assert.equal(summary.totalChanges, 1);
    assert.equal(summary.sections.find((item) => item.section === "products")?.edited, 1);
  });

  it("does not treat array order differences as changes when ids are stable", () => {
    const left = canonicalizeProduct(makeProduct());
    const right = canonicalizeProduct(
      makeProduct({
        highlights: ["Dali", "Kunming"],
      }),
    );

    assert.equal(stableCanonicalString(left), stableCanonicalString(right));
  });

  it("sortKeysDeep normalizes key order", () => {
    const left = sortKeysDeep({ b: 1, a: { d: 2, c: 3 } });
    const right = sortKeysDeep({ a: { c: 3, d: 2 }, b: 1 });
    assert.equal(JSON.stringify(left), JSON.stringify(right));
  });
});

describe("published snapshot live context", () => {
  it("includes draft-status knowledge from the active published snapshot", () => {
    const snapshot = buildBrainSnapshot({
      companyDna: null,
      products: [],
      knowledge: [makeKnowledge({ status: "draft" }) as never],
      documents: [],
      behaviors: [],
    });

    const context = mapSnapshotToBusinessBrainContext(snapshot);
    assert.equal(context.knowledge.length, 1);
    assert.equal(context.knowledge[0]?.title, "Refund Policy");
  });

  it("excludes archived products from live published context", () => {
    const snapshot = buildBrainSnapshot({
      companyDna: null,
      products: [makeProduct({ status: "archived" }) as never],
      knowledge: [],
      documents: [],
      behaviors: [],
    });

    const context = mapSnapshotToBusinessBrainContext(snapshot);
    assert.equal(context.products.length, 0);
  });

  it("excludes disabled behavior rules from live published context", () => {
    const snapshot = buildBrainSnapshot({
      companyDna: null,
      products: [],
      knowledge: [],
      documents: [],
      behaviors: [
        {
          id: "33333333-3333-3333-3333-333333333333",
          business_brain_id: "brain-1",
          type: "NEVER_DO",
          name: "No repeated greeting",
          description: "Do not greet repeatedly",
          enabled: false,
          config: {},
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        } as never,
      ],
    });

    const context = mapSnapshotToBusinessBrainContext(snapshot);
    assert.equal(context.behaviors.length, 0);
  });
});

describe("post-publish draft summary", () => {
  it("remains zero when current draft matches stored published snapshot", () => {
    const current = buildBrainSnapshot({
      companyDna: null,
      products: [makeProduct() as never],
      knowledge: [makeKnowledge() as never],
      documents: [],
      behaviors: [],
    });

    const published = parseBrainSnapshot(JSON.parse(JSON.stringify(current)));
    const summary = summarizeDraftChanges(current, published);
    assert.equal(summary.totalChanges, 0);
    assert.equal(summary.hasUnpublishedChanges, false);
  });

  it("creates a real diff after a subsequent edit", () => {
    const published = buildBrainSnapshot({
      companyDna: null,
      products: [],
      knowledge: [makeKnowledge() as never],
      documents: [],
      behaviors: [],
    });

    const current = buildBrainSnapshot({
      companyDna: null,
      products: [],
      knowledge: [makeKnowledge({ content: "Updated refund policy" }) as never],
      documents: [],
      behaviors: [],
    });

    const summary = summarizeDraftChanges(current, published);
    assert.equal(summary.totalChanges, 1);
    assert.equal(summary.hasUnpublishedChanges, true);
  });
});
