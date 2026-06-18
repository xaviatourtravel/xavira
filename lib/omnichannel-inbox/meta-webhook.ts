import { createHmac, timingSafeEqual } from "node:crypto";

import type { OmnichannelChannel } from "@/types/omnichannel-inbox";

/**
 * Meta webhook setup (Instagram Messaging + Facebook Messenger):
 *
 * Callback URL:
 *   {NEXT_PUBLIC_SITE_URL}/api/webhooks/meta
 *
 * Verify token env:
 *   META_WEBHOOK_VERIFY_TOKEN
 *
 * Subscribe to `messages` (and optionally `messaging_postbacks`) on the Page /
 * Instagram app in Meta Developer Console.
 */

export type MetaWebhookObject = "page" | "instagram";

export type MetaMessagingAttachment = {
  type?: string;
  payload?: {
    url?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type MetaMessagingEvent = {
  sender?: { id?: string; name?: string; username?: string };
  recipient?: { id?: string };
  timestamp?: number;
  message?: {
    mid?: string;
    text?: string;
    attachments?: MetaMessagingAttachment[];
    is_echo?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type MetaWebhookEntry = {
  id?: string;
  time?: number;
  messaging?: MetaMessagingEvent[];
  [key: string]: unknown;
};

export type MetaWebhookPayload = {
  object?: string;
  entry?: MetaWebhookEntry[];
};

export type ParsedMetaIncomingMessage = {
  channel: OmnichannelChannel;
  entryId: string;
  externalConversationId: string;
  externalUserId: string;
  externalMessageId: string;
  messageText: string | null;
  attachments: Array<{
    type: string;
    url: string | null;
    payload: Record<string, unknown>;
  }>;
  customerName: string | null;
  customerUsername: string | null;
  timestamp: string;
};

export type MetaWebhookIngestResult = {
  processed: number;
  skipped: number;
  duplicates: number;
  unresolved: number;
};

function devLog(message: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (details) {
    console.log(`[meta-webhook] ${message}`, details);
  } else {
    console.log(`[meta-webhook] ${message}`);
  }
}

export function metaWebhookDevLog(
  message: string,
  details?: Record<string, unknown>,
) {
  devLog(message, details);
}

export function getMetaWebhookVerifyToken() {
  return process.env.META_WEBHOOK_VERIFY_TOKEN?.trim() ?? "";
}

export function verifyMetaWebhookSubscription(params: {
  mode: string | null;
  verifyToken: string | null;
  challenge: string | null;
}) {
  const expectedToken = getMetaWebhookVerifyToken();

  if (!expectedToken) {
    return { ok: false as const, reason: "missing_verify_token_env" };
  }

  if (params.mode !== "subscribe") {
    return { ok: false as const, reason: "invalid_mode" };
  }

  if (!params.verifyToken || params.verifyToken !== expectedToken) {
    return { ok: false as const, reason: "invalid_verify_token" };
  }

  if (!params.challenge) {
    return { ok: false as const, reason: "missing_challenge" };
  }

  return { ok: true as const, challenge: params.challenge };
}

export function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string | undefined,
) {
  if (!appSecret?.trim()) {
    return { ok: true as const, skipped: true as const };
  }

  if (!signatureHeader?.startsWith("sha256=")) {
    return { ok: false as const, reason: "missing_signature" };
  }

  const expected = createHmac("sha256", appSecret.trim())
    .update(rawBody, "utf8")
    .digest("hex");
  const received = signatureHeader.slice("sha256=".length);

  try {
    const valid = timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(received, "hex"),
    );
    return valid
      ? { ok: true as const, skipped: false as const }
      : { ok: false as const, reason: "invalid_signature" };
  } catch {
    return { ok: false as const, reason: "invalid_signature" };
  }
}

function isMessagingEvent(value: unknown): value is MetaMessagingEvent {
  return Boolean(value && typeof value === "object" && "sender" in value);
}

function detectChannel(objectType: string | undefined): OmnichannelChannel | null {
  if (objectType === "instagram") {
    return "instagram";
  }

  if (objectType === "page") {
    return "facebook";
  }

  return null;
}

function parseAttachments(attachments: MetaMessagingAttachment[] | undefined) {
  if (!attachments?.length) {
    return [];
  }

  return attachments.map((attachment) => ({
    type: typeof attachment.type === "string" ? attachment.type : "unknown",
    url:
      typeof attachment.payload?.url === "string"
        ? attachment.payload.url
        : null,
    payload:
      attachment.payload && typeof attachment.payload === "object"
        ? (attachment.payload as Record<string, unknown>)
        : {},
  }));
}

function timestampToIso(timestamp: number | undefined, fallbackMs?: number) {
  const ms = timestamp ?? fallbackMs;
  if (!ms || Number.isNaN(ms)) {
    return new Date().toISOString();
  }

  return new Date(ms).toISOString();
}

export function parseMetaIncomingMessages(
  payload: MetaWebhookPayload,
): ParsedMetaIncomingMessage[] {
  const channel = detectChannel(payload.object);
  if (!channel || !Array.isArray(payload.entry)) {
    return [];
  }

  const parsed: ParsedMetaIncomingMessage[] = [];

  for (const entry of payload.entry) {
    const entryId = typeof entry.id === "string" ? entry.id : "";
    if (!entryId) {
      continue;
    }

    const messagingEvents = Array.isArray(entry.messaging)
      ? entry.messaging.filter(isMessagingEvent)
      : [];

    for (const event of messagingEvents) {
      const message = event.message;
      if (!message || message.is_echo) {
        continue;
      }

      const senderId = event.sender?.id?.trim();
      const messageId = message.mid?.trim();
      if (!senderId || !messageId) {
        continue;
      }

      const attachments = parseAttachments(message.attachments);
      const messageText =
        typeof message.text === "string" ? message.text.trim() : "";

      if (!messageText && attachments.length === 0) {
        continue;
      }

      const senderName =
        typeof event.sender?.name === "string" ? event.sender.name.trim() : "";
      const senderUsername =
        typeof event.sender?.username === "string"
          ? event.sender.username.trim()
          : "";

      parsed.push({
        channel,
        entryId,
        externalConversationId: senderId,
        externalUserId: senderId,
        externalMessageId: messageId,
        messageText: messageText || null,
        attachments,
        customerName: senderName || null,
        customerUsername: senderUsername || null,
        timestamp: timestampToIso(event.timestamp, entry.time),
      });
    }
  }

  return parsed;
}

export function parseMetaWebhookPayload(rawBody: string): MetaWebhookPayload {
  const parsed = JSON.parse(rawBody) as MetaWebhookPayload;
  return parsed;
}
