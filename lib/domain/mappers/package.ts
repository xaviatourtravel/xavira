import type { Package, PackageRow } from "../package";

export function mapPackageFromRow(row: PackageRow, id = "package"): Package {
  return {
    id,
    name: row.name,
    destination: row.destination,
    departureDate: row.departure_date,
    durationDays: row.duration_days,
    priceIdr: row.price_idr,
    quota: row.quota,
    category: row.category ?? null,
  };
}
