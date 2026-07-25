/**
 * Small, safe, extendable mapping layer for airport and airline codes.
 *
 * Authoritative source of truth is always the stored 3-letter airport code
 * and 2–3 char airline code. This directory only enriches display: friendly
 * names appear when known; unknown codes fall back to the code itself and
 * never block invoice creation. No paid external API is required for MVP.
 */

export type AirportInfo = {
  /** IATA code, always 3 uppercase letters. */
  code: string;
  /** City / metropolitan name (e.g. "Jakarta"). */
  city: string;
  /** Optional airport proper name (e.g. "Soekarno-Hatta"). */
  airportName?: string;
};

/** Extend freely — additions are display-only and cannot break parsing. */
export const AIRPORT_DIRECTORY: Record<string, AirportInfo> = {
  CGK: { code: "CGK", city: "Jakarta", airportName: "Soekarno-Hatta" },
  HLP: { code: "HLP", city: "Jakarta", airportName: "Halim Perdanakusuma" },
  SUB: { code: "SUB", city: "Surabaya", airportName: "Juanda" },
  DPS: { code: "DPS", city: "Denpasar", airportName: "Ngurah Rai" },
  UPG: { code: "UPG", city: "Makassar", airportName: "Sultan Hasanuddin" },
  MES: { code: "MES", city: "Medan" },
  KNO: { code: "KNO", city: "Medan", airportName: "Kualanamu" },
  BTH: { code: "BTH", city: "Batam", airportName: "Hang Nadim" },
  PDG: { code: "PDG", city: "Padang", airportName: "Minangkabau" },
  BPN: { code: "BPN", city: "Balikpapan", airportName: "Sultan Aji Muhammad Sulaiman" },
  ADD: { code: "ADD", city: "Addis Ababa", airportName: "Bole" },
  JED: { code: "JED", city: "Jeddah", airportName: "King Abdulaziz" },
  MED: { code: "MED", city: "Madinah", airportName: "Prince Mohammad bin Abdulaziz" },
  RUH: { code: "RUH", city: "Riyadh", airportName: "King Khalid" },
  DXB: { code: "DXB", city: "Dubai" },
  AUH: { code: "AUH", city: "Abu Dhabi" },
  DOH: { code: "DOH", city: "Doha", airportName: "Hamad" },
  IST: { code: "IST", city: "Istanbul" },
  KUL: { code: "KUL", city: "Kuala Lumpur" },
  SIN: { code: "SIN", city: "Singapore", airportName: "Changi" },
  CAI: { code: "CAI", city: "Cairo" },
  AMM: { code: "AMM", city: "Amman" },
  JFK: { code: "JFK", city: "New York", airportName: "John F. Kennedy" },
  LHR: { code: "LHR", city: "London", airportName: "Heathrow" },
};

/** Extend freely — additions are display-only. */
export const AIRLINE_DIRECTORY: Record<string, string> = {
  ET: "Ethiopian Airlines",
  GA: "Garuda Indonesia",
  QG: "Citilink",
  JT: "Lion Air",
  ID: "Batik Air",
  QZ: "AirAsia Indonesia",
  SV: "Saudia",
  SG: "SpiceJet",
  EK: "Emirates",
  QR: "Qatar Airways",
  EY: "Etihad Airways",
  TK: "Turkish Airlines",
  MS: "EgyptAir",
  RJ: "Royal Jordanian",
  MH: "Malaysia Airlines",
  SQ: "Singapore Airlines",
  CX: "Cathay Pacific",
  "6E": "IndiGo",
};

/** Normalize an airport code to a safe display value. Never throws. */
export function normalizeAirportCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : null;
}

/** Normalize an airline code (2–3 alphanumeric, at least one letter). */
export function normalizeAirlineCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  if (!/^[A-Z0-9]{2,3}$/.test(code) || !/[A-Z]/.test(code)) return null;
  return code;
}

export type AirportDisplay = {
  code: string;
  city: string | null;
  airportName: string | null;
  /** City when known, else the raw code. Always non-empty. */
  primary: string;
};

/** Resolve display for an airport code; unknown codes fall back to the code. */
export function resolveAirportDisplay(raw: string | null | undefined): AirportDisplay {
  const code = normalizeAirportCode(raw) ?? (raw ?? "").trim().toUpperCase();
  const info = AIRPORT_DIRECTORY[code];
  return {
    code,
    city: info?.city ?? null,
    airportName: info?.airportName ?? null,
    primary: info?.city ?? code,
  };
}

/** Resolve an airline display name; unknown codes fall back to the code. */
export function resolveAirlineName(raw: string | null | undefined): string {
  const code = normalizeAirlineCode(raw) ?? (raw ?? "").trim().toUpperCase();
  return AIRLINE_DIRECTORY[code] ?? code;
}

/** True when the airport code is a known, mapped entry. */
export function isKnownAirport(raw: string | null | undefined): boolean {
  const code = normalizeAirportCode(raw);
  return code != null && code in AIRPORT_DIRECTORY;
}

/** True when the airline code is a known, mapped entry. */
export function isKnownAirline(raw: string | null | undefined): boolean {
  const code = normalizeAirlineCode(raw);
  return code != null && code in AIRLINE_DIRECTORY;
}
