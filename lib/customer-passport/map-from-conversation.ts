import { getConversationDisplayName } from "@/components/omnichannel-inbox/inbox-display";
import { formatWhatsappPhoneDisplay } from "@/lib/whatsapp-inbox/display";
import {
  PASSPORT_JOURNEY_STAGES,
} from "@/lib/customer-passport/constants";
import type {
  CustomerPassport,
  PassportJourneyStage,
  PassportTimelineEntry,
  TravelStyle,
} from "@/lib/customer-passport/types";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import type { OmnichannelConversationStatus } from "@/types/omnichannel-inbox";

function inferJourneyFromConversationStatus(
  status: OmnichannelConversationStatus,
  hasLead: boolean,
): PassportJourneyStage {
  switch (status) {
    case "new":
      return "awareness";
    case "following_up":
      return hasLead ? "interest" : "awareness";
    case "quotation_sent":
      return "quotation";
    case "waiting_dp":
      return "dp";
    case "closed_won":
      return "repeat";
    case "closed_lost":
      return "review";
    default:
      return "awareness";
  }
}

export function inferJourneyFromLeadStatus(status: string): PassportJourneyStage {
  switch (status) {
    case "new":
      return "awareness";
    case "contacted":
      return "interest";
    case "qualified":
      return "planning";
    case "proposal":
      return "quotation";
    case "negotiation":
      return "negotiation";
    case "won":
      return "dp";
    case "nurturing":
      return "interest";
    case "lost":
      return "review";
    default:
      return "awareness";
  }
}

export function buildJourneyView(currentStage: PassportJourneyStage) {
  const currentIndex = PASSPORT_JOURNEY_STAGES.indexOf(currentStage);

  return {
    currentStage,
    stages: PASSPORT_JOURNEY_STAGES.map((stage, index) => ({
      stage,
      reached: index <= currentIndex,
      current: stage === currentStage,
    })),
  };
}

function inferTravelStyles(
  partySize: number | null | undefined,
  budgetIdr: number | null | undefined,
): TravelStyle[] {
  const styles: TravelStyle[] = [];

  if (partySize != null && partySize >= 3) {
    styles.push("family");
  } else if (partySize === 1) {
    styles.push("solo");
  }

  if (budgetIdr != null) {
    if (budgetIdr >= 30_000_000) {
      styles.push("luxury");
    } else if (budgetIdr <= 15_000_000) {
      styles.push("budget");
    }
  }

  return styles.length > 0 ? styles : ["family"];
}

function buildTimelineFromConversation(
  conversation: OmnichannelConversationDetail,
): PassportTimelineEntry[] {
  const items: PassportTimelineEntry[] = [];

  for (const message of conversation.messages) {
    items.push({
      id: `message-${message.id}`,
      kind: "message",
      label:
        message.direction === "incoming" ? "Customer message" : "Team reply",
      detail: message.message_text?.trim() || undefined,
      timestamp: message.created_at,
      channel: conversation.channel,
    });
  }

  for (const note of conversation.notes) {
    items.push({
      id: `note-${note.id}`,
      kind: "note",
      label: note.authorName ? `Note · ${note.authorName}` : "Internal note",
      detail: note.note.trim(),
      timestamp: note.created_at,
      channel: conversation.channel,
    });
  }

  for (const entry of conversation.assignmentHistory) {
    items.push({
      id: `assignment-${entry.id}`,
      kind: "assignment",
      label: "Assignment changed",
      detail: `${entry.assignedFromName ?? "Unassigned"} → ${entry.assignedToName ?? "Unassigned"}`,
      timestamp: entry.createdAt,
      channel: conversation.channel,
    });
  }

  return items.sort(
    (left, right) =>
      new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
  );
}

function resolvePhone(conversation: OmnichannelConversationDetail): string | null {
  const lead = conversation.leadContext;
  if (lead?.phone?.trim()) {
    return lead.phone.trim();
  }

  if (conversation.channel === "whatsapp" && conversation.externalUserId) {
    return formatWhatsappPhoneDisplay(conversation.externalUserId);
  }

  return null;
}

export function mapPassportFromConversation(
  conversation: OmnichannelConversationDetail,
): CustomerPassport {
  const leadContext = conversation.leadContext;
  const hasLead = Boolean(conversation.leadId);
  const displayName = getConversationDisplayName(conversation);

  const journeyStage = leadContext
    ? inferJourneyFromLeadStatus(leadContext.status)
    : inferJourneyFromConversationStatus(conversation.status, hasLead);

  const pinnedFacts = conversation.notes.slice(0, 5).map((note) => ({
    id: note.id,
    kind: "pinned" as const,
    label: note.authorName ? `Note · ${note.authorName}` : "Team note",
    detail: note.note.trim(),
    createdAt: note.created_at,
  }));

  return {
    id: conversation.leadId ?? conversation.id,
    entityType: hasLead ? "lead" : "prospect",
    leadId: conversation.leadId,
    conversationId: conversation.id,
    identity: {
      avatarUrl: conversation.customerAvatar,
      name: leadContext?.fullName ?? displayName,
      phone: resolvePhone(conversation),
      email: leadContext?.email ?? null,
      city: null,
      country: "Indonesia",
      language: "id",
    },
    relationship: {
      ownerId: conversation.assignedUserId,
      ownerName: conversation.assignedUserName,
      relationshipScore: leadContext?.healthScore ?? null,
      relationshipLabel: leadContext?.healthBadge ?? null,
      firstContactAt: conversation.createdAt,
      lastInteractionAt: conversation.lastMessageAt,
      avgResponseTimeMinutes: null,
    },
    journey: buildJourneyView(journeyStage),
    travel: {
      visitedDestinations: [],
      wishlist: leadContext?.packageInterest
        ? [leadContext.packageInterest]
        : [],
      upcomingTrips: [],
      travelStyles: inferTravelStyles(
        leadContext?.partySize,
        leadContext?.budgetIdr,
      ),
    },
    preferences: {
      halalPriority: true,
      seatPreference: null,
      hotelPreference: null,
      roomType: null,
      specialRequests: leadContext?.travelDatePreference ?? null,
    },
    commercial: {
      lifetimeRevenueIdr: leadContext?.budgetIdr ?? 0,
      bookingCount: 0,
      invoiceCount: 0,
      outstandingPaymentIdr: 0,
    },
    memory: {
      aiMemories: [],
      pinnedFacts,
      travelHistory: [],
    },
    timeline: buildTimelineFromConversation(conversation),
  };
}
