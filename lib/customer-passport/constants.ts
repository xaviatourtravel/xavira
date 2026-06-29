import type { PassportJourneyStage, TravelStyle } from "@/lib/customer-passport/types";

export const PASSPORT_JOURNEY_STAGES: PassportJourneyStage[] = [
  "awareness",
  "interest",
  "planning",
  "quotation",
  "negotiation",
  "dp",
  "trip",
  "review",
  "repeat",
];

export const PASSPORT_JOURNEY_LABELS: Record<PassportJourneyStage, string> = {
  awareness: "Awareness",
  interest: "Interest",
  planning: "Planning",
  quotation: "Quotation",
  negotiation: "Negotiation",
  dp: "DP",
  trip: "Trip",
  review: "Review",
  repeat: "Repeat",
};

export const TRAVEL_STYLE_LABELS: Record<TravelStyle, string> = {
  family: "Family",
  solo: "Solo",
  corporate: "Corporate",
  luxury: "Luxury",
  budget: "Budget",
};

export const PASSPORT_TIMELINE_KIND_LABELS: Record<
  import("@/lib/customer-passport/types").PassportTimelineKind,
  string
> = {
  message: "Message",
  booking: "Booking",
  invoice: "Invoice",
  payment: "Payment",
  note: "Note",
  task: "Task",
  assignment: "Assignment",
  system: "System",
};
