import { formatOmnichannelChannelLabel } from "@/lib/omnichannel-inbox/constants";
import {
  findConversationById,
  findMessagesByConversationId,
  findNotesByConversationId,
  type OmnichannelSupabaseClient,
} from "@/lib/omnichannel-inbox/repository";
import {
  loadSalesAssistantContextForLead,
  type SalesAssistantContext,
} from "@/lib/ai/sales-assistant-context";
import {
  buildSalesAssistantPrompt,
  type SalesAssistantLead,
} from "@/lib/ai/sales-assistant";
import type { BuildRuntimeContextInput } from "@/modules/ai/runtime/build-runtime-context";
import { getCustomerDisplayName } from "@/lib/omnichannel-inbox/customer-display";

const RECENT_MESSAGE_LIMIT = 14;

export type OmnichannelSuggestReplyContext = {
  conversationId: string;
  customerName: string;
  channelLabel: string;
  leadId: string | null;
  salesContext: SalesAssistantContext;
  recentMessages: Array<{
    direction: "incoming" | "outgoing";
    text: string;
    timestamp: string;
  }>;
  internalNotes: string[];
};

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

function formatRecentMessagesForPrompt(
  messages: OmnichannelSuggestReplyContext["recentMessages"],
) {
  if (messages.length === 0) {
    return "Belum ada pesan dalam thread ini.";
  }

  return messages
    .map((message) => {
      const speaker =
        message.direction === "incoming" ? "Pelanggan" : "Tim Desklabs";
      const time = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }).format(new Date(message.timestamp));

      return `[${speaker} · ${time}]\n${message.text.trim()}`;
    })
    .join("\n\n");
}

function formatInternalNotesForPrompt(notes: string[]) {
  if (notes.length === 0) {
    return "Tidak ada catatan internal.";
  }

  return notes
    .map((note, index) => `${index + 1}. ${note.trim()}`)
    .join("\n");
}

export async function loadOmnichannelSuggestReplyContext(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  conversationId: string,
): Promise<OmnichannelSuggestReplyContext | null> {
  const [conversation, messages, notes] = await Promise.all([
    findConversationById(supabase, organizationId, conversationId),
    findMessagesByConversationId(supabase, organizationId, conversationId),
    findNotesByConversationId(supabase, organizationId, conversationId),
  ]);

  if (!conversation || !messages) {
    return null;
  }

  const customerName = getCustomerDisplayName(
    conversation.customer_name,
    conversation.customer_username,
    conversation.external_user_id,
  );
  const channelLabel = formatOmnichannelChannelLabel(conversation.channel);

  const recentMessages = messages
    .slice(-RECENT_MESSAGE_LIMIT)
    .map((message) => ({
      direction: message.direction as "incoming" | "outgoing",
      text: message.message_text?.trim() || "(lampiran/media tanpa teks)",
      timestamp: message.created_at,
    }));

  const lastIncomingMessage =
    [...recentMessages]
      .reverse()
      .find((message) => message.direction === "incoming")
      ?.text ?? null;

  const internalNotes = (notes ?? [])
    .map((note) => note.note.trim())
    .filter(Boolean);

  let salesContext: SalesAssistantContext;
  let leadId: string | null = conversation.lead_id ?? null;

  if (conversation.lead_id) {
    const leadContext = await loadSalesAssistantContextForLead(
      supabase,
      organizationId,
      conversation.lead_id,
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
    conversationId: conversation.id,
    customerName,
    channelLabel,
    leadId,
    salesContext,
    recentMessages,
    internalNotes,
  };
}

export function buildOmnichannelSuggestReplyPrompt(
  context: OmnichannelSuggestReplyContext,
  runtimeContext?: BuildRuntimeContextInput,
) {
  const basePrompt = buildSalesAssistantPrompt({
    action: "reply",
    customerContext: `
Thread ${context.channelLabel} dengan ${context.customerName}.

Riwayat pesan terbaru:
"""
${formatRecentMessagesForPrompt(context.recentMessages)}
"""

Catatan internal tim (HANYA untuk membantu sales memahami konteks — jangan kutip langsung ke pelanggan):
"""
${formatInternalNotesForPrompt(context.internalNotes)}
"""
`.trim(),
    lead: context.salesContext.lead,
    selectedPackage: context.salesContext.selectedPackage,
    activities: context.salesContext.activities,
    followUpTasks: context.salesContext.followUpTasks,
    booking: context.salesContext.booking,
    runtimeContext,
  });

  return `
${basePrompt}

Konteks kanal:
- Balasan akan dikirim manual via ${context.channelLabel}.
- Gaya: hangat, helpful, semi-formal, seperti konsultan travel Desklabs/Xavira.
- Singkat dan actionable (ideal 2-4 kalimat, maksimal ~600 karakter).
- Jawab hanya berdasarkan konteks yang tersedia.
- Jika detail paket/harga belum jelas, ajukan pertanyaan klarifikasi (tanggal, jumlah pax, destinasi, budget).
- Jangan mengarang harga, promo, atau ketersediaan seat.
- Jangan sertakan isi catatan internal ke balasan pelanggan.
- Output hanya teks balasan siap kirim. Tanpa markdown, label, atau penjelasan tambahan.
`.trim();
}
