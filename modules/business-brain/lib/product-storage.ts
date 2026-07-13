import { randomUUID } from "crypto";

import { createAdminClient } from "@/utils/supabase/admin";

import {
  logProductUploadError,
  logProductUploadStep,
} from "@/modules/business-brain/lib/product-upload-debug";
import {
  buildProductDocumentStoragePath,
  isPdfBuffer,
  sanitizeProductDocumentFileName,
} from "@/modules/business-brain/lib/product-document-upload-path";

export const BRAIN_PRODUCT_BUCKET = "brain-product-files";

export { sanitizeProductDocumentFileName, buildProductDocumentStoragePath };

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
  const filePath = buildProductDocumentStoragePath(
    organizationId,
    productId,
    randomUUID(),
    fileName,
  );

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

export async function createBrainProductSignedUploadUrl(
  filePath: string,
): Promise<{ token: string; signedUrl: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BRAIN_PRODUCT_BUCKET)
    .createSignedUploadUrl(filePath, { upsert: false });

  if (error || !data?.token) {
    logProductUploadError(error);
    throw new Error(error?.message ?? "Failed to create signed upload URL.");
  }

  return {
    token: data.token,
    signedUrl: data.signedUrl,
  };
}

export type BrainProductStoredObjectInfo = {
  size: number;
  mimeType: string | null;
};

export async function getBrainProductStoredObjectInfo(
  filePath: string,
): Promise<BrainProductStoredObjectInfo | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BRAIN_PRODUCT_BUCKET).info(filePath);

  if (error) {
    logProductUploadError(error);
    return null;
  }

  return {
    size: data.size ?? 0,
    mimeType: data.contentType ?? data.metadata?.mimetype ?? null,
  };
}

export async function readBrainProductFileHeader(
  filePath: string,
  byteCount = 5,
): Promise<Buffer | null> {
  const signedUrl = await createBrainProductFileSignedUrl(filePath, 60);
  if (!signedUrl) {
    return null;
  }

  const response = await fetch(signedUrl, {
    headers: {
      Range: `bytes=0-${byteCount - 1}`,
    },
  });

  if (!response.ok && response.status !== 206) {
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function verifyBrainProductPdfHeader(filePath: string): Promise<boolean> {
  const header = await readBrainProductFileHeader(filePath);
  if (!header) return false;
  return isPdfBuffer(header);
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
