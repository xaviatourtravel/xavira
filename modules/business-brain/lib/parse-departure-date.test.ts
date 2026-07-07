import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatDepartureDatePreview,
  parseDepartureDate,
} from "@/modules/business-brain/lib/parse-departure-date";
import {
  mapProductImportToFormValues,
  mergeProductImportPatch,
} from "@/modules/business-brain/lib/map-product-import-to-form";
import { parseProductImportText } from "@/modules/business-brain/lib/parse-product-import-text";
import { createEmptyDepartureItem } from "@/modules/business-brain/lib/product-knowledge-score";
import { DEFAULT_BRAIN_PRODUCT_FORM } from "@/modules/business-brain/types/products";

describe("parseDepartureDate", () => {
  it('parseDepartureDate("24 September 2026") === "2026-09-24"', () => {
    assert.equal(parseDepartureDate("24 September 2026"), "2026-09-24");
  });

  it('parseDepartureDate("24 Sep 2026") === "2026-09-24"', () => {
    assert.equal(parseDepartureDate("24 Sep 2026"), "2026-09-24");
  });

  it('parseDepartureDate("24 Sept 2026") === "2026-09-24"', () => {
    assert.equal(parseDepartureDate("24 Sept 2026"), "2026-09-24");
  });

  it('parseDepartureDate("24 september 2026") === "2026-09-24"', () => {
    assert.equal(parseDepartureDate("24 september 2026"), "2026-09-24");
  });

  it('parseDepartureDate("24 September, 2026") === "2026-09-24"', () => {
    assert.equal(parseDepartureDate("24 September, 2026"), "2026-09-24");
  });

  it('parseDepartureDate("2026-09-24") === "2026-09-24"', () => {
    assert.equal(parseDepartureDate("2026-09-24"), "2026-09-24");
  });

  it('parseDepartureDate("24/09/2026") === "2026-09-24"', () => {
    assert.equal(parseDepartureDate("24/09/2026"), "2026-09-24");
  });

  it('parseDepartureDate("24-09-2026") === "2026-09-24"', () => {
    assert.equal(parseDepartureDate("24-09-2026"), "2026-09-24");
  });

  it("supports Indonesian month names", () => {
    assert.equal(parseDepartureDate("24 September 2026"), "2026-09-24");
    assert.equal(parseDepartureDate("1 Januari 2026"), "2026-01-01");
    assert.equal(parseDepartureDate("2 Februari 2026"), "2026-02-02");
    assert.equal(parseDepartureDate("3 Maret 2026"), "2026-03-03");
    assert.equal(parseDepartureDate("4 Mei 2026"), "2026-05-04");
    assert.equal(parseDepartureDate("5 Juni 2026"), "2026-06-05");
    assert.equal(parseDepartureDate("6 Juli 2026"), "2026-07-06");
    assert.equal(parseDepartureDate("7 Agustus 2026"), "2026-08-07");
    assert.equal(parseDepartureDate("8 Oktober 2026"), "2026-10-08");
    assert.equal(parseDepartureDate("9 Desember 2026"), "2026-12-09");
  });

  it("returns null for empty input", () => {
    assert.equal(parseDepartureDate(""), null);
    assert.equal(parseDepartureDate(null), null);
  });
});

describe("formatDepartureDatePreview", () => {
  it("formats Indonesian locale", () => {
    assert.equal(formatDepartureDatePreview("2026-09-24", "id"), "24 September 2026");
  });

  it("formats English locale", () => {
    assert.equal(formatDepartureDatePreview("2026-09-24", "en"), "September 24, 2026");
  });
});

describe("parseProductImportText departure regression", () => {
  const sample = ["DEPARTURE_DATE: 24 September 2026", "MIN_PARTICIPANTS: 25"].join("\n");

  it("parses departure date to ISO", () => {
    const parsed = parseProductImportText(sample);
    assert.equal(parsed.departureDate, "2026-09-24");
    assert.equal(parsed.minParticipants, "25");
  });

  it("maps departure schedule with seats and status", () => {
    const parsed = parseProductImportText(sample);
    const patch = mapProductImportToFormValues(parsed);

    assert.equal(patch.departures?.length, 1);
    assert.equal(patch.departures?.[0]?.departureDate, "2026-09-24");
    assert.equal(patch.departures?.[0]?.availableSeats, 25);
    assert.equal(patch.departures?.[0]?.status, "open");
  });

  it("creates a departure when product has none", () => {
    const parsed = parseProductImportText(sample);
    const patch = mapProductImportToFormValues(parsed);
    const merged = mergeProductImportPatch(DEFAULT_BRAIN_PRODUCT_FORM, patch);

    assert.equal(merged.departures.length, 1);
    assert.equal(merged.departures[0]?.departureDate, "2026-09-24");
    assert.equal(merged.departures[0]?.availableSeats, 25);
    assert.equal(merged.departures[0]?.status, "open");
  });

  it("fills empty first schedule instead of replacing existing rows", () => {
    const emptyFirst = {
      ...DEFAULT_BRAIN_PRODUCT_FORM,
      departures: [{ ...createEmptyDepartureItem(), departureDate: "" }],
    };
    const parsed = parseProductImportText(sample);
    const patch = mapProductImportToFormValues(parsed);
    const merged = mergeProductImportPatch(emptyFirst, patch);

    assert.equal(merged.departures.length, 1);
    assert.equal(merged.departures[0]?.departureDate, "2026-09-24");
    assert.equal(merged.departures[0]?.availableSeats, 25);
  });

  it("appends imported date when schedules already exist", () => {
    const existing = {
      ...DEFAULT_BRAIN_PRODUCT_FORM,
      departures: [
        {
          ...createEmptyDepartureItem(),
          departureDate: "2026-10-01",
          availableSeats: 10,
          status: "open" as const,
        },
      ],
    };
    const parsed = parseProductImportText(sample);
    const patch = mapProductImportToFormValues(parsed);
    const merged = mergeProductImportPatch(existing, patch);

    assert.equal(merged.departures.length, 2);
    assert.equal(merged.departures[0]?.departureDate, "2026-10-01");
    assert.equal(merged.departures[1]?.departureDate, "2026-09-24");
    assert.equal(merged.departures[1]?.availableSeats, 25);
  });

  it("does not duplicate an existing departure date", () => {
    const existing = {
      ...DEFAULT_BRAIN_PRODUCT_FORM,
      departures: [
        {
          ...createEmptyDepartureItem(),
          departureDate: "2026-09-24",
          availableSeats: 12,
          status: "open" as const,
        },
      ],
    };
    const parsed = parseProductImportText(sample);
    const patch = mapProductImportToFormValues(parsed);
    const merged = mergeProductImportPatch(existing, patch);

    assert.equal(merged.departures.length, 1);
    assert.equal(merged.departures[0]?.availableSeats, 12);
  });
});
