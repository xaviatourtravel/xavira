"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/session";
import { formatActionError } from "@/lib/errors";
import { workspaceBrandingUpdateSchema } from "@/modules/organization/branding/schemas";
import {
  finalizeWorkspaceLogoUpload,
  getWorkspaceBranding,
  prepareWorkspaceLogoUpload,
  removeWorkspaceLogo,
  updateWorkspaceBranding,
} from "@/modules/organization/branding/services/branding-service";
import type { WorkspaceLogoMime } from "@/modules/organization/branding/types";

function revalidateBrandingPaths() {
  revalidatePath("/settings");
  revalidatePath("/settings/organization");
  revalidatePath("/settings/organization/branding");
  revalidatePath("/finance/invoices/settings");
}

export async function getWorkspaceBrandingAction() {
  try {
    const { profile } = await requireProfile();
    const branding = await getWorkspaceBranding(profile);
    return { success: true as const, branding };
  } catch (error) {
    return {
      success: false as const,
      message: formatActionError(error, "getWorkspaceBranding"),
    };
  }
}

export async function updateWorkspaceBrandingAction(raw: unknown) {
  try {
    const { profile } = await requireProfile();
    const input = workspaceBrandingUpdateSchema.parse(raw);
    const branding = await updateWorkspaceBranding(profile, input);
    revalidateBrandingPaths();
    return { success: true as const, branding };
  } catch (error) {
    return {
      success: false as const,
      message: formatActionError(error, "updateWorkspaceBranding"),
    };
  }
}

export async function prepareWorkspaceLogoUploadAction(input: {
  originalFilename: string;
  declaredMimeType: string;
  declaredSize: number;
  contentHash: string;
}) {
  try {
    const { profile } = await requireProfile();
    const prepared = await prepareWorkspaceLogoUpload(profile, input);
    return { ok: true as const, ...prepared };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to prepare logo upload.";
    const [code, ...rest] = message.split(": ");
    return {
      ok: false as const,
      code: rest.length ? code : "UPLOAD_PREPARATION_FAILED",
      message: rest.length ? rest.join(": ") : message,
    };
  }
}

export async function finalizeWorkspaceLogoUploadAction(input: {
  storagePath: string;
  originalFilename: string;
  contentHash: string;
  mimeType: WorkspaceLogoMime;
}) {
  try {
    const { profile } = await requireProfile();
    const branding = await finalizeWorkspaceLogoUpload(profile, input);
    revalidateBrandingPaths();
    return { ok: true as const, branding };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to finalize logo upload.";
    const [code, ...rest] = message.split(": ");
    return {
      ok: false as const,
      code: rest.length ? code : "UPLOAD_FINALIZATION_FAILED",
      message: rest.length ? rest.join(": ") : message,
    };
  }
}

export async function removeWorkspaceLogoAction() {
  try {
    const { profile } = await requireProfile();
    const branding = await removeWorkspaceLogo(profile);
    revalidateBrandingPaths();
    return { success: true as const, branding };
  } catch (error) {
    return {
      success: false as const,
      message: formatActionError(error, "removeWorkspaceLogo"),
    };
  }
}
