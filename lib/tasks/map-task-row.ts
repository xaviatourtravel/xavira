import type { TaskPrimaryAction, TaskSourceLink, WorkspaceTask } from "@/lib/tasks/types";
import {
  isTaskPriority,
  isTaskStatus,
  isTaskType,
  type TaskStatus,
  type TaskType,
} from "@/lib/tasks/constants";
import { resolveDisplayStatus } from "@/lib/tasks/priority";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  status: string;
  priority: string;
  due_at: string | null;
  customer_id: string | null;
  lead_id: string | null;
  conversation_id: string | null;
  booking_id: string | null;
  payment_id: string | null;
  participant_id: string | null;
  assigned_to: string | null;
  leads?: { full_name: string } | Array<{ full_name: string }> | null;
  customers?: { full_name: string } | Array<{ full_name: string }> | null;
  conversations?: { customer_name: string | null } | Array<{ customer_name: string | null }> | null;
  bookings?: { customer_name: string; booking_code: string | null } | Array<{ customer_name: string; booking_code: string | null }> | null;
};

function pickRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function buildSourceLinks(row: TaskRow): TaskSourceLink[] {
  const links: TaskSourceLink[] = [];

  if (row.conversation_id) {
    links.push({
      type: "conversation",
      id: row.conversation_id,
      label: "Conversation",
      href: `/inbox?c=${row.conversation_id}`,
    });
  }

  const leadId = row.lead_id ?? row.customer_id;
  if (leadId) {
    links.push({
      type: "lead",
      id: leadId,
      label: "Customer",
      href: `/customers/${leadId}`,
    });
  }

  if (row.booking_id) {
    const booking = pickRelation(row.bookings);
    links.push({
      type: "booking",
      id: row.booking_id,
      label: booking?.booking_code?.trim() || "Booking",
      href: `/bookings/${row.booking_id}`,
    });
  }

  if (row.payment_id) {
    links.push({
      type: "payment",
      id: row.payment_id,
      label: "Payment",
      href: row.booking_id ? `/bookings/${row.booking_id}` : "/bookings",
    });
  }

  if (row.participant_id && row.booking_id) {
    links.push({
      type: "participant",
      id: row.participant_id,
      label: "Participant",
      href: `/bookings/${row.booking_id}`,
    });
  }

  return links;
}

function buildPrimaryAction(
  taskType: TaskType | string,
  row: TaskRow,
  sourceLinks: TaskSourceLink[],
): TaskPrimaryAction {
  const leadId = row.lead_id ?? row.customer_id;
  const conversationLink = sourceLinks.find((link) => link.type === "conversation");
  const bookingLink = sourceLinks.find((link) => link.type === "booking");

  if (
    (taskType === "reply_conversation" ||
      taskType === "resolve_inbox_unread") &&
    conversationLink
  ) {
    return { kind: "reply", href: conversationLink.href, label: "Reply" };
  }

  if (leadId) {
    return {
      kind: "open_customer",
      href: `/customers/${leadId}`,
      label: "Open Customer",
    };
  }

  if (bookingLink) {
    return {
      kind: "open_booking",
      href: bookingLink.href,
      label: "Open Booking",
    };
  }

  if (leadId) {
    return {
      kind: "open_lead",
      href: `/leads/${leadId}`,
      label: "Open Lead",
    };
  }

  return { kind: "mark_done", label: "Mark Done" };
}

function resolveCustomerName(row: TaskRow) {
  const lead = pickRelation(row.leads);
  const customer = pickRelation(row.customers);
  const conversation = pickRelation(row.conversations);
  const booking = pickRelation(row.bookings);

  return (
    lead?.full_name?.trim() ||
    customer?.full_name?.trim() ||
    conversation?.customer_name?.trim() ||
    booking?.customer_name?.trim() ||
    null
  );
}

export function mapSavedTaskRow(row: TaskRow): WorkspaceTask {
  const taskType = isTaskType(row.task_type) ? row.task_type : row.task_type;
  const priority = isTaskPriority(row.priority) ? row.priority : "normal";
  const status = resolveDisplayStatus(
    isTaskStatus(row.status) ? row.status : "open",
    row.due_at,
  ) as TaskStatus | string;
  const sourceLinks = buildSourceLinks(row);

  return {
    id: row.id,
    isDerived: false,
    title: row.title,
    description: row.description,
    taskType,
    status,
    priority,
    dueAt: row.due_at,
    customerName: resolveCustomerName(row),
    customerId: row.customer_id,
    leadId: row.lead_id ?? row.customer_id,
    conversationId: row.conversation_id,
    bookingId: row.booking_id,
    paymentId: row.payment_id,
    participantId: row.participant_id,
    sourceLinks,
    primaryAction: buildPrimaryAction(taskType, row, sourceLinks),
    assignedTo: row.assigned_to,
  };
}

export function buildDerivedTaskId(taskType: string, sourceId: string) {
  return `derived:${taskType}:${sourceId}`;
}

export function isDerivedTaskId(taskId: string) {
  return taskId.startsWith("derived:");
}
