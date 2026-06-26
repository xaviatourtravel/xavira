import { formatPaymentStatusLabel } from "@/lib/bookings/payment-status";
import { formatPaymentTypeLabel } from "@/lib/bookings/payment-fields";
import { loadLeadConversationContext } from "@/lib/leads/lead-customer-360";
import { getEffectiveLeadTemperature } from "@/lib/leads/lead-temperature";
import { formatLeadSourceLabel } from "@/lib/leads/source-tracking";
import {
  findMessagesByConversationId,
  type OmnichannelSupabaseClient,
} from "@/lib/omnichannel-inbox/repository";

import type { CustomerAiMissingField } from "./types";

export type CustomerAiSummaryContext = {
  lead: {
    id: string;
    full_name: string;
    phone: string | null;
    whatsapp_number: string | null;
    email: string | null;
    source: string;
    status: string;
    package_interest: string | null;
    travel_date_preference: string | null;
    party_size: number | null;
    budget_idr: number | null;
    notes: string | null;
    lead_temperature: string | null;
    updated_at: string;
    assignedToLabel: string;
  };
  activities: Array<{
    activity_type: string;
    title: string | null;
    body: string | null;
    occurred_at: string;
  }>;
  followUpTasks: Array<{
    title: string;
    description: string | null;
    due_date: string;
    status: string;
  }>;
  conversationMessages: Array<{
    direction: "incoming" | "outgoing";
    text: string;
    createdAt: string;
  }>;
  bookings: Array<{
    booking_code: string | null;
    package_name: string | null;
    departure_date: string | null;
    total_pax: number;
    total_amount: number;
    payment_status: string;
    booking_status: string;
  }>;
  payments: Array<{
    booking_code: string | null;
    payment_type: string;
    amount: number;
    payment_date: string | null;
  }>;
  participantsCount: number;
  ruleBasedMissingFields: CustomerAiMissingField[];
  fingerprint: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function detectMissingFields(input: {
  phone: string | null;
  whatsapp_number: string | null;
  travel_date_preference: string | null;
  party_size: number | null;
  budget_idr: number | null;
  package_interest: string | null;
}): CustomerAiMissingField[] {
  const missing: CustomerAiMissingField[] = [];

  if (!input.phone?.trim() && !input.whatsapp_number?.trim()) {
    missing.push("phone");
  }

  if (!input.travel_date_preference?.trim()) {
    missing.push("travel date");
  }

  if (input.party_size == null || input.party_size < 1) {
    missing.push("pax");
  }

  if (input.budget_idr == null || input.budget_idr <= 0) {
    missing.push("budget");
  }

  if (!input.package_interest?.trim()) {
    missing.push("package preference");
  }

  return missing;
}

export function hasMinimalCustomerAiContext(context: CustomerAiSummaryContext) {
  const { lead, activities, conversationMessages, bookings } = context;

  const hasRichLeadFields =
    Boolean(lead.phone?.trim() || lead.whatsapp_number?.trim()) ||
    Boolean(lead.package_interest?.trim()) ||
    Boolean(lead.travel_date_preference?.trim()) ||
    lead.party_size != null ||
    (lead.budget_idr != null && lead.budget_idr > 0) ||
    Boolean(lead.notes?.trim());

  return (
    hasRichLeadFields ||
    activities.length > 0 ||
    conversationMessages.length > 0 ||
    bookings.length > 0
  );
}

export function buildCustomerAiSummaryFingerprint(input: {
  updatedAt: string;
  status: string;
  notes: string | null;
  activityCount: number;
  messageCount: number;
  bookingCount: number;
  paymentCount: number;
}) {
  return [
    input.updatedAt,
    input.status,
    input.notes ?? "",
    String(input.activityCount),
    String(input.messageCount),
    String(input.bookingCount),
    String(input.paymentCount),
  ].join("|");
}

export async function loadCustomerAiSummaryContext(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  leadId: string,
): Promise<CustomerAiSummaryContext | null> {
  const { data: lead } = await supabase
    .from("leads")
    .select(
      "id, full_name, phone, whatsapp_number, email, source, status, package_interest, travel_date_preference, party_size, budget_idr, notes, assigned_to, lead_temperature, created_at, updated_at, metadata, profiles!leads_assigned_to_fkey(full_name)",
    )
    .eq("id", leadId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!lead) {
    return null;
  }

  const [{ data: activities }, { data: followUpTasks }, { data: bookings }] =
    await Promise.all([
      supabase
        .from("lead_activities")
        .select("activity_type, title, body, occurred_at")
        .eq("lead_id", leadId)
        .eq("organization_id", organizationId)
        .order("occurred_at", { ascending: false })
        .limit(15),
      supabase
        .from("follow_up_tasks")
        .select("title, description, due_date, status")
        .eq("lead_id", leadId)
        .eq("organization_id", organizationId)
        .order("due_date", { ascending: true }),
      supabase
        .from("bookings")
        .select(
          "id, booking_code, package_name, departure_date, total_pax, total_amount, payment_status, booking_status",
        )
        .eq("lead_id", leadId)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
    ]);

  const bookingRows = bookings ?? [];
  const bookingIds = bookingRows.map((booking) => booking.id);

  let payments: CustomerAiSummaryContext["payments"] = [];
  let participantsCount = 0;

  if (bookingIds.length > 0) {
    const [{ data: paymentRows }, { count }] = await Promise.all([
      supabase
        .from("booking_payments")
        .select("booking_id, payment_type, amount, payment_date")
        .in("booking_id", bookingIds)
        .order("payment_date", { ascending: false, nullsFirst: false })
        .limit(10),
      supabase
        .from("booking_participants")
        .select("id", { count: "exact", head: true })
        .in("booking_id", bookingIds),
    ]);

    const bookingCodeById = new Map(
      bookingRows.map((booking) => [booking.id, booking.booking_code]),
    );

    payments = (paymentRows ?? []).map((payment) => ({
      booking_code: bookingCodeById.get(payment.booking_id) ?? null,
      payment_type: payment.payment_type,
      amount: Number(payment.amount),
      payment_date: payment.payment_date,
    }));

    participantsCount = count ?? 0;
  }

  const conversationContext = await loadLeadConversationContext(
    supabase,
    organizationId,
    lead,
  );

  let conversationMessages: CustomerAiSummaryContext["conversationMessages"] =
    [];

  if (conversationContext) {
    const messages = await findMessagesByConversationId(
      supabase,
      organizationId,
      conversationContext.conversationId,
    );

    conversationMessages = (messages ?? []).slice(-20).map((message) => ({
      direction: message.direction as "incoming" | "outgoing",
      text: message.message_text?.trim() || "(attachment)",
      createdAt: message.created_at,
    }));
  }

  const assigneeProfile = lead.profiles as
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null;
  const assignedToLabel = Array.isArray(assigneeProfile)
    ? assigneeProfile[0]?.full_name?.trim() || "Belum di-assign"
    : assigneeProfile?.full_name?.trim() || "Belum di-assign";

  const activityRows = activities ?? [];
  const ruleBasedMissingFields = detectMissingFields(lead);

  return {
    lead: {
      id: lead.id,
      full_name: lead.full_name,
      phone: lead.phone,
      whatsapp_number: lead.whatsapp_number,
      email: lead.email,
      source: lead.source,
      status: lead.status,
      package_interest: lead.package_interest,
      travel_date_preference: lead.travel_date_preference,
      party_size: lead.party_size,
      budget_idr: lead.budget_idr,
      notes: lead.notes,
      lead_temperature: lead.lead_temperature,
      updated_at: lead.updated_at,
      assignedToLabel,
    },
    activities: activityRows,
    followUpTasks: followUpTasks ?? [],
    conversationMessages,
    bookings: bookingRows.map((booking) => ({
      booking_code: booking.booking_code,
      package_name: booking.package_name,
      departure_date: booking.departure_date,
      total_pax: booking.total_pax,
      total_amount: Number(booking.total_amount),
      payment_status: booking.payment_status,
      booking_status: booking.booking_status,
    })),
    payments,
    participantsCount,
    ruleBasedMissingFields,
    fingerprint: buildCustomerAiSummaryFingerprint({
      updatedAt: lead.updated_at,
      status: lead.status,
      notes: lead.notes,
      activityCount: activityRows.length,
      messageCount: conversationMessages.length,
      bookingCount: bookingRows.length,
      paymentCount: payments.length,
    }),
  };
}

export function formatCustomerAiSummaryContext(context: CustomerAiSummaryContext) {
  const temperature = getEffectiveLeadTemperature({
    lead_temperature: context.lead.lead_temperature,
    status: context.lead.status,
    updated_at: context.lead.updated_at,
  });

  const activitiesText =
    context.activities.length === 0
      ? "- Belum ada aktivitas"
      : context.activities
          .map(
            (activity) =>
              `- ${activity.occurred_at}: ${activity.activity_type} | ${activity.title ?? ""} ${activity.body ?? ""}`.trim(),
          )
          .join("\n");

  const followUpsText =
    context.followUpTasks.length === 0
      ? "- Belum ada follow-up"
      : context.followUpTasks
          .map(
            (task) =>
              `- ${task.due_date} [${task.status}] ${task.title}${task.description ? ` — ${task.description}` : ""}`,
          )
          .join("\n");

  const conversationText =
    context.conversationMessages.length === 0
      ? "- Belum ada percakapan inbox"
      : context.conversationMessages
          .map(
            (message) =>
              `- [${message.direction}] ${message.createdAt}: ${message.text}`,
          )
          .join("\n");

  const bookingsText =
    context.bookings.length === 0
      ? "- Belum ada booking"
      : context.bookings
          .map(
            (booking) =>
              `- ${booking.booking_code ?? "Booking"} | ${booking.package_name ?? "-"} | departure ${booking.departure_date ?? "-"} | pax ${booking.total_pax} | total ${formatCurrency(booking.total_amount)} | payment ${formatPaymentStatusLabel(booking.payment_status)} | status ${booking.booking_status}`,
          )
          .join("\n");

  const paymentsText =
    context.payments.length === 0
      ? "- Belum ada payment"
      : context.payments
          .map(
            (payment) =>
              `- ${payment.booking_code ?? "Booking"} | ${formatPaymentTypeLabel(payment.payment_type)} | ${formatCurrency(payment.amount)} | ${payment.payment_date ?? "-"}`,
          )
          .join("\n");

  return `
Data lead:
- Nama: ${context.lead.full_name}
- Sumber: ${formatLeadSourceLabel(context.lead.source)}
- Status pipeline: ${context.lead.status}
- Assigned: ${context.lead.assignedToLabel}
- Suhu lead (sistem): ${temperature.value}${temperature.isSuggested ? " (suggested)" : ""}
- Phone: ${context.lead.phone ?? context.lead.whatsapp_number ?? "-"}
- Email: ${context.lead.email ?? "-"}
- Paket diminati: ${context.lead.package_interest ?? "-"}
- Preferensi tanggal: ${context.lead.travel_date_preference ?? "-"}
- Pax: ${context.lead.party_size ?? "-"}
- Budget: ${context.lead.budget_idr != null ? formatCurrency(context.lead.budget_idr) : "-"}
- Catatan profil: ${context.lead.notes?.trim() || "-"}

Field kosong terdeteksi sistem: ${context.ruleBasedMissingFields.join(", ") || "tidak ada"}

Aktivitas internal:
${activitiesText}

Follow-up:
${followUpsText}

Percakapan inbox (terbaru):
${conversationText}

Booking:
${bookingsText}

Payment:
${paymentsText}

Participants terdaftar: ${context.participantsCount}
`.trim();
}
