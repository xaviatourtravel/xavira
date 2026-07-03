import { randomUUID } from "crypto";

import { createAdminClient } from "@/utils/supabase/admin";

export const BUSINESS_BRAIN_BUCKET = "business-brain";

function sanitizeFileName(fileName: string): string {
  const normalized = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "document";
}

export async function uploadBusinessBrainDocument({
  organizationId,
  buffer,
  fileName,
  mimeType,
}: {
  organizationId: string;
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}): Promise<{ storagePath: string }> {
  const admin = createAdminClient();
  const storagePath = `${organizationId}/documents/${randomUUID()}-${sanitizeFileName(fileName)}`;

  const { error } = await admin.storage
    .from(BUSINESS_BRAIN_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return { storagePath };
}

export async function createBusinessBrainDocumentSignedUrl(
  storagePath: string,
  expiresInSeconds = 300,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUSINESS_BRAIN_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

export async function removeBusinessBrainDocument(storagePath: string): Promise<void> {
  const admin = createAdminClient();
  await admin.storage.from(BUSINESS_BRAIN_BUCKET).remove([storagePath]);
}
