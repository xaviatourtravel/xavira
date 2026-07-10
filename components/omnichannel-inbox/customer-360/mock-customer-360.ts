import type {
  Customer360ConversationSeed,
  Customer360Profile,
} from "./types";

function formatJoinedDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function buildMockCustomer360Profile(
  seed: Customer360ConversationSeed,
): Customer360Profile {
  const assignedOwner = seed.assignedOwner?.trim() || "Adi Santoso";
  const statusLabel = seed.statusLabel?.trim() || "Qualified Lead";

  return {
    customer: {
      id: seed.id,
      name: seed.displayName,
      avatarUrl: seed.avatarUrl,
      channel: seed.channel,
      channelLabel: seed.channelLabel,
      statusLabel,
      assignedOwner,
      joinedSince: formatJoinedDate(seed.createdAt),
      leadBadge: {
        label: "Hot",
        value: 82,
      },
      leadScore: {
        label: "Hot",
        value: 82,
      },
    },
    stats: {
      conversations: "4",
      bookings: "1",
      trips: "2",
      lastContact: "2h ago",
      averageResponse: "12m",
      lifetimeValue: "Rp45M",
    },
    interestTags: [
      "Japan",
      "Yunnan",
      "Umrah",
      "VIP",
      "Family",
      "Luxury",
      "Budget",
      "Muslim Tour",
    ],
    contact: {
      phone: "+62 812-3456-7890",
      email: "siti.rahayu@email.com",
      city: "Jakarta",
      language: "Bahasa Indonesia",
      timezone: "GMT+7",
    },
    preferences: {
      preferredDestination: "Yunnan, China",
      preferredBudget: "Under Rp20M",
      preferredDeparture: "May 2026",
      travelerCount: "2 adults",
      mealPreference: "Halal",
      travelStyle: "Comfort · Guided",
    },
    relationship: {
      assignedSales: assignedOwner,
      lastFollowUp: "Yesterday · WhatsApp",
      lastQuotation: "3 days ago · Yunnan Premium",
      customerSince: formatJoinedDate(seed.createdAt),
      referralSource: "WhatsApp inbound",
    },
  };
}
