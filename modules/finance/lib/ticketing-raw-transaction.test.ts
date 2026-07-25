/**
 * FIN-002H — Raw ticketing transaction layout on the customer PDF.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { PDFDocument } from "pdf-lib";

import {
  buildTicketingRawTransactionBlock,
  resolveTicketingBillItemName,
} from "@/modules/finance/lib/ticketing-raw-transaction";
import { ensureSegmentsFromRawItinerary } from "@/modules/finance/lib/ticketing-editor-state";
import { buildInvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-data";
import {
  INVOICE_PDF_LABELS,
  invoiceDocumentTitle,
} from "@/modules/finance/pdf/invoice-pdf-labels";
import { renderInvoicePdfBuffer } from "@/modules/finance/pdf/invoice-pdf-renderer";
import {
  fixtureShortInvoice,
  fixtureTicketingFourSegmentRoundTrip,
  fixtureTicketingGroups,
  fixtureTicketingInvoice,
} from "@/modules/finance/pdf/fixtures/invoice-pdf-fixtures";

const TEMPLATE = path.join(
  process.cwd(),
  "modules/finance/pdf/templates/ticketing.tsx",
);
const ITINERARY = path.join(
  process.cwd(),
  "modules/finance/pdf/shared/flight-itinerary.tsx",
);

const SAMPLE_RAW =
  "1.C/17-17\n1 ET 629U 02AUG S CGKADD GN17 2035 0600 03AUG\n2 ET 462U 03AUG M ADDJED GN17 1100 1330 /E\n3 ET 463U 10AUG M JEDADD GN17 1520 1750 /E\n4 ET 628U 10AUG M ADDCGK GN17 2355 1730 11AUG";

describe("FIN-002H payment-request Item Tagihan", () => {
  const template = readFileSync(TEMPLATE, "utf8");

  it("payment table first column is Item Tagihan", () => {
    assert.equal(INVOICE_PDF_LABELS.billItemName, "Item Tagihan");
    assert.ok(template.includes("INVOICE_PDF_LABELS.billItemName"));
    assert.ok(template.includes('data-payment-request-item="true"'));
  });

  it("Kode Booking PNR is not used as the payment-table column", () => {
    const block = template.slice(
      template.indexOf("function CurrentPaymentRequest"),
      template.indexOf("function HeaderCell"),
    );
    assert.ok(!block.includes("INVOICE_PDF_LABELS.bookingPnrCode"));
    assert.ok(!block.includes("primaryTicketPnr"));
    assert.ok(block.includes("primaryBillItemName"));
  });

  it("item value comes from authoritative invoice item description", async () => {
    assert.ok(template.includes("resolveTicketingBillItemName"));
    const data = await buildInvoicePdfData(fixtureTicketingInvoice(), {
      mode: "issued",
      ticketing: fixtureTicketingGroups(),
    });
    const name = resolveTicketingBillItemName({ items: data.items });
    assert.match(name, /^Tiket Pesawat/i);
    assert.ok(!/^INV\//i.test(name));
    assert.ok(name !== data.invoiceNumber);
    assert.ok(name !== data.ticketing?.groups[0]?.pnrCode);
  });
});

describe("FIN-002H raw Ringkasan Transaksi", () => {
  const template = readFileSync(TEMPLATE, "utf8");
  const itinerary = readFileSync(ITINERARY, "utf8");

  it("Ringkasan Transaksi displays PNR", () => {
    const block = buildTicketingRawTransactionBlock({
      ...fixtureTicketingGroups()[0]!,
      pnrCode: "JXHVJY",
      rawItinerary: SAMPLE_RAW,
    });
    assert.equal(block.pnrCode, "JXHVJY");
    assert.ok(template.includes("INVOICE_PDF_LABELS.bookingPnrCode"));
    assert.ok(template.includes('data-summary-line="pnr"'));
    assert.ok(template.includes('data-transaction-summary="raw"'));
  });

  it("raw itinerary lines preserve original order", () => {
    const block = buildTicketingRawTransactionBlock({
      ...fixtureTicketingGroups()[0]!,
      rawItinerary: SAMPLE_RAW,
    });
    assert.deepEqual(block.itineraryLines, SAMPLE_RAW.split("\n"));
    assert.equal(block.itineraryLines[0], "1.C/17-17");
    assert.match(block.itineraryLines[1]!, /ET 629U/);
    assert.match(block.itineraryLines[4]!, /ET 628U/);
  });

  it("raw itinerary line breaks are preserved", () => {
    const block = buildTicketingRawTransactionBlock({
      ...fixtureTicketingGroups()[0]!,
      rawItinerary: SAMPLE_RAW,
    });
    assert.equal(block.itineraryLines.length, 5);
    assert.ok(template.includes("data-raw-itinerary-lines"));
    assert.ok(template.includes('fontFamily: "Courier"'));
  });

  it("parsed city/route summary does not render", () => {
    assert.ok(!template.includes("buildTicketingTransactionSummary"));
    assert.ok(!template.includes("summary.routeSummary"));
    assert.ok(!template.includes("summary.viaLabel"));
    assert.ok(!template.includes("Jakarta–Jeddah"));
    assert.ok(template.includes('data-transaction-summary="raw"'));
  });

  it("flight cards/timeline do not render in the default billing path", () => {
    assert.ok(!itinerary.includes('data-flight-segment="card"'));
    const defaultPage = template.slice(
      0,
      template.indexOf("{includeItinerary ? ("),
    );
    assert.ok(!defaultPage.includes("<FlightItinerary"));
    assert.ok(!defaultPage.includes("data-flight-segment"));
  });

  it("raw GDS content is not modified", () => {
    const block = buildTicketingRawTransactionBlock({
      ...fixtureTicketingGroups()[0]!,
      rawItinerary: SAMPLE_RAW,
    });
    assert.equal(block.rawItinerary, SAMPLE_RAW);
    assert.ok(!block.rawItinerary.includes("Jakarta"));
    assert.ok(!block.rawItinerary.includes("Ethiopian"));
    assert.ok(!block.rawItinerary.includes("Addis"));
  });

  it("normal 4-segment invoice remains structurally one page", async () => {
    const groups = fixtureTicketingFourSegmentRoundTrip();
    groups[0]!.rawItinerary = SAMPLE_RAW;
    const data = await buildInvoicePdfData(fixtureTicketingInvoice(), {
      mode: "issued",
      ticketing: groups,
    });
    const buffer = await renderInvoicePdfBuffer(data);
    const document = await PDFDocument.load(buffer);
    assert.equal(document.getPageCount(), 1);
  });

  it("package invoices remain unchanged", async () => {
    assert.equal(invoiceDocumentTitle("package", "invoice"), "Invoice");
    const data = await buildInvoicePdfData(fixtureShortInvoice(), {
      mode: "issued",
    });
    assert.equal(data.invoiceType, "package");
    assert.equal(data.ticketing, null);
  });
});

describe("FIN-002H editor background parse", () => {
  it("auto-parses raw itinerary when segments are empty", () => {
    const applied = ensureSegmentsFromRawItinerary({
      rawItinerary: SAMPLE_RAW,
      tripType: "round_trip",
      segments: [],
    });
    assert.ok(applied);
    assert.equal(applied!.segments.length, 4);
    assert.equal(applied!.primaryAirlineCode, "ET");
  });

  it("does not reparse when segments already exist", () => {
    const existing = ensureSegmentsFromRawItinerary({
      rawItinerary: SAMPLE_RAW,
      tripType: "round_trip",
      segments: [
        {
          direction: "outbound",
          airlineCode: "GA",
          flightNumber: "100",
          bookingClass: "Y",
          departureAirport: "CGK",
          arrivalAirport: "DPS",
          departureLocalDate: "",
          departureLocalTime: "",
          arrivalLocalDate: "",
          arrivalLocalTime: "",
          arrivalDayOffset: 0,
          status: "",
          rawSegment: "",
        },
      ],
    });
    assert.equal(existing, null);
  });
});
