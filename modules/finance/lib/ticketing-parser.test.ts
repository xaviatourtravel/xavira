import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  parseGdsItinerary,
  parseGdsSegmentLine,
} from "@/modules/finance/lib/gds-parser";
import {
  resolveAirportDisplay,
  resolveAirlineName,
} from "@/modules/finance/lib/airport-airline-directory";
import {
  groupSegmentsByDirection,
  suggestSegmentDirections,
} from "@/modules/finance/lib/ticketing-grouping";
import { buildTicketingInvoiceItems, buildRouteSummary } from "@/modules/finance/lib/ticketing-pricing";
import { calculateInvoiceTotals } from "@/modules/finance/lib/invoice-calculator";
import { normalizePnr } from "@/modules/finance/schemas/ticketing";

const SAMPLE = `1 ET 629U 02AUG S CGKADD GN17 2035 0600 03AUG
2 ET 462U 03AUG M ADDJED GN17 1100 1330 /E
3 ET 463U 10AUG M JEDADD GN17 1520 1750 /E
4 ET 628U 10AUG M ADDCGK GN17 2355 1730 11AUG`;

describe("FIN-002 GDS parser", () => {
  it("extracts the four provided sample segments", () => {
    const { segments } = parseGdsItinerary(SAMPLE);
    assert.equal(segments.length, 4);

    const [first] = segments;
    assert.equal(first!.airlineCode, "ET");
    assert.equal(first!.flightNumber, "629");
    assert.equal(first!.bookingClass, "U");
    assert.equal(first!.departureAirport, "CGK");
    assert.equal(first!.arrivalAirport, "ADD");
    assert.equal(first!.departureLocalDate, "02AUG");
    assert.equal(first!.departureLocalTime, "20:35");
    assert.equal(first!.arrivalLocalTime, "06:00");
    assert.equal(first!.arrivalLocalDate, "03AUG");
    assert.equal(first!.arrivalDayOffset, 1);

    assert.deepEqual(
      segments.map((s) => `${s.departureAirport}${s.arrivalAirport}`),
      ["CGKADD", "ADDJED", "JEDADD", "ADDCGK"],
    );
  });

  it("produces a +1 day offset only from an explicit arrival date", () => {
    const overnight = parseGdsSegmentLine("1 ET 628U 10AUG M ADDCGK GN17 2355 1730 11AUG", 1);
    assert.equal(overnight!.arrivalDayOffset, 1);

    const noDate = parseGdsSegmentLine("1 ET 462U 03AUG M ADDJED GN17 1100 1330 /E", 1);
    assert.equal(noDate!.arrivalDayOffset, 0);
  });

  it("returns warnings for malformed lines without throwing", () => {
    const { segments, warnings } = parseGdsItinerary("this is not a valid gds line\n???");
    assert.equal(segments.length, 0);
    assert.ok(warnings.length >= 1);
  });

  it("keeps a partially-parsed line with per-line warnings", () => {
    const seg = parseGdsSegmentLine("1 ET 629U 02AUG S CGKADD", 1);
    assert.ok(seg);
    assert.equal(seg!.departureAirport, "CGK");
    assert.ok(seg!.warnings.length >= 0);
    assert.equal(seg!.rawSegment, "1 ET 629U 02AUG S CGKADD");
  });
});

describe("FIN-002 airport/airline directory", () => {
  it("shows friendly names when known", () => {
    assert.equal(resolveAirportDisplay("CGK").primary, "Jakarta");
    assert.equal(resolveAirportDisplay("ADD").primary, "Addis Ababa");
    assert.equal(resolveAirlineName("ET"), "Ethiopian Airlines");
  });

  it("falls back safely to the code for unknown airport", () => {
    const unknown = resolveAirportDisplay("ZZZ");
    assert.equal(unknown.primary, "ZZZ");
    assert.equal(unknown.city, null);
  });

  it("falls back safely to the code for unknown airline", () => {
    assert.equal(resolveAirlineName("ZZ"), "ZZ");
  });
});

describe("FIN-002 grouping", () => {
  it("suggests round-trip grouping and remains editable", () => {
    const { segments } = parseGdsItinerary(SAMPLE);
    const suggestions = suggestSegmentDirections(segments, "round_trip");
    assert.deepEqual(suggestions, ["outbound", "outbound", "return", "return"]);

    // Editable: overriding one direction re-groups deterministically.
    const withDirections = segments.map((seg, index) => ({
      ...seg,
      direction: suggestions[index]!,
    }));
    withDirections[1]!.direction = "other";
    const grouped = groupSegmentsByDirection(withDirections);
    assert.equal(grouped.outbound.length, 1);
    assert.equal(grouped.other.length, 1);
    assert.equal(grouped.return.length, 2);
  });

  it("treats one-way and multi-city as outbound suggestions", () => {
    const { segments } = parseGdsItinerary("1 ET 629U 02AUG S CGKADD GN17 2035 0600");
    assert.deepEqual(suggestSegmentDirections(segments, "one_way"), ["outbound"]);
  });
});

describe("FIN-002 ticketing pricing", () => {
  it("computes passenger count × unit price via the invoice calculator", () => {
    const { items } = buildTicketingInvoiceItems({
      passengerCount: 17,
      pricePerPassengerMinor: 14_300_000,
      routeSummary: "CGK → ADD → JED → CGK",
    });
    const totals = calculateInvoiceTotals({
      items: items.map((item) => ({
        quantity: item.quantity,
        unitPriceMinor: item.unitPriceMinor,
        discountMinor: item.discountMinor,
      })),
    });
    assert.equal(totals.totalMinor, 243_100_000);
  });

  it("routes taxes/fees and discount to invoice-level totals", () => {
    const result = buildTicketingInvoiceItems({
      passengerCount: 2,
      pricePerPassengerMinor: 5_000_000,
      serviceFeeMinor: 200_000,
      taxesAndFeesMinor: 100_000,
      discountMinor: 300_000,
      routeSummary: "CGK → JED",
    });
    assert.equal(result.items.length, 2);
    assert.equal(result.totals.additionalFeesMinor, 100_000);
    assert.equal(result.totals.discountMinor, 300_000);
    const totals = calculateInvoiceTotals({
      items: result.items.map((item) => ({
        quantity: item.quantity,
        unitPriceMinor: item.unitPriceMinor,
        discountMinor: item.discountMinor,
      })),
      additionalFeesMinor: result.totals.additionalFeesMinor,
      discountMinor: result.totals.discountMinor,
    });
    // (2×5,000,000 + 200,000) - 300,000 + 100,000
    assert.equal(totals.totalMinor, 10_000_000);
  });

  it("builds a de-duplicated route summary", () => {
    assert.equal(
      buildRouteSummary(["CGK", "ADD", "ADD", "JED", "CGK"]),
      "CGK → ADD → JED → CGK",
    );
  });
});

describe("FIN-002 PNR normalization", () => {
  it("uppercases, trims and strips inner spaces", () => {
    assert.equal(normalizePnr("  ab c12 "), "ABC12");
  });

  it("does not force a fixed six-character length", () => {
    assert.equal(normalizePnr("Q7X9"), "Q7X9");
    assert.equal(normalizePnr("abcdef"), "ABCDEF");
    assert.equal(normalizePnr("ab12cd8"), "AB12CD8");
  });
});
