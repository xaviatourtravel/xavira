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
 * Signature validation env:
 *   META_WEBHOOK_APP_SECRET (webhook POST signature only)
 *
 * OAuth/token exchange uses META_APP_SECRET separately — not for webhooks.
 *
 * Subscribe to `messages` on the connected Page in Meta Developer Console.
 */

export type MetaWebhookSignatureSecretSource = "META_WEBHOOK_APP_SECRET" | "none";

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

export type MetaWebhookSignatureResult =
  | { ok: true; skipped: true }
  | { ok: true; skipped: false; algorithm: MetaWebhookSignatureAlgorithm }
  | {
      ok: false;
      reason: "missing_signature" | "invalid_signature";
      algorithm?: MetaWebhookSignatureAlgorithm;
      debug?: MetaWebhookSignatureDebug;
    };

export type MetaWebhookSignatureAlgorithm = "sha256" | "sha1";

export type MetaWebhookSignatureDebug = {
  algorithm: MetaWebhookSignatureAlgorithm;
  expectedPrefix: string;
  receivedPrefix: string;
  bodyLength: number;
  expectedDigestLength: number;
  receivedDigestLength: number;
};

const SIGNATURE_PREFIX_LENGTH = 12;

function signatureDigestPrefix(digest: string) {
  return digest.slice(0, SIGNATURE_PREFIX_LENGTH);
}

function safeEqualHexDigest(expectedHex: string, receivedHex: string): boolean {
  const expected = expectedHex.toLowerCase();
  const received = receivedHex.toLowerCase().trim();

  if (expected.length !== received.length) {
    return false;
  }

  if (!/^[0-9a-f]+$/.test(received) || !/^[0-9a-f]+$/.test(expected)) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function computeHmacHexDigest(
  rawBody: string,
  appSecret: string,
  algorithm: MetaWebhookSignatureAlgorithm,
) {
  return createHmac(algorithm, appSecret).update(rawBody, "utf8").digest("hex");
}

function verifySignatureHeader(
  rawBody: string,
  appSecret: string,
  algorithm: MetaWebhookSignatureAlgorithm,
  headerPrefix: "sha256=" | "sha1=",
  signatureHeader: string,
): { valid: boolean; debug: MetaWebhookSignatureDebug } {
  const received = signatureHeader.slice(headerPrefix.length).trim();
  const expected = computeHmacHexDigest(rawBody, appSecret, algorithm);

  return {
    valid: safeEqualHexDigest(expected, received),
    debug: {
      algorithm,
      expectedPrefix: signatureDigestPrefix(expected),
      receivedPrefix: signatureDigestPrefix(received),
      bodyLength: rawBody.length,
      expectedDigestLength: expected.length,
      receivedDigestLength: received.length,
    },
  };
}

export function getMetaWebhookSignatureDebugLog(
  debug: MetaWebhookSignatureDebug,
) {
  return {
    algorithm: debug.algorithm,
    expectedPrefix: debug.expectedPrefix,
    receivedPrefix: debug.receivedPrefix,
    bodyLength: debug.bodyLength,
    expectedDigestLength: debug.expectedDigestLength,
    receivedDigestLength: debug.receivedDigestLength,
  };
}

export function metaWebhookLog(
  message: string,
  details?: Record<string, unknown>,
) {
  if (details) {
    console.log(`[META WEBHOOK] ${message}`, details);
    return;
  }

  console.log(`[META WEBHOOK] ${message}`);
}

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

export function getMetaWebhookSignatureSecretContext() {
  const hasWebhookAppSecret = Boolean(process.env.META_WEBHOOK_APP_SECRET?.trim());
  const hasMetaAppSecret = Boolean(process.env.META_APP_SECRET?.trim());

  return {
    secretSource: hasWebhookAppSecret
      ? ("META_WEBHOOK_APP_SECRET" as const)
      : ("none" as const),
    hasMetaAppSecret,
    hasWebhookAppSecret,
  };
}

export function getMetaWebhookAppSecret(): string | undefined {
  const secret = process.env.META_WEBHOOK_APP_SECRET?.trim();
  return secret || undefined;
}

export function getMetaWebhookPostLogContext(
  request: Request,
  rawBody: string,
) {
  return {
    method: request.method,
    userAgent: request.headers.get("user-agent"),
    contentType: request.headers.get("content-type"),
    hasSignature256: Boolean(request.headers.get("x-hub-signature-256")),
    hasSignature: Boolean(request.headers.get("x-hub-signature")),
    bodyLength: rawBody.length,
    ...getMetaWebhookSignatureSecretContext(),
  };
}

export function logMetaWebhookReject(
  reason: string,
  request: Request,
  rawBody: string,
  extra?: Record<string, unknown>,
) {
  metaWebhookLog(`reject reason: ${reason}`, {
    ...getMetaWebhookPostLogContext(request, rawBody),
    ...extra,
  });
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
  headers: {
    signature256: string | null;
    signature: string | null;
  },
  appSecret: string | undefined,
): MetaWebhookSignatureResult {
  if (!appSecret?.trim()) {
    return { ok: true, skipped: true };
  }

  const secret = appSecret.trim();
  const signature256 = headers.signature256?.trim() ?? "";
  const signature = headers.signature?.trim() ?? "";

  if (signature256.startsWith("sha256=")) {
    const result = verifySignatureHeader(
      rawBody,
      secret,
      "sha256",
      "sha256=",
      signature256,
    );

    if (result.valid) {
      return { ok: true, skipped: false, algorithm: "sha256" };
    }

    return {
      ok: false,
      reason: "invalid_signature",
      algorithm: "sha256",
      debug: result.debug,
    };
  }

  if (signature.startsWith("sha1=")) {
    const result = verifySignatureHeader(
      rawBody,
      secret,
      "sha1",
      "sha1=",
      signature,
    );

    if (result.valid) {
      return { ok: true, skipped: false, algorithm: "sha1" };
    }

    return {
      ok: false,
      reason: "invalid_signature",
      algorithm: "sha1",
      debug: result.debug,
    };
  }

  return { ok: false, reason: "missing_signature" };
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
