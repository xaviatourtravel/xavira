import { WHATSAPP_INSTANCE_NAME } from "@/lib/integrations/whatsapp/constants";
import {
  type ParsedWhatsAppIncomingMessage,
  whatsAppWebhookDevLog,
} from "@/lib/integrations/whatsapp/webhook-parser";
import { getLeadWhatsAppPhone } from "@/lib/leads/next-best-action";
import {
  attachWhatsappProviderMessageId,
  findReconcilableOutgoingWhatsappMessage,
  findWhatsappConversationByPhone,
  findWhatsappMessageByExternalId,
  insertWhatsappConversation,
  insertWhatsappMessage,
  updateWhatsappConversationById,
  type WhatsappSupabaseClient,
} from "@/lib/whatsapp-inbox/repository";
import type { Json } from "@/types/database";

export type WhatsAppWebhookIngestResult = {
  processed: number;
  duplicates: number;
  unresolved: number;
  ignored: number;
};

function normalizePhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

function phonesMatch(candidate: string, target: string) {
  const left = normalizePhoneDigits(candidate);
  const right = normalizePhoneDigits(target);

  if (!left || !right) {
    return false;
  }

  if (left === right) {
    return true;
  }

  const leftCore = left.replace(/^62/, "").replace(/^0/, "");
  const rightCore = right.replace(/^62/, "").replace(/^0/, "");
  return leftCore === rightCore;
}

async function resolveWorkspaceId(
  supabase: WhatsappSupabaseClient,
  instanceName: string,
) {
  const configuredOrg =
    process.env.WHATSAPP_ORGANIZATION_ID?.trim() ||
    process.env.BETA_JOIN_ORGANIZATION_ID?.trim();

  if (configuredOrg) {
    return configuredOrg;
  }

  const { data, error } = await supabase
    .from("integrations")
    .select("organization_id, metadata")
    .eq("status", "connected")
    .eq("provider", "whatsapp_cloud");

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const storedInstance = typeof metadata.instanceName === "string"
      ? metadata.instanceName.trim()
      : null;

    if (storedInstance === instanceName) {
      return row.organization_id;
    }
  }

  whatsAppWebhookDevLog("workspace unresolved", { instanceName });
  return null;
}

async function matchCustomerIdByPhone(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  phoneNumber: string,
) {
  const { data, error } = await supabase
    .from("leads")
    .select("id, phone, whatsapp_number")
    .eq("organization_id", workspaceId)
    .is("deleted_at", null)
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  for (const lead of data ?? []) {
    const leadPhone = getLeadWhatsAppPhone(lead.whatsapp_number, lead.phone);
    if (leadPhone && phonesMatch(leadPhone, phoneNumber)) {
      return lead.id;
    }
  }

  return null;
}

function getDisplayName(message: ParsedWhatsAppIncomingMessage) {
  return message.pushName?.trim() || message.phoneNumber;
}

export async function ingestWhatsAppIncomingMessages(
  supabase: WhatsappSupabaseClient,
  messages: ParsedWhatsAppIncomingMessage[],
  ignored = 0,
): Promise<WhatsAppWebhookIngestResult> {
  const result: WhatsAppWebhookIngestResult = {
    processed: 0,
    duplicates: 0,
    unresolved: 0,
    ignored,
  };

  if (messages.length === 0) {
    return result;
  }

  whatsAppWebhookDevLog("messages received", { count: messages.length });

  const workspaceCache = new Map<string, string | null>();

  for (const message of messages) {
    const instanceName = message.instanceName || WHATSAPP_INSTANCE_NAME;

    if (!workspaceCache.has(instanceName)) {
      workspaceCache.set(
        instanceName,
        await resolveWorkspaceId(supabase, instanceName),
      );
    }

    const workspaceId = workspaceCache.get(instanceName);
    if (!workspaceId) {
      result.unresolved += 1;
      continue;
    }

    let conversation = await findWhatsappConversationByPhone(
      supabase,
      workspaceId,
      instanceName,
      message.phoneNumber,
    );

    if (!conversation) {
      const customerId = await matchCustomerIdByPhone(
        supabase,
        workspaceId,
        message.phoneNumber,
      );

      conversation = await insertWhatsappConversation(supabase, {
        workspace_id: workspaceId,
        instance_name: instanceName,
        phone_number: message.phoneNumber,
        contact_name: message.pushName?.trim() || null,
        customer_id: customerId,
      });
    } else {
      const updates: {
        customer_id?: string;
        contact_name?: string;
      } = {};

      if (!conversation.customer_id) {
        const customerId = await matchCustomerIdByPhone(
          supabase,
          workspaceId,
          message.phoneNumber,
        );

        if (customerId) {
          updates.customer_id = customerId;
        }
      }

      const pushName = message.pushName?.trim();
      if (pushName && pushName !== conversation.contact_name) {
        updates.contact_name = pushName;
      }

      if (Object.keys(updates).length > 0) {
        conversation = await updateWhatsappConversationById(
          supabase,
          workspaceId,
          conversation.id,
          updates,
        );
      }
    }

    // Deduplikasi berdasarkan provider message id dalam percakapan (yang sudah
    // tercakup instance + nomor). Ini mencegah duplikat ketika balasan yang
    // dikirim dari Desklabs di-echo kembali oleh webhook fromMe=true, karena
    // pesan keluar Desklabs menyimpan provider id pada external_message_id.
    const existingMessage = await findWhatsappMessageByExternalId(
      supabase,
      conversation.id,
      message.externalMessageId,
    );

    if (existingMessage) {
      result.duplicates += 1;
      continue;
    }

    // Echo dari balasan yang dikirim Desklabs: rekonsiliasi baris yang masih
    // menunggu provider id daripada menyisipkan duplikat.
    if (message.direction === "outgoing") {
      const pending = await findReconcilableOutgoingWhatsappMessage(
        supabase,
        conversation.id,
        message.messageText,
      );

      if (pending) {
        await attachWhatsappProviderMessageId(
          supabase,
          pending.id,
          message.externalMessageId,
        );
        result.duplicates += 1;
        continue;
      }
    }

    await insertWhatsappMessage(supabase, {
      conversation_id: conversation.id,
      direction: message.direction,
      message_type: message.messageType,
      text: message.messageText,
      media_url: message.mediaUrl,
      // Pesan keluar dari perangkat sudah terkirim oleh WhatsApp.
      status: message.direction === "outgoing" ? "sent" : "received",
      timestamp: message.timestamp,
      raw_payload: message.rawPayload as Json,
      external_message_id: message.externalMessageId,
    });

    result.processed += 1;
    whatsAppWebhookDevLog("message stored", {
      conversationId: conversation.id,
      direction: message.direction,
      phoneNumber: message.phoneNumber,
      displayName: getDisplayName(message),
    });
  }

  return result;
}
