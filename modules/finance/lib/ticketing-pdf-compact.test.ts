/**
 * FIN-002C — Compact ticketing itinerary structural and render contracts.
 *
 * React-PDF pagination is deterministic for these fixtures, so the standard
 * four-segment case also asserts the rendered PDF page count. Visual quality
 * still requires the manual smoke check documented in the deliverable.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { PDFDocument } from "pdf-lib";

import { buildInvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-data";
import { renderInvoicePdfBuffer } from "@/modules/finance/pdf/invoice-pdf-renderer";
import {
  fixtureShortInvoice,
  fixtureTicketingEightSegments,
  fixtureTicketingFourSegmentRoundTrip,
  fixtureTicketingInvoice,
  fixtureTicketingLongNames,
  fixtureTicketingOneSegment,
  fixtureTicketingOvernightArrival,
  fixtureTicketingTwelveSegments,
  fixtureTicketingTwoSegments,
} from "@/modules/finance/pdf/fixtures/invoice-pdf-fixtures";
import type { InvoiceTicketGroupRecord } from "@/modules/finance/types/ticketing";

const itinerarySource = readFileSync(
  path.join(
    process.cwd(),
    "modules/finance/pdf/shared/flight-itinerary.tsx",
  ),
  "utf8",
);
const ticketingTemplateSource = readFileSync(
  path.join(
    process.cwd(),
    "modules/finance/pdf/templates/ticketing.tsx",
  ),
  "utf8",
);

async function renderTicketing(groups: InvoiceTicketGroupRecord[]) {
  const data = await buildInvoicePdfData(fixtureTicketingInvoice(), {
    mode: "issued",
    ticketing: groups,
  });
  const buffer = await renderInvoicePdfBuffer(data);
  const document = await PDFDocument.load(buffer);
  return { buffer, pages: document.getPageCount() };
}

describe("FIN-002C compact itinerary structure", () => {
  it("removes the large per-segment card wrapper", () => {
    assert.ok(!itinerarySource.includes('data-flight-segment="card"'));
    assert.ok(!itinerarySource.includes("function SegmentCard"));
    assert.ok(!/borderRadius:\s*8[\s\S]{0,180}data-flight-segment/.test(itinerarySource));
  });

  it("uses compact non-splitting segment rows in wrapping journey groups", () => {
    assert.ok(
      itinerarySource.includes('data-flight-segment="compact-row"'),
    );
    assert.ok(
      itinerarySource.includes('data-compact-height-target="38-52pt"'),
    );
    assert.ok(itinerarySource.includes('data-journey-group="compact-list"'));
    assert.match(itinerarySource, /function SegmentRow[\s\S]*?wrap=\{false\}/);
    assert.match(
      itinerarySource,
      /data-journey-group="compact-list"[\s\S]*?>[\s\S]*?segments\.map/,
    );
  });

  it("renders transit as one compact separator row without invented duration", () => {
    assert.ok(itinerarySource.includes('data-transit-row="compact"'));
    assert.match(
      itinerarySource,
      /INVOICE_PDF_LABELS\.transit[\s\S]*?resolveAirportDisplay\(airportCode\)\.primary/,
    );
    assert.ok(!/transitDuration|layoverDuration|durationMinutes/.test(itinerarySource));
  });

  it("keeps airport codes dominant and explicit next-day offsets visible", () => {
    assert.ok(itinerarySource.includes('data-airport-code="dominant"'));
    assert.ok(itinerarySource.includes('data-arrival-day-offset="true"'));
    assert.match(
      itinerarySource,
      /\+\$\{dayOffset\} \$\{INVOICE_PDF_LABELS\.nextDay\}/,
    );
  });

  it("shows airline name once in the compact flight detail hierarchy", () => {
    assert.ok(
      itinerarySource.includes('data-flight-detail="single-airline-label"'),
    );
    assert.match(
      itinerarySource,
      /\$\{flightLabel\}\$\{classLabel\} · \$\{airline\}/,
    );
    // No legacy second airline-name line remains below each segment.
    assert.ok(!itinerarySource.includes("{airline}\n      </Text>"));
  });

  it("uses compact single-row ticket summary layout in the optional itinerary component", () => {
    assert.ok(
      itinerarySource.includes('data-ticket-summary-layout="single-row"'),
    );
    assert.ok(
      itinerarySource.includes('data-flight-segment="compact-row"'),
    );
  });

  it("billing template keeps optional itinerary behind includeItineraryDetail", () => {
    assert.ok(
      ticketingTemplateSource.includes(
        'data-optional-itinerary-detail="true"',
      ),
    );
    assert.ok(
      ticketingTemplateSource.includes("includeItineraryDetail"),
    );
    assert.ok(
      ticketingTemplateSource.includes('data-transaction-summary="raw"'),
    );
    // Default billing PDF must not force itinerary before financial summary.
    const summaryIdx = ticketingTemplateSource.indexOf(
      "<TransactionSummary data={data} />",
    );
    const financialIdx = ticketingTemplateSource.indexOf(
      "<FinancialSummary data={data} />",
    );
    const itineraryIdx = ticketingTemplateSource.indexOf(
      "<FlightItinerary data={data} />",
    );
    assert.ok(summaryIdx > 0 && financialIdx > summaryIdx);
    assert.ok(itineraryIdx > financialIdx);
  });
});

describe("FIN-002C deterministic fixture coverage", () => {
  it("provides 1, 2, 4, 8 and 12 segment fixtures", () => {
    assert.equal(fixtureTicketingOneSegment()[0]!.segments.length, 1);
    assert.equal(fixtureTicketingTwoSegments()[0]!.segments.length, 2);
    assert.equal(
      fixtureTicketingFourSegmentRoundTrip()[0]!.segments.length,
      4,
    );
    assert.equal(fixtureTicketingEightSegments()[0]!.segments.length, 8);
    assert.equal(fixtureTicketingTwelveSegments()[0]!.segments.length, 12);
  });

  it("provides long-name and explicit overnight fixtures", () => {
    const long = fixtureTicketingLongNames()[0]!.segments;
    assert.equal(long[0]!.departureAirport, "BPN");
    assert.equal(long[0]!.arrivalAirport, "MED");
    assert.equal(long[1]!.airlineCode, "RJ");

    const overnight = fixtureTicketingOvernightArrival()[0]!.segments[0]!;
    assert.equal(overnight.arrivalDayOffset, 1);
    assert.equal(overnight.arrivalLocalDate, "03AUG");
  });
});

describe("FIN-002C rendered pagination", () => {
  it("fits the standard four-segment round trip on one A4 page", async () => {
    const { buffer, pages } = await renderTicketing(
      fixtureTicketingFourSegmentRoundTrip(),
    );
    assert.equal(buffer.subarray(0, 4).toString("ascii"), "%PDF");
    assert.equal(pages, 1);
  });

  it("renders explicit overnight content without changing pagination", async () => {
    const { pages } = await renderTicketing(fixtureTicketingOvernightArrival());
    assert.equal(pages, 1);
  });

  it("keeps 8 and 12 segment itineraries multipage-safe", async () => {
    const eight = await renderTicketing(fixtureTicketingEightSegments());
    const twelve = await renderTicketing(fixtureTicketingTwelveSegments());
    assert.ok(eight.pages >= 1 && eight.pages <= 3);
    assert.ok(twelve.pages >= eight.pages && twelve.pages <= 4);
    assert.ok(eight.buffer.length > 1_000);
    assert.ok(twelve.buffer.length > 1_000);
  });

  it("leaves package PDF routing and rendering unchanged", async () => {
    const routingSource = readFileSync(
      path.join(
        process.cwd(),
        "modules/finance/pdf/invoice-pdf-document.tsx",
      ),
      "utf8",
    );
    assert.match(
      routingSource,
      /if \(data\.invoiceType === "ticketing"\)[\s\S]*?TicketingTemplate/,
    );
    assert.match(
      routingSource,
      /getInvoiceTemplateComponent\(data\.theme\.templateKey\)/,
    );

    const packageData = await buildInvoicePdfData(fixtureShortInvoice(), {
      mode: "issued",
    });
    const buffer = await renderInvoicePdfBuffer(packageData);
    const document = await PDFDocument.load(buffer);
    assert.equal(document.getPageCount(), 1);
  });
});
