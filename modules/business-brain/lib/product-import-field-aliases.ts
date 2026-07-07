export const PRODUCT_IMPORT_CANONICAL_KEYS = [
  "PRODUCT_ID",
  "PRODUCT_NAME",
  "COUNTRY",
  "DURATION",
  "DEPARTURE_DATE",
  "YEAR",
  "STARTING_PRICE_ADULT",
  "CHILD_TWIN_PRICE",
  "CHILD_NO_BED_PRICE",
  "EARLY_BIRD",
  "PROMO",
  "AIRLINE",
  "FLIGHT_ROUTE",
  "ROUTE_SHORT",
  "MAIN_HIGHLIGHTS",
  "BEST_FOR",
  "NOT_BEST_FOR",
  "INCLUDED",
  "EXCLUDED",
  "DP_RULE",
  "MIN_PARTICIPANTS",
  "MUSLIM_FRIENDLY_NOTES",
  "SALES_ANGLE",
  "CTA",
  "INTERNAL_NOTES",
] as const;

export type ProductImportCanonicalKey = (typeof PRODUCT_IMPORT_CANONICAL_KEYS)[number];

export const PRODUCT_IMPORT_FIELD_ALIASES: Record<
  ProductImportCanonicalKey,
  readonly string[]
> = {
  PRODUCT_ID: [
    "Product ID",
    "Product Id",
    "ID Produk",
    "Kode Produk",
    "Kode Paket",
    "SKU",
  ],
  PRODUCT_NAME: [
    "Product Name",
    "Nama Produk",
    "Nama Paket",
    "Paket",
    "Package Name",
    "Title",
    "Judul",
    "Nama Tour",
    "Tour Name",
  ],
  COUNTRY: [
    "Country",
    "Negara",
    "Destination Country",
    "Negara Tujuan",
    "Destination",
    "Destinasi",
  ],
  DURATION: [
    "Duration",
    "Durasi",
    "Lama Perjalanan",
    "Trip Duration",
    "Panjang Tour",
  ],
  DEPARTURE_DATE: [
    "Departure Date",
    "Departure",
    "Tanggal Berangkat",
    "Tanggal Keberangkatan",
    "Start Date",
    "Tgl Berangkat",
    "Tanggal Mulai",
  ],
  YEAR: ["Year", "Tahun", "Tahun Keberangkatan"],
  STARTING_PRICE_ADULT: [
    "Starting Price Adult",
    "Starting Price",
    "Harga Dewasa",
    "Harga Mulai",
    "Adult Price",
    "Harga Adult",
    "Price Adult",
  ],
  CHILD_TWIN_PRICE: [
    "Child Twin Price",
    "Child Price Twin",
    "Harga Anak Twin",
    "Harga Anak Ranjang",
    "Child Twin",
  ],
  CHILD_NO_BED_PRICE: [
    "Child No Bed Price",
    "Child Price No Bed",
    "Harga Anak No Bed",
    "Harga Anak Tanpa Ranjang",
    "Child No Bed",
  ],
  EARLY_BIRD: [
    "Early Bird",
    "Early Bird Price",
    "Harga Early Bird",
    "Promo Early Bird",
  ],
  PROMO: ["Promo", "Promo Price", "Harga Promo", "Promotion", "Promosi"],
  AIRLINE: ["Airline", "Maskapai", "Penerbangan", "Carrier"],
  FLIGHT_ROUTE: [
    "Flight Route",
    "Rute Penerbangan",
    "Route",
    "Rute",
    "Flight Path",
  ],
  ROUTE_SHORT: [
    "Route Short",
    "Rute Singkat",
    "Short Route",
    "Ringkasan Rute",
  ],
  MAIN_HIGHLIGHTS: [
    "Main Highlights",
    "Highlights",
    "Highlight Utama",
    "Sorotan",
    "Sorotan Utama",
  ],
  BEST_FOR: ["Best For", "Cocok Untuk", "Ideal For", "Target Market"],
  NOT_BEST_FOR: [
    "Not Best For",
    "Tidak Cocok Untuk",
    "Not Ideal For",
    "Avoid For",
  ],
  INCLUDED: [
    "Included",
    "Termasuk",
    "What's Included",
    "Yang Termasuk",
    "Fasilitas Termasuk",
  ],
  EXCLUDED: [
    "Excluded",
    "Tidak Termasuk",
    "What's Excluded",
    "Yang Tidak Termasuk",
    "Tidak Termasuk Dalam Paket",
  ],
  DP_RULE: [
    "DP Rule",
    "Aturan DP",
    "Down Payment Rule",
    "Uang Muka",
    "Aturan Uang Muka",
    "Deposit Rule",
  ],
  MIN_PARTICIPANTS: [
    "Min Participants",
    "Minimum Participants",
    "Min Peserta",
    "Minimum Peserta",
    "Min Pax",
    "Minimum Pax",
  ],
  MUSLIM_FRIENDLY_NOTES: [
    "Muslim Friendly Notes",
    "Catatan Muslim Friendly",
    "Halal Notes",
    "Catatan Halal",
    "Muslim Friendly",
  ],
  SALES_ANGLE: [
    "Sales Angle",
    "Sudut Penjualan",
    "Pitch",
    "Sales Pitch",
    "Angle Penjualan",
  ],
  CTA: ["CTA", "Call To Action", "Ajakan", "Call to Action"],
  INTERNAL_NOTES: [
    "Internal Notes",
    "Catatan Internal",
    "Catatan Tim",
    "Team Notes",
    "Private Notes",
  ],
};

const KNOWN_KEY_SET = new Set<string>(PRODUCT_IMPORT_CANONICAL_KEYS);

const ALIAS_TO_CANONICAL = new Map<string, ProductImportCanonicalKey>();

for (const canonical of PRODUCT_IMPORT_CANONICAL_KEYS) {
  ALIAS_TO_CANONICAL.set(normalizeFieldKey(canonical), canonical);
  for (const alias of PRODUCT_IMPORT_FIELD_ALIASES[canonical]) {
    ALIAS_TO_CANONICAL.set(normalizeFieldKey(alias), canonical);
  }
}

/** Normalize human-entered field labels to a comparable token (e.g. product-name → PRODUCT_NAME). */
export function normalizeFieldKey(raw: string): string {
  return raw
    .trim()
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .toUpperCase();
}

export function resolveCanonicalFieldKey(
  rawKey: string,
): ProductImportCanonicalKey | null {
  const normalized = normalizeFieldKey(rawKey);
  if (!normalized) return null;

  const fromAlias = ALIAS_TO_CANONICAL.get(normalized);
  if (fromAlias) return fromAlias;

  if (KNOWN_KEY_SET.has(normalized)) {
    return normalized as ProductImportCanonicalKey;
  }

  return null;
}

/** Split a single input line into label + optional inline value. */
export function splitProductImportKeyLine(line: string): {
  rawKey: string;
  inlineValue: string;
} | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const separatorMatch = trimmed.match(/^(.+?)\s*(::|=>|->|=|:|\s-\s)\s*(.*)$/);
  if (separatorMatch) {
    return {
      rawKey: separatorMatch[1].trim(),
      inlineValue: separatorMatch[3].trim(),
    };
  }

  if (resolveCanonicalFieldKey(trimmed)) {
    return { rawKey: trimmed, inlineValue: "" };
  }

  return null;
}
