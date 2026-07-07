export type ParsedProductImport = {
  productId: string | null;
  name: string | null;
  country: string | null;
  duration: string | null;
  departureDate: string | null;
  year: string | null;
  pricing: {
    adult: number | null;
    childTwin: number | null;
    childNoBed: number | null;
    earlyBird: number | null;
    promo: number | null;
  };
  airline: string | null;
  flightRoute: string | null;
  routeShort: string | null;
  highlights: string[];
  bestFor: string | null;
  notBestFor: string | null;
  included: string[];
  excluded: string[];
  dpRule: string | null;
  minParticipants: string | null;
  muslimFriendlyNotes: string | null;
  salesAngle: string | null;
  cta: string | null;
  internalNotes: string | null;
  unknownFields: Array<{ key: string; value: string }>;
};

export type ProductImportWarningKey =
  | "missingProductName"
  | "missingDestination"
  | "missingStartingPrice"
  | "missingDepartureDate"
  | "unknownField";
