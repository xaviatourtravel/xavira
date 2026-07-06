import type { AIActionType } from "@/modules/ai/action-engine/types";

export const PERMISSIONED_ACTION_TYPES = [
  "SEND_DOCUMENT",
  "HANDOVER",
  "CREATE_LEAD_NOTE",
  "UPDATE_MEMORY",
  "UPDATE_LEAD_PROGRESS",
  "SUGGEST_PACKAGE",
  "ASK_QUALIFICATION",
  "FOLLOW_UP_MESSAGE",
] as const;

export type PermissionedActionType = (typeof PERMISSIONED_ACTION_TYPES)[number];

export type BrainActionPermissionRecord = {
  id: string;
  businessBrainId: string;
  actionType: PermissionedActionType;
  enabled: boolean;
  requireManualApproval: boolean;
  minimumConfidence: number;
  createdAt: string;
  updatedAt: string;
};

export type BrainActionPermissionDefault = {
  enabled: boolean;
  requireManualApproval: boolean;
  minimumConfidence: number;
};

export const DEFAULT_BRAIN_ACTION_PERMISSIONS: Record<
  PermissionedActionType,
  BrainActionPermissionDefault
> = {
  SEND_DOCUMENT: {
    enabled: true,
    requireManualApproval: false,
    minimumConfidence: 0.95,
  },
  HANDOVER: {
    enabled: true,
    requireManualApproval: false,
    minimumConfidence: 0.5,
  },
  UPDATE_MEMORY: {
    enabled: true,
    requireManualApproval: false,
    minimumConfidence: 0.5,
  },
  UPDATE_LEAD_PROGRESS: {
    enabled: true,
    requireManualApproval: false,
    minimumConfidence: 0.5,
  },
  CREATE_LEAD_NOTE: {
    enabled: true,
    requireManualApproval: false,
    minimumConfidence: 0.5,
  },
  SUGGEST_PACKAGE: {
    enabled: true,
    requireManualApproval: false,
    minimumConfidence: 0.5,
  },
  ASK_QUALIFICATION: {
    enabled: true,
    requireManualApproval: false,
    minimumConfidence: 0.5,
  },
  FOLLOW_UP_MESSAGE: {
    enabled: true,
    requireManualApproval: false,
    minimumConfidence: 0.85,
  },
};

export function isPermissionedActionType(
  value: string,
): value is PermissionedActionType {
  return (PERMISSIONED_ACTION_TYPES as readonly string[]).includes(value);
}

export function formatActionTypeLabel(actionType: PermissionedActionType): string {
  return actionType
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function getPermissionedActionDescription(
  actionType: PermissionedActionType,
): string {
  const descriptions: Record<PermissionedActionType, string> = {
    SEND_DOCUMENT: "Send a published Business Brain document via WhatsApp.",
    HANDOVER: "Hand the conversation to a human teammate.",
    CREATE_LEAD_NOTE: "Create an internal conversation note for sales.",
    UPDATE_MEMORY: "Persist a customer memory field from the conversation.",
    UPDATE_LEAD_PROGRESS: "Update lead qualification progress from collected fields.",
    SUGGEST_PACKAGE: "Record a package recommendation for sales follow-up.",
    ASK_QUALIFICATION: "Record the next qualification question to ask.",
    FOLLOW_UP_MESSAGE: "Send a scheduled follow-up message to the customer.",
  };
  return descriptions[actionType];
}

export function isConfigurableActionType(
  value: AIActionType,
): value is PermissionedActionType {
  return isPermissionedActionType(value);
}
