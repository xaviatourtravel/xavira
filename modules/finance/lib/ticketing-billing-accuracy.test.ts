/**
 * FIN-002E — Ticketing billing-summary data accuracy.
 *
 * - Departure date derives from the earliest outbound flight, never the
 *   invoice issue date, and hides when unavailable.
 * - Due date renders when persisted; absence uses a customer-friendly label.
 * - Round-trip route summary shows journey endpoints only; transit airports
 *   render as "via …" instead of main-route endpoints.
 * - Payment-request labels are always Indonesian.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  buildTicketingTransactionSummary,
  deriveDepartureDateLabel,
} from "@/modules/finance/lib/ticketing-transaction-summary";
import {
  derivePaymentRequestNote,
  localizePaymentRequestNote,
} from "@/modules/finance/types/invoice-payments";
import { buildInvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-data";
import { formatPdfDate } from "@/modules/finance/pdf/invoice-pdf-theme";
import {
  fixtureTicketingGroups,
  fixtureTicketingInvoice,
} from "@/modules/finance/pdf/fixtures/invoice-pdf-fixtures";
import type { InvoiceTicketGroupRecord } from "@/modules/finance/types/ticketing";

const TEMPLATE = path.join(
  process.cwd(),
  "modules/finance/pdf/templates/ticketing.tsx",
);
const SUMMARY_SOURCE = path.join(
  process.cwd(),
  "modules/finance/lib/ticketing-transaction-summary.ts",
);

function group(
  overrides: Partial<InvoiceTicketGroupRecord> = {},
): InvoiceTicketGroupRecord {
  return { ...fixtureTicketingGroups()[0]!, ...overrides };
}

describe("FIN-002E departure date", () => {
  it("derives the departure date from the earliest outbound flight", () => {
    // Fixture: first outbound segment departs 02AUG; group date 2026-08-02.
    const label = deriveDepartureDateLabel(group());
    assert.equal(label, formatPdfDate("2026-08-02"));
  });

  it("uses the outbound segment date even when the group date disagrees", () => {
    // Group date drifted; the segment remains authoritative and no year is
    // invented for the year-less GDS token.
    const label = deriveDepartureDateLabel(group({ departureDate: "2026-09-15" }));
    assert.equal(label, "2 Agu");
  });

  it("renders an ISO outbound segment date fully", () => {
    const base = group();
    base.segments = base.segments.map((segment, index) =>
      index === 0 ? { ...segment, departureLocalDate: "2026-08-02" } : segment,
    );
    assert.equal(deriveDepartureDateLabel(base), formatPdfDate("2026-08-02"));
  });

  it("falls back to the ticket-group departure date when segments have no date", () => {
    const base = group({ departureDate: "2026-08-02" });
    base.segments = base.segments.map((segment) => ({
      ...segment,
      departureLocalDate: null,
    }));
    assert.equal(deriveDepartureDateLabel(base), formatPdfDate("2026-08-02"));
  });

  it("never uses the invoice issue date as the flight departure date", async () => {
    const source = readFileSync(SUMMARY_SOURCE, "utf8");
    assert.ok(!source.includes("issueDate"));
    assert.ok(!source.includes("issue_date"));

    // The invoice issue date differs from every flight date; the summary must
    // not pick it up.
    const invoice = fixtureTicketingInvoice({ issueDate: "2026-07-17" });
    const data = await buildInvoicePdfData(invoice, {
      mode: "issued",
      ticketing: fixtureTicketingGroups(),
    });
    const summary = buildTicketingTransactionSummary(data.ticketing!.groups[0]!);
    assert.notEqual(summary.departureDateLabel, formatPdfDate("2026-07-17"));
    assert.equal(summary.departureDateLabel, formatPdfDate("2026-08-02"));
  });

  it("hides the departure phrase when no flight date is available", () => {
    const base = group({ departureDate: null });
    base.segments = base.segments.map((segment) => ({
      ...segment,
      departureLocalDate: null,
    }));
    const summary = buildTicketingTransactionSummary(base);
    assert.equal(summary.departureDateLabel, null);
    assert.ok(!summary.lines.some((line) => line.includes("Keberangkatan")));
    assert.ok(summary.lines.some((line) => line.includes("17 pax")));
  });
});

describe("FIN-002E due date", () => {
  const template = readFileSync(TEMPLATE, "utf8");

  it("renders the persisted due date when present", async () => {
    const data = await buildInvoicePdfData(
      fixtureTicketingInvoice({ dueDate: "2026-08-01" }),
      { mode: "issued", ticketing: fixtureTicketingGroups() },
    );
    assert.equal(data.dueDate, "2026-08-01");
    assert.match(
      template,
      /format(?:Billing|Due)Date\(data\.dueDate\)/,
    );
  });

  it("absent due date uses a customer-friendly label instead of a dash", () => {
    assert.ok(template.includes("INVOICE_PDF_LABELS.dueDateUnset"));
    assert.ok(
      template.includes("function formatBillingDate") ||
        template.includes("function formatDueDate"),
    );
    assert.ok(!template.includes('formatPdfDate(data.dueDate) : "—"'));
  });
});

describe("FIN-002E route summary", () => {
  it("round-trip main route excludes transit airports", () => {
    const summary = buildTicketingTransactionSummary(group());
    assert.equal(summary.routeSummary, "Jakarta–Jeddah · Jeddah–Jakarta");
    assert.ok(!summary.routeSummary.includes("Addis"));
    assert.ok(!summary.routeSummary.includes("ADD"));
    assert.equal(summary.routeCodes, "CGK–JED · JED–CGK");
  });

  it("transit airport renders separately as via …", () => {
    const summary = buildTicketingTransactionSummary(group());
    assert.equal(summary.viaLabel, "via Addis Ababa");
    assert.ok(summary.lines.includes("via Addis Ababa"));
  });

  it("one-way route shows origin to final destination only", () => {
    const base = group({ tripType: "one_way" });
    base.segments = base.segments.slice(0, 2).map((segment) => ({
      ...segment,
      direction: "outbound" as const,
    }));
    const summary = buildTicketingTransactionSummary(base);
    assert.equal(summary.routeSummary, "Jakarta–Jeddah");
    assert.equal(summary.viaLabel, "via Addis Ababa");
  });

  it("multi-city shows a concise ordered city list", () => {
    const base = group({ tripType: "multi_city" });
    base.segments = base.segments.map((segment) => ({
      ...segment,
      direction: "other" as const,
    }));
    const summary = buildTicketingTransactionSummary(base);
    assert.equal(summary.routeSummary, "Jakarta–Addis Ababa–Jeddah–Addis Ababa–Jakarta");
    assert.equal(summary.viaLabel, null);
  });

  it("no via label when the journey is nonstop", () => {
    const base = group({ tripType: "one_way" });
    base.segments = [
      { ...base.segments[0]!, arrivalAirport: "JED", direction: "outbound" },
    ];
    const summary = buildTicketingTransactionSummary(base);
    assert.equal(summary.routeSummary, "Jakarta–Jeddah");
    assert.equal(summary.viaLabel, null);
  });
});

describe("FIN-002E payment-request localization", () => {
  it("localizes known English values to Indonesian", () => {
    assert.equal(localizePaymentRequestNote("Full Payment"), "Pembayaran penuh");
    assert.equal(localizePaymentRequestNote("DP"), "Uang muka");
    assert.equal(localizePaymentRequestNote("Installment"), "Cicilan");
    assert.equal(localizePaymentRequestNote("Remaining Balance"), "Pelunasan");
  });

  it("keeps custom Indonesian notes unchanged", () => {
    assert.equal(localizePaymentRequestNote("Uang muka 30%"), "Uang muka 30%");
    assert.equal(localizePaymentRequestNote("Pelunasan"), "Pelunasan");
  });

  it("derived labels are always Indonesian", () => {
    const english = /^(Full Payment|DP|Installment|Remaining Balance)$/;
    const cases = [
      { totalMinor: 100, amountPaidMinor: 0, balanceDueMinor: 100 },
      { totalMinor: 100, amountPaidMinor: 40, balanceDueMinor: 60 },
      { totalMinor: 100, amountPaidMinor: 100, balanceDueMinor: 0 },
      {
        paymentRequestNote: "Full Payment",
        totalMinor: 100,
        amountPaidMinor: 0,
        balanceDueMinor: 100,
      },
    ];
    for (const params of cases) {
      assert.ok(!english.test(derivePaymentRequestNote(params)));
    }
    assert.equal(
      derivePaymentRequestNote({
        totalMinor: 100,
        amountPaidMinor: 0,
        balanceDueMinor: 100,
      }),
      "Pembayaran penuh",
    );
    assert.equal(
      derivePaymentRequestNote({
        totalMinor: 100,
        amountPaidMinor: 40,
        balanceDueMinor: 60,
      }),
      "Pelunasan",
    );
    assert.equal(
      derivePaymentRequestNote({
        totalMinor: 100,
        amountPaidMinor: 100,
        balanceDueMinor: 0,
      }),
      "Lunas",
    );
  });

  it("PDF data uses the localized payment-request note", async () => {
    const data = await buildInvoicePdfData(
      fixtureTicketingInvoice({ paymentRequestNote: "Full Payment" }),
      { mode: "issued", ticketing: fixtureTicketingGroups() },
    );
    assert.equal(data.paymentRequestNote, "Pembayaran penuh");
  });
});
