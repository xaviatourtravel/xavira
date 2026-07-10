import type {
  BookingActivityDateGroup,
  BookingActivityEvent,
  BookingWorkspaceData,
  BookingWorkspaceLabels,
  BookingWorkspaceStatus,
} from "./types";

function formatCurrencyIdr(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

const STATUS_LABELS: Record<BookingWorkspaceStatus, string> = {
  draft: "Draft",
  pending_payment: "Pending Payment",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function getBookingStatusLabel(status: BookingWorkspaceStatus) {
  return STATUS_LABELS[status];
}

export function buildMockBookingWorkspace(bookingId: string): BookingWorkspaceData {
  const bookingCode = `BK-${bookingId.slice(0, 6).toUpperCase() || "AURORA"}`;

  return {
    header: {
      bookingId,
      bookingCode,
      status: "in_progress",
      destination: "Tokyo, Japan",
      departureDate: "12 Aug 2026",
      returnDate: "19 Aug 2026",
      travelers: 4,
      assignedStaff: {
        id: "staff-1",
        name: "Rina Wijaya",
        role: "Operations Lead",
      },
    },
    summary: [
      { key: "status", label: "Status", value: "In Progress", highlight: true },
      { key: "departure", label: "Departure", value: "12 Aug 2026" },
      { key: "return", label: "Return", value: "19 Aug 2026" },
      { key: "package", label: "Package", value: "Japan Sakura 7D6N" },
      { key: "airline", label: "Airline", value: "Garuda Indonesia" },
      { key: "hotel", label: "Hotel", value: "Shinjuku Granbell" },
      { key: "visa", label: "Visa", value: "2 of 4 submitted" },
      { key: "insurance", label: "Insurance", value: "Allianz Travel Plus" },
      { key: "tour_leader", label: "Tour Leader", value: "Budi Santoso" },
    ],
    passengers: [
      {
        id: "p1",
        name: "Ahmad Fauzi",
        passport: "A1234567",
        nationality: "Indonesia",
        visa: "Approved",
        seat: "12A",
        meal: "Halal",
        status: "complete",
      },
      {
        id: "p2",
        name: "Siti Nurhaliza",
        passport: "B7654321",
        nationality: "Indonesia",
        visa: "Approved",
        seat: "12B",
        meal: "Vegetarian",
        status: "complete",
      },
      {
        id: "p3",
        name: "Dewi Lestari",
        passport: "—",
        nationality: "Indonesia",
        visa: "Not submitted",
        seat: "—",
        meal: "Regular",
        status: "waiting_passport",
      },
      {
        id: "p4",
        name: "Bambang Hartono",
        passport: "C9988776",
        nationality: "Indonesia",
        visa: "Processing",
        seat: "12D",
        meal: "Halal",
        status: "need_visa",
      },
    ],
    tripTimeline: [
      { id: "created", label: "Booking Created", state: "completed", dateLabel: "28 Jun 2026" },
      { id: "deposit", label: "Deposit Paid", state: "completed", dateLabel: "29 Jun 2026" },
      { id: "passport", label: "Passport Received", state: "current", dateLabel: "In progress" },
      { id: "visa", label: "Visa Submitted", state: "pending" },
      { id: "ticket", label: "Ticket Issued", state: "pending" },
      { id: "final_payment", label: "Final Payment", state: "pending" },
      { id: "departure", label: "Departure", state: "pending", dateLabel: "12 Aug 2026" },
      { id: "completed", label: "Completed", state: "pending" },
    ],
    payment: {
      totalAmount: 48_000_000,
      depositAmount: 12_000_000,
      paidAmount: 24_000_000,
      remainingAmount: 24_000_000,
      dueDate: "25 Jul 2026",
      currency: "IDR",
    },
    documents: [
      { id: "d1", type: "passport", label: "Passport", status: "pending" },
      { id: "d2", type: "visa", label: "Visa", status: "pending" },
      { id: "d3", type: "voucher", label: "Voucher", status: "missing" },
      { id: "d4", type: "insurance", label: "Insurance", status: "received" },
      { id: "d5", type: "ticket", label: "Ticket", status: "missing" },
      { id: "d6", type: "invoice", label: "Invoice", status: "verified" },
    ],
    notes: [
      {
        id: "n1",
        author: "Rina Wijaya",
        body: "Customer requested halal meals for all travelers. Confirmed with airline.",
        createdAt: "2026-07-02T09:15:00+07:00",
      },
      {
        id: "n2",
        author: "Budi Santoso",
        body: "Dewi still needs to upload passport scan. Follow up via WhatsApp tomorrow.",
        createdAt: "2026-07-03T14:30:00+07:00",
      },
      {
        id: "n3",
        author: "Rina Wijaya",
        body: "Visa application submitted for Bambang. ETA 5–7 business days.",
        createdAt: "2026-07-04T11:00:00+07:00",
      },
    ],
    activity: [
      {
        id: "a1",
        type: "payment",
        title: "Deposit received",
        description: formatCurrencyIdr(12_000_000),
        timestamp: "2026-06-29T10:22:00+07:00",
        actor: "Finance Team",
      },
      {
        id: "a2",
        type: "status_change",
        title: "Status changed to In Progress",
        timestamp: "2026-06-29T10:25:00+07:00",
        actor: "Rina Wijaya",
      },
      {
        id: "a3",
        type: "assignment",
        title: "Assigned to Rina Wijaya",
        timestamp: "2026-06-28T16:40:00+07:00",
        actor: "System",
      },
      {
        id: "a4",
        type: "document",
        title: "Passport uploaded",
        description: "Ahmad Fauzi · A1234567",
        timestamp: "2026-07-01T08:10:00+07:00",
        actor: "Ahmad Fauzi",
      },
      {
        id: "a5",
        type: "payment",
        title: "Partial payment recorded",
        description: formatCurrencyIdr(12_000_000),
        timestamp: "2026-07-02T15:45:00+07:00",
        actor: "Finance Team",
      },
      {
        id: "a6",
        type: "note",
        title: "Internal note added",
        description: "Halal meal request confirmed.",
        timestamp: "2026-07-02T09:15:00+07:00",
        actor: "Rina Wijaya",
      },
      {
        id: "a7",
        type: "system",
        title: "Booking created",
        description: bookingCode,
        timestamp: "2026-06-28T14:00:00+07:00",
        actor: "System",
      },
    ],
  };
}

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatActivityTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(timestamp));
}

function resolveActivityGroupLabel(
  date: Date,
  now: Date,
  labels: Pick<BookingWorkspaceLabels, "activityToday" | "activityYesterday" | "activityLastWeek">,
) {
  const today = startOfDay(now);
  const eventDay = startOfDay(date);
  const diffDays = Math.floor((today.getTime() - eventDay.getTime()) / 86_400_000);

  if (isSameDay(eventDay, today)) {
    return labels.activityToday;
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(eventDay, yesterday)) {
    return labels.activityYesterday;
  }

  if (diffDays <= 7) {
    return labels.activityLastWeek;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export function groupBookingActivity(
  events: BookingActivityEvent[],
  labels: Pick<BookingWorkspaceLabels, "activityToday" | "activityYesterday" | "activityLastWeek">,
): BookingActivityDateGroup[] {
  const now = new Date();
  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const groups: BookingActivityDateGroup[] = [];

  for (const event of sorted) {
    const eventDate = new Date(event.timestamp);
    const label = resolveActivityGroupLabel(eventDate, now, labels);
    const groupId = `${label}-${startOfDay(eventDate).toISOString()}`;
    const existing = groups.find((group) => group.id === groupId);

    if (existing) {
      existing.events.push(event);
      continue;
    }

    groups.push({
      id: groupId,
      label,
      events: [event],
    });
  }

  return groups;
}

export { formatActivityTime, formatCurrencyIdr };
