/**
 * Friendly, field-level validation messages for ticketing draft actions.
 *
 * Raw Zod issue arrays must never reach the browser — they leak schema
 * internals and render as JSON. Detailed issues stay in server logs only.
 */

import { ZodError } from "zod";

const FIELD_MESSAGES: Array<{ match: RegExp; message: string }> = [
  {
    match: /primaryAirlineCode/,
    message: "Kode maskapai tidak valid. Gunakan 2 karakter, misalnya ET.",
  },
  {
    match: /segments/,
    message: "Tambahkan minimal satu segmen penerbangan.",
  },
  {
    match: /pnrCode/,
    message: "Masukkan kode PNR.",
  },
  {
    match: /passengerCount/,
    message: "Jumlah penumpang minimal 1.",
  },
  {
    match: /manualRecipientName/,
    message: "Masukkan nama penerima.",
  },
  {
    match: /customerId/,
    message: "Pilih customer terlebih dahulu.",
  },
  {
    match: /pricePerPassenger/,
    message: "Harga per penumpang tidak valid.",
  },
  {
    match: /departureAirport|arrivalAirport/,
    message: "Kode bandara harus tiga huruf, misalnya CGK.",
  },
  {
    match: /airlineCode/,
    message: "Kode maskapai segmen tidak valid.",
  },
  {
    match: /flightNumber/,
    message: "Nomor penerbangan wajib diisi.",
  },
];

const GENERIC_MESSAGE = "Data tiket belum valid. Periksa kembali formulir.";

/** True when a string looks like a serialized Zod issue array. */
export function looksLikeRawZodIssues(message: string): boolean {
  const trimmed = message.trim();
  return (
    trimmed.startsWith("[") &&
    /"(code|path|validation|message)"\s*:/.test(trimmed)
  );
}

/**
 * Map a ticketing action failure to a short Indonesian message.
 * Never returns serialized issue arrays or stack traces.
 */
export function formatTicketingValidationError(error: unknown): string {
  if (error instanceof ZodError) {
    const seen = new Set<string>();
    const messages: string[] = [];
    for (const issue of error.issues) {
      const path = issue.path.join(".");
      const mapped = FIELD_MESSAGES.find((entry) => entry.match.test(path));
      const message = mapped?.message ?? null;
      if (message && !seen.has(message)) {
        seen.add(message);
        messages.push(message);
      }
    }
    return messages.length > 0 ? messages.join(" ") : GENERIC_MESSAGE;
  }

  if (error instanceof Error && error.message) {
    // A ZodError stringified upstream must still not leak raw issues.
    if (looksLikeRawZodIssues(error.message)) {
      return GENERIC_MESSAGE;
    }
    return error.message;
  }

  return GENERIC_MESSAGE;
}
