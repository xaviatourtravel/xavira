type PostgresLikeError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

const TECHNICAL_PATTERNS = [
  "duplicate key",
  "unique constraint",
  "violates",
  "foreign key",
  "pgrst",
  "postgres",
  "sql state",
  "internal server error",
  "row-level security",
  "permission denied",
  "23505",
  "23503",
  "23514",
  "42501",
  "22p02",
  "pgrst116",
];

export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as PostgresLikeError).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return "Unknown error";
}

function extractErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as PostgresLikeError).code;
    if (typeof code === "string") {
      return code.toLowerCase();
    }
  }

  return "";
}

function buildErrorHaystack(error: unknown): string {
  const parts = [extractErrorMessage(error)];

  if (error && typeof error === "object") {
    const record = error as PostgresLikeError;
    if (record.details) {
      parts.push(record.details);
    }
    if (record.hint) {
      parts.push(record.hint);
    }
  }

  return parts.join(" ").toLowerCase();
}

function isAlreadyUserFriendly(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) {
    return false;
  }

  const lower = trimmed.toLowerCase();

  if (TECHNICAL_PATTERNS.some((pattern) => lower.includes(pattern))) {
    return false;
  }

  if (/^[a-z0-9_.-]+$/.test(trimmed) && trimmed.includes("_")) {
    return false;
  }

  return true;
}

function matchesAny(haystack: string, patterns: string[]) {
  return patterns.some((pattern) => haystack.includes(pattern));
}

export function getUserFriendlyErrorMessage(error: unknown): string {
  const raw = extractErrorMessage(error).trim();

  if (raw && isAlreadyUserFriendly(raw)) {
    return raw;
  }

  const haystack = buildErrorHaystack(error);
  const code = extractErrorCode(error);

  if (
    matchesAny(haystack, [
      "leads_organization_phone_active_unique",
      "duplicate phone",
      "duplicate whatsapp",
    ]) ||
    (haystack.includes("duplicate key") &&
      matchesAny(haystack, ["phone", "whatsapp"]))
  ) {
    return "Lead dengan nomor WhatsApp ini sudah terdaftar. Silakan cari lead yang sudah ada atau gunakan nomor lain.";
  }

  if (
    matchesAny(haystack, ["duplicate email", "leads_organization_email"]) ||
    (haystack.includes("duplicate key") && haystack.includes("email"))
  ) {
    return "Lead dengan email ini sudah terdaftar.";
  }

  if (
    matchesAny(haystack, [
      "booking serupa",
      "bookings_organization",
      "booking_code",
    ]) &&
    matchesAny(haystack, ["duplicate key", "unique constraint", "already exists"])
  ) {
    return "Booking serupa sudah ada.";
  }

  if (
    haystack.includes("duplicate key") &&
    haystack.includes("booking")
  ) {
    return "Booking serupa sudah ada.";
  }

  if (
    haystack.includes("passport") &&
    matchesAny(haystack, ["duplicate key", "unique constraint", "already exists"])
  ) {
    return "Nomor paspor ini sudah digunakan oleh peserta lain.";
  }

  if (
    code === "42501" ||
    matchesAny(haystack, [
      "permission denied",
      "row-level security",
      "not authorized",
      "insufficient privilege",
    ])
  ) {
    return "Anda tidak memiliki izin untuk melakukan tindakan ini.";
  }

  if (
    code === "pgrst116" ||
    matchesAny(haystack, ["not found", "no rows", "does not exist"])
  ) {
    return "Data tidak ditemukan.";
  }

  if (
    code === "23503" ||
    matchesAny(haystack, ["foreign key", "violates foreign key"])
  ) {
    return "Data tidak dapat disimpan karena masih terhubung dengan data lain.";
  }

  if (
    code === "23505" ||
    matchesAny(haystack, ["duplicate key", "unique constraint"])
  ) {
    return "Data tidak dapat disimpan. Periksa kembali informasi yang dimasukkan.";
  }

  if (
    code === "23514" ||
    code === "22p02" ||
    matchesAny(haystack, [
      "violates check constraint",
      "invalid input",
      "validation failed",
    ])
  ) {
    return "Data tidak dapat disimpan. Periksa kembali informasi yang dimasukkan.";
  }

  if (
    raw === "500" ||
    matchesAny(haystack, [
      "internal server error",
      "fetch failed",
      "network error",
      "unexpected error",
      "service unavailable",
      "gateway timeout",
    ])
  ) {
    return "Terjadi gangguan sistem. Silakan coba beberapa saat lagi.";
  }

  return "Data tidak dapat disimpan. Periksa kembali informasi yang dimasukkan.";
}
