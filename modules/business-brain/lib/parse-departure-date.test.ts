import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatDepartureDatePreview,
  parseDepartureDate,
  parseDepartureDates,
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

describe("parseDepartureDates multi-date formats", () => {
  it('parses "2,3,4 Oktober 2026"', () => {
    assert.deepEqual(parseDepartureDates("2,3,4 Oktober 2026"), [
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
  });

  it('parses "2, 3, 4 October 2026"', () => {
    assert.deepEqual(parseDepartureDates("2, 3, 4 October 2026"), [
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
  });

  it('parses "2-4 Oktober 2026"', () => {
    assert.deepEqual(parseDepartureDates("2-4 Oktober 2026"), [
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
  });

  it('parses "2 sampai 4 Oktober 2026"', () => {
    assert.deepEqual(parseDepartureDates("2 sampai 4 Oktober 2026"), [
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
  });

  it('parses "30 Oktober, 6 November 2026"', () => {
    assert.deepEqual(parseDepartureDates("30 Oktober, 6 November 2026"), [
      "2026-10-30",
      "2026-11-06",
    ]);
  });

  it('parses "28 Desember 2026, 4 Januari 2027"', () => {
    assert.deepEqual(parseDepartureDates("28 Desember 2026, 4 Januari 2027"), [
      "2026-12-28",
      "2027-01-04",
    ]);
  });

  it('parses "24 September 2026"', () => {
    assert.deepEqual(parseDepartureDates("24 September 2026"), ["2026-09-24"]);
  });

  it("dedupes and sorts dates", () => {
    assert.deepEqual(parseDepartureDates("4,2,3 Oktober 2026"), [
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
  });

  it("returns empty array for unparseable input", () => {
    assert.deepEqual(parseDepartureDates("soon"), []);
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
    assert.deepEqual(parsed.departureDates, ["2026-09-24"]);
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

  it("imports multiple departure dates into schedule list", () => {
    const parsed = parseProductImportText("DEPARTURE_DATE: 2,3,4 Oktober 2026");
    const patch = mapProductImportToFormValues(parsed);
    const merged = mergeProductImportPatch(DEFAULT_BRAIN_PRODUCT_FORM, patch);

    assert.deepEqual(
      merged.departures.map((item) => item.departureDate),
      ["2026-10-02", "2026-10-03", "2026-10-04"],
    );
  });

  it("skips duplicate dates when importing multiple departures", () => {
    const existing = {
      ...DEFAULT_BRAIN_PRODUCT_FORM,
      departures: [
        {
          ...createEmptyDepartureItem(),
          departureDate: "2026-10-03",
          availableSeats: 8,
          status: "open" as const,
        },
      ],
    };
    const parsed = parseProductImportText("DEPARTURE_DATE: 2,3,4 Oktober 2026");
    const patch = mapProductImportToFormValues(parsed);
    const merged = mergeProductImportPatch(existing, patch);

    assert.deepEqual(
      merged.departures.map((item) => item.departureDate),
      ["2026-10-03", "2026-10-02", "2026-10-04"],
    );
    assert.equal(merged.departures[0]?.availableSeats, 8);
  });

  it("stores unparseable departure text as additional field", () => {
    const parsed = parseProductImportText("DEPARTURE_DATE: TBD soon");
    assert.equal(parsed.departureDate, null);
    assert.deepEqual(parsed.departureDates, []);
    assert.equal(parsed.additionalFields.length, 1);
    assert.equal(parsed.additionalFields[0]?.value, "TBD soon");
  });
});
