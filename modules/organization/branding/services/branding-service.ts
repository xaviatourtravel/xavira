import type { Profile } from "@/types/app-types";

import { canManageWorkspaceSettings, isAdminOrOwner } from "@/lib/auth/permissions";
import * as invoiceRepo from "@/modules/finance/repositories/invoice-repository";
import {
  resolveWorkspaceBranding,
} from "@/modules/organization/branding/lib/branding-settings";
import {
  assertOrganizationScopedLogoPath,
  validateWorkspaceLogoPrepareMetadata,
} from "@/modules/organization/branding/lib/logo-validation";
import { validateWorkspaceLogoBytes } from "@/modules/organization/branding/lib/logo-bytes";
import {
  createWorkspaceLogoPreviewUrl,
  createWorkspaceLogoSignedUploadUrl,
  downloadWorkspaceLogoObject,
  getWorkspaceLogoObjectInfo,
  plannedLogoPath,
  removeWorkspaceLogoObject,
} from "@/modules/organization/branding/lib/logo-storage";
import * as brandingRepo from "@/modules/organization/branding/repositories/branding-repository";
import type {
  WorkspaceBranding,
  WorkspaceBrandingUpdateInput,
  WorkspaceLogoMime,
} from "@/modules/organization/branding/types";
import { WORKSPACE_BRAND_BUCKET } from "@/modules/organization/branding/types";

function assertCanManageBranding(profile: Profile) {
  if (!isAdminOrOwner(profile) || !canManageWorkspaceSettings(profile)) {
    throw new Error("Only owners and admins can update workspace branding.");
  }
}

function requireOrganizationId(profile: Profile): string {
  if (!profile.organization_id) {
    throw new Error("Organization required");
  }
  return profile.organization_id;
}

export async function getWorkspaceBranding(
  profile: Profile,
): Promise<WorkspaceBranding> {
  const organizationId = requireOrganizationId(profile);
  const org = await brandingRepo.getOrganizationBrandingRow(organizationId);
  if (!org) {
    throw new Error("Organization not found");
  }

  let legacy = null;
  try {
    legacy = await invoiceRepo.getBrandSettings(organizationId);
  } catch {
    legacy = null;
  }

  const branding = resolveWorkspaceBranding({
    organizationId,
    organizationName: org.name,
    organizationPhone: org.phone,
    settings: org.settings,
    legacy: legacy
      ? {
          legalName: legacy.legalName,
          address: legacy.address,
          email: legacy.email,
          phone: legacy.phone,
          website: legacy.website,
          taxId: legacy.taxId,
          primaryColor: legacy.primaryColor,
          secondaryColor: legacy.secondaryColor,
          accentColor: legacy.accentColor,
          logoUrl: legacy.logoUrl,
        }
      : null,
  });

  // Preview signed URL only for members of this org (caller already scoped).
  if (branding.logoPath) {
    branding.logoPreviewUrl = await createWorkspaceLogoPreviewUrl(
      branding.logoPath,
      organizationId,
    );
  }

  return branding;
}

export async function updateWorkspaceBranding(
  profile: Profile,
  input: WorkspaceBrandingUpdateInput,
): Promise<WorkspaceBranding> {
  assertCanManageBranding(profile);
  requireOrganizationId(profile);

  if (!input.displayName?.trim()) {
    throw new Error("INVALID_DISPLAY_NAME: Workspace name is required.");
  }
  if (!input.primaryColor || !input.secondaryColor || !input.accentColor) {
    throw new Error("INVALID_COLOR: Primary, secondary, and accent are required.");
  }

  // Persistence is RPC-only: no arbitrary settings JSON, no service-role org update.
  await brandingRepo.rpcUpdateWorkspaceBranding({
    displayName: input.displayName.trim(),
    legalName: input.legalName ?? null,
    tagline: input.tagline ?? null,
    address: input.address ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    website: input.website ?? null,
    taxId: input.taxId ?? null,
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    accentColor: input.accentColor,
  });

  return getWorkspaceBranding(profile);
}

export async function prepareWorkspaceLogoUpload(
  profile: Profile,
  input: {
    originalFilename: string;
    declaredMimeType: string;
    declaredSize: number;
    /** Client-computed hash for path planning; recomputed on finalize. */
    contentHash: string;
  },
): Promise<{
  bucket: string;
  storagePath: string;
  token: string;
  mimeType: WorkspaceLogoMime;
  alreadyUploaded: boolean;
}> {
  assertCanManageBranding(profile);
  const organizationId = requireOrganizationId(profile);

  const validation = validateWorkspaceLogoPrepareMetadata(input);
  if (!validation.ok) {
    throw new Error(`${validation.code}: ${validation.message}`);
  }

  if (!/^[a-f0-9]{64}$/i.test(input.contentHash)) {
    throw new Error("INVALID_CONTENT_HASH: Invalid logo content hash.");
  }

  const storagePath = plannedLogoPath({
    organizationId,
    contentHash: input.contentHash.toLowerCase(),
    mimeType: validation.mimeType,
  });

  // organization_id never comes from the browser for path construction
  if (!assertOrganizationScopedLogoPath(storagePath, organizationId)) {
    throw new Error("INVALID_PATH: Logo path must be organization-scoped.");
  }

  const existingObject = await getWorkspaceLogoObjectInfo(
    storagePath,
    organizationId,
  );
  if (existingObject) {
    return {
      bucket: WORKSPACE_BRAND_BUCKET,
      storagePath,
      token: "",
      mimeType: validation.mimeType,
      alreadyUploaded: true as const,
    };
  }

  const signed = await createWorkspaceLogoSignedUploadUrl(
    storagePath,
    organizationId,
  );
  return {
    bucket: WORKSPACE_BRAND_BUCKET,
    storagePath,
    token: signed.token,
    mimeType: validation.mimeType,
    alreadyUploaded: false as const,
  };
}

export async function finalizeWorkspaceLogoUpload(
  profile: Profile,
  input: {
    storagePath: string;
    originalFilename: string;
    contentHash: string;
    mimeType: WorkspaceLogoMime;
  },
): Promise<WorkspaceBranding> {
  assertCanManageBranding(profile);
  const organizationId = requireOrganizationId(profile);

  // Reject cross-workspace paths before any Storage access.
  if (!assertOrganizationScopedLogoPath(input.storagePath, organizationId)) {
    throw new Error("INVALID_PATH: Logo path must be organization-scoped.");
  }

  const claimedPath = plannedLogoPath({
    organizationId,
    contentHash: input.contentHash.toLowerCase(),
    mimeType: input.mimeType,
  });
  if (input.storagePath !== claimedPath) {
    throw new Error("PATH_MISMATCH: Upload path does not match content hash.");
  }

  const org = await brandingRepo.getOrganizationBrandingRow(organizationId);
  if (!org) throw new Error("Organization not found");

  const current = resolveWorkspaceBranding({
    organizationId,
    organizationName: org.name,
    organizationPhone: org.phone,
    settings: org.settings,
  });

  // Duplicate finalize with same path is safe — idempotent success.
  if (
    current.logoPath === input.storagePath &&
    current.logoContentHash?.toLowerCase() === input.contentHash.toLowerCase()
  ) {
    return getWorkspaceBranding(profile);
  }

  const info = await getWorkspaceLogoObjectInfo(
    input.storagePath,
    organizationId,
  );
  if (!info) {
    throw new Error("OBJECT_MISSING: Uploaded logo was not found in storage.");
  }

  const buffer = await downloadWorkspaceLogoObject(
    input.storagePath,
    organizationId,
  );
  if (!buffer) {
    throw new Error("OBJECT_UNREADABLE: Unable to read uploaded logo.");
  }

  // Recompute magic/MIME/hash from stored bytes — never trust client alone.
  const bytesCheck = validateWorkspaceLogoBytes({
    buffer,
    declaredMimeType: input.mimeType,
  });
  if (!bytesCheck.ok) {
    await removeWorkspaceLogoObject(input.storagePath, organizationId).catch(
      () => undefined,
    );
    throw new Error(`${bytesCheck.code}: ${bytesCheck.message}`);
  }

  if (bytesCheck.contentHash.toLowerCase() !== input.contentHash.toLowerCase()) {
    await removeWorkspaceLogoObject(input.storagePath, organizationId).catch(
      () => undefined,
    );
    throw new Error("HASH_MISMATCH: Uploaded content hash does not match.");
  }

  const authoritativePath = plannedLogoPath({
    organizationId,
    contentHash: bytesCheck.contentHash.toLowerCase(),
    mimeType: bytesCheck.mimeType,
  });
  if (authoritativePath !== input.storagePath) {
    await removeWorkspaceLogoObject(input.storagePath, organizationId).catch(
      () => undefined,
    );
    throw new Error("PATH_MISMATCH: Logo path does not match verified bytes.");
  }

  const result = await brandingRepo.rpcSetWorkspaceBrandingLogo({
    logoPath: authoritativePath,
    contentHash: bytesCheck.contentHash.toLowerCase(),
    mimeType: bytesCheck.mimeType,
  });

  // Replace creates a new hashed path — remove prior object when different.
  if (
    result.previousLogoPath &&
    result.previousLogoPath !== authoritativePath
  ) {
    await removeWorkspaceLogoObject(
      result.previousLogoPath,
      organizationId,
    ).catch(() => undefined);
  }

  return getWorkspaceBranding(profile);
}

export async function removeWorkspaceLogo(
  profile: Profile,
): Promise<WorkspaceBranding> {
  assertCanManageBranding(profile);
  const organizationId = requireOrganizationId(profile);

  const cleared = await brandingRepo.rpcClearWorkspaceBrandingLogo();
  if (cleared.previousLogoPath) {
    await removeWorkspaceLogoObject(
      cleared.previousLogoPath,
      organizationId,
    ).catch(() => undefined);
  }

  return getWorkspaceBranding(profile);
}

export {
  resolveWorkspaceBranding,
  deriveWorkspaceInitials,
} from "@/modules/organization/branding/lib/branding-settings";
