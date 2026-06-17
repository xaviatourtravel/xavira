import { getFollowUpTodayBounds } from "@/lib/follow-ups/list-filters";
import {
  getJakartaDateString,
  getJakartaMonthKey,
  toJakartaDateString,
} from "@/lib/dashboard/jakarta-date";

type FollowUpTaskComplianceRow = {
  due_date: string;
  status: string;
  updated_at: string;
};

export type FollowUpComplianceSnapshot = {
  followedOnTime: number;
  totalRequiringFollowUp: number;
  complianceRate: number;
};

export type FollowUpComplianceMetrics = {
  today: FollowUpComplianceSnapshot;
  thisMonth: FollowUpComplianceSnapshot;
};

function isTaskCompletedOnTime(task: FollowUpTaskComplianceRow) {
  if (task.status !== "completed") {
    return false;
  }

  return new Date(task.updated_at).getTime() <= new Date(task.due_date).getTime();
}

function isTaskDueInToday(task: FollowUpTaskComplianceRow) {
  const { todayStart, todayEnd } = getFollowUpTodayBounds();
  const dueAt = new Date(task.due_date).getTime();

  return dueAt >= todayStart.getTime() && dueAt <= todayEnd.getTime();
}

function isTaskDueInCurrentMonth(
  task: FollowUpTaskComplianceRow,
  now = new Date(),
) {
  const dueDate = toJakartaDateString(task.due_date);
  const currentMonth = getJakartaMonthKey(getJakartaDateString(now));

  return getJakartaMonthKey(dueDate) === currentMonth;
}

function buildComplianceSnapshot(
  tasks: FollowUpTaskComplianceRow[],
  predicate: (task: FollowUpTaskComplianceRow) => boolean,
): FollowUpComplianceSnapshot {
  const relevantTasks = tasks.filter(predicate);
  const followedOnTime = relevantTasks.filter(isTaskCompletedOnTime).length;
  const totalRequiringFollowUp = relevantTasks.length;
  const complianceRate =
    totalRequiringFollowUp > 0
      ? Math.round((followedOnTime / totalRequiringFollowUp) * 100)
      : 100;

  return {
    followedOnTime,
    totalRequiringFollowUp,
    complianceRate,
  };
}

export function buildFollowUpComplianceMetrics(
  tasks: FollowUpTaskComplianceRow[],
  now = new Date(),
): FollowUpComplianceMetrics {
  return {
    today: buildComplianceSnapshot(tasks, (task) => isTaskDueInToday(task)),
    thisMonth: buildComplianceSnapshot(tasks, (task) =>
      isTaskDueInCurrentMonth(task, now),
    ),
  };
}

export async function loadFollowUpComplianceMetrics(
  supabase: Awaited<ReturnType<typeof import("@/utils/supabase/server").createClient>>,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("follow_up_tasks")
    .select("due_date, status, updated_at")
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Load follow-up compliance metrics error:", error);
    throw new Error(error.message);
  }

  return buildFollowUpComplianceMetrics((data ?? []) as FollowUpTaskComplianceRow[]);
}
