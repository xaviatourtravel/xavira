export type BookingWorkspaceStatus =
  | "draft"
  | "pending_payment"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type PassengerReadinessStatus =
  | "complete"
  | "waiting_passport"
  | "waiting_payment"
  | "need_visa";

export type DocumentStatus = "missing" | "pending" | "received" | "verified";

export type TripStepState = "completed" | "current" | "pending";

export type BookingActivityType =
  | "payment"
  | "status_change"
  | "assignment"
  | "document"
  | "note"
  | "system";

export type BookingStaffMember = {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
};

export type BookingHeaderData = {
  bookingId: string;
  bookingCode: string;
  status: BookingWorkspaceStatus;
  destination: string;
  departureDate: string;
  returnDate: string;
  travelers: number;
  assignedStaff: BookingStaffMember;
};

export type BookingSummaryItem = {
  key: string;
  label: string;
  value: string;
  highlight?: boolean;
};

export type BookingPassenger = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  passport: string;
  nationality: string;
  visa: string;
  seat: string;
  meal: string;
  status: PassengerReadinessStatus;
};

export type TripTimelineStep = {
  id: string;
  label: string;
  state: TripStepState;
  dateLabel?: string;
};

export type BookingPaymentData = {
  totalAmount: number;
  depositAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  currency: string;
};

export type BookingDocument = {
  id: string;
  type: "passport" | "visa" | "voucher" | "insurance" | "ticket" | "invoice";
  label: string;
  status: DocumentStatus;
};

export type BookingNote = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export type BookingActivityEvent = {
  id: string;
  type: BookingActivityType;
  title: string;
  description?: string;
  timestamp: string;
  actor?: string;
};

export type BookingActivityDateGroup = {
  id: string;
  label: string;
  events: BookingActivityEvent[];
};

export type BookingWorkspaceData = {
  header: BookingHeaderData;
  summary: BookingSummaryItem[];
  passengers: BookingPassenger[];
  tripTimeline: TripTimelineStep[];
  payment: BookingPaymentData;
  documents: BookingDocument[];
  notes: BookingNote[];
  activity: BookingActivityEvent[];
};

export type BookingWorkspaceLabels = {
  back: string;
  generateInvoice: string;
  more: string;
  assignedStaff: string;
  travelers: string;
  bookingSummary: string;
  passengerList: string;
  tripTimeline: string;
  payment: string;
  documents: string;
  internalNotes: string;
  activityFeed: string;
  recordPayment: string;
  deposit: string;
  paid: string;
  remaining: string;
  dueDate: string;
  open: string;
  replace: string;
  columnName: string;
  columnPassport: string;
  columnNationality: string;
  columnVisa: string;
  columnSeat: string;
  columnMeal: string;
  columnStatus: string;
  columnActions: string;
  passengerStatusComplete: string;
  passengerStatusWaitingPassport: string;
  passengerStatusWaitingPayment: string;
  passengerStatusNeedVisa: string;
  documentStatusMissing: string;
  documentStatusPending: string;
  documentStatusReceived: string;
  documentStatusVerified: string;
  activityToday: string;
  activityYesterday: string;
  activityLastWeek: string;
};
