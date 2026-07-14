/** Integer minor-unit money helpers. For IDR, 1 major = 1 minor (no cents). */

export function assertNonNegativeMinor(value: number, label: string): number {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer minor unit`);
  }
  if (value < 0) {
    throw new Error(`${label} cannot be negative`);
  }
  return value;
}

export function assertNonNegativeInteger(value: number, label: string): number {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }
  if (value < 0) {
    throw new Error(`${label} cannot be negative`);
  }
  return value;
}

/** Safe multiply-then-round for quantity × unit price → integer minor units. */
export function multiplyQuantityPrice(
  quantity: number,
  unitPriceMinor: number,
): number {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("quantity must be a positive number");
  }
  assertNonNegativeMinor(unitPriceMinor, "unit_price_minor");

  // Multiply in integer space when quantity is an integer; otherwise use
  // half-up rounding of decimal product (still rejecting float money inputs).
  const scaled = quantity * unitPriceMinor;
  const rounded = Math.round(scaled);
  if (!Number.isSafeInteger(rounded)) {
    throw new Error("line total exceeds safe integer range");
  }
  return rounded;
}

const LEGAL_ENTITY_PREFIXES = new Set([
  "PT",
  "CV",
  "UD",
  "FA",
  "NV",
  "LTD",
  "LLC",
  "INC",
  "CORP",
  "CO",
  "TBK",
  "PERSERO",
]);

const NAME_STOP_WORDS = new Set([
  "AND",
  "DAN",
  "OR",
  "ATAU",
  "OF",
  "THE",
  "YANG",
  "FOR",
  "A",
  "AN",
]);

/**
 * Normalize a user-entered invoice prefix.
 * Uppercase alphanumerics only; empty → null.
 */
export function normalizeInvoicePrefix(
  input: string | null | undefined,
): string | null {
  if (input == null) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const normalized = trimmed.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!normalized) return null;
  return normalized;
}

/** Validate raw prefix input; reject slash and punctuation explicitly. */
export function parseInvoicePrefixInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Invoice prefix is required");
  }
  if (/[^A-Za-z0-9]/.test(trimmed)) {
    throw new Error("Invoice prefix may only contain letters and numbers");
  }
  const normalized = trimmed.toUpperCase();
  if (normalized.length < 2 || normalized.length > 10) {
    throw new Error("Invoice prefix must be 2–10 characters");
  }
  return normalized;
}

/**
 * Deterministic short code from organization name.
 * Never uses slug/UUID. Max 10 chars. Never empty.
 */
export function deriveInvoicePrefixFromOrganizationName(
  name: string | null | undefined,
): string {
  const raw = (name ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  if (!raw) return "ORG";

  let tokens = raw.split(" ").filter(Boolean);
  const hasLegal = tokens.length > 0 && LEGAL_ENTITY_PREFIXES.has(tokens[0]!);
  if (hasLegal) {
    tokens = tokens.slice(1);
  }

  const meaningful = tokens.filter((token) => !NAME_STOP_WORDS.has(token));
  if (meaningful.length === 0) return "ORG";

  if (hasLegal) {
    if (meaningful.length === 1) {
      const word = meaningful[0]!.slice(0, 10);
      return word.length >= 2 ? word : "ORG";
    }
    const initials = meaningful
      .map((token) => token[0]!)
      .join("")
      .slice(0, 10);
    return initials.length >= 2 ? initials : "ORG";
  }

  const first = meaningful[0]!.slice(0, 10);
  if (first.length >= 2) return first;

  const initials = meaningful
    .map((token) => token[0]!)
    .join("")
    .slice(0, 10);
  return initials.length >= 2 ? initials : "ORG";
}

/**
 * Resolve number code for INV/{CODE}/{YEAR}/{SEQ}.
 * Priority: configured prefix → org name → ORG.
 * Never accepts caller-supplied code at issue time.
 */
export function resolveInvoiceNumberCode(params: {
  configuredPrefix?: string | null;
  organizationName?: string | null;
}): string {
  try {
    if (params.configuredPrefix) {
      return parseInvoicePrefixInput(params.configuredPrefix);
    }
  } catch {
    // fall through to name / ORG
  }
  return deriveInvoicePrefixFromOrganizationName(params.organizationName);
}

export function formatInvoiceNumber(params: {
  workspaceCode: string;
  year: number;
  sequence: number;
}): string {
  const code =
    params.workspaceCode.replace(/[^A-Z0-9]/gi, "").toUpperCase() || "ORG";
  const padded = String(params.sequence).padStart(4, "0");
  return `INV/${code}/${params.year}/${padded}`;
}

/** @deprecated Prefer resolveInvoiceNumberCode / org name fallback. */
export function workspaceCodeFromSlug(slug: string): string {
  return slug.replace(/-/g, "").toUpperCase() || "ORG";
}

export function formatMinorAsIdr(minor: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(minor);
}

/**
 * Display integer minor units with Indonesian thousand separators (no currency symbol).
 * Example: 2400000 → "2.400.000"
 */
export function formatIdrGrouped(minor: number): string {
  if (!Number.isInteger(minor) || minor < 0) {
    throw new Error("minor must be a non-negative integer");
  }
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(minor);
}

/**
 * Parse a money input string into integer minor units.
 * Strips non-digits, removes leading zeroes, rejects negatives.
 * Empty / whitespace → null (allowed while editing).
 */
export function parseIdrInputToMinor(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (/[-]/.test(trimmed)) {
    throw new Error("amount cannot be negative");
  }
  // Allow Indonesian grouping dots and spaces; reject other letters
  if (/[^\d.\s]/.test(trimmed)) {
    throw new Error("amount contains invalid characters");
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits === "") return null;
  const normalized = digits.replace(/^0+(?=\d)/, "");
  if (!/^\d+$/.test(normalized)) {
    throw new Error("amount is invalid");
  }
  const value = Number(normalized);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error("amount is out of range");
  }
  return value;
}

/** Normalize digit strings like "02400000" → "2400000" (keep single "0"). */
export function normalizeIdrDigitString(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") return "";
  return digits.replace(/^0+(?=\d)/, "");
}
