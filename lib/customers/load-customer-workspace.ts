import { calculateLeadHealthScore } from "@/lib/leads/health-score";
import {
  buildExtendedLeadTimeline,
  buildLeadFollowUpHistory,
  loadLeadConversationContext,
  mapActivitiesForTimeline,
  type LeadFollowUpHistoryItem,
} from "@/lib/leads/lead-customer-360";
import { getEffectiveLeadTemperature } from "@/lib/leads/lead-temperature";
import type { LeadTimelineEvent } from "@/lib/leads/timeline";
import { buildBookingPaymentTotals } from "@/lib/bookings/payment-summary";
import { loadOmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import type { OmnichannelSupabaseClient } from "@/lib/omnichannel-inbox/repository";
import {
  formatAssignedUserLabel,
  getLeadAssigneeName,
} from "@/lib/leads/assignment";
import type { BookingParticipantItem } from "@/components/bookings/booking-participants-list";
import type { BookingPaymentItem } from "@/components/bookings/booking-payments-section";

export type CustomerBookingRow = {
  id: string;
  booking_code: string | null;
  package_name: string | null;
  departure_date: string | null;
  total_pax: number;
  total_amount: number;
  payment_status: string;
  booking_status: string;
  created_at: string;
};

export type CustomerPaymentRow = BookingPaymentItem & {
  bookingId: string;
  bookingCode: string | null;
  bookingPaymentStatus: string;
};

export type CustomerParticipantGroup = {
  bookingId: string;
  bookingCode: string | null;
  packageName: string | null;
  participants: BookingParticipantItem[];
};

export type CustomerWorkspaceData = {
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
    created_at: string;
    updated_at: string;
    assignedToLabel: string;
  };
  leadTemperature: ReturnType<typeof getEffectiveLeadTemperature>;
  healthScore: ReturnType<typeof calculateLeadHealthScore>;
  conversationHref: string | null;
  conversationId: string | null;
  conversationDetail: OmnichannelConversationDetail | null;
  /**
   * Tautan internal Inbox Desklabs untuk tombol "Hubungi Customer".
   * Mengarah ke percakapan yang ada (WhatsApp diutamakan) atau alur mulai
   * percakapan baru. Tidak pernah berupa tautan wa.me eksternal.
   */
  contactInboxHref: string;
  contactHasConversation: boolean;
  bookings: CustomerBookingRow[];
  payments: CustomerPaymentRow[];
  participantGroups: CustomerParticipantGroup[];
  followUpHistory: LeadFollowUpHistoryItem[];
  timelineEvents: LeadTimelineEvent[];
  nextFollowUp: LeadFollowUpHistoryItem | null;
  lastActivityAt: string | null;
  metrics: {
    totalBookings: number;
    totalPaid: number;
    outstandingBalance: number;
  };
};

/**
 * Mencari percakapan WhatsApp milik customer ini (jika ada).
 * WhatsApp diutamakan sebagai kanal kontak utama Desklabs.
 */
async function findCustomerWhatsappConversationId(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  customerId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("whatsapp_conversations")
    .select("id, last_message_at")
    .eq("workspace_id", organizationId)
    .eq("customer_id", customerId)
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

export async function loadCustomerWorkspace(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  leadId: string,
): Promise<CustomerWorkspaceData | null> {
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select(
      "id, full_name, phone, whatsapp_number, email, source, status, package_interest, travel_date_preference, party_size, budget_idr, notes, assigned_to, lead_temperature, metadata, created_at, updated_at, profiles!leads_assigned_to_fkey(full_name)",
    )
    .eq("id", leadId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (leadError || !lead) {
    return null;
  }

  const [
    { data: activities },
    { data: followUpTasks },
    { data: bookings },
  ] = await Promise.all([
    supabase
      .from("lead_activities")
      .select(
        "id, activity_type, title, body, occurred_at, metadata, profiles:actor_id(full_name)",
      )
      .eq("lead_id", leadId)
      .eq("organization_id", organizationId)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("follow_up_tasks")
      .select("id, title, description, due_date, status, created_by")
      .eq("lead_id", leadId)
      .eq("organization_id", organizationId)
      .order("due_date", { ascending: true }),
    supabase
      .from("bookings")
      .select(
        "id, booking_code, package_name, departure_date, total_pax, total_amount, payment_status, booking_status, created_at",
      )
      .eq("lead_id", leadId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
  ]);

  const bookingRows = (bookings ?? []) as CustomerBookingRow[];
  const bookingIds = bookingRows.map((booking) => booking.id);

  let paymentRows: CustomerPaymentRow[] = [];
  let participantGroups: CustomerParticipantGroup[] = [];

  if (bookingIds.length > 0) {
    const [{ data: payments }, { data: participants }] = await Promise.all([
      supabase
        .from("booking_payments")
        .select(
          "id, booking_id, payment_type, payment_method, reference_number, amount, payment_date, notes",
        )
        .in("booking_id", bookingIds)
        .order("payment_date", { ascending: false, nullsFirst: false }),
      supabase
        .from("booking_participants")
        .select(
          "id, booking_id, full_name, phone, passport_number, passport_photo_url, address, emergency_contact, notes",
        )
        .in("booking_id", bookingIds)
        .order("created_at", { ascending: true }),
    ]);

    const bookingById = new Map(bookingRows.map((booking) => [booking.id, booking]));

    paymentRows = (payments ?? []).map((payment) => {
      const booking = bookingById.get(payment.booking_id);
      return {
        id: payment.id,
        payment_type: payment.payment_type,
        payment_method: payment.payment_method,
        reference_number: payment.reference_number,
        amount: Number(payment.amount),
        payment_date: payment.payment_date,
        notes: payment.notes,
        bookingId: payment.booking_id,
        bookingCode: booking?.booking_code ?? null,
        bookingPaymentStatus: booking?.payment_status ?? "unpaid",
      };
    });

    const participantsByBooking = new Map<string, BookingParticipantItem[]>();

    for (const participant of participants ?? []) {
      const list = participantsByBooking.get(participant.booking_id) ?? [];
      list.push({
        id: participant.id,
        full_name: participant.full_name,
        phone: participant.phone,
        passport_number: participant.passport_number,
        passport_photo_url: participant.passport_photo_url,
        address: participant.address,
        emergency_contact: participant.emergency_contact,
        notes: participant.notes,
      });
      participantsByBooking.set(participant.booking_id, list);
    }

    participantGroups = bookingRows.map((booking) => ({
      bookingId: booking.id,
      bookingCode: booking.booking_code,
      packageName: booking.package_name,
      participants: participantsByBooking.get(booking.id) ?? [],
    }));
  }

  const conversationContext = await loadLeadConversationContext(
    supabase,
    organizationId,
    lead,
  );

  const conversationDetail = conversationContext
    ? await loadOmnichannelConversationDetail(
        supabase,
        organizationId,
        conversationContext.conversationId,
      )
    : null;

  // Tentukan target Inbox untuk tombol "Hubungi Customer".
  // Prioritas: percakapan WhatsApp customer -> percakapan kanal lain ->
  // alur mulai percakapan baru. Tidak pernah mengarah ke wa.me.
  const whatsappConversationId = await findCustomerWhatsappConversationId(
    supabase,
    organizationId,
    lead.id,
  );

  const contactInboxHref = whatsappConversationId
    ? `/inbox?filter=whatsapp&c=${whatsappConversationId}`
    : conversationContext
      ? `/inbox?c=${conversationContext.conversationId}`
      : `/inbox?newCustomer=${lead.id}`;

  const contactHasConversation = Boolean(
    whatsappConversationId || conversationContext,
  );

  const assignedToLabel = formatAssignedUserLabel(
    getLeadAssigneeName(lead.profiles),
  );

  const followUpHistory = buildLeadFollowUpHistory(
    followUpTasks ?? [],
    activities ?? [],
    getLeadAssigneeName(lead.profiles),
  );

  const timelineEvents = buildExtendedLeadTimeline({
    leadId: lead.id,
    leadCreatedAt: lead.created_at,
    leadMetadata: lead.metadata,
    activities: mapActivitiesForTimeline(activities ?? []),
    conversation: conversationContext,
  });

  const nextFollowUp =
    followUpHistory.find((task) => task.isPending) ?? null;

  const lastActivityAt = timelineEvents[0]?.occurredAt ?? null;

  let totalPaid = 0;
  let outstandingBalance = 0;

  for (const booking of bookingRows) {
    const bookingPayments = paymentRows.filter(
      (payment) => payment.bookingId === booking.id,
    );
    const totals = buildBookingPaymentTotals(
      Number(booking.total_amount),
      bookingPayments,
    );
    totalPaid += totals.amountPaid;
    outstandingBalance += totals.outstandingBalance;
  }

  const healthScore = calculateLeadHealthScore({
    assignedTo: lead.assigned_to,
    updatedAt: lead.updated_at,
    status: lead.status,
    followUpTaskCount: (followUpTasks ?? []).filter(
      (task) => task.status !== "completed",
    ).length,
  });

  const leadTemperature = getEffectiveLeadTemperature({
    lead_temperature: lead.lead_temperature,
    status: lead.status,
    updated_at: lead.updated_at,
  });

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
      created_at: lead.created_at,
      updated_at: lead.updated_at,
      assignedToLabel,
    },
    leadTemperature,
    healthScore,
    conversationHref: conversationContext?.inboxHref ?? null,
    conversationId: conversationContext?.conversationId ?? null,
    conversationDetail,
    contactInboxHref,
    contactHasConversation,
    bookings: bookingRows,
    payments: paymentRows,
    participantGroups,
    followUpHistory,
    timelineEvents,
    nextFollowUp,
    lastActivityAt,
    metrics: {
      totalBookings: bookingRows.length,
      totalPaid,
      outstandingBalance,
    },
  };
}
