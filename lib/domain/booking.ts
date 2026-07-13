export type BookingStatus =
  | "none"
  | "draft"
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "cancelled";

/** Canonical booking entity. */
export type Booking = {
  id: string;
  code: string | null;
  status: BookingStatus;
  packageName: string | null;
  destination: string | null;
  departureDate: string | null;
  travelerCount: number | null;
  budgetIdr: number | null;
  paymentStatus: string | null;
};

/** Normalized booking row shape from CRM tables. */
export type BookingRow = {
  id: string;
  booking_code: string | null;
  package_name: string | null;
  departure_date: string | null;
  total_pax: number | null;
  payment_status: string | null;
  booking_status: string | null;
};

/** Read-model snapshot for context panel booking preview. */
export type BookingSnapshot = {
  status: string;
  departure: string;
  destination: string;
  travelers: string;
  budget: string;
};
