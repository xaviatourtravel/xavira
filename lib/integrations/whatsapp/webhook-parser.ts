import type { Json } from "@/types/database";

export type ParsedWhatsAppIncomingMessage = {
  instanceName: string;
  phoneNumber: string;
  pushName: string | null;
  messageText: string | null;
  messageType: string;
  mediaUrl: string | null;
  externalMessageId: string;
  timestamp: string;
  rawPayload: Json;
};

export type WhatsAppWebhookParseResult = {
  messages: ParsedWhatsAppIncomingMessage[];
  ignored: number;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizePhoneFromJid(value: string | null) {
  if (!value) {
    return null;
  }

  const jid = value.split("@")[0] ?? value;
  const digits = jid.replace(/\D/g, "");
  return digits || null;
}

function normalizeTimestamp(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    return new Date(millis).toISOString();
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
}

function extractMessageText(message: Record<string, unknown>) {
  const conversation = getString(message.conversation);
  if (conversation) {
    return conversation;
  }

  const extendedText = asRecord(message.extendedTextMessage);
  const extendedBody = getString(extendedText.text);
  if (extendedBody) {
    return extendedBody;
  }

  const image = asRecord(message.imageMessage);
  if (Object.keys(image).length > 0) {
    return getString(image.caption) || "[Gambar]";
  }

  const video = asRecord(message.videoMessage);
  if (Object.keys(video).length > 0) {
    return getString(video.caption) || "[Video]";
  }

  const audio = asRecord(message.audioMessage);
  if (Object.keys(audio).length > 0) {
    return "[Audio]";
  }

  const document = asRecord(message.documentMessage);
  if (Object.keys(document).length > 0) {
    return getString(document.fileName) || "[Dokumen]";
  }

  const sticker = asRecord(message.stickerMessage);
  if (Object.keys(sticker).length > 0) {
    return "[Stiker]";
  }

  return null;
}

function extractMediaUrl(message: Record<string, unknown>) {
  const image = asRecord(message.imageMessage);
  const video = asRecord(message.videoMessage);
  const audio = asRecord(message.audioMessage);
  const document = asRecord(message.documentMessage);

  return (
    getString(image.url) ||
    getString(video.url) ||
    getString(audio.url) ||
    getString(document.url) ||
    null
  );
}

function detectMessageType(message: Record<string, unknown>) {
  if (message.conversation) {
    return "text";
  }

  if (message.extendedTextMessage) {
    return "text";
  }

  if (message.imageMessage) {
    return "image";
  }

  if (message.videoMessage) {
    return "video";
  }

  if (message.audioMessage) {
    return "audio";
  }

  if (message.documentMessage) {
    return "document";
  }

  if (message.stickerMessage) {
    return "sticker";
  }

  return "text";
}

function shouldSkipJid(remoteJid: string | null) {
  if (!remoteJid) {
    return true;
  }

  return (
    remoteJid.endsWith("@g.us") ||
    remoteJid.endsWith("@broadcast") ||
    remoteJid === "status@broadcast"
  );
}

function parseMessageRecord(
  instanceName: string,
  record: Record<string, unknown>,
  fallbackPayload: Json,
): ParsedWhatsAppIncomingMessage | null {
  const key = asRecord(record.key);
  const remoteJid = getString(key.remoteJid) ?? getString(record.remoteJid);
  const fromMe = key.fromMe === true || record.fromMe === true;

  if (fromMe || shouldSkipJid(remoteJid)) {
    return null;
  }

  const phoneNumber = normalizePhoneFromJid(remoteJid);
  if (!phoneNumber) {
    return null;
  }

  const message = asRecord(record.message);
  const messageText = extractMessageText(message);
  const messageType = getString(record.messageType) ?? detectMessageType(message);
  const externalMessageId =
    getString(key.id) ??
    getString(record.id) ??
    `${phoneNumber}-${normalizeTimestamp(record.messageTimestamp ?? record.timestamp)}`;

  if (!messageText && messageType === "text") {
    return null;
  }

  return {
    instanceName,
    phoneNumber,
    pushName: getString(record.pushName) ?? getString(record.notify),
    messageText,
    messageType,
    mediaUrl: extractMediaUrl(message),
    externalMessageId,
    timestamp: normalizeTimestamp(
      record.messageTimestamp ?? record.timestamp ?? record.t,
    ),
    rawPayload: fallbackPayload,
  };
}

function collectMessageRecords(payload: Record<string, unknown>) {
  const instanceName =
    getString(payload.instance) ??
    getString(payload.instanceName) ??
    getString(asRecord(payload.instance).instanceName) ??
    "desklabs-local";

  const data = payload.data;
  const records: Record<string, unknown>[] = [];

  if (Array.isArray(data)) {
    for (const item of data) {
      records.push(asRecord(item));
    }
  } else {
    const dataRecord = asRecord(data);
    records.push(...asArray(dataRecord.messages).map(asRecord));

    if (Object.keys(dataRecord).length > 0) {
      records.push(dataRecord);
    }
  }

  if (records.length === 0) {
    records.push(payload);
  }

  return { instanceName, records };
}

export function parseWhatsAppWebhookPayload(payload: unknown): WhatsAppWebhookParseResult {
  const root = asRecord(payload);
  const event = getString(root.event)?.toLowerCase() ?? "";
  const allowedEvents = [
    "",
    "messages.upsert",
    "messages_upsert",
    "message",
    "messages.set",
  ];

  if (event && !allowedEvents.includes(event)) {
    return { messages: [], ignored: 1 };
  }

  const { instanceName, records } = collectMessageRecords(root);
  const messages: ParsedWhatsAppIncomingMessage[] = [];
  let ignored = 0;

  for (const record of records) {
    const parsed = parseMessageRecord(instanceName, record, root as Json);
    if (parsed) {
      messages.push(parsed);
    } else {
      ignored += 1;
    }
  }

  return { messages, ignored };
}

export function parseWhatsAppWebhookBody(rawBody: string): unknown {
  if (!rawBody.trim()) {
    throw new Error("empty_payload");
  }

  return JSON.parse(rawBody) as unknown;
}

export function whatsAppWebhookDevLog(message: string, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.info("[WHATSAPP WEBHOOK]", message, context ?? {});
  }
}

export function whatsAppWebhookLog(message: string, context?: Record<string, unknown>) {
  console.info("[WHATSAPP WEBHOOK]", message, context ?? {});
}
