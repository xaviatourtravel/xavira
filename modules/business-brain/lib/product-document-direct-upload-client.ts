import { createClient } from "@/utils/supabase/client";

import { BRAIN_PRODUCT_BUCKET } from "@/modules/business-brain/lib/product-storage";

export type DirectProductDocumentUploadInput = {
  storagePath: string;
  token: string;
  file: File;
  mimeType: string;
};

export type DirectProductDocumentUploadResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Uploads a file directly to Supabase Storage using a server-issued signed upload token.
 * Binary bytes never pass through Next.js. Supabase uploadToSignedUrl does not expose
 * byte-level transfer progress, so callers should use stage-based UI instead of percent.
 */
export async function uploadProductDocumentToSignedUrl(
  input: DirectProductDocumentUploadInput,
): Promise<DirectProductDocumentUploadResult> {
  const supabase = createClient();

  const { error } = await supabase.storage
    .from(BRAIN_PRODUCT_BUCKET)
    .uploadToSignedUrl(input.storagePath, input.token, input.file, {
      contentType: input.mimeType,
      upsert: false,
    });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  return { ok: true };
}
