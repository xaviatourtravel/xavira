import type {
  CustomerTimelineEvent,
  TimelineDateGroup,
  TimelineDateGroupId,
  TimelineEvent,
  TimelineLabels,
} from "./types";

function todayAt(hour: number, minute: number): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function yesterdayAt(hour: number, minute: number): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function daysAgoAt(days: number, hour: number, minute: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function toTimelineEvent(event: CustomerTimelineEvent): TimelineEvent {
  return {
    id: event.id,
    type: event.type,
    title: event.title,
    description: event.description,
    timestamp: event.timestamp,
    actor: event.actor,
    metadata: event.metadata,
  };
}

export function buildMockTimelineEvents(conversationId: string): TimelineEvent[] {
  return [
    {
      id: `${conversationId}-payment`,
      type: "payment_received",
      title: "Payment Received",
      description: "Down payment confirmed\nRp5.000.000",
      actor: { id: "system", name: "System" },
      timestamp: todayAt(9, 30),
    },
    {
      id: `${conversationId}-ai`,
      type: "ai_summary_updated",
      title: "AI Summary Updated",
      description: "Budget under Rp20M and Yunnan interest captured.",
      actor: { id: "ai", name: "AI Copilot" },
      timestamp: todayAt(8, 12),
    },
    {
      id: `${conversationId}-transfer-hisbi`,
      type: "transferred",
      title: "Transfer Conversation",
      description: "Ownership moved from Adi to Hisbi for workload balancing.",
      actor: { id: "rendhy", name: "Rendhy" },
      timestamp: yesterdayAt(14, 20),
    },
    {
      id: `${conversationId}-quotation`,
      type: "quotation_sent",
      title: "Quotation Sent",
      description: "Yunnan Premium package quote shared via WhatsApp.",
      actor: { id: "adi", name: "Adi Saputra" },
      timestamp: yesterdayAt(11, 45),
    },
    {
      id: `${conversationId}-booking`,
      type: "booking_created",
      title: "Booking Created",
      description: "Yunnan 8D7N · 2 travelers · May departure.",
      actor: { id: "adi", name: "Adi Saputra" },
      timestamp: daysAgoAt(3, 16, 10),
    },
    {
      id: `${conversationId}-assigned`,
      type: "assigned",
      title: "Assigned to Adi",
      description: "Conversation ownership assigned to sales.",
      actor: { id: "system", name: "System" },
      timestamp: daysAgoAt(4, 11, 0),
    },
    {
      id: `${conversationId}-note`,
      type: "internal_note_added",
      title: "Internal Note Added",
      description: "Customer wants Yunnan if budget under 20 million.",
      actor: { id: "adi", name: "Adi Saputra" },
      timestamp: daysAgoAt(5, 10, 30),
    },
    {
      id: `${conversationId}-journey`,
      type: "journey_updated",
      title: "Journey Updated",
      description: "Stage moved from New Lead to Qualified.",
      actor: { id: "system", name: "System" },
      timestamp: daysAgoAt(5, 15, 0),
    },
    {
      id: `${conversationId}-inquiry`,
      type: "customer_inquiry",
      title: "Customer asked about Yunnan package",
      description: "Incoming WhatsApp message about halal-friendly itinerary.",
      actor: { id: "customer", name: "Siti Rahayu" },
      timestamp: daysAgoAt(6, 13, 15),
    },
    {
      id: `${conversationId}-started`,
      type: "conversation_started",
      title: "Customer Created",
      description: "New WhatsApp conversation opened.",
      actor: { id: "system", name: "System" },
      timestamp: daysAgoAt(7, 9, 0),
    },
  ];
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function resolveDateGroupId(timestamp: string, now = new Date()): TimelineDateGroupId {
  const eventDate = new Date(timestamp);
  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const lastWeekStart = new Date(todayStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  if (eventDate >= todayStart) {
    return "today";
  }

  if (eventDate >= yesterdayStart) {
    return "yesterday";
  }

  return "last_week";
}

const GROUP_ORDER: TimelineDateGroupId[] = ["today", "yesterday", "last_week"];

export function groupTimelineEvents(
  events: TimelineEvent[],
  labels: TimelineLabels,
): TimelineDateGroup[] {
  const grouped = new Map<TimelineDateGroupId, TimelineEvent[]>();

  for (const event of events) {
    const groupId = resolveDateGroupId(event.timestamp);
    const bucket = grouped.get(groupId) ?? [];
    bucket.push(event);
    grouped.set(groupId, bucket);
  }

  return GROUP_ORDER.flatMap((groupId) => {
    const bucket = grouped.get(groupId);
    if (!bucket?.length) {
      return [];
    }

    const sortedEvents = [...bucket].sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    );

    const label =
      groupId === "today"
        ? labels.today
        : groupId === "yesterday"
          ? labels.yesterday
          : labels.lastWeek;

    return [
      {
        id: groupId,
        label,
        events: sortedEvents,
      },
    ];
  });
}
