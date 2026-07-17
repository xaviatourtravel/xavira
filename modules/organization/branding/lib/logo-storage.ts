import { createAdminClient } from "@/utils/supabase/admin";

import {
  WORKSPACE_BRAND_BUCKET,
  type WorkspaceLogoMime,
} from "@/modules/organization/branding/types";
import {
  assertOrganizationScopedLogoPath,
  buildWorkspaceLogoStoragePath,
} from "@/modules/organization/branding/lib/logo-validation";

/**
 * Storage helpers are server-only. Service role is used solely for private
 * Storage operations after application authz and org-scoped path checks.
 * There is no generic organization table update helper here.
 */

export async function createWorkspaceLogoSignedUploadUrl(
  storagePath: string,
  organizationId: string,
): Promise<{ token: string; signedUrl: string }> {
  if (!assertOrganizationScopedLogoPath(storagePath, organizationId)) {
    throw new Error("INVALID_PATH: Logo path must be organization-scoped.");
  }
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(WORKSPACE_BRAND_BUCKET)
    .createSignedUploadUrl(storagePath, { upsert: false });

  if (error || !data?.token) {
    throw new Error(error?.message ?? "Failed to create signed upload URL.");
  }

  return { token: data.token, signedUrl: data.signedUrl };
}

export async function downloadWorkspaceLogoObject(
  storagePath: string,
  organizationId: string,
): Promise<Buffer | null> {
  if (!assertOrganizationScopedLogoPath(storagePath, organizationId)) {
    return null;
  }
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(WORKSPACE_BRAND_BUCKET)
    .download(storagePath);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

export async function getWorkspaceLogoObjectInfo(
  storagePath: string,
  organizationId: string,
): Promise<{ size: number; mimeType: string | null } | null> {
  if (!assertOrganizationScopedLogoPath(storagePath, organizationId)) {
    return null;
  }
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(WORKSPACE_BRAND_BUCKET)
    .info(storagePath);
  if (error || !data) return null;
  return {
    size: data.size ?? 0,
    mimeType: data.contentType ?? data.metadata?.mimetype ?? null,
  };
}

/** Short-lived Settings preview URL only — never a permanent public logo URL. */
export async function createWorkspaceLogoPreviewUrl(
  storagePath: string,
  organizationId: string,
  expiresInSeconds = 900,
): Promise<string | null> {
  if (!assertOrganizationScopedLogoPath(storagePath, organizationId)) {
    return null;
  }
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(WORKSPACE_BRAND_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function removeWorkspaceLogoObject(
  storagePath: string,
  organizationId: string,
): Promise<void> {
  if (!assertOrganizationScopedLogoPath(storagePath, organizationId)) {
    throw new Error("INVALID_PATH: Logo path must be organization-scoped.");
  }
  const admin = createAdminClient();
  await admin.storage.from(WORKSPACE_BRAND_BUCKET).remove([storagePath]);
}

export function plannedLogoPath(params: {
  organizationId: string;
  contentHash: string;
  mimeType: WorkspaceLogoMime;
}): string {
  return buildWorkspaceLogoStoragePath(params);
}
