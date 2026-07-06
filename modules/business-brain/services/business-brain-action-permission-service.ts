import {
  ensureDefaultBrainActionPermissions,
  findBrainActionPermission,
  listBrainActionPermissions,
  upsertBrainActionPermission,
} from "@/modules/business-brain/repositories/brain-action-permission-repository";
import {
  ensureBusinessBrain,
  findBusinessBrainByOrganizationId,
} from "@/modules/business-brain/repositories/business-brain-repository";
import {
  DEFAULT_BRAIN_ACTION_PERMISSIONS,
  type BrainActionPermissionRecord,
  type PermissionedActionType,
} from "@/modules/business-brain/types/action-permissions";

export type UpdateActionPermissionInput = {
  actionType: PermissionedActionType;
  enabled: boolean;
  requireManualApproval: boolean;
  minimumConfidence: number;
};

async function getBusinessBrainId(organizationId: string) {
  const brain = await ensureBusinessBrain(organizationId);
  await ensureDefaultBrainActionPermissions(brain.id);
  return brain.id;
}

export async function getActionPermissions(
  organizationId: string,
): Promise<BrainActionPermissionRecord[]> {
  const businessBrainId = await getBusinessBrainId(organizationId);
  return listBrainActionPermissions(businessBrainId);
}

export async function getActionPermission(
  organizationId: string,
  actionType: PermissionedActionType,
): Promise<BrainActionPermissionRecord> {
  const businessBrainId = await getBusinessBrainId(organizationId);
  const permission = await findBrainActionPermission(businessBrainId, actionType);

  if (permission) {
    return permission;
  }

  const defaults = DEFAULT_BRAIN_ACTION_PERMISSIONS[actionType];
  return {
    id: "",
    businessBrainId,
    actionType,
    enabled: defaults.enabled,
    requireManualApproval: defaults.requireManualApproval,
    minimumConfidence: defaults.minimumConfidence,
    createdAt: "",
    updatedAt: "",
  };
}

export async function updateActionPermission(
  organizationId: string,
  input: UpdateActionPermissionInput,
): Promise<BrainActionPermissionRecord> {
  const businessBrain = await findBusinessBrainByOrganizationId(organizationId);
  if (!businessBrain) {
    throw new Error("Business Brain not found.");
  }

  await ensureDefaultBrainActionPermissions(businessBrain.id);

  const minimumConfidence = Math.min(1, Math.max(0.5, input.minimumConfidence));

  return upsertBrainActionPermission({
    businessBrainId: businessBrain.id,
    actionType: input.actionType,
    enabled: input.enabled,
    requireManualApproval: input.requireManualApproval,
    minimumConfidence,
  });
}
