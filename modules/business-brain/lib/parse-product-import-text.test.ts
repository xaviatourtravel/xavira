import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseProductImportText } from "@/modules/business-brain/lib/parse-product-import-text";
import {
  normalizeFieldKey,
  resolveCanonicalFieldKey,
} from "@/modules/business-brain/lib/product-import-field-aliases";

describe("normalizeFieldKey", () => {
  const equivalentKeys = [
    "PRODUCT_NAME",
    "PRODUCT NAME",
    "Product Name",
    "product-name",
    "product.name",
    "product:name",
    "product/name",
    "product,name",
    "product;name",
    "product|name",
  ];

  for (const key of equivalentKeys) {
    it(`normalizes "${key}" to PRODUCT_NAME`, () => {
      assert.equal(normalizeFieldKey(key), "PRODUCT_NAME");
    });
  }
});

describe("resolveCanonicalFieldKey aliases", () => {
  it("resolves English aliases", () => {
    assert.equal(resolveCanonicalFieldKey("Product Name"), "PRODUCT_NAME");
    assert.equal(resolveCanonicalFieldKey("Departure Date"), "DEPARTURE_DATE");
    assert.equal(resolveCanonicalFieldKey("Country"), "COUNTRY");
    assert.equal(resolveCanonicalFieldKey("Package Name"), "PRODUCT_NAME");
    assert.equal(resolveCanonicalFieldKey("Start Date"), "DEPARTURE_DATE");
  });

  it("resolves Indonesian aliases", () => {
    assert.equal(resolveCanonicalFieldKey("Nama Produk"), "PRODUCT_NAME");
    assert.equal(resolveCanonicalFieldKey("Nama Paket"), "PRODUCT_NAME");
    assert.equal(resolveCanonicalFieldKey("Paket"), "PRODUCT_NAME");
    assert.equal(resolveCanonicalFieldKey("Negara"), "COUNTRY");
    assert.equal(resolveCanonicalFieldKey("Tanggal Berangkat"), "DEPARTURE_DATE");
    assert.equal(resolveCanonicalFieldKey("Tanggal Keberangkatan"), "DEPARTURE_DATE");
  });
});

describe("parseProductImportText key formats", () => {
  it("parses underscore keys with colon separator", () => {
    const parsed = parseProductImportText(
      ["PRODUCT_NAME: Japan Tour", "COUNTRY: Japan"].join("\n"),
    );
    assert.equal(parsed.name, "Japan Tour");
    assert.equal(parsed.country, "Japan");
  });

  it("parses spaced keys with equals separator", () => {
    const parsed = parseProductImportText("Product Name = Bali Adventure");
    assert.equal(parsed.name, "Bali Adventure");
  });

  it("parses dashed keys with arrow separator", () => {
    const parsed = parseProductImportText("product-name -> Tokyo Explorer");
    assert.equal(parsed.name, "Tokyo Explorer");
  });

  it("parses dotted keys with double-colon separator", () => {
    const parsed = parseProductImportText("product.name :: Hokkaido Snow");
    assert.equal(parsed.name, "Hokkaido Snow");
  });

  it("parses slashed keys with fat-arrow separator", () => {
    const parsed = parseProductImportText("product/name => Osaka Food Trip");
    assert.equal(parsed.name, "Osaka Food Trip");
  });

  it("parses comma-separated label tokens with dash separator", () => {
    const parsed = parseProductImportText("product,name - Kyoto Heritage");
    assert.equal(parsed.name, "Kyoto Heritage");
  });

  it("parses mixed-case English alias with colon", () => {
    const parsed = parseProductImportText("Departure Date: 24 September 2026");
    assert.equal(parsed.departureDate, "2026-09-24");
  });

  it("parses Indonesian alias with equals", () => {
    const parsed = parseProductImportText("Nama Produk = Tour Jepang Premium");
    assert.equal(parsed.name, "Tour Jepang Premium");
  });
});

describe("parseProductImportText multiline values", () => {
  it("supports value on following lines after key-only label", () => {
    const parsed = parseProductImportText(
      ["Product Name", "", "Japan Tokyo Fuji"].join("\n"),
    );
    assert.equal(parsed.name, "Japan Tokyo Fuji");
  });

  it("supports multiline values until the next field", () => {
    const parsed = parseProductImportText(
      [
        "Product Name",
        "Japan Tokyo Fuji",
        "Premium Package",
        "Country: Japan",
      ].join("\n"),
    );
    assert.equal(parsed.name, "Japan Tokyo Fuji\nPremium Package");
    assert.equal(parsed.country, "Japan");
  });
});

describe("parseProductImportText additional fields", () => {
  it("stores unrecognized fields as additional fields without blocking known fields", () => {
    const parsed = parseProductImportText(
      [
        "PRODUCT_NAME: Known Tour",
        "Custom Promo Code: EARLY2026",
        "COUNTRY: Japan",
      ].join("\n"),
    );

    assert.equal(parsed.name, "Known Tour");
    assert.equal(parsed.country, "Japan");
    assert.equal(parsed.additionalFields.length, 1);
    assert.equal(parsed.additionalFields[0]?.key, "Custom Promo Code");
    assert.equal(parsed.additionalFields[0]?.value, "EARLY2026");
  });
});

describe("parseProductImportText regression", () => {
  const legacySample = [
    "PRODUCT_ID: PKG-001",
    "PRODUCT_NAME: Japan Premium Tour",
    "COUNTRY: Japan",
    "DURATION: 8D7N",
    "DEPARTURE_DATE: 24 September 2026",
    "STARTING_PRICE_ADULT: Rp 25.000.000",
    "MAIN_HIGHLIGHTS: Mt Fuji; Tokyo City Tour",
    "INCLUDED: Hotel; Breakfast",
    "MIN_PARTICIPANTS: 25",
  ].join("\n");

  it("continues parsing legacy underscore format", () => {
    const parsed = parseProductImportText(legacySample);

    assert.equal(parsed.productId, "PKG-001");
    assert.equal(parsed.name, "Japan Premium Tour");
    assert.equal(parsed.country, "Japan");
    assert.equal(parsed.duration, "8D7N");
    assert.equal(parsed.departureDate, "2026-09-24");
    assert.equal(parsed.pricing.adult, 25_000_000);
    assert.deepEqual(parsed.highlights, ["Mt Fuji", "Tokyo City Tour"]);
    assert.deepEqual(parsed.included, ["Hotel", "Breakfast"]);
    assert.equal(parsed.minParticipants, "25");
    assert.equal(parsed.additionalFields.length, 0);
  });
});
