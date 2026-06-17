import {
  formatQueuePriorityLabel,
  getQueuePrioritySortOrder,
  TEMPERATURE_OVERDUE_THRESHOLDS,
  type QueuePriority,
} from "@/lib/automation/constants";
import { getFollowUpTodayBounds } from "@/lib/follow-ups/list-filters";
import {
  formatAssignedUserLabel,
  getLeadAssigneeName,
} from "@/lib/leads/assignment";
import {
  getEffectiveLeadTemperature,
  getLeadTemperatureLabel,
  type LeadTemperature,
} from "@/lib/leads/lead-temperature";
import { getLeadNextBestAction } from "@/lib/leads/next-best-action";
import { getJakartaDateString, toJakartaDateString } from "@/lib/dashboard/jakarta-date";
import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type QueueReason = {
  key: string;
  emoji: string;
  label: string;
};

export type FollowUpQueueItem = {
  leadId: string;
  leadName: string;
  assignedSalesName: string;
  whatsappNumber: string | null;
  phone: string | null;
  temperature: LeadTemperature;
  temperatureLabel: string;
  status: string;
  lastActivityAt: string | null;
  lastActivityLabel: string;
  daysSinceLastFollowUp: number;
  priority: QueuePriority;
  priorityLabel: string;
  reasons: QueueReason[];
  nextAction: string;
  snoozeEndedToday: boolean;
};

type LeadRow = {
  id: string;
  full_name: string;
  status: string;
  assigned_to: string | null;
  updated_at: string;
  created_at: string;
  last_contacted_at: string | null;
  lead_temperature: string | null;
  snooze_until: string | null;
  whatsapp_number: string | null;
  phone: string | null;
  profiles:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null;
};

type FollowUpTaskRow = {
  lead_id: string;
  due_date: string;
  status: string;
  updated_at: string;
};

type ActivityRow = {
  lead_id: string;
  activity_type: string;
  title: string | null;
  occurred_at: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const FOLLOW_UP_ACTIVITY_TYPES = new Set([
  "follow_up_sent",
  "follow_up_generated",
  "whatsapp",
  "call",
  "email",
]);

function getDaysSince(isoDate: string, now = Date.now()) {
  const diff = now - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(diff / DAY_MS));
}

function isActiveLeadStatus(status: string) {
  return status !== "won" && status !== "lost";
}

function isLeadSnoozed(snoozeUntil: string | null, nowIso: string) {
  return Boolean(snoozeUntil && snoozeUntil > nowIso);
}

function getLatestTimestamp(candidates: Array<string | null | undefined>) {
  const valid = candidates.filter((value): value is string => Boolean(value));

  if (valid.length === 0) {
    return null;
  }

  return valid.sort(
    (left, right) => new Date(right).getTime() - new Date(left).getTime(),
  )[0];
}

export function resolveQueuePriority(
  temperature: LeadTemperature,
  daysSinceLastFollowUp: number,
): QueuePriority {
  const threshold = TEMPERATURE_OVERDUE_THRESHOLDS[temperature];

  if (daysSinceLastFollowUp > threshold) {
    if (temperature === "hot") {
      return "critical";
    }

    if (temperature === "warm") {
      return "high";
    }

    return "medium";
  }

  return "low";
}

export function buildQueueReasons(input: {
  temperature: LeadTemperature;
  daysSinceLastFollowUp: number;
  hasFollowUpDueToday: boolean;
  daysSinceLastActivity: number;
  snoozeEndedToday: boolean;
}): QueueReason[] {
  const reasons: QueueReason[] = [];

  if (input.temperature === "hot" && input.daysSinceLastFollowUp > 1) {
    reasons.push({
      key: "hot_overdue",
      emoji: "🔥",
      label: `Hot lead overdue ${input.daysSinceLastFollowUp} days`,
    });
  }

  if (input.hasFollowUpDueToday) {
    reasons.push({
      key: "due_today",
      emoji: "📅",
      label: "Follow up due today",
    });
  }

  if (input.daysSinceLastActivity >= 7) {
    reasons.push({
      key: "no_activity",
      emoji: "⚠",
      label: `No activity for ${input.daysSinceLastActivity} days`,
    });
  }

  if (input.snoozeEndedToday) {
    reasons.push({
      key: "snooze_ended",
      emoji: "💤",
      label: "Snooze ended today",
    });
  }

  if (reasons.length === 0 && input.daysSinceLastFollowUp > 0) {
    reasons.push({
      key: "needs_follow_up",
      emoji: "📌",
      label: `No follow up for ${input.daysSinceLastFollowUp} days`,
    });
  }

  return reasons;
}

function shouldIncludeInQueue(input: {
  priority: QueuePriority;
  reasons: QueueReason[];
  hasPendingTask: boolean;
}) {
  return (
    input.priority !== "low" ||
    input.reasons.length > 0 ||
    input.hasPendingTask
  );
}

function formatActivityLabel(activity: ActivityRow | undefined) {
  if (!activity) {
    return "No activity yet";
  }

  const title = activity.title?.trim();
  if (title) {
    return title;
  }

  return activity.activity_type.replace(/_/g, " ");
}

export function buildFollowUpQueueItems(input: {
  leads: LeadRow[];
  followUpTasks: FollowUpTaskRow[];
  activities: ActivityRow[];
  now?: Date;
}): FollowUpQueueItem[] {
  const now = input.now ?? new Date();
  const nowIso = now.toISOString();
  const todayJakarta = getJakartaDateString(now);
  const { todayStart, todayEnd } = getFollowUpTodayBounds();

  const pendingTasksByLead = new Map<string, FollowUpTaskRow[]>();
  const completedTasksByLead = new Map<string, FollowUpTaskRow[]>();

  for (const task of input.followUpTasks) {
    const bucket =
      task.status === "completed" ? completedTasksByLead : pendingTasksByLead;
    const existing = bucket.get(task.lead_id) ?? [];
    existing.push(task);
    bucket.set(task.lead_id, existing);
  }

  const latestActivityByLead = new Map<string, ActivityRow>();

  for (const activity of input.activities) {
    const current = latestActivityByLead.get(activity.lead_id);

    if (
      !current ||
      new Date(activity.occurred_at).getTime() >
        new Date(current.occurred_at).getTime()
    ) {
      latestActivityByLead.set(activity.lead_id, activity);
    }
  }

  const latestFollowUpActivityByLead = new Map<string, ActivityRow>();

  for (const activity of input.activities) {
    if (!FOLLOW_UP_ACTIVITY_TYPES.has(activity.activity_type)) {
      continue;
    }

    const current = latestFollowUpActivityByLead.get(activity.lead_id);

    if (
      !current ||
      new Date(activity.occurred_at).getTime() >
        new Date(current.occurred_at).getTime()
    ) {
      latestFollowUpActivityByLead.set(activity.lead_id, activity);
    }
  }

  const items: FollowUpQueueItem[] = [];

  for (const lead of input.leads) {
    if (!isActiveLeadStatus(lead.status)) {
      continue;
    }

    if (isLeadSnoozed(lead.snooze_until, nowIso)) {
      continue;
    }

    const temperature = getEffectiveLeadTemperature(lead);
    const pendingTasks = pendingTasksByLead.get(lead.id) ?? [];
    const completedTasks = completedTasksByLead.get(lead.id) ?? [];
    const latestActivity = latestActivityByLead.get(lead.id);
    const latestFollowUpActivity = latestFollowUpActivityByLead.get(lead.id);
    const latestCompletedTask = completedTasks
      .slice()
      .sort(
        (left, right) =>
          new Date(right.updated_at).getTime() -
          new Date(left.updated_at).getTime(),
      )[0];

    const lastFollowUpAt = getLatestTimestamp([
      latestFollowUpActivity?.occurred_at,
      latestCompletedTask?.updated_at,
      lead.last_contacted_at,
    ]);

    const referenceFollowUpAt = lastFollowUpAt ?? lead.updated_at ?? lead.created_at;
    const daysSinceLastFollowUp = getDaysSince(referenceFollowUpAt, now.getTime());
    const daysSinceLastActivity = latestActivity
      ? getDaysSince(latestActivity.occurred_at, now.getTime())
      : getDaysSince(lead.created_at, now.getTime());

    const hasFollowUpDueToday = pendingTasks.some((task) => {
      const dueAt = new Date(task.due_date).getTime();
      return dueAt >= todayStart.getTime() && dueAt <= todayEnd.getTime();
    });

    const snoozeEndedToday = Boolean(
      lead.snooze_until &&
        lead.snooze_until <= nowIso &&
        toJakartaDateString(lead.snooze_until) === todayJakarta,
    );

    const priority = resolveQueuePriority(temperature.value, daysSinceLastFollowUp);
    const reasons = buildQueueReasons({
      temperature: temperature.value,
      daysSinceLastFollowUp,
      hasFollowUpDueToday,
      daysSinceLastActivity,
      snoozeEndedToday,
    });

    if (
      !shouldIncludeInQueue({
        priority,
        reasons,
        hasPendingTask: pendingTasks.length > 0,
      })
    ) {
      continue;
    }

    const nextAction = getLeadNextBestAction({
      status: lead.status,
      updatedAt: lead.updated_at,
    }).title;

    items.push({
      leadId: lead.id,
      leadName: lead.full_name,
      assignedSalesName: formatAssignedUserLabel(
        getLeadAssigneeName(lead.profiles),
      ),
      whatsappNumber: lead.whatsapp_number,
      phone: lead.phone,
      temperature: temperature.value,
      temperatureLabel: getLeadTemperatureLabel(
        temperature.value,
        temperature.isSuggested,
      ),
      status: lead.status,
      lastActivityAt: latestActivity?.occurred_at ?? null,
      lastActivityLabel: formatActivityLabel(latestActivity),
      daysSinceLastFollowUp,
      priority,
      priorityLabel: formatQueuePriorityLabel(priority),
      reasons,
      nextAction,
      snoozeEndedToday,
    });
  }

  return items.sort((left, right) => {
    const priorityDiff =
      getQueuePrioritySortOrder(left.priority) -
      getQueuePrioritySortOrder(right.priority);

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return right.daysSinceLastFollowUp - left.daysSinceLastFollowUp;
  });
}

export async function loadFollowUpQueue(
  supabase: SupabaseServerClient,
  organizationId: string,
  options: { assignedTo?: string | null } = {},
) {
  let leadsQuery = supabase
    .from("leads")
    .select(
      `
      id,
      full_name,
      status,
      assigned_to,
      updated_at,
      created_at,
      last_contacted_at,
      lead_temperature,
      snooze_until,
      whatsapp_number,
      phone,
      profiles:assigned_to ( full_name )
    `,
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .not("status", "in", "(won,lost)");

  if (options.assignedTo) {
    leadsQuery = leadsQuery.eq("assigned_to", options.assignedTo);
  }

  const { data: leads, error: leadsError } = await leadsQuery;

  if (leadsError) {
    console.error("Load follow-up queue leads error:", leadsError);
    throw new Error(leadsError.message);
  }

  const leadRows = (leads ?? []) as LeadRow[];
  const leadIds = leadRows.map((lead) => lead.id);

  if (leadIds.length === 0) {
    return [];
  }

  const [{ data: followUpTasks, error: tasksError }, { data: activities, error: activitiesError }] =
    await Promise.all([
      supabase
        .from("follow_up_tasks")
        .select("lead_id, due_date, status, updated_at")
        .eq("organization_id", organizationId)
        .in("lead_id", leadIds),
      supabase
        .from("lead_activities")
        .select("lead_id, activity_type, title, occurred_at")
        .eq("organization_id", organizationId)
        .in("lead_id", leadIds)
        .order("occurred_at", { ascending: false }),
    ]);

  if (tasksError) {
    console.error("Load follow-up queue tasks error:", tasksError);
    throw new Error(tasksError.message);
  }

  if (activitiesError) {
    console.error("Load follow-up queue activities error:", activitiesError);
    throw new Error(activitiesError.message);
  }

  return buildFollowUpQueueItems({
    leads: leadRows,
    followUpTasks: (followUpTasks ?? []) as FollowUpTaskRow[],
    activities: (activities ?? []) as ActivityRow[],
  });
}

export function summarizeFollowUpQueue(items: FollowUpQueueItem[]) {
  return {
    requiringFollowUp: items.length,
    overdueLeads: items.filter((item) => item.daysSinceLastFollowUp > 0).length,
    hotOverdueLeads: items.filter(
      (item) => item.temperature === "hot" && item.daysSinceLastFollowUp > 1,
    ).length,
    dueTodayLeads: items.filter((item) =>
      item.reasons.some((reason) => reason.key === "due_today"),
    ).length,
    criticalLeads: items.filter((item) => item.priority === "critical").length,
  };
}
