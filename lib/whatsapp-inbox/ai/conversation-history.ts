import type { WhatsAppConversationTurn } from "@/modules/business-brain/types/prompt";
import type { WhatsappMessageRow } from "@/types/whatsapp-inbox";
import {
  findWhatsappMessagesByConversationId,
  type WhatsappSupabaseClient,
} from "@/lib/whatsapp-inbox/repository";

export const WHATSAPP_AI_HISTORY_LIMIT = 10;
export const WHATSAPP_GREETING_INACTIVITY_MS = 12 * 60 * 60 * 1000;

const CUSTOMER_GREETING_PATTERN =
  /^(halo|hai|hello|hi|assalamualaikum|selamat\s+(pagi|siang|sore|malam)|pagi\s+kak|siang\s+kak|sore\s+kak|malam\s+kak)\b/i;

export function isCustomerGreetingMessage(messageText: string) {
  const normalized = messageText.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return CUSTOMER_GREETING_PATTERN.test(normalized);
}

function isBusinessOutgoingMessage(message: WhatsappMessageRow) {
  if (message.direction !== "outgoing") {
    return false;
  }

  return message.sender_type === "ai" || message.sender_type === "human";
}

function getLatestMessageTimestamp(messages: WhatsappMessageRow[]) {
  let latest = 0;

  for (const message of messages) {
    const timestamp = Date.parse(message.timestamp);
    if (!Number.isNaN(timestamp) && timestamp > latest) {
      latest = timestamp;
    }
  }

  return latest;
}

/**
 * Return true only when a greeting opener is appropriate:
 * - no prior AI/human outgoing message, or
 * - 12+ hours since last activity and the customer greets again.
 */
export function shouldUseGreeting(
  conversationHistory: WhatsappMessageRow[],
  latestCustomerMessage: string,
  nowMs = Date.now(),
) {
  const hasBusinessOutgoing = conversationHistory.some(isBusinessOutgoingMessage);

  if (!hasBusinessOutgoing) {
    return true;
  }

  const latestActivityAt = getLatestMessageTimestamp(conversationHistory);
  if (latestActivityAt <= 0) {
    return false;
  }

  const inactiveMs = nowMs - latestActivityAt;
  return (
    inactiveMs >= WHATSAPP_GREETING_INACTIVITY_MS &&
    isCustomerGreetingMessage(latestCustomerMessage)
  );
}

export async function loadWhatsappConversationHistoryForAi(
  supabase: WhatsappSupabaseClient,
  conversationId: string,
  limit = WHATSAPP_AI_HISTORY_LIMIT,
) {
  const messages = await findWhatsappMessagesByConversationId(
    supabase,
    conversationId,
  );

  return messages
    .filter((message) => message.text?.trim())
    .slice(-limit);
}

export async function loadWhatsappConversationMessagesForGreeting(
  supabase: WhatsappSupabaseClient,
  conversationId: string,
) {
  const messages = await findWhatsappMessagesByConversationId(
    supabase,
    conversationId,
  );

  return messages.filter((message) => message.text?.trim());
}

function formatHistoryLine(message: WhatsappMessageRow) {
  const text = message.text?.trim() ?? "";

  if (message.direction === "incoming") {
    return `Customer: ${text}`;
  }

  if (message.sender_type === "ai") {
    return `AI: ${text}`;
  }

  return `Human: ${text}`;
}

export function formatWhatsappConversationHistoryForAi(
  messages: WhatsappMessageRow[],
) {
  if (messages.length === 0) {
    return "(belum ada riwayat percakapan)";
  }

  return messages.map(formatHistoryLine).join("\n");
}

function mapWhatsappMessageToConversationTurn(
  message: WhatsappMessageRow,
): WhatsAppConversationTurn | null {
  const text = message.text?.trim() ?? "";
  if (!text) {
    return null;
  }

  if (message.direction === "incoming") {
    return {
      sender: "customer",
      text,
      createdAt: message.timestamp,
    };
  }

  return {
    sender: message.sender_type === "ai" ? "ai" : "human",
    text,
    createdAt: message.timestamp,
  };
}

export function mapWhatsappMessagesToConversationTurns(
  messages: WhatsappMessageRow[],
  options?: { excludeMessageIds?: string[] },
): WhatsAppConversationTurn[] {
  const excludedIds = new Set(options?.excludeMessageIds ?? []);

  return messages
    .filter((message) => !excludedIds.has(message.id))
    .map(mapWhatsappMessageToConversationTurn)
    .filter((turn): turn is WhatsAppConversationTurn => turn !== null);
}
