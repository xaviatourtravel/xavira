import type { createClient } from "@/utils/supabase/server";

import { formatAutomaticFollowUpTitle } from "@/lib/leads/follow-up-task-display";

type AutomaticFollowUpProfile = {
  id: string;
  organization_id: string;
};

const AUTOMATIC_FOLLOW_UP_ACTIVITY_TYPE = "follow_up_generated" as const;

const STATUS_FOLLOW_UP_CONFIG = {
  proposal_sent: {
    title: "Follow up proposal",
    dueDays: 2,
    activityTitle: "Follow up proposal otomatis dibuat",
    activityBody:
      "Sistem membuat follow up proposal karena status lead berubah menjadi proposal sent.",
  },
  negotiating: {
    title: "Follow up negosiasi",
    dueDays: 1,
    activityTitle: "Follow up negosiasi otomatis dibuat",
    activityBody:
      "Sistem membuat follow up negosiasi karena status lead berubah menjadi negotiating.",
  },
} as const;

type StatusFollowUpStatus = keyof typeof STATUS_FOLLOW_UP_CONFIG;

export function getFollowUpDueDateInDays(days: number, from = new Date()) {
  const dueDate = new Date(from);
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate.toISOString();
}

export function getFirstFollowUpDueDate(from = new Date()) {
  return getFollowUpDueDateInDays(1, from);
}

async function createAutomaticFollowUpWithActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: AutomaticFollowUpProfile,
  leadId: string,
  task: {
    title: string;
    dueDays: number;
  },
  activity: {
    title: string;
    body: string;
  },
) {
  const { error: followUpError } = await supabase.from("follow_up_tasks").insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    title: formatAutomaticFollowUpTitle(task.title),
    status: "pending",
    due_date: getFollowUpDueDateInDays(task.dueDays),
    created_by: profile.id,
  });

  if (followUpError) {
    return;
  }

  await supabase.from("lead_activities").insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    actor_id: profile.id,
    activity_type: AUTOMATIC_FOLLOW_UP_ACTIVITY_TYPE,
    title: activity.title,
    body: activity.body,
  });
}

export async function createAutomaticFirstFollowUpTask(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: AutomaticFollowUpProfile,
  leadId: string,
) {
  await createAutomaticFollowUpWithActivity(
    supabase,
    profile,
    leadId,
    {
      title: "Follow up pertama",
      dueDays: 1,
    },
    {
      title: "Follow up pertama otomatis dibuat",
      body: "Sistem membuat follow up pertama untuk lead ini.",
    },
  );
}

export async function createAutomaticStatusFollowUpTask(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: AutomaticFollowUpProfile,
  leadId: string,
  previousStatus: string,
  newStatus: string,
) {
  if (previousStatus === newStatus) {
    return;
  }

  if (!(newStatus in STATUS_FOLLOW_UP_CONFIG)) {
    return;
  }

  const config = STATUS_FOLLOW_UP_CONFIG[newStatus as StatusFollowUpStatus];

  await createAutomaticFollowUpWithActivity(
    supabase,
    profile,
    leadId,
    {
      title: config.title,
      dueDays: config.dueDays,
    },
    {
      title: config.activityTitle,
      body: config.activityBody,
    },
  );
}
