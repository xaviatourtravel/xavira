/**
 * Parse Indonesian / international currency strings into integer IDR amounts.
 * Strips currency labels and grouping separators before converting to number.
 */
export function parseCurrency(value: string | number | null | undefined): number | null {
  if (value == null) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  const cleaned = trimmed
    .replace(/rp/gi, "")
    .replace(/idr/gi, "")
    .replace(/[^\d]/g, "");

  return cleaned ? Number(cleaned) : null;
}

/** Display IDR amounts in preview (e.g. Rp24.200.000) */
export function formatIdrCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  const amount = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value);
  return `Rp${amount}`;
}

/** Format for optional text fields (early bird, promo) */
export function formatIdrAmount(value: number | null | undefined): string {
  if (value == null) return "";
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value);
}
