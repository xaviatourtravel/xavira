"use server";

import { revalidatePath } from "next/cache";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { updateActionPermissionSchema } from "@/modules/business-brain/schemas/action-permissions";
import {
  getActionPermissions,
  updateActionPermission,
} from "@/modules/business-brain/services/business-brain-action-permission-service";

const AI_PERMISSIONS_PATH = "/business-brain/ai-permissions";

function revalidateAiPermissions() {
  revalidatePath(AI_PERMISSIONS_PATH);
}

function requireOrgId(profile: { organization_id: string | null }) {
  if (!profile.organization_id) {
    throw new Error("Organization is required.");
  }
  return profile.organization_id;
}

export async function loadBrainActionPermissionsAction() {
  const { profile } = await requireProfile();
  const organizationId = requireOrgId(profile);
  const permissions = await getActionPermissions(organizationId);

  return {
    permissions,
    canEdit: isAdminOrOwner(profile),
  };
}

export async function updateBrainActionPermissionAction(input: unknown) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  const parsed = updateActionPermissionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid permission data.",
    };
  }

  try {
    const organizationId = requireOrgId(profile);
    const permission = await updateActionPermission(organizationId, parsed.data);
    revalidateAiPermissions();
    return { ok: true as const, permission };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to update permission.",
    };
  }
}
