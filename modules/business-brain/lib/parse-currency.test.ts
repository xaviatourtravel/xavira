import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatIdrCurrency, parseCurrency } from "@/modules/business-brain/lib/parse-currency";
import { mapProductImportToFormValues } from "@/modules/business-brain/lib/map-product-import-to-form";
import { parseProductImportText } from "@/modules/business-brain/lib/parse-product-import-text";

describe("parseCurrency", () => {
  it('parseCurrency("Rp24.200.000") === 24200000', () => {
    assert.equal(parseCurrency("Rp24.200.000"), 24_200_000);
  });

  it('parseCurrency("Rp 24.200.000") === 24200000', () => {
    assert.equal(parseCurrency("Rp 24.200.000"), 24_200_000);
  });

  it('parseCurrency("IDR 24.200.000") === 24200000', () => {
    assert.equal(parseCurrency("IDR 24.200.000"), 24_200_000);
  });

  it('parseCurrency("24.200.000") === 24200000', () => {
    assert.equal(parseCurrency("24.200.000"), 24_200_000);
  });

  it('parseCurrency("24,200,000") === 24200000', () => {
    assert.equal(parseCurrency("24,200,000"), 24_200_000);
  });

  it('parseCurrency("24 200 000") === 24200000', () => {
    assert.equal(parseCurrency("24 200 000"), 24_200_000);
  });

  it('parseCurrency("24200000") === 24200000', () => {
    assert.equal(parseCurrency("24200000"), 24_200_000);
  });

  it('parseCurrency("") === null', () => {
    assert.equal(parseCurrency(""), null);
  });

  it('parseCurrency(null) === null', () => {
    assert.equal(parseCurrency(null), null);
  });
});

describe("parseProductImportText pricing regression", () => {
  const sample = [
    "STARTING_PRICE_ADULT: Rp24.200.000",
    "CHILD_TWIN_PRICE: Rp24.200.000",
    "CHILD_NO_BED_PRICE: Rp23.700.000",
  ].join("\n");

  it("parses all three price fields", () => {
    const parsed = parseProductImportText(sample);

    assert.equal(parsed.pricing.adult, 24_200_000);
    assert.equal(parsed.pricing.childTwin, 24_200_000);
    assert.equal(parsed.pricing.childNoBed, 23_700_000);
  });

  it("formats preview amounts", () => {
    const parsed = parseProductImportText(sample);

    assert.equal(formatIdrCurrency(parsed.pricing.adult), "Rp24.200.000");
    assert.equal(formatIdrCurrency(parsed.pricing.childTwin), "Rp24.200.000");
    assert.equal(formatIdrCurrency(parsed.pricing.childNoBed), "Rp23.700.000");
  });

  it("maps numeric form values without truncation", () => {
    const parsed = parseProductImportText(sample);
    const form = mapProductImportToFormValues(parsed);

    const adult = form.pricing?.find((item) => item.packageName === "Adult");
    const childTwin = form.pricing?.find((item) => item.packageName === "Child (Twin)");
    const childNoBed = form.pricing?.find((item) => item.packageName === "Child (No Bed)");

    assert.equal(adult?.price, 24_200_000);
    assert.equal(childTwin?.price, 24_200_000);
    assert.equal(childNoBed?.price, 23_700_000);
  });
});
