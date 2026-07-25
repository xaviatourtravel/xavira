export const TICKET_TRIP_TYPES = ["one_way", "round_trip", "multi_city"] as const;
export type TicketTripType = (typeof TICKET_TRIP_TYPES)[number];

export const FLIGHT_DIRECTIONS = ["outbound", "return", "other"] as const;
export type FlightDirection = (typeof FLIGHT_DIRECTIONS)[number];

export const INVOICE_TYPES = ["package", "ticketing"] as const;
export type InvoiceType = (typeof INVOICE_TYPES)[number];

export const INVOICE_DOCUMENT_TYPES = ["invoice", "proforma"] as const;
export type InvoiceDocumentType = (typeof INVOICE_DOCUMENT_TYPES)[number];

export type InvoiceFlightSegmentRecord = {
  id: string;
  organizationId: string;
  ticketGroupId: string;
  invoiceId: string;
  direction: FlightDirection;
  segmentOrder: number;
  airlineCode: string;
  flightNumber: string;
  bookingClass: string | null;
  departureAirport: string;
  arrivalAirport: string;
  departureLocalDate: string | null;
  departureLocalTime: string | null;
  arrivalLocalDate: string | null;
  arrivalLocalTime: string | null;
  arrivalDayOffset: number;
  status: string | null;
  rawSegment: string | null;
};

export type InvoiceTicketGroupRecord = {
  id: string;
  organizationId: string;
  invoiceId: string;
  pnrCode: string;
  passengerCount: number;
  tripType: TicketTripType;
  primaryAirlineCode: string | null;
  departureDate: string | null;
  returnDate: string | null;
  rawItinerary: string | null;
  sortOrder: number;
  segments: InvoiceFlightSegmentRecord[];
};

export type InvoiceTicketingData = {
  groups: InvoiceTicketGroupRecord[];
};
