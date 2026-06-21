import {
  calculateLeadHealthScore,
  type LeadHealthBadge,
} from "@/lib/leads/health-score";
import { formatLeadSourceLabel } from "@/lib/leads/source-tracking";
import {
  formatInboxFollowUpDueDateTime,
  formatInboxFollowUpPriorityLabel,
  parseInboxFollowUpTaskMetadata,
  type InboxFollowUpPriority,
} from "@/lib/omnichannel-inbox/inbox-follow-up";
import type { OmnichannelSupabaseClient } from "@/lib/omnichannel-inbox/repository";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";

export type InboxLeadTimelineEntry = {
  id: string;
  type:
    | "conversation_created"
    | "lead_converted"
    | "follow_up_created"
    | "note_added"
    | "activity";
  label: string;
  detail?: string;
  timestamp: string;
};

export type InboxLeadNextFollowUp = {
  id: string;
  title: string;
  dueDate: string;
  dueDateLabel: string;
  priority: InboxFollowUpPriority;
  priorityLabel: string;
  assignedToName: string | null;
  status: string;
};

export type InboxLeadPanelContext = {
  leadId: string;
  fullName: string;
  status: string;
  statusLabel: string;
  healthScore: number;
  healthBadge: LeadHealthBadge;
  email: string | null;
  phone: string | null;
  source: string;
  sourceLabel: string;
  packageInterest: string | null;
  travelDatePreference: string | null;
  partySize: number | null;
  budgetIdr: number | null;
  assignedToName: string | null;
  tags: string[];
  lastFollowUpAt: string | null;
  lastFollowUpLabel: string | null;
  nextFollowUpAt: string | null;
  nextFollowUpLabel: string | null;
  nextFollowUp: InboxLeadNextFollowUp | null;
  timeline: InboxLeadTimelineEntry[];
};

type LeadRow = {
  id: string;
  full_name: string | null;
  status: string;
  assigned_to: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  source: string;
  package_interest: string | null;
  travel_date_preference: string | null;
  party_size: number | null;
  budget_idr: number | null;
  updated_at: string;
  created_at: string;
  last_contacted_at: string | null;
};

type FollowUpTaskRow = {
  id: string;
  title: string;
  due_date: string;
  status: string;
  updated_at: string;
  created_at: string;
};

type LeadActivityRow = {
  id: string;
  activity_type: string;
  title: string | null;
  body: string | null;
  occurred_at: string;
  metadata: unknown;
};

function formatLeadStatusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildConvertedLeadTimeline(
  conversation: OmnichannelConversationDetail,
  lead: LeadRow,
  followUpTasks: FollowUpTaskRow[],
  activities: LeadActivityRow[],
): InboxLeadTimelineEntry[] {
  const items: InboxLeadTimelineEntry[] = [
    {
      id: `conversation-created-${conversation.id}`,
      type: "conversation_created",
      label: "Conversation created",
      detail: `${conversation.channelLabel} thread opened`,
      timestamp: conversation.createdAt,
    },
    {
      id: `lead-converted-${lead.id}`,
      type: "lead_converted",
      label: "Lead converted",
      detail: lead.full_name?.trim() || "Lead created from inbox",
      timestamp: lead.created_at,
    },
  ];

  for (const task of followUpTasks) {
    items.push({
      id: `follow-up-${task.id}`,
      type: "follow_up_created",
      label:
        task.status === "completed" ? "Follow up completed" : "Follow up created",
      detail: task.title,
      timestamp: task.status === "completed" ? task.updated_at : task.created_at,
    });
  }

  for (const note of conversation.notes) {
    items.push({
      id: `conversation-note-${note.id}`,
      type: "note_added",
      label: "Note added",
      detail: note.note.trim(),
      timestamp: note.created_at,
    });
  }

  for (const activity of activities) {
    if (activity.activity_type === "note" && activity.title === "Lead dari Inbox") {
      continue;
    }

    items.push({
      id: `activity-${activity.id}`,
      type: "activity",
      label: activity.title?.trim() || "Lead activity",
      detail: activity.body?.trim() || undefined,
      timestamp: activity.occurred_at,
    });
  }

  return items
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    )
    .slice(0, 20);
}

export async function loadInboxLeadPanelContext(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  conversation: OmnichannelConversationDetail,
): Promise<InboxLeadPanelContext | null> {
  if (!conversation.leadId) {
    return null;
  }

  const [
    { data: lead, error: leadError },
    { data: followUpTasks },
    { data: activities },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, full_name, status, assigned_to, email, phone, whatsapp_number, source, package_interest, travel_date_preference, party_size, budget_idr, updated_at, created_at, last_contacted_at",
      )
      .eq("organization_id", organizationId)
      .eq("id", conversation.leadId)
      .maybeSingle(),
    supabase
      .from("follow_up_tasks")
      .select("id, title, due_date, status, updated_at, created_at")
      .eq("organization_id", organizationId)
      .eq("lead_id", conversation.leadId)
      .order("due_date", { ascending: true }),
    supabase
      .from("lead_activities")
      .select("id, activity_type, title, body, occurred_at, metadata")
      .eq("organization_id", organizationId)
      .eq("lead_id", conversation.leadId)
      .order("occurred_at", { ascending: false })
      .limit(24),
  ]);

  if (leadError || !lead) {
    return null;
  }

  const leadRow = lead as LeadRow;
  const taskRows = (followUpTasks ?? []) as FollowUpTaskRow[];
  const activityRows = (activities ?? []) as LeadActivityRow[];
  const pendingTasks = taskRows.filter((task) => task.status !== "completed");
  const completedTasks = taskRows.filter((task) => task.status === "completed");
  const nextTask = pendingTasks[0] ?? null;
  const lastCompletedTask = completedTasks.at(-1) ?? null;

  const followUpMetadataByTaskId = new Map<
    string,
    ReturnType<typeof parseInboxFollowUpTaskMetadata>
  >();

  for (const activity of activityRows) {
    const metadata = parseInboxFollowUpTaskMetadata(activity.metadata);
    if (metadata?.follow_up_task_id) {
      followUpMetadataByTaskId.set(metadata.follow_up_task_id, metadata);
    }
  }

  const nextTaskMetadata = nextTask
    ? followUpMetadataByTaskId.get(nextTask.id)
    : null;

  const assigneeIds = new Set<string>();
  if (nextTaskMetadata?.assigned_to) {
    assigneeIds.add(nextTaskMetadata.assigned_to);
  }

  const assigneeNames = new Map<string, string>();
  if (assigneeIds.size > 0) {
    const { data: assignees } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", organizationId)
      .in("id", [...assigneeIds]);

    for (const assignee of assignees ?? []) {
      assigneeNames.set(
        assignee.id,
        assignee.full_name?.trim() || "Team member",
      );
    }
  }

  const nextFollowUpPriority =
    nextTaskMetadata?.priority ?? ("normal" as InboxFollowUpPriority);
  const nextFollowUpAssignedToName = nextTaskMetadata?.assigned_to
    ? assigneeNames.get(nextTaskMetadata.assigned_to) ?? null
    : null;
  const health = calculateLeadHealthScore({
    assignedTo: leadRow.assigned_to,
    updatedAt: leadRow.updated_at,
    status: leadRow.status,
    followUpTaskCount: pendingTasks.length,
  });

  let assignedToName: string | null = null;
  if (leadRow.assigned_to) {
    const { data: assignee } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("organization_id", organizationId)
      .eq("id", leadRow.assigned_to)
      .maybeSingle();

    assignedToName = assignee?.full_name?.trim() || null;
  }

  return {
    leadId: leadRow.id,
    fullName: leadRow.full_name?.trim() || conversation.customerName,
    status: leadRow.status,
    statusLabel: formatLeadStatusLabel(leadRow.status),
    healthScore: health.score,
    healthBadge: health.badge,
    email: leadRow.email?.trim() || null,
    phone:
      leadRow.phone?.trim() ||
      leadRow.whatsapp_number?.trim() ||
      null,
    source: leadRow.source,
    sourceLabel: formatLeadSourceLabel(leadRow.source),
    packageInterest: leadRow.package_interest?.trim() || null,
    travelDatePreference: leadRow.travel_date_preference,
    partySize: leadRow.party_size,
    budgetIdr: leadRow.budget_idr,
    assignedToName,
    tags: conversation.tags,
    lastFollowUpAt:
      lastCompletedTask?.updated_at ?? leadRow.last_contacted_at ?? null,
    lastFollowUpLabel: lastCompletedTask?.title ?? null,
    nextFollowUpAt: nextTask?.due_date ?? null,
    nextFollowUpLabel: nextTask?.title ?? null,
    nextFollowUp: nextTask
      ? {
          id: nextTask.id,
          title: nextTask.title,
          dueDate: nextTask.due_date,
          dueDateLabel: formatInboxFollowUpDueDateTime(nextTask.due_date),
          priority: nextFollowUpPriority,
          priorityLabel: formatInboxFollowUpPriorityLabel(nextFollowUpPriority),
          assignedToName: nextFollowUpAssignedToName ?? assignedToName,
          status: nextTask.status,
        }
      : null,
    timeline: buildConvertedLeadTimeline(
      conversation,
      leadRow,
      taskRows,
      activityRows,
    ),
  };
}

export function formatInboxLeadTimelineTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(timestamp));
}

export type InboxLeadExtractionFieldKey =
  | "full_name"
  | "phone"
  | "email"
  | "package_interest"
  | "travel_date_preference"
  | "party_size"
  | "notes";

export type InboxLeadExtractionConfig = {
  enabled: true;
  fields: InboxLeadExtractionFieldKey[];
};

export const INBOX_LEAD_AI_EXTRACTION: InboxLeadExtractionConfig = {
  enabled: true,
  fields: [
    "full_name",
    "phone",
    "email",
    "package_interest",
    "travel_date_preference",
    "party_size",
    "notes",
  ],
};
