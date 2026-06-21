import { formatOmnichannelChannelLabel } from "@/lib/omnichannel-inbox/constants";
import {
  formatInboxFollowUpPriorityLabel,
  parseInboxFollowUpTaskMetadata,
  type InboxFollowUpPriority,
} from "@/lib/omnichannel-inbox/inbox-follow-up";
import {
  findMessagesByConversationId,
  type OmnichannelSupabaseClient,
} from "@/lib/omnichannel-inbox/repository";
import {
  buildLeadTimeline,
  type LeadTimelineActivitySource,
  type LeadTimelineEvent,
} from "@/lib/leads/timeline";
import type { OmnichannelChannel } from "@/types/omnichannel-inbox";

export type LeadConversationContext = {
  conversationId: string;
  channel: OmnichannelChannel;
  channelLabel: string;
  customerName: string;
  customerUsername: string | null;
  status: string;
  lastMessageAt: string | null;
  inboxHref: string;
  recentMessages: Array<{
    id: string;
    direction: "incoming" | "outgoing";
    text: string;
    createdAt: string;
  }>;
};

export type LeadFollowUpHistoryItem = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: string;
  isOverdue: boolean;
  isPending: boolean;
  isCompleted: boolean;
  priority: InboxFollowUpPriority;
  priorityLabel: string;
  assignedToName: string | null;
};

export type BookingReadinessItem = {
  id:
    | "destination"
    | "date"
    | "pax"
    | "budget"
    | "phone"
    | "package";
  label: string;
  confirmed: boolean;
  detail: string | null;
};

export type BookingReadinessSummary = {
  items: BookingReadinessItem[];
  confirmedCount: number;
  totalCount: number;
  isReady: boolean;
};

type LeadActivityRow = {
  id: string;
  activity_type: string;
  title: string | null;
  body: string | null;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
  profiles:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null;
};

type FollowUpTaskRow = {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  status: string;
  created_by: string | null;
};

type LeadRowFor360 = {
  id: string;
  full_name: string;
  phone: string | null;
  whatsapp_number: string | null;
  email: string | null;
  package_interest: string | null;
  travel_date_preference: string | null;
  party_size: number | null;
  budget_idr: number | null;
  notes: string | null;
  assigned_to: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profiles:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null;
};

function resolveProfileName(
  profiles:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null,
) {
  if (!profiles) {
    return null;
  }

  if (Array.isArray(profiles)) {
    return profiles[0]?.full_name?.trim() || null;
  }

  return profiles.full_name?.trim() || null;
}

function getConversationIdFromMetadata(metadata: Record<string, unknown> | null) {
  const value = metadata?.omnichannel_conversation_id;
  return typeof value === "string" && value ? value : null;
}

export async function loadLeadConversationContext(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  lead: LeadRowFor360,
): Promise<LeadConversationContext | null> {
  const metadataConversationId = getConversationIdFromMetadata(lead.metadata);

  const { data: linkedConversation } = await supabase
    .from("conversations")
    .select(
      "id, channel, customer_name, customer_username, status, last_message_at",
    )
    .eq("organization_id", organizationId)
    .eq("lead_id", lead.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let conversation = linkedConversation;

  if (!conversation && metadataConversationId) {
    const { data: metadataConversation } = await supabase
      .from("conversations")
      .select(
        "id, channel, customer_name, customer_username, status, last_message_at",
      )
      .eq("organization_id", organizationId)
      .eq("id", metadataConversationId)
      .maybeSingle();

    conversation = metadataConversation;
  }

  if (!conversation) {
    return null;
  }

  const messages = await findMessagesByConversationId(
    supabase,
    organizationId,
    conversation.id,
  );

  const recentMessages = (messages ?? []).slice(-6).map((message) => ({
    id: message.id,
    direction: message.direction as "incoming" | "outgoing",
    text: message.message_text?.trim() || "(attachment)",
    createdAt: message.created_at,
  }));

  return {
    conversationId: conversation.id,
    channel: conversation.channel as OmnichannelChannel,
    channelLabel: formatOmnichannelChannelLabel(
      conversation.channel as OmnichannelChannel,
    ),
    customerName: conversation.customer_name?.trim() || lead.full_name,
    customerUsername: conversation.customer_username,
    status: conversation.status,
    lastMessageAt: conversation.last_message_at,
    inboxHref: `/inbox?c=${conversation.id}`,
    recentMessages,
  };
}

export function buildLeadFollowUpHistory(
  tasks: FollowUpTaskRow[],
  activities: LeadActivityRow[],
  assignedToName: string | null,
): LeadFollowUpHistoryItem[] {
  const metadataByTaskId = new Map<
    string,
    ReturnType<typeof parseInboxFollowUpTaskMetadata>
  >();

  for (const activity of activities) {
    const metadata = parseInboxFollowUpTaskMetadata(activity.metadata);
    if (metadata?.follow_up_task_id) {
      metadataByTaskId.set(metadata.follow_up_task_id, metadata);
    }
  }

  const now = Date.now();

  return tasks
    .map((task) => {
      const metadata = metadataByTaskId.get(task.id);
      const priority = metadata?.priority ?? "normal";
      const isCompleted = task.status === "completed";
      const isPending = !isCompleted;
      const isOverdue =
        isPending && new Date(task.due_date).getTime() < now;

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        dueDate: task.due_date,
        status: task.status,
        isOverdue,
        isPending,
        isCompleted,
        priority,
        priorityLabel: formatInboxFollowUpPriorityLabel(priority),
        assignedToName: assignedToName,
      };
    })
    .sort(
      (left, right) =>
        new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime(),
    );
}

export function buildBookingReadiness(
  lead: LeadRowFor360,
  hasSelectedPackage: boolean,
): BookingReadinessSummary {
  const phone = lead.phone?.trim() || lead.whatsapp_number?.trim() || null;

  const items: BookingReadinessItem[] = [
    {
      id: "destination",
      label: "Destination confirmed",
      confirmed: Boolean(lead.package_interest?.trim()),
      detail: lead.package_interest,
    },
    {
      id: "date",
      label: "Date confirmed",
      confirmed: Boolean(lead.travel_date_preference),
      detail: lead.travel_date_preference,
    },
    {
      id: "pax",
      label: "Pax confirmed",
      confirmed: lead.party_size != null && lead.party_size > 0,
      detail: lead.party_size != null ? String(lead.party_size) : null,
    },
    {
      id: "budget",
      label: "Budget confirmed",
      confirmed: lead.budget_idr != null && lead.budget_idr > 0,
      detail:
        lead.budget_idr != null ? String(lead.budget_idr) : null,
    },
    {
      id: "phone",
      label: "Phone collected",
      confirmed: Boolean(phone),
      detail: phone,
    },
    {
      id: "package",
      label: "Package selected",
      confirmed: Boolean(lead.package_interest?.trim()) || hasSelectedPackage,
      detail: lead.package_interest,
    },
  ];

  const confirmedCount = items.filter((item) => item.confirmed).length;

  return {
    items,
    confirmedCount,
    totalCount: items.length,
    isReady: confirmedCount >= 5,
  };
}

export function buildExtendedLeadTimeline(input: {
  leadId: string;
  leadCreatedAt: string;
  leadMetadata: unknown;
  activities: LeadTimelineActivitySource[];
  conversation: LeadConversationContext | null;
}): LeadTimelineEvent[] {
  const baseEvents = buildLeadTimeline({
    leadId: input.leadId,
    leadCreatedAt: input.leadCreatedAt,
    leadMetadata: input.leadMetadata,
    activities: input.activities,
  });

  const supplemental: LeadTimelineEvent[] = [];

  if (input.conversation) {
    for (const message of input.conversation.recentMessages.slice(-4)) {
      supplemental.push({
        id: `conversation-message-${message.id}`,
        eventType: "note_added",
        occurredAt: message.createdAt,
        userName:
          message.direction === "incoming" ? "Customer" : "Team",
        description:
          message.direction === "incoming"
            ? "Customer message received"
            : "Team message sent",
        details: message.text,
        source: "metadata",
      });
    }
  }

  const seen = new Set(baseEvents.map((event) => event.id));
  const merged = [...baseEvents];

  for (const event of supplemental) {
    if (seen.has(event.id)) {
      continue;
    }

    merged.push(event);
  }

  return merged.sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() -
      new Date(left.occurredAt).getTime(),
  );
}

export function mapActivitiesForTimeline(
  activities: LeadActivityRow[],
): LeadTimelineActivitySource[] {
  return activities.map((activity) => ({
    id: activity.id,
    activity_type: activity.activity_type,
    title: activity.title,
    body: activity.body,
    occurred_at: activity.occurred_at,
    metadata: activity.metadata,
    actorName: resolveProfileName(activity.profiles),
  }));
}
