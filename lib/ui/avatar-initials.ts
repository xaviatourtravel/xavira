/**
 * SSR-safe avatar initials. Strips emoji/symbols so server and client match.
 */
export function getSafeInitials(name?: string | null) {
  const value = (name ?? "").trim().replace(/^@/, "");

  const cleaned = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim();

  const parts = cleaned.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  const first = parts[0]?.charAt(0) ?? "";
  const second = parts.length > 1 ? (parts[1]?.charAt(0) ?? "") : "";

  return `${first}${second}`.toUpperCase() || "?";
}
