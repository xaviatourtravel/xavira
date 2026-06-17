import { randomUUID } from "crypto";

import type { KnowledgeFileKind } from "@/lib/knowledge/constants";
import { createAdminClient } from "@/utils/supabase/admin";

export const KNOWLEDGE_BUCKET = "knowledge-files";

const KIND_TO_CONTENT_TYPE: Record<KnowledgeFileKind, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

function sanitizeFileName(fileName: string): string {
  const normalized = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "document";
}

export async function uploadKnowledgeFile({
  organizationId,
  buffer,
  fileName,
  kind,
}: {
  organizationId: string;
  buffer: Buffer;
  fileName: string;
  kind: KnowledgeFileKind;
}): Promise<{ filePath: string }> {
  const admin = createAdminClient();
  const filePath = `${organizationId}/${randomUUID()}-${sanitizeFileName(fileName)}`;

  const { error } = await admin.storage
    .from(KNOWLEDGE_BUCKET)
    .upload(filePath, buffer, {
      contentType: KIND_TO_CONTENT_TYPE[kind],
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return { filePath };
}

export async function createKnowledgeFileSignedUrl(
  filePath: string,
  expiresInSeconds = 300,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(KNOWLEDGE_BUCKET)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

export async function removeKnowledgeFile(filePath: string): Promise<void> {
  const admin = createAdminClient();
  await admin.storage.from(KNOWLEDGE_BUCKET).remove([filePath]);
}
