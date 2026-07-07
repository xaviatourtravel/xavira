import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { LEAD_SOURCES } from "@/constants/lead-sources";
import {
  formatLeadSourceLabel,
  getLeadSourceAnalyticsBucket,
  getLeadSourceOptions,
  isLeadSourceV1,
  parseLeadSourceForSave,
} from "@/lib/leads/source-tracking";

describe("LEAD_SOURCES", () => {
  it("includes Instagram directly below Meta Ads", () => {
    assert.equal(LEAD_SOURCES[0]?.value, "meta_ads");
    assert.equal(LEAD_SOURCES[1]?.value, "instagram");
  });

  it("includes all required sources", () => {
    const values = LEAD_SOURCES.map((source) => source.value);
    assert.deepEqual(values, [
      "meta_ads",
      "instagram",
      "tiktok",
      "website",
      "whatsapp",
      "referral",
      "repeat_customer",
      "walk_in",
      "other",
    ]);
  });
});

describe("lead source compatibility", () => {
  it("accepts instagram as a first-class source", () => {
    assert.equal(isLeadSourceV1("instagram"), true);
    assert.equal(parseLeadSourceForSave("instagram"), "instagram");
  });

  it("keeps legacy facebook saveable", () => {
    assert.equal(parseLeadSourceForSave("facebook"), "facebook");
  });

  it("labels instagram consistently in both locales", () => {
    assert.equal(formatLeadSourceLabel("instagram", "en"), "Instagram");
    assert.equal(formatLeadSourceLabel("instagram", "id"), "Instagram");
  });

  it("buckets legacy facebook into meta ads analytics", () => {
    assert.equal(getLeadSourceAnalyticsBucket("facebook"), "meta_ads");
    assert.equal(getLeadSourceAnalyticsBucket("instagram"), "instagram");
  });

  it("exposes localized options for filters and forms", () => {
    const options = getLeadSourceOptions("id");
    assert.equal(options[1]?.value, "instagram");
    assert.equal(options[1]?.label, "Instagram");
  });
});
