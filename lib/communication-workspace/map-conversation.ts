import { getConversationDisplayName } from "@/components/omnichannel-inbox/inbox-display";
import { formatWhatsappPhoneDisplay } from "@/lib/whatsapp-inbox/display";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import type {
  WorkspaceConversationViewModel,
  WorkspaceExtractedFields,
  WorkspaceTimelineEntry,
} from "@/lib/communication-workspace/types";

function resolvePhone(conversation: OmnichannelConversationDetail): string | null {
  const leadContext = conversation.leadContext;

  if (leadContext?.phone?.trim()) {
    return leadContext.phone.trim();
  }

  if (conversation.channel === "whatsapp" && conversation.externalUserId) {
    return formatWhatsappPhoneDisplay(conversation.externalUserId);
  }

  return null;
}

function buildExtractedFields(
  conversation: OmnichannelConversationDetail,
): WorkspaceExtractedFields {
  const lead = conversation.leadContext;

  return {
    name: lead?.fullName ?? getConversationDisplayName(conversation),
    destination: lead?.packageInterest ?? "",
    departure: lead?.travelDatePreference ?? "",
    pax: lead?.partySize != null ? String(lead.partySize) : "",
    budget: lead?.budgetIdr != null ? String(lead.budgetIdr) : "",
    city: "",
  };
}

function buildConversationTimeline(
  conversation: OmnichannelConversationDetail,
): WorkspaceTimelineEntry[] {
  const items: WorkspaceTimelineEntry[] = [
    {
      id: `created-${conversation.id}`,
      label: "Conversation started",
      detail: conversation.channelLabel,
      timestamp: conversation.createdAt,
      channel: conversation.channel,
      tone: "system",
    },
  ];

  for (const message of conversation.messages) {
    items.push({
      id: `message-${message.id}`,
      label:
        message.direction === "incoming"
          ? "Customer message"
          : "Team reply",
      detail: message.message_text?.trim() || undefined,
      timestamp: message.created_at,
      channel: conversation.channel,
      tone: "message",
    });
  }

  for (const note of conversation.notes) {
    items.push({
      id: `note-${note.id}`,
      label: note.authorName ? `Note · ${note.authorName}` : "Internal note",
      detail: note.note.trim(),
      timestamp: note.created_at,
      channel: conversation.channel,
      tone: "note",
    });
  }

  for (const assignment of conversation.assignmentHistory) {
    items.push({
      id: `assignment-${assignment.id}`,
      label: "Assignment changed",
      detail: `${assignment.assignedFromName ?? "Unassigned"} → ${assignment.assignedToName ?? "Unassigned"}`,
      timestamp: assignment.createdAt,
      channel: conversation.channel,
      tone: "activity",
    });
  }

  for (const event of conversation.aiActivityEvents ?? []) {
    items.push({
      id: `ai-event-${event.id}`,
      label: event.label,
      detail: event.detail,
      timestamp: event.timestamp,
      channel: conversation.channel,
      tone: "activity",
    });
  }

  if (conversation.leadContext?.timeline) {
    for (const entry of conversation.leadContext.timeline) {
      if (
        entry.type === "follow_up_created" ||
        entry.type === "lead_converted" ||
        entry.type === "activity"
      ) {
        items.push({
          id: entry.id,
          label: entry.label,
          detail: entry.detail,
          timestamp: entry.timestamp,
          channel: conversation.channel,
          tone: "activity",
        });
      }
    }
  }

  return items
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    )
    .slice(0, 48);
}

function buildLeadTimeline(
  conversation: OmnichannelConversationDetail,
): WorkspaceTimelineEntry[] {
  const leadContext = conversation.leadContext;
  if (!leadContext) {
    return buildConversationTimeline(conversation);
  }

  return leadContext.timeline.map((entry) => ({
    id: entry.id,
    label: entry.label,
    detail: entry.detail,
    timestamp: entry.timestamp,
    channel: conversation.channel,
    tone:
      entry.type === "note_added"
        ? "note"
        : entry.type === "activity"
          ? "activity"
          : "system",
  }));
}

function resolveLeadBadge(
  conversation: OmnichannelConversationDetail,
): WorkspaceConversationViewModel["leadBadge"] {
  if (!conversation.leadId) {
    return "prospect";
  }

  const status = conversation.leadContext?.status;
  if (status === "closed_won" || status === "waiting_dp") {
    return "customer";
  }

  return "lead";
}

function estimateRevenuePotential(
  conversation: OmnichannelConversationDetail,
): number | null {
  const budget = conversation.leadContext?.budgetIdr;
  if (budget != null && budget > 0) {
    return budget;
  }

  return null;
}

export function mapConversationToWorkspace(
  conversation: OmnichannelConversationDetail,
): WorkspaceConversationViewModel {
  const leadContext = conversation.leadContext;
  const isConverted = Boolean(conversation.leadId);

  return {
    id: conversation.id,
    channel: conversation.channel,
    channelLabel: conversation.channelLabel,
    displayName: getConversationDisplayName(conversation),
    phone: resolvePhone(conversation),
    username: conversation.customerUsername,
    avatarUrl: conversation.customerAvatar,
    leadBadge: resolveLeadBadge(conversation),
    leadId: conversation.leadId,
    status: conversation.status,
    statusLabel: conversation.statusLabel,
    assignedUserId: conversation.assignedUserId,
    assignedUserName: conversation.assignedUserName,
    leadScore: leadContext?.healthScore ?? null,
    leadScoreLabel: leadContext?.healthBadge ?? null,
    revenuePotentialIdr: estimateRevenuePotential(conversation),
    extractedFields: buildExtractedFields(conversation),
    notes: conversation.notes.map((note) => ({
      id: note.id,
      note: note.note,
      authorName: note.authorName,
      createdAt: note.created_at,
    })),
    timeline: isConverted
      ? buildLeadTimeline(conversation)
      : buildConversationTimeline(conversation),
    createdAt: conversation.createdAt,
    isWhatsapp: conversation.channel === "whatsapp",
  };
}

export function formatWorkspaceCurrency(value: number | null) {
  if (value == null || value <= 0) {
    return null;
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
