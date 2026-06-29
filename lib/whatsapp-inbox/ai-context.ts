import { formatOmnichannelChannelLabel } from "@/lib/omnichannel-inbox/constants";
import type { OmnichannelSuggestReplyContext } from "@/lib/omnichannel-inbox/ai-suggest-reply";
import {
  loadSalesAssistantContextForLead,
  type SalesAssistantContext,
} from "@/lib/ai/sales-assistant-context";
import type { SalesAssistantLead } from "@/lib/ai/sales-assistant";
import {
  findWhatsappConversationById,
  findWhatsappConversationNotesByConversationId,
  findWhatsappMessagesByConversationId,
  type WhatsappSupabaseClient,
} from "@/lib/whatsapp-inbox/repository";
import { resolveWhatsappContactDisplay } from "@/lib/whatsapp-inbox/display";

const RECENT_MESSAGE_LIMIT = 14;

function buildConversationLeadStub(
  customerName: string,
  lastIncomingMessage: string | null,
): SalesAssistantLead {
  return {
    full_name: customerName,
    status: "new",
    interest_type: "halal_tour",
    package_interest: null,
    notes: lastIncomingMessage?.trim()
      ? `Percakapan inbox: ${lastIncomingMessage.trim()}`
      : null,
    lead_temperature: null,
    updated_at: new Date().toISOString(),
    budget_idr: null,
    travel_date_preference: null,
    party_size: null,
  };
}

export async function loadWhatsappSuggestReplyContext(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversationId: string,
): Promise<OmnichannelSuggestReplyContext | null> {
  const [conversation, messages, notes] = await Promise.all([
    findWhatsappConversationById(supabase, workspaceId, conversationId),
    findWhatsappMessagesByConversationId(supabase, conversationId),
    findWhatsappConversationNotesByConversationId(supabase, conversationId),
  ]);

  if (!conversation) {
    return null;
  }

  const contact = resolveWhatsappContactDisplay(conversation);
  const customerName = contact.primaryName;
  const channelLabel = formatOmnichannelChannelLabel("whatsapp");

  const recentMessages = messages
    .slice(-RECENT_MESSAGE_LIMIT)
    .map((message) => ({
      direction: message.direction as "incoming" | "outgoing",
      text: message.text?.trim() || "(lampiran/media tanpa teks)",
      timestamp: message.timestamp,
    }));

  const lastIncomingMessage =
    [...recentMessages]
      .reverse()
      .find((message) => message.direction === "incoming")
      ?.text ?? null;

  const internalNotes = notes
    .map((note) => note.note.trim())
    .filter(Boolean);

  let salesContext: SalesAssistantContext;
  let leadId: string | null = conversation.customer_id ?? null;

  if (conversation.customer_id) {
    const leadContext = await loadSalesAssistantContextForLead(
      supabase,
      workspaceId,
      conversation.customer_id,
    );

    if (leadContext) {
      salesContext = leadContext;
    } else {
      salesContext = {
        lead: buildConversationLeadStub(customerName, lastIncomingMessage),
        selectedPackage: null,
        activities: [],
        followUpTasks: [],
        booking: null,
      };
      leadId = null;
    }
  } else {
    salesContext = {
      lead: buildConversationLeadStub(customerName, lastIncomingMessage),
      selectedPackage: null,
      activities: [],
      followUpTasks: [],
      booking: null,
    };
  }

  return {
    conversationId,
    customerName,
    channelLabel,
    leadId,
    salesContext,
    recentMessages,
    internalNotes,
  };
}

export async function loadWhatsappLeadExtractionContext(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  conversationId: string,
) {
  return loadWhatsappSuggestReplyContext(
    supabase,
    workspaceId,
    conversationId,
  );
}
