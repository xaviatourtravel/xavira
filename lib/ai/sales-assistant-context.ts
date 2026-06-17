import { formatInboxSourceLabel, type InboxSource } from "@/lib/inbox/constants";
import { loadInboxConversationRawById } from "@/lib/inbox/queries";
import type { createClient } from "@/utils/supabase/server";

import type {
  SalesAssistantActivity,
  SalesAssistantBooking,
  SalesAssistantFollowUpTask,
  SalesAssistantLead,
  SalesAssistantPackage,
} from "@/lib/ai/sales-assistant";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type SalesAssistantContext = {
  lead: SalesAssistantLead;
  selectedPackage: SalesAssistantPackage | null;
  activities: SalesAssistantActivity[];
  followUpTasks: SalesAssistantFollowUpTask[];
  booking: SalesAssistantBooking | null;
};

export type SalesAssistantLeadContext = SalesAssistantContext & {
  leadId: string;
};

export type InboxChatAssistantContext = SalesAssistantContext & {
  conversationId: string;
  sourceLabel: string;
  contactName: string;
  leadId: string | null;
};

function buildConversationLeadStub(
  contactName: string,
  lastMessage: string | null,
): SalesAssistantLead {
  return {
    full_name: contactName,
    status: "new",
    interest_type: "umroh",
    package_interest: null,
    notes: lastMessage?.trim()
      ? `Percakapan inbox: ${lastMessage.trim()}`
      : null,
    lead_temperature: null,
    updated_at: new Date().toISOString(),
    budget_idr: null,
    travel_date_preference: null,
    party_size: null,
  };
}

export function buildInboxIncomingMessageContext(
  sourceLabel: string,
  incomingMessage: string,
) {
  return `Pesan masuk terakhir dari pelanggan via ${sourceLabel}:
"""
${incomingMessage.trim()}
"""

Buat draf balasan yang relevan terhadap pesan di atas.
Jangan mengarang harga, jadwal keberangkatan, atau ketersediaan seat/kuota jika data tidak tersedia di konteks lead/paket.`;
}

export async function loadSalesAssistantContextForLead(
  supabase: SupabaseServerClient,
  organizationId: string,
  leadId: string,
): Promise<SalesAssistantLeadContext | null> {
  const { data: lead } = await supabase
    .from("leads")
    .select(
      `
      id,
      full_name,
      status,
      interest_type,
      package_interest,
      notes,
      lead_temperature,
      updated_at,
      budget_idr,
      travel_date_preference,
      party_size
    `,
    )
    .eq("id", leadId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!lead) {
    return null;
  }

  const [
    { data: selectedPackage },
    { data: activities },
    { data: followUpTasks },
    { data: booking },
  ] = await Promise.all([
    lead.package_interest
      ? supabase
          .from("packages")
          .select(
            "name, destination, departure_date, duration_days, price_idr, quota",
          )
          .eq("organization_id", organizationId)
          .eq("name", lead.package_interest)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("lead_activities")
      .select("activity_type, title, body, occurred_at")
      .eq("lead_id", leadId)
      .eq("organization_id", organizationId)
      .order("occurred_at", { ascending: false })
      .limit(5),
    supabase
      .from("follow_up_tasks")
      .select("title, description, due_date, status")
      .eq("lead_id", leadId)
      .eq("organization_id", organizationId)
      .order("due_date", { ascending: true })
      .limit(5),
    supabase
      .from("bookings")
      .select("booking_code, package_name, payment_status, booking_status")
      .eq("lead_id", leadId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    leadId: lead.id,
    lead,
    selectedPackage,
    activities: activities ?? [],
    followUpTasks: followUpTasks ?? [],
    booking: booking ?? null,
  };
}

export async function loadInboxChatAssistantContext(
  supabase: SupabaseServerClient,
  organizationId: string,
  conversationId: string,
): Promise<InboxChatAssistantContext | null> {
  const conversation = await loadInboxConversationRawById(
    supabase,
    organizationId,
    conversationId,
  );

  if (!conversation) {
    return null;
  }

  const sourceLabel = formatInboxSourceLabel(conversation.source as InboxSource);

  if (conversation.lead_id) {
    const leadContext = await loadSalesAssistantContextForLead(
      supabase,
      organizationId,
      conversation.lead_id,
    );

    if (leadContext) {
      return {
        conversationId: conversation.id,
        sourceLabel,
        contactName: conversation.contact_name,
        leadId: leadContext.leadId,
        lead: leadContext.lead,
        selectedPackage: leadContext.selectedPackage,
        activities: leadContext.activities,
        followUpTasks: leadContext.followUpTasks,
        booking: leadContext.booking,
      };
    }
  }

  return {
    conversationId: conversation.id,
    sourceLabel,
    contactName: conversation.contact_name,
    leadId: null,
    lead: buildConversationLeadStub(
      conversation.contact_name,
      conversation.last_message,
    ),
    selectedPackage: null,
    activities: [],
    followUpTasks: [],
    booking: null,
  };
}
