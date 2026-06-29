import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { Profile } from "@/types/app-types";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { getFollowUpTodayBounds } from "@/lib/follow-ups/list-filters";
import { buildDerivedTaskId } from "@/lib/tasks/map-task-row";
import type { WorkspaceTask } from "@/lib/tasks/types";

type AppSupabase = SupabaseClient<Database>;

const DERIVED_TASK_LIMIT = 40;

function hasParticipantGap(participant: {
  passport_number: string | null;
  passport_photo_url: string | null;
  emergency_contact: string | null;
  full_name: string;
}) {
  const missingPassport =
    !participant.passport_number?.trim() || !participant.passport_photo_url?.trim();
  const missingEmergency = !participant.emergency_contact?.trim();

  return missingPassport || missingEmergency;
}

function buildConversationTask(
  conversation: {
    id: string;
    customer_name: string | null;
    unread_count: number;
    last_message_at: string | null;
    lead_id: string | null;
    status: string;
  },
): WorkspaceTask {
  const priority = conversation.status === "following_up" ? "urgent" : "high";
  const customerName = conversation.customer_name?.trim() || "Customer";
  const href = `/inbox?c=${conversation.id}`;

  return {
    id: buildDerivedTaskId("reply_conversation", conversation.id),
    isDerived: true,
    title: `Reply to ${customerName}`,
    description: `${conversation.unread_count} unread message${conversation.unread_count === 1 ? "" : "s"} waiting for a response.`,
    taskType: "reply_conversation",
    status: "open",
    priority,
    dueAt: conversation.last_message_at,
    customerName,
    customerId: conversation.lead_id,
    leadId: conversation.lead_id,
    conversationId: conversation.id,
    bookingId: null,
    paymentId: null,
    participantId: null,
    sourceLinks: [
      {
        type: "conversation",
        id: conversation.id,
        label: "Conversation",
        href,
      },
      ...(conversation.lead_id
        ? [
            {
              type: "lead" as const,
              id: conversation.lead_id,
              label: "Customer",
              href: `/customers/${conversation.lead_id}`,
            },
          ]
        : []),
    ],
    primaryAction: { kind: "reply", href, label: "Reply" },
    assignedTo: null,
  };
}

function buildFollowUpTask(task: {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  lead_id: string;
  leads?: { full_name: string } | Array<{ full_name: string }> | null;
}): WorkspaceTask {
  const lead = Array.isArray(task.leads) ? (task.leads[0] ?? null) : task.leads;
  const customerName = lead?.full_name?.trim() || "Customer";
  const isOverdue = new Date(task.due_date).getTime() < Date.now();

  return {
    id: buildDerivedTaskId("follow_up_customer", task.id),
    isDerived: true,
    title: task.title,
    description:
      task.description ||
      `Follow up with ${customerName}${isOverdue ? " — overdue." : "."}`,
    taskType: "follow_up_customer",
    status: isOverdue ? "overdue" : "open",
    priority: isOverdue ? "urgent" : "high",
    dueAt: task.due_date,
    customerName,
    customerId: task.lead_id,
    leadId: task.lead_id,
    conversationId: null,
    bookingId: null,
    paymentId: null,
    participantId: null,
    sourceLinks: [
      {
        type: "lead",
        id: task.lead_id,
        label: "Customer",
        href: `/customers/${task.lead_id}`,
      },
    ],
    primaryAction: {
      kind: "open_customer",
      href: `/customers/${task.lead_id}`,
      label: "Open Customer",
    },
    assignedTo: null,
  };
}

function buildPaymentTask(booking: {
  id: string;
  customer_name: string;
  booking_code: string | null;
  payment_status: string;
  total_amount: number;
  lead_id: string | null;
}): WorkspaceTask {
  const href = `/bookings/${booking.id}`;
  const isUnpaid = booking.payment_status === "unpaid";

  return {
    id: buildDerivedTaskId("confirm_payment", booking.id),
    isDerived: true,
    title: isUnpaid
      ? `Confirm payment for ${booking.customer_name}`
      : `Follow up DP for ${booking.customer_name}`,
    description: isUnpaid
      ? "Booking is unpaid and needs payment confirmation."
      : "Down payment received — confirm remaining balance or next step.",
    taskType: "confirm_payment",
    status: "open",
    priority: isUnpaid ? "high" : "normal",
    dueAt: null,
    customerName: booking.customer_name,
    customerId: booking.lead_id,
    leadId: booking.lead_id,
    conversationId: null,
    bookingId: booking.id,
    paymentId: null,
    participantId: null,
    sourceLinks: [
      {
        type: "booking",
        id: booking.id,
        label: booking.booking_code?.trim() || "Booking",
        href,
      },
    ],
    primaryAction: { kind: "open_booking", href, label: "Open Booking" },
    assignedTo: null,
  };
}

function buildParticipantTask(participant: {
  id: string;
  full_name: string;
  booking_id: string;
  passport_number: string | null;
  passport_photo_url: string | null;
  emergency_contact: string | null;
  bookings?: {
    customer_name: string;
    booking_code: string | null;
    lead_id: string | null;
  } | Array<{
    customer_name: string;
    booking_code: string | null;
    lead_id: string | null;
  }> | null;
}): WorkspaceTask {
  const booking = Array.isArray(participant.bookings)
    ? (participant.bookings[0] ?? null)
    : participant.bookings;
  const href = `/bookings/${participant.booking_id}`;
  const missingPassport =
    !participant.passport_number?.trim() || !participant.passport_photo_url?.trim();

  return {
    id: buildDerivedTaskId("complete_participant_data", participant.id),
    isDerived: true,
    title: missingPassport
      ? `Request passport for ${participant.full_name}`
      : `Complete data for ${participant.full_name}`,
    description: missingPassport
      ? "Passport number or photo is still missing."
      : "Emergency contact or participant details are incomplete.",
    taskType: missingPassport ? "request_passport" : "complete_participant_data",
    status: "open",
    priority: "normal",
    dueAt: null,
    customerName: booking?.customer_name?.trim() || participant.full_name,
    customerId: booking?.lead_id ?? null,
    leadId: booking?.lead_id ?? null,
    conversationId: null,
    bookingId: participant.booking_id,
    paymentId: null,
    participantId: participant.id,
    sourceLinks: [
      {
        type: "booking",
        id: participant.booking_id,
        label: booking?.booking_code?.trim() || "Booking",
        href,
      },
      {
        type: "participant",
        id: participant.id,
        label: participant.full_name,
        href,
      },
    ],
    primaryAction: { kind: "open_booking", href, label: "Open Booking" },
    assignedTo: null,
  };
}

async function loadMyLeadIds(
  supabase: AppSupabase,
  profile: Profile,
): Promise<string[]> {
  const { data } = await supabase
    .from("leads")
    .select("id")
    .eq("organization_id", profile.organization_id)
    .eq("assigned_to", profile.id)
    .is("deleted_at", null);

  return (data ?? []).map((lead) => lead.id);
}

export async function deriveWorkspaceTasks(
  supabase: AppSupabase,
  profile: Profile,
): Promise<WorkspaceTask[]> {
  const viewAll = isAdminOrOwner(profile);
  const myLeadIds = viewAll ? null : await loadMyLeadIds(supabase, profile);
  const { todayEnd } = getFollowUpTodayBounds();

  let conversationsQuery = supabase
    .from("conversations")
    .select("id, customer_name, unread_count, last_message_at, lead_id, status, assigned_user_id")
    .eq("organization_id", profile.organization_id)
    .gt("unread_count", 0)
    .order("last_message_at", { ascending: false })
    .limit(15);

  if (!viewAll) {
    conversationsQuery = conversationsQuery.or(
      `assigned_user_id.eq.${profile.id},assigned_user_id.is.null`,
    );
  }

  let followUpsQuery = supabase
    .from("follow_up_tasks")
    .select(`
      id,
      title,
      description,
      due_date,
      lead_id,
      leads ( full_name )
    `)
    .eq("organization_id", profile.organization_id)
    .eq("status", "pending")
    .lte("due_date", todayEnd.toISOString())
    .order("due_date", { ascending: true })
    .limit(15);

  if (myLeadIds) {
    if (myLeadIds.length === 0) {
      followUpsQuery = followUpsQuery.in("lead_id", ["00000000-0000-0000-0000-000000000000"]);
    } else {
      followUpsQuery = followUpsQuery.in("lead_id", myLeadIds);
    }
  }

  const bookingsQuery = supabase
    .from("bookings")
    .select("id, customer_name, booking_code, payment_status, total_amount, lead_id")
    .eq("organization_id", profile.organization_id)
    .in("payment_status", ["unpaid", "dp_paid", "partial_paid", "pending"])
    .neq("booking_status", "cancelled")
    .order("updated_at", { ascending: false })
    .limit(15);

  const participantsQuery = supabase
    .from("booking_participants")
    .select(`
      id,
      full_name,
      booking_id,
      passport_number,
      passport_photo_url,
      emergency_contact,
      bookings!inner (
        organization_id,
        customer_name,
        booking_code,
        lead_id,
        booking_status
      )
    `)
    .eq("bookings.organization_id", profile.organization_id)
    .neq("bookings.booking_status", "cancelled")
    .limit(30);

  const [
    { data: conversations },
    { data: followUps },
    { data: bookings },
    { data: participants },
  ] = await Promise.all([
    conversationsQuery,
    followUpsQuery,
    bookingsQuery,
    participantsQuery,
  ]);

  const derived: WorkspaceTask[] = [];

  for (const conversation of conversations ?? []) {
    derived.push(buildConversationTask(conversation));
  }

  for (const followUp of followUps ?? []) {
    derived.push(buildFollowUpTask(followUp));
  }

  for (const booking of bookings ?? []) {
    derived.push(buildPaymentTask(booking));
  }

  for (const participant of participants ?? []) {
    if (hasParticipantGap(participant)) {
      derived.push(buildParticipantTask(participant));
    }
  }

  return derived.slice(0, DERIVED_TASK_LIMIT);
}

export async function countUnreadConversations(
  supabase: AppSupabase,
  profile: Profile,
) {
  const viewAll = isAdminOrOwner(profile);

  let query = supabase
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id)
    .gt("unread_count", 0);

  if (!viewAll) {
    query = query.or(
      `assigned_user_id.eq.${profile.id},assigned_user_id.is.null`,
    );
  }

  const { count } = await query;
  return count ?? 0;
}

export async function countPaymentsToConfirm(
  supabase: AppSupabase,
  organizationId: string,
) {
  const { count } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("payment_status", ["unpaid", "dp_paid", "partial_paid", "pending"])
    .neq("booking_status", "cancelled");

  return count ?? 0;
}
