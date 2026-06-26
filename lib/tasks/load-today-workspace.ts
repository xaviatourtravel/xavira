import type { Profile } from "@/types/app-types";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { ACTIVE_TASK_STATUSES } from "@/lib/tasks/constants";
import {
  countPaymentsToConfirm,
  countUnreadConversations,
  deriveWorkspaceTasks,
} from "@/lib/tasks/derive-tasks";
import { mapSavedTaskRow } from "@/lib/tasks/map-task-row";
import { compareTasksByPriority, isTaskOverdue } from "@/lib/tasks/priority";
import type {
  TodayFocusSection,
  TodaySummaryMetrics,
  TodayWorkspaceData,
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

  const [{ data: savedRows }, unreadConversations, paymentsToConfirm] =
    await Promise.all([
      savedTasksQuery,
      countUnreadConversations(supabase, profile),
      countPaymentsToConfirm(supabase, profile.organization_id),
    ]);

  const savedTasks = (savedRows ?? []).map((row) => mapSavedTaskRow(row));
  const usingDerivedTasks = savedTasks.length === 0;

  const tasks = usingDerivedTasks
    ? sortTasks(await deriveWorkspaceTasks(supabase, profile))
    : sortTasks(savedTasks);

  const userName = profile.full_name?.trim() || "there";

  return {
    userName,
    tasks,
    summary: buildSummary(tasks, unreadConversations, paymentsToConfirm),
    focusSections: buildFocusSections(tasks),
    usingDerivedTasks,
  };
}
