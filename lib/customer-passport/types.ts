export type PassportEntityType = "lead" | "prospect";

export type PassportJourneyStage =
  | "awareness"
  | "interest"
  | "planning"
  | "quotation"
  | "negotiation"
  | "dp"
  | "trip"
  | "review"
  | "repeat";

export type TravelStyle =
  | "family"
  | "solo"
  | "corporate"
  | "luxury"
  | "budget";

export type PassportTimelineKind =
  | "message"
  | "booking"
  | "invoice"
  | "payment"
  | "note"
  | "task"
  | "assignment"
  | "system";

export type CustomerPassportIdentity = {
  avatarUrl: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  country: string | null;
  language: string | null;
};

export type CustomerPassportRelationship = {
  ownerId: string | null;
  ownerName: string | null;
  relationshipScore: number | null;
  relationshipLabel: string | null;
  firstContactAt: string | null;
  lastInteractionAt: string | null;
  avgResponseTimeMinutes: number | null;
};

export type CustomerPassportJourney = {
  currentStage: PassportJourneyStage;
  stages: Array<{
    stage: PassportJourneyStage;
    reached: boolean;
    current: boolean;
  }>;
};

export type CustomerPassportTravel = {
  visitedDestinations: string[];
  wishlist: string[];
  upcomingTrips: Array<{
    id: string;
    label: string;
    departureDate: string | null;
    status: string;
  }>;
  travelStyles: TravelStyle[];
};

export type CustomerPassportPreferences = {
  halalPriority: boolean | null;
  seatPreference: string | null;
  hotelPreference: string | null;
  roomType: string | null;
  specialRequests: string | null;
};

export type CustomerPassportCommercial = {
  lifetimeRevenueIdr: number;
  bookingCount: number;
  invoiceCount: number;
  outstandingPaymentIdr: number;
};

export type PassportMemoryItem = {
  id: string;
  kind: "ai" | "pinned" | "travel";
  label: string;
  detail: string;
  createdAt: string | null;
};

export type CustomerPassportMemory = {
  aiMemories: PassportMemoryItem[];
  pinnedFacts: PassportMemoryItem[];
  travelHistory: PassportMemoryItem[];
};

export type PassportTimelineEntry = {
  id: string;
  kind: PassportTimelineKind;
  label: string;
  detail?: string;
  timestamp: string;
  channel?: string | null;
};

export type CustomerPassport = {
  id: string;
  entityType: PassportEntityType;
  leadId: string | null;
  conversationId: string | null;
  identity: CustomerPassportIdentity;
  relationship: CustomerPassportRelationship;
  journey: CustomerPassportJourney;
  travel: CustomerPassportTravel;
  preferences: CustomerPassportPreferences;
  commercial: CustomerPassportCommercial;
  memory: CustomerPassportMemory;
  timeline: PassportTimelineEntry[];
};

export type CustomerPassportVariant = "compact" | "full";
