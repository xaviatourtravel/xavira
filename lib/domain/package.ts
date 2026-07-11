/** Canonical travel package entity. */
export type Package = {
  id: string;
  name: string;
  destination: string | null;
  departureDate: string | null;
  durationDays: number | null;
  priceIdr: number | null;
  quota: number | null;
  category: string | null;
};

/** Normalized package row / prompt payload shape. */
export type PackageRow = {
  name: string;
  destination: string | null;
  departure_date: string | null;
  duration_days: number | null;
  price_idr: number | null;
  quota: number | null;
  category?: string | null;
};
