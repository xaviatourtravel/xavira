import {
  defaultPermissionForAction,
  findBrainActionPermissionForWorkspace,
} from "@/modules/business-brain/repositories/brain-action-permission-repository";
import {
  isConfigurableActionType,
  type BrainActionPermissionRecord,
} from "@/modules/business-brain/types/action-permissions";
import {
  normalizeActionConfidence,
  type ActionEngineContext,
  type ActionValidationResult,
  type AIAction,
} from "@/modules/ai/action-engine/types";

export type ActionPermissionCheckResult =
  | {
      approved: true;
      permission: BrainActionPermissionRecord;
      requiresApproval: boolean;
    }
  | { approved: false; reason: string; code: string };

async function resolvePermission(
  context: ActionEngineContext,
  action: AIAction,
): Promise<BrainActionPermissionRecord> {
  if (!isConfigurableActionType(action.type)) {
    throw new Error(`Action type is not permission-controlled: ${action.type}`);
  }

  const stored = await findBrainActionPermissionForWorkspace(
    context.supabase,
    context.workspaceId,
    action.type,
  );

  if (stored) {
    return stored;
  }

  const defaults = defaultPermissionForAction(action.type);
  return {
    id: "",
    businessBrainId: "",
    ...defaults,
    createdAt: "",
    updatedAt: "",
  };
}

export async function checkActionPermission(
  action: AIAction,
  context: ActionEngineContext,
): Promise<ActionPermissionCheckResult> {
  if (action.type === "NO_ACTION") {
    return {
      approved: true,
      permission: {
        id: "",
        businessBrainId: "",
        actionType: "UPDATE_MEMORY",
        enabled: true,
        requireManualApproval: false,
        minimumConfidence: 0.5,
        createdAt: "",
        updatedAt: "",
      },
      requiresApproval: false,
    };
  }

  if (!isConfigurableActionType(action.type)) {
    return {
      approved: false,
      reason: `Unsupported action type: ${action.type}`,
      code: "unsupported_action",
    };
  }

  const permission = await resolvePermission(context, action);

  if (!permission.enabled) {
    return {
      approved: false,
      reason: `${action.type} is disabled for this workspace`,
      code: "action_permission_disabled",
    };
  }

  const confidence = normalizeActionConfidence(action.confidence);
  if (confidence < permission.minimumConfidence) {
    return {
      approved: false,
      reason: `Confidence ${confidence.toFixed(2)} is below workspace minimum ${permission.minimumConfidence.toFixed(2)}`,
      code: "action_permission_low_confidence",
    };
  }

  return {
    approved: true,
    permission,
    requiresApproval: permission.requireManualApproval,
  };
}

export function isPermissionBlockedCode(code: string): boolean {
  return (
    code === "action_permission_disabled" ||
    code === "action_permission_low_confidence"
  );
}

export function mergeRequiresApproval(
  permissionRequiresApproval: boolean,
  typeRequiresApproval: boolean,
): boolean {
  return permissionRequiresApproval || typeRequiresApproval;
}
