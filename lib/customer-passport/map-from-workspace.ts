import { buildCommunicationFeed } from "@/lib/customers/communication-workspace";
import type { CustomerWorkspaceData } from "@/lib/customers/load-customer-workspace";
import {
  buildJourneyView,
  inferJourneyFromLeadStatus,
} from "@/lib/customer-passport/map-from-conversation";
import type {
  CustomerPassport,
  PassportMemoryItem,
  PassportTimelineEntry,
  PassportTimelineKind,
  TravelStyle,
} from "@/lib/customer-passport/types";
import type { CommunicationFeedCategory } from "@/lib/customers/communication-workspace";

function mapFeedCategoryToTimelineKind(
  category: CommunicationFeedCategory,
): PassportTimelineKind {
  switch (category) {
    case "whatsapp":
    case "email":
      return "message";
    case "booking":
      return "booking";
    case "invoice":
      return "invoice";
    case "payment":
      return "payment";
    case "task":
      return "task";
    case "note":
      return "note";
    default:
      return "system";
  }
}

function inferTravelStylesFromWorkspace(
  data: CustomerWorkspaceData,
): TravelStyle[] {
  const styles: TravelStyle[] = [];
  const partySize = data.lead.party_size;

  if (partySize != null && partySize >= 3) {
    styles.push("family");
  } else if (partySize === 1) {
    styles.push("solo");
  }

  const budget = data.lead.budget_idr;
  if (budget != null) {
    if (budget >= 30_000_000) {
      styles.push("luxury");
    } else if (budget <= 15_000_000) {
      styles.push("budget");
    }
  }

  return styles.length > 0 ? styles : ["family"];
}

function buildMemoryFromWorkspace(data: CustomerWorkspaceData) {
  const pinnedFacts: PassportMemoryItem[] = [];

  if (data.lead.notes?.trim()) {
    pinnedFacts.push({
      id: "lead-notes",
      kind: "pinned",
      label: "Lead notes",
      detail: data.lead.notes.trim(),
      createdAt: data.lead.updated_at,
    });
  }

  for (const event of data.timelineEvents) {
    if (event.eventType === "note_added") {
      pinnedFacts.push({
        id: event.id,
        kind: "pinned",
        label: event.description,
        detail: event.details ?? "",
        createdAt: event.occurredAt,
      });
    }
  }

  const travelHistory: PassportMemoryItem[] = data.bookings.map((booking) => ({
    id: `booking-${booking.id}`,
    kind: "travel",
    label: booking.package_name ?? booking.booking_code ?? "Booking",
    detail: `${booking.booking_status} · ${booking.payment_status}`,
    createdAt: booking.created_at,
  }));

  return {
    aiMemories: [] as PassportMemoryItem[],
    pinnedFacts: pinnedFacts.slice(0, 8),
    travelHistory,
  };
}

function inferJourneyFromWorkspace(data: CustomerWorkspaceData) {
  if (data.bookings.some((booking) => booking.booking_status === "completed")) {
    return buildJourneyView("review");
  }

  if (
    data.bookings.some(
      (booking) =>
        booking.booking_status === "confirmed" ||
        booking.payment_status === "dp_paid" ||
        booking.payment_status === "fully_paid",
    )
  ) {
    return buildJourneyView("trip");
  }

  if (data.metrics.outstandingBalance > 0 && data.metrics.totalPaid > 0) {
    return buildJourneyView("dp");
  }

  return buildJourneyView(inferJourneyFromLeadStatus(data.lead.status));
}

export function mapPassportFromWorkspace(
  data: CustomerWorkspaceData,
): CustomerPassport {
  const feed = buildCommunicationFeed(data);
  const timeline: PassportTimelineEntry[] = feed.map((item) => ({
    id: item.id,
    kind: mapFeedCategoryToTimelineKind(item.category),
    label: item.title,
    detail: item.description,
    timestamp: item.occurredAt,
    channel: item.category === "whatsapp" ? "whatsapp" : null,
  }));

  const visitedDestinations = [
    ...new Set(
      data.bookings
        .filter((booking) => booking.booking_status === "completed")
        .map((booking) => booking.package_name)
        .filter((value): value is string => Boolean(value?.trim())),
    ),
  ];

  const wishlist = data.lead.package_interest?.trim()
    ? [data.lead.package_interest.trim()]
    : [];

  const upcomingTrips = data.bookings
    .filter((booking) => booking.booking_status !== "completed")
    .map((booking) => ({
      id: booking.id,
      label: booking.package_name ?? booking.booking_code ?? "Upcoming trip",
      departureDate: booking.departure_date,
      status: booking.booking_status,
    }));

  return {
    id: data.lead.id,
    entityType: "lead",
    leadId: data.lead.id,
    conversationId: data.conversationId,
    identity: {
      avatarUrl: data.conversationDetail?.customerAvatar ?? null,
      name: data.lead.full_name,
      phone: data.lead.phone ?? data.lead.whatsapp_number,
      email: data.lead.email,
      city: null,
      country: "Indonesia",
      language: "id",
    },
    relationship: {
      ownerId: null,
      ownerName: data.lead.assignedToLabel !== "Unassigned"
        ? data.lead.assignedToLabel
        : null,
      relationshipScore: data.healthScore.score,
      relationshipLabel: data.healthScore.badge,
      firstContactAt: data.lead.created_at,
      lastInteractionAt: data.lastActivityAt ?? data.lead.updated_at,
      avgResponseTimeMinutes: null,
    },
    journey: inferJourneyFromWorkspace(data),
    travel: {
      visitedDestinations,
      wishlist,
      upcomingTrips,
      travelStyles: inferTravelStylesFromWorkspace(data),
    },
    preferences: {
      halalPriority: true,
      seatPreference: null,
      hotelPreference: null,
      roomType: null,
      specialRequests:
        data.lead.travel_date_preference ?? data.lead.notes ?? null,
    },
    commercial: {
      lifetimeRevenueIdr: data.metrics.totalPaid,
      bookingCount: data.metrics.totalBookings,
      invoiceCount: data.payments.length,
      outstandingPaymentIdr: data.metrics.outstandingBalance,
    },
    memory: buildMemoryFromWorkspace(data),
    timeline,
  };
}
