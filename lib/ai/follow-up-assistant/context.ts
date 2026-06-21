import {
  findMessagesByConversationId,
} from "@/lib/omnichannel-inbox/repository";
import {
  buildBookingPaymentTotals,
  type BookingPaymentLike,
} from "@/lib/bookings/payment-summary";
import {
  formatPaymentStatusLabel,
  normalizeBookingPaymentStatus,
} from "@/lib/bookings/payment-status";
import type { createClient } from "@/utils/supabase/server";

import {
  type BookingPaymentReminderType,
  type FollowUpDeliveryChannel,
} from "./constants";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type LeadFollowUpContext = {
  leadId: string;
  fullName: string;
  status: string;
  destination: string | null;
  travelDate: string | null;
  partySize: number | null;
  notes: string | null;
  daysSinceLastActivity: number;
  lastConversationText: string | null;
  lastConversationChannel: FollowUpDeliveryChannel | null;
  packageInterest: string | null;
  budgetIdr: number | null;
};

export type BookingPaymentReminderContext = {
  bookingId: string;
  leadId: string | null;
  customerName: string;
  bookingCode: string | null;
  packageName: string | null;
  departureDate: string | null;
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  paymentStatus: string;
  paymentStatusLabel: string;
  reminderType: BookingPaymentReminderType;
  lastPaymentDate: string | null;
  paymentsSummary: string;
};

function getDaysSince(dateIso: string) {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function mapChannelToDelivery(
  channel: string | null | undefined,
): FollowUpDeliveryChannel | null {
  if (channel === "whatsapp") {
    return "whatsapp";
  }

  if (channel === "instagram") {
    return "instagram";
  }

  if (channel === "email") {
    return "email";
  }

  return null;
}

function formatRecentConversation(
  messages: Array<{
    direction: "incoming" | "outgoing";
    text: string;
    createdAt: string;
  }>,
) {
  if (messages.length === 0) {
    return null;
  }

  return messages
    .map((message) => {
      const speaker =
        message.direction === "incoming" ? "Pelanggan" : "Tim Desklabs";
      return `${speaker}: ${message.text}`;
    })
    .join("\n");
}

function resolveBookingReminderType(
  paymentStatus: string,
  amountPaid: number,
): BookingPaymentReminderType {
  const normalized = normalizeBookingPaymentStatus(paymentStatus);

  if (normalized === "unpaid" || amountPaid === 0) {
    return "dp_not_paid";
  }

  if (normalized === "dp_paid") {
    return "partial_payment";
  }

  return "final_payment_due";
}

function formatPaymentsSummary(payments: BookingPaymentLike[]) {
  if (payments.length === 0) {
    return "Belum ada pembayaran tercatat.";
  }

  return payments
    .map((payment) => {
      const date = payment.payment_date ?? "tanpa tanggal";
      return `- ${date}: ${payment.payment_type} sebesar Rp ${Number(payment.amount).toLocaleString("id-ID")}`;
    })
    .join("\n");
}

function getConversationIdFromMetadata(metadata: Record<string, unknown> | null) {
  const value = metadata?.omnichannel_conversation_id;
  return typeof value === "string" && value ? value : null;
}

async function loadLeadInboxConversationText(
  supabase: SupabaseServerClient,
  organizationId: string,
  leadId: string,
  metadata: Record<string, unknown> | null,
) {
  const metadataConversationId = getConversationIdFromMetadata(metadata);

  const { data: linkedConversation } = await supabase
    .from("conversations")
    .select("id, channel")
    .eq("organization_id", organizationId)
    .eq("lead_id", leadId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let conversation = linkedConversation;

  if (!conversation && metadataConversationId) {
    const { data: metadataConversation } = await supabase
      .from("conversations")
      .select("id, channel")
      .eq("organization_id", organizationId)
      .eq("id", metadataConversationId)
      .maybeSingle();

    conversation = metadataConversation;
  }

  if (!conversation) {
    return {
      lastConversationText: null as string | null,
      lastConversationChannel: null as FollowUpDeliveryChannel | null,
    };
  }

  const messages = await findMessagesByConversationId(
    supabase,
    organizationId,
    conversation.id,
  );

  const recentMessages = (messages ?? []).slice(-6).map((message) => ({
    direction: message.direction as "incoming" | "outgoing",
    text: message.message_text?.trim() || "(attachment)",
    createdAt: message.created_at,
  }));

  return {
    lastConversationText: formatRecentConversation(recentMessages),
    lastConversationChannel: mapChannelToDelivery(conversation.channel),
  };
}

export async function loadLeadFollowUpContext(
  supabase: SupabaseServerClient,
  organizationId: string,
  leadId: string,
): Promise<LeadFollowUpContext | null> {
  const { data: lead } = await supabase
    .from("leads")
    .select(
      "id, full_name, status, package_interest, travel_date_preference, party_size, notes, budget_idr, updated_at, metadata",
    )
    .eq("id", leadId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!lead) {
    return null;
  }

  const [{ data: activities }, { data: matchedPackage }, conversationData] =
    await Promise.all([
      supabase
        .from("lead_activities")
        .select("occurred_at")
        .eq("lead_id", leadId)
        .eq("organization_id", organizationId)
        .order("occurred_at", { ascending: false })
        .limit(1),
      lead.package_interest
        ? supabase
            .from("packages")
            .select("destination")
            .eq("organization_id", organizationId)
            .eq("name", lead.package_interest)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      loadLeadInboxConversationText(
        supabase,
        organizationId,
        lead.id,
        (lead.metadata as Record<string, unknown> | null) ?? null,
      ),
    ]);

  const lastActivityAt = activities?.[0]?.occurred_at ?? lead.updated_at;
  const destination =
    matchedPackage?.destination?.trim() || lead.package_interest?.trim() || null;

  return {
    leadId: lead.id,
    fullName: lead.full_name,
    status: lead.status,
    destination,
    travelDate: lead.travel_date_preference,
    partySize: lead.party_size,
    notes: lead.notes,
    daysSinceLastActivity: getDaysSince(lastActivityAt),
    lastConversationText: conversationData.lastConversationText,
    lastConversationChannel: conversationData.lastConversationChannel,
    packageInterest: lead.package_interest,
    budgetIdr: lead.budget_idr,
  };
}

export async function loadBookingPaymentReminderContext(
  supabase: SupabaseServerClient,
  organizationId: string,
  bookingId: string,
): Promise<BookingPaymentReminderContext | null> {
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, lead_id, customer_name, booking_code, package_name, departure_date, total_amount, payment_status",
    )
    .eq("id", bookingId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!booking) {
    return null;
  }

  const { data: payments } = await supabase
    .from("booking_payments")
    .select("payment_type, amount, payment_date")
    .eq("booking_id", bookingId)
    .order("payment_date", { ascending: false, nullsFirst: false });

  const paymentRows = (payments ?? []) as BookingPaymentLike[];
  const totals = buildBookingPaymentTotals(
    Number(booking.total_amount),
    paymentRows,
  );
  const reminderType = resolveBookingReminderType(
    booking.payment_status,
    totals.amountPaid,
  );

  return {
    bookingId: booking.id,
    leadId: booking.lead_id,
    customerName: booking.customer_name,
    bookingCode: booking.booking_code,
    packageName: booking.package_name,
    departureDate: booking.departure_date,
    totalAmount: Number(booking.total_amount),
    amountPaid: totals.amountPaid,
    outstandingBalance: totals.outstandingBalance,
    paymentStatus: booking.payment_status,
    paymentStatusLabel: formatPaymentStatusLabel(booking.payment_status),
    reminderType,
    lastPaymentDate: totals.lastPaymentDate,
    paymentsSummary: formatPaymentsSummary(paymentRows),
  };
}

export type InboxFollowUpContext = LeadFollowUpContext & {
  conversationId: string;
  channelLabel: string;
};

export { resolveBookingReminderType as getBookingPaymentReminderType };

export async function loadInboxFollowUpContext(
  supabase: SupabaseServerClient,
  organizationId: string,
  conversationId: string,
): Promise<InboxFollowUpContext | null> {
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, lead_id, channel, customer_name")
    .eq("id", conversationId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!conversation?.lead_id) {
    return null;
  }

  const leadContext = await loadLeadFollowUpContext(
    supabase,
    organizationId,
    conversation.lead_id,
  );

  if (!leadContext) {
    return null;
  }

  const messages = await findMessagesByConversationId(
    supabase,
    organizationId,
    conversationId,
  );

  const recentMessages = (messages ?? [])
    .slice(-8)
    .map((message) => ({
      direction: message.direction as "incoming" | "outgoing",
      text: message.message_text?.trim() || "(attachment)",
      createdAt: message.created_at,
    }));

  return {
    ...leadContext,
    conversationId: conversation.id,
    channelLabel: conversation.channel,
    lastConversationText:
      formatRecentConversation(recentMessages) ?? leadContext.lastConversationText,
    lastConversationChannel:
      mapChannelToDelivery(conversation.channel) ??
      leadContext.lastConversationChannel,
  };
}
