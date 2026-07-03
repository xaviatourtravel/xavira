import type { Profile } from "@/types/app-types";
import { loadAuditLogs } from "@/lib/audit";
import { getJakartaDayBounds } from "@/lib/audit/queries";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { ACTIVE_TASK_STATUSES } from "@/lib/tasks/constants";
import {
  countPaymentsToConfirm,
  countUnreadConversations,
  deriveWorkspaceTasks,
} from "@/lib/tasks/derive-tasks";
import { mapSavedTaskRow } from "@/lib/tasks/map-task-row";
import { compareTasksByPriority, isTaskOverdue } from "@/lib/tasks/priority";
import {
  buildDailyObjective,
  buildMorningBrief,
  estimateTaskMinutes,
  estimateTotalMinutes,
  getGreetingLabel,
  getGreetingPeriod,
  getTaskBusinessImpact,
  getTaskReason,
  groupTasksForQueue,
  pickDailyInsight,
} from "@/lib/tasks/today-intelligence";
import type {
  TodayActivityItem,
  TodayFocusSection,
  TodaySummaryMetrics,
  TodayWorkspaceData,
  WorkspaceHealthIndicator,
  WorkspaceHealthStatus,
  WorkspaceTask,
} from "@/lib/tasks/types";
import { createClient } from "@/utils/supabase/server";

function buildFocusSections(tasks: WorkspaceTask[]): TodayFocusSection[] {
  const now = Date.now();
  const dueSoonCutoff = now + 24 * 60 * 60 * 1000;

  const highPriority = tasks
    .filter((task) => task.priority === "urgent" || task.priority === "high")
    .slice(0, 5);

  const dueSoon = tasks
    .filter((task) => {
      if (!task.dueAt) {
        return false;
      }

      const dueTime = new Date(task.dueAt).getTime();
      return dueTime >= now && dueTime <= dueSoonCutoff;
    })
    .slice(0, 5);

  const waitingReply = tasks
    .filter(
      (task) =>
        task.taskType === "reply_conversation" ||
        task.taskType === "resolve_inbox_unread",
    )
    .slice(0, 5);

  const readyForHuman = tasks
    .filter((task) => task.taskType === "take_over_qualified_lead")
    .slice(0, 5);

  const paymentAttention = tasks
    .filter(
      (task) =>
        task.taskType === "confirm_payment" ||
        task.taskType === "send_payment_reminder",
    )
    .slice(0, 5);

  return [
    {
      id: "high-priority",
      title: "High priority",
      tasks: highPriority,
      emptyLabel: "No high-priority items right now.",
    },
    {
      id: "due-soon",
      title: "Due soon",
      tasks: dueSoon,
      emptyLabel: "Nothing due in the next 24 hours.",
    },
    {
      id: "waiting-reply",
      title: "Waiting reply",
      tasks: waitingReply,
      emptyLabel: "Inbox is caught up.",
    },
    {
      id: "ready-for-human",
      title: "Ready for human",
      tasks: readyForHuman,
      emptyLabel: "No qualified leads waiting for handover.",
    },
    {
      id: "payment-attention",
      title: "Payment attention",
      tasks: paymentAttention,
      emptyLabel: "No payment follow-ups needed.",
    },
    {
      id: "ai-suggestions",
      title: "AI suggestions",
      tasks: [],
      emptyLabel: "AI task suggestions will appear here soon.",
    },
  ];
}

function buildSummary(
  tasks: WorkspaceTask[],
  unreadConversations: number,
  paymentsToConfirm: number,
): TodaySummaryMetrics {
  const overdueTasks = tasks.filter(
    (task) =>
      task.status === "overdue" || isTaskOverdue(task.dueAt, task.status),
  ).length;

  return {
    openTasks: tasks.length,
    overdueTasks,
    unreadConversations,
    paymentsToConfirm,
  };
}

function sortTasks(tasks: WorkspaceTask[]) {
  return [...tasks].sort(compareTasksByPriority);
}

function statusFromCount(
  count: number,
  warningAt: number,
  criticalAt: number,
): WorkspaceHealthStatus {
  if (count >= criticalAt) {
    return "critical";
  }

  if (count >= warningAt) {
    return "attention";
  }

  return "healthy";
}

function buildHealthIndicators(input: {
  unreadConversations: number;
  overdueTasks: number;
  paymentsToConfirm: number;
  oldestUnreadHours: number | null;
  knowledgeCount: number;
}): WorkspaceHealthIndicator[] {
  const responseStatus: WorkspaceHealthStatus =
    input.oldestUnreadHours != null && input.oldestUnreadHours >= 4
      ? "critical"
      : input.unreadConversations >= 3
        ? "attention"
        : input.unreadConversations > 0
          ? "attention"
          : "healthy";

  const followUpStatus = statusFromCount(input.overdueTasks, 1, 3);
  const paymentStatus = statusFromCount(input.paymentsToConfirm, 1, 4);
  const inboxStatus = statusFromCount(input.unreadConversations, 1, 5);
  const knowledgeStatus: WorkspaceHealthStatus =
    input.knowledgeCount === 0 ? "attention" : "healthy";

  return [
    {
      id: "response-time",
      label: "Response Time",
      status: responseStatus,
      detail:
        input.unreadConversations === 0
          ? "Semua percakapan sudah dibalas"
          : input.oldestUnreadHours != null
            ? `${input.unreadConversations} unread · tertua ~${Math.round(input.oldestUnreadHours)}j`
            : `${input.unreadConversations} percakapan menunggu`,
      href: "/inbox",
    },
    {
      id: "follow-up",
      label: "Follow Up",
      status: followUpStatus,
      detail:
        input.overdueTasks === 0
          ? "Tidak ada follow up overdue"
          : `${input.overdueTasks} task melewati deadline`,
      href: "/follow-ups/queue",
    },
    {
      id: "payments",
      label: "Payments",
      status: paymentStatus,
      detail:
        input.paymentsToConfirm === 0
          ? "Pembayaran terpantau"
          : `${input.paymentsToConfirm} perlu konfirmasi`,
      href: "/bookings",
    },
    {
      id: "inbox",
      label: "Inbox",
      status: inboxStatus,
      detail:
        input.unreadConversations === 0
          ? "Inbox caught up"
          : `${input.unreadConversations} thread aktif`,
      href: "/inbox",
    },
    {
      id: "knowledge",
      label: "Knowledge",
      status: knowledgeStatus,
      detail:
        input.knowledgeCount === 0
          ? "Belum ada SOP — pertimbangkan menambah"
          : `${input.knowledgeCount} artikel tersedia`,
      href: "/knowledge",
    },
  ];
}

function formatAuditActivityLabel(action: string, entityLabel: string | null) {
  const labels: Record<string, string> = {
    team_member_invited: "Undangan tim dikirim",
    first_run_completed: "Setup workspace selesai",
    demo_request_submitted: "Demo request diterima",
    lead_created: "Lead baru dibuat",
    booking_created: "Booking dibuat",
    follow_up_created: "Follow up dijadwalkan",
  };

  if (labels[action]) {
    return labels[action];
  }

  return entityLabel?.trim() || action.replace(/_/g, " ");
}

function mapAuditToTimeline(
  logs: Awaited<ReturnType<typeof loadAuditLogs>>,
): TodayActivityItem[] {
  return logs.slice(0, 8).map((log) => ({
    id: log.id,
    label: formatAuditActivityLabel(log.action, log.entity_label),
    detail: log.entity_label,
    timestamp: log.created_at,
    href: null,
  }));
}

async function countCompletedTasksToday(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  profileId: string,
  viewAll: boolean,
) {
  const { from, to } = getJakartaDayBounds();

  let query = supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "completed")
    .gte("completed_at", from)
    .lte("completed_at", to);

  if (!viewAll) {
    query = query.or(
      `assigned_to.eq.${profileId},assigned_to.is.null,created_by.eq.${profileId}`,
    );
  }

  const { count } = await query;
  return count ?? 0;
}

async function loadOldestUnreadAgeHours(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: Profile,
) {
  const viewAll = isAdminOrOwner(profile);

  let omnichannelQuery = supabase
    .from("conversations")
    .select("last_message_at")
    .eq("organization_id", profile.organization_id)
    .gt("unread_count", 0)
    .order("last_message_at", { ascending: true })
    .limit(1);

  let whatsappQuery = supabase
    .from("whatsapp_conversations")
    .select("last_message_at")
    .eq("workspace_id", profile.organization_id)
    .gt("unread_count", 0)
    .order("last_message_at", { ascending: true })
    .limit(1);

  if (!viewAll) {
    omnichannelQuery = omnichannelQuery.or(
      `assigned_user_id.eq.${profile.id},assigned_user_id.is.null`,
    );
    whatsappQuery = whatsappQuery.or(
      `assigned_user_id.eq.${profile.id},assigned_user_id.is.null`,
    );
  }

  const [{ data: omnichannelData }, { data: whatsappData }] = await Promise.all([
    omnichannelQuery,
    whatsappQuery,
  ]);

  const candidates = [
    omnichannelData?.[0]?.last_message_at,
    whatsappData?.[0]?.last_message_at,
  ].filter((value): value is string => Boolean(value));

  if (candidates.length === 0) {
    return null;
  }

  const oldest = candidates.reduce((earliest, current) =>
    new Date(current).getTime() < new Date(earliest).getTime()
      ? current
      : earliest,
  );

  const hours = (Date.now() - new Date(oldest).getTime()) / (1000 * 60 * 60);
  return Math.max(0, hours);
}

export async function loadTodayWorkspace(
  profile: Profile,
): Promise<TodayWorkspaceData> {
  const supabase = await createClient();
  const viewAll = isAdminOrOwner(profile);

  let savedTasksQuery = supabase
    .from("tasks")
    .select(`
      id,
      title,
      description,
      task_type,
      status,
      priority,
      due_at,
      customer_id,
      lead_id,
      conversation_id,
      booking_id,
      payment_id,
      participant_id,
      assigned_to,
      leads:lead_id ( full_name ),
      conversations:conversation_id ( customer_name ),
      bookings:booking_id ( customer_name, booking_code )
    `)
    .eq("organization_id", profile.organization_id)
    .in("status", ACTIVE_TASK_STATUSES)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(100);

  if (!viewAll) {
    savedTasksQuery = savedTasksQuery.or(
      `assigned_to.eq.${profile.id},assigned_to.is.null,created_by.eq.${profile.id}`,
    );
  }

  const [
    { data: savedRows },
    unreadConversations,
    paymentsToConfirm,
    completedToday,
    oldestUnreadHours,
    { count: knowledgeCount },
    auditLogs,
  ] = await Promise.all([
    savedTasksQuery,
    countUnreadConversations(supabase, profile),
    countPaymentsToConfirm(supabase, profile.organization_id),
    countCompletedTasksToday(
      supabase,
      profile.organization_id,
      profile.id,
      viewAll,
    ),
    loadOldestUnreadAgeHours(supabase, profile),
    supabase
      .from("knowledge_entries")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id),
    loadAuditLogs(supabase, profile.organization_id, { limit: 8 }),
  ]);

  const savedTasks = (savedRows ?? []).map((row) => mapSavedTaskRow(row));
  const usingDerivedTasks = savedTasks.length === 0;

  const tasks = usingDerivedTasks
    ? sortTasks(await deriveWorkspaceTasks(supabase, profile))
    : sortTasks(savedTasks);

  const summary = buildSummary(tasks, unreadConversations, paymentsToConfirm);
  const userName = profile.full_name?.trim() || "there";
  const greetingPeriod = getGreetingPeriod();
  const topTask = tasks[0] ?? null;
  const remainingMinutes = estimateTotalMinutes(tasks);
  const totalTasksToday = completedToday + tasks.length;
  const progressPercent =
    totalTasksToday === 0
      ? 100
      : Math.round((completedToday / totalTasksToday) * 100);

  const insightTemplate = pickDailyInsight({
    unreadConversations,
    overdueTasks: summary.overdueTasks,
    paymentsToConfirm,
    openTasks: tasks.length,
    knowledgeCount: knowledgeCount ?? 0,
  });

  return {
    userName,
    tasks,
    summary,
    focusSections: buildFocusSections(tasks),
    usingDerivedTasks,
    morningBrief: {
      greeting: getGreetingLabel(greetingPeriod),
      brief: buildMorningBrief({
        tasks,
        unreadConversations,
        paymentsToConfirm,
        overdueTasks: summary.overdueTasks,
      }),
      dailyObjective: buildDailyObjective({
        tasks,
        unreadConversations,
        paymentsToConfirm,
      }),
    },
    nextBestAction: topTask
      ? {
          task: topTask,
          reason: getTaskReason(topTask),
          estimatedMinutes: estimateTaskMinutes(topTask),
          businessImpact: getTaskBusinessImpact(topTask),
        }
      : null,
    progress: {
      completedTasks: completedToday,
      remainingTasks: tasks.length,
      totalTasksToday,
      progressPercent,
      estimatedMinutesRemaining: remainingMinutes,
    },
    healthIndicators: buildHealthIndicators({
      unreadConversations,
      overdueTasks: summary.overdueTasks,
      paymentsToConfirm,
      oldestUnreadHours,
      knowledgeCount: knowledgeCount ?? 0,
    }),
    priorityQueue: groupTasksForQueue(tasks),
    aiInsight: {
      message: insightTemplate.message,
      actionLabel: insightTemplate.actionLabel,
      actionHref: insightTemplate.actionHref,
    },
    activityTimeline: mapAuditToTimeline(auditLogs),
  };
}
