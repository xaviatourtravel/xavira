import type { MessageRow } from "@/types/omnichannel-inbox";

export type ConversationUploadedFile = {
  id: string;
  name: string;
  url: string | null;
  timestamp: string;
  direction: MessageRow["direction"];
  kind: "file" | "media";
};

const MEDIA_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "mp4",
  "mov",
  "avi",
  "webm",
  "mkv",
  "mp3",
  "wav",
  "ogg",
]);

function resolveFileKind(name: string, attachment: unknown): "file" | "media" {
  const record =
    attachment && typeof attachment === "object"
      ? (attachment as Record<string, unknown>)
      : null;
  const mime =
    typeof record?.mimeType === "string"
      ? record.mimeType
      : typeof record?.type === "string"
        ? record.type
        : "";
  if (mime.startsWith("image/") || mime.startsWith("video/") || mime.startsWith("audio/")) {
    return "media";
  }

  const extension = name.split(".").pop()?.toLowerCase();
  if (extension && MEDIA_EXTENSIONS.has(extension)) {
    return "media";
  }

  return "file";
}

function readAttachmentName(value: unknown, index: number): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidates = [record.name, record.fileName, record.filename, record.url];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        const trimmed = candidate.trim();
        if (trimmed.includes("/")) {
          const parts = trimmed.split("/");
          return parts[parts.length - 1] || trimmed;
        }
        return trimmed;
      }
    }
  }

  return `Attachment ${index + 1}`;
}

function readAttachmentUrl(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const url = record.url ?? record.href ?? record.link;
    return typeof url === "string" && url.trim() ? url.trim() : null;
  }

  return null;
}

export function extractConversationUploadedFiles(
  messages: MessageRow[],
): ConversationUploadedFile[] {
  const files: ConversationUploadedFile[] = [];

  for (const message of messages) {
    const attachments = Array.isArray(message.attachments_json)
      ? message.attachments_json
      : [];

    attachments.forEach((attachment, index) => {
      const name = readAttachmentName(attachment, index);
      files.push({
        id: `${message.id}-${index}`,
        name,
        url: readAttachmentUrl(attachment),
        timestamp: message.created_at,
        direction: message.direction,
        kind: resolveFileKind(name, attachment),
      });
    });
  }

  return files.sort(
    (left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp),
  );
}

export function partitionConversationFiles(files: ConversationUploadedFile[]) {
  return {
    media: files.filter((file) => file.kind === "media"),
    documents: files.filter((file) => file.kind === "file"),
    recent: files.slice(0, 8),
  };
}
