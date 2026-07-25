/**
 * FIN-002B — Ticketing draft validation & parser state fix.
 *
 * Proves:
 * - primary airline normalization (ET, et, "ET 629", full names)
 * - parser prefills the primary airline from the first valid segment
 * - parsed segments flow into the authoritative submit payload
 * - the save payload passes the create schema with all 4 sample segments
 * - save-before-parse guard returns friendly Indonesian messages
 * - raw Zod issue arrays are never surfaced to the browser
 * - edit mode rehydrates saved segments
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { ZodError } from "zod";

import { financeUiEn, financeUiId } from "@/lib/i18n/finance-dictionary";
import {
  applyParsedItinerary,
  editableSegmentsToTicketPayload,
  normalizePrimaryAirlineInput,
  ticketingSaveGuard,
} from "@/modules/finance/lib/ticketing-editor-state";
import {
  formatTicketingValidationError,
  looksLikeRawZodIssues,
} from "@/modules/finance/lib/ticketing-validation-messages";
import { createTicketingDraftSchema } from "@/modules/finance/schemas/ticketing";

const SAMPLE_ITINERARY = [
  "1 ET 629U 02AUG S CGKADD GN17 2035 0600 03AUG",
  "2 ET 462U 03AUG M ADDJED GN17 1100 1330 /E",
  "3 ET 463U 10AUG M JEDADD GN17 1520 1750 /E",
  "4 ET 628U 10AUG M ADDCGK GN17 2355 1730 11AUG",
].join("\n");

// 1. + 2. IATA codes are accepted and normalized

test("airline input: ET is accepted as-is", () => {
  assert.deepEqual(normalizePrimaryAirlineInput("ET"), {
    code: "ET",
    valid: true,
  });
  for (const code of ["GA", "SQ", "SV", "EK", "QR"]) {
    assert.equal(normalizePrimaryAirlineInput(code).code, code);
  }
});

test("airline input: lowercase et normalizes to ET", () => {
  assert.deepEqual(normalizePrimaryAirlineInput("et"), {
    code: "ET",
    valid: true,
  });
  assert.deepEqual(normalizePrimaryAirlineInput("  et  "), {
    code: "ET",
    valid: true,
  });
});

// 3. Carrier + flight number extracts the carrier when unambiguous

test("airline input: 'ET 629' and 'ET629' extract ET", () => {
  assert.equal(normalizePrimaryAirlineInput("ET 629").code, "ET");
  assert.equal(normalizePrimaryAirlineInput("ET629").code, "ET");
  assert.equal(normalizePrimaryAirlineInput("ET 629U").code, "ET");
  assert.equal(normalizePrimaryAirlineInput("et 629").code, "ET");
});

// 4. Full airline names are never silently converted

test("airline input: full airline name is rejected, not converted", () => {
  const result = normalizePrimaryAirlineInput("Ethiopian Airlines");
  assert.equal(result.valid, false);
  assert.equal(result.code, null);
  assert.equal(normalizePrimaryAirlineInput("Garuda").valid, false);
});

test("airline input: empty is allowed (optional field)", () => {
  assert.deepEqual(normalizePrimaryAirlineInput(""), { code: null, valid: true });
  assert.deepEqual(normalizePrimaryAirlineInput("   "), {
    code: null,
    valid: true,
  });
  assert.deepEqual(normalizePrimaryAirlineInput(null), {
    code: null,
    valid: true,
  });
});

// 5. Parser prefills primary airline from the first valid segment

test("parser prefills primaryAirlineCode ET from sample itinerary", () => {
  const applied = applyParsedItinerary({
    rawItinerary: SAMPLE_ITINERARY,
    tripType: "round_trip",
    currentPrimaryAirline: "",
  });
  assert.equal(applied.primaryAirlineCode, "ET");
});

test("parser keeps an existing valid primary airline over the derived one", () => {
  const applied = applyParsedItinerary({
    rawItinerary: SAMPLE_ITINERARY,
    tripType: "round_trip",
    currentPrimaryAirline: "GA",
  });
  assert.equal(applied.primaryAirlineCode, "GA");
});

// 6. Parsed segments enter the submit (payload) state

test("parsed segments enter submit state with 4 editable rows", () => {
  const applied = applyParsedItinerary({
    rawItinerary: SAMPLE_ITINERARY,
    tripType: "round_trip",
  });
  assert.equal(applied.segments.length, 4);
  assert.deepEqual(
    applied.segments.map((s) => s.airlineCode),
    ["ET", "ET", "ET", "ET"],
  );
  assert.deepEqual(
    applied.segments.map((s) => s.flightNumber),
    ["629", "462", "463", "628"],
  );
  assert.deepEqual(
    applied.segments.map((s) => `${s.departureAirport}-${s.arrivalAirport}`),
    ["CGK-ADD", "ADD-JED", "JED-ADD", "ADD-CGK"],
  );
});

// 7. The save payload contains all 4 sample segments and passes the schema

test("save payload with parsed segments passes createTicketingDraftSchema", () => {
  const applied = applyParsedItinerary({
    rawItinerary: SAMPLE_ITINERARY,
    tripType: "round_trip",
  });
  const payload = {
    recipientSource: "manual" as const,
    manualRecipientName: "Bapak Ahmad",
    documentType: "invoice" as const,
    currency: "IDR",
    ticketGroup: {
      pnrCode: "ABC123",
      passengerCount: 17,
      tripType: "round_trip" as const,
      primaryAirlineCode: applied.primaryAirlineCode,
      rawItinerary: SAMPLE_ITINERARY,
      sortOrder: 0,
      segments: editableSegmentsToTicketPayload(applied.segments),
    },
    pricing: {
      pricePerPassengerMinor: 14_300_000_00,
      serviceFeeMinor: 0,
      taxesAndFeesMinor: 0,
      discountMinor: 0,
      amountPaidMinor: 0,
    },
  };

  const parsed = createTicketingDraftSchema.parse(payload);
  assert.equal(parsed.ticketGroup.segments.length, 4);
  assert.equal(parsed.ticketGroup.primaryAirlineCode, "ET");
  assert.deepEqual(
    parsed.ticketGroup.segments.map((s) => s.segmentOrder),
    [0, 1, 2, 3],
  );
});

// 8. + 9. Save guard produces friendly Indonesian messages

test("raw itinerary without parse blocks save with parse-first message", () => {
  const guard = ticketingSaveGuard({
    pnrCode: "ABC123",
    passengerCount: 17,
    segmentCount: 0,
    rawItinerary: SAMPLE_ITINERARY,
    primaryAirline: "ET",
  });
  assert.equal(guard, "parseFirst");
  assert.equal(
    financeUiId.errParseFirst,
    "Klik Parse itinerary terlebih dahulu atau tambahkan minimal satu segmen.",
  );
});

test("empty itinerary and empty segments show add-segment message", () => {
  const guard = ticketingSaveGuard({
    pnrCode: "ABC123",
    passengerCount: 1,
    segmentCount: 0,
    rawItinerary: "",
    primaryAirline: "",
  });
  assert.equal(guard, "addSegment");
  assert.equal(
    financeUiId.errAddSegment,
    "Tambahkan minimal satu segmen penerbangan.",
  );
});

test("save guard flags invalid airline and missing PNR with field messages", () => {
  assert.equal(
    ticketingSaveGuard({
      pnrCode: "ABC123",
      passengerCount: 1,
      segmentCount: 4,
      rawItinerary: SAMPLE_ITINERARY,
      primaryAirline: "Ethiopian Airlines",
    }),
    "airlineInvalid",
  );
  assert.equal(
    ticketingSaveGuard({
      pnrCode: "",
      passengerCount: 1,
      segmentCount: 4,
      rawItinerary: SAMPLE_ITINERARY,
      primaryAirline: "ET",
    }),
    "pnrRequired",
  );
  assert.equal(financeUiId.errAirlineInvalid.includes("Kode maskapai"), true);
  assert.equal(financeUiId.errPnrRequired, "Masukkan kode PNR.");
  assert.equal(financeUiId.errPaxMin, "Jumlah penumpang minimal 1.");
  // English locale must have all guard keys too.
  for (const key of [
    "errParseFirst",
    "errAddSegment",
    "errAirlineInvalid",
    "errPnrRequired",
    "errPaxMin",
    "errTicketingGeneric",
    "primaryAirlineCode",
    "airlineCodeExample",
  ] as const) {
    assert.ok(financeUiEn[key], `missing en key ${key}`);
    assert.ok(financeUiId[key], `missing id key ${key}`);
  }
});

test("guard passes with valid form state", () => {
  assert.equal(
    ticketingSaveGuard({
      pnrCode: "ABC123",
      passengerCount: 17,
      segmentCount: 4,
      rawItinerary: SAMPLE_ITINERARY,
      primaryAirline: "ET",
    }),
    null,
  );
});

// 10. Raw Zod issue arrays are never rendered

test("ZodError maps to friendly Indonesian field messages, not raw issues", () => {
  const invalid = {
    recipientSource: "manual",
    manualRecipientName: "Bapak Ahmad",
    ticketGroup: {
      pnrCode: "ABC123",
      passengerCount: 17,
      tripType: "round_trip",
      primaryAirlineCode: "ETHIOPIAN AIRLINES",
      segments: [],
    },
    pricing: { pricePerPassengerMinor: 0 },
  };
  let caught: unknown;
  try {
    createTicketingDraftSchema.parse(invalid);
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof ZodError);

  const message = formatTicketingValidationError(caught);
  assert.ok(!message.trim().startsWith("["), "must not be a JSON array");
  assert.ok(!message.includes('"code"'), "must not leak issue objects");
  assert.ok(
    message.includes("Kode maskapai tidak valid. Gunakan 2 karakter, misalnya ET."),
  );
  assert.ok(message.includes("Tambahkan minimal satu segmen penerbangan."));
});

test("stringified Zod issue arrays are detected and replaced", () => {
  const observed = JSON.stringify([
    {
      validation: "regex",
      code: "invalid_string",
      message: "Airline code is invalid",
      path: ["ticketGroup", "primaryAirlineCode"],
    },
  ]);
  assert.equal(looksLikeRawZodIssues(observed), true);
  assert.equal(looksLikeRawZodIssues("Masukkan kode PNR."), false);

  const formatted = formatTicketingValidationError(new Error(observed));
  assert.ok(!formatted.trim().startsWith("["));
});

test("ticketing actions route errors through the friendly formatter", () => {
  const source = readFileSync(
    path.join(process.cwd(), "modules/finance/actions/ticketing-actions.ts"),
    "utf8",
  );
  assert.ok(source.includes("formatTicketingValidationError(error)"));
  assert.ok(!source.includes("error instanceof Error ? error.message"));
});

test("editor sanitizes raw Zod arrays and submits through the save guard", () => {
  const source = readFileSync(
    path.join(
      process.cwd(),
      "modules/finance/components/ticketing-invoice-editor.tsx",
    ),
    "utf8",
  );
  assert.ok(source.includes("looksLikeRawZodIssues(errorMessage)"));
  assert.ok(source.includes("ticketingSaveGuard("));
  assert.ok(source.includes("applyParsedItinerary("));
  assert.ok(source.includes("editableSegmentsToTicketPayload(segments)"));
  // Single authoritative segment state: parse writes into `segments`.
  assert.ok(source.includes("setSegments(applied.segments)"));
});

// 11. Edit mode rehydrates saved segments

test("edit page rehydrates saved segments into editor initial state", () => {
  const editPage = readFileSync(
    path.join(
      process.cwd(),
      "app/(dashboard)/finance/invoices/[id]/edit/page.tsx",
    ),
    "utf8",
  );
  assert.ok(editPage.includes("group?.segments.map"));

  const editor = readFileSync(
    path.join(
      process.cwd(),
      "modules/finance/components/ticketing-invoice-editor.tsx",
    ),
    "utf8",
  );
  assert.ok(editor.includes("initial?.segments?.length ? initial.segments : []"));
});
