"use client";

import { createClient } from "@/utils/supabase/client";

import { WORKSPACE_BRAND_BUCKET } from "@/modules/organization/branding/types";

export async function uploadWorkspaceLogoToSignedUrl(params: {
  storagePath: string;
  token: string;
  file: File;
  mimeType: string;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(WORKSPACE_BRAND_BUCKET)
    .uploadToSignedUrl(params.storagePath, params.token, params.file, {
      contentType: params.mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }
}

export async function hashFileSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
