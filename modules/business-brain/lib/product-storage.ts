import { randomUUID } from "crypto";

import { createAdminClient } from "@/utils/supabase/admin";

import {
  logProductUploadError,
  logProductUploadStep,
} from "@/modules/business-brain/lib/product-upload-debug";

export const BRAIN_PRODUCT_BUCKET = "brain-product-files";

function sanitizeFileName(fileName: string): string {
  const normalized = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "document";
}

export async function uploadBrainProductFile({
  organizationId,
  productId,
  buffer,
  fileName,
  mimeType,
}: {
  organizationId: string;
  productId: string;
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}): Promise<{ filePath: string }> {
  const admin = createAdminClient();
  const filePath = `${organizationId}/${productId}/${randomUUID()}-${sanitizeFileName(fileName)}`;

  logProductUploadStep("Supabase upload request", {
    bucket: BRAIN_PRODUCT_BUCKET,
    filePath,
    mimeType,
    byteLength: buffer.byteLength,
  });

  const { data, error } = await admin.storage
    .from(BRAIN_PRODUCT_BUCKET)
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  logProductUploadStep("Supabase response", {
    bucket: BRAIN_PRODUCT_BUCKET,
    filePath,
    data,
    error: error
      ? {
          message: error.message,
          name: error.name,
        }
      : null,
  });

  if (error) {
    logProductUploadError(error);
    throw error;
  }

  return { filePath };
}

export async function createBrainProductFileSignedUrl(
  filePath: string,
  expiresInSeconds = 300,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BRAIN_PRODUCT_BUCKET)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

export async function removeBrainProductFile(filePath: string): Promise<void> {
  const admin = createAdminClient();
  await admin.storage.from(BRAIN_PRODUCT_BUCKET).remove([filePath]);
}
