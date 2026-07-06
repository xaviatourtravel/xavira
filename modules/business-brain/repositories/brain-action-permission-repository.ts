import { createClient } from "@/utils/supabase/server";
import type { WhatsappSupabaseClient } from "@/lib/whatsapp-inbox/repository";

import {
  DEFAULT_BRAIN_ACTION_PERMISSIONS,
  isPermissionedActionType,
  PERMISSIONED_ACTION_TYPES,
  type BrainActionPermissionRecord,
  type PermissionedActionType,
} from "@/modules/business-brain/types/action-permissions";

export type BrainActionPermissionRow = {
  id: string;
  business_brain_id: string;
  action_type: string;
  enabled: boolean;
  require_manual_approval: boolean;
  minimum_confidence: number;
  created_at: string;
  updated_at: string;
};

const PERMISSION_COLUMNS =
  "id, business_brain_id, action_type, enabled, require_manual_approval, minimum_confidence, created_at, updated_at";

export function mapBrainActionPermissionRow(
  row: BrainActionPermissionRow,
): BrainActionPermissionRecord {
  const actionType = isPermissionedActionType(row.action_type)
    ? row.action_type
    : "UPDATE_MEMORY";

  return {
    id: row.id,
    businessBrainId: row.business_brain_id,
    actionType,
    enabled: row.enabled,
    requireManualApproval: row.require_manual_approval,
    minimumConfidence: Number(row.minimum_confidence) || 0.5,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function defaultPermissionForAction(
  actionType: PermissionedActionType,
): Omit<BrainActionPermissionRecord, "id" | "businessBrainId" | "createdAt" | "updatedAt"> {
  const defaults = DEFAULT_BRAIN_ACTION_PERMISSIONS[actionType];
  return {
    actionType,
    enabled: defaults.enabled,
    requireManualApproval: defaults.requireManualApproval,
    minimumConfidence: defaults.minimumConfidence,
  };
}

export async function listBrainActionPermissions(
  businessBrainId: string,
): Promise<BrainActionPermissionRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_action_permissions")
    .select(PERMISSION_COLUMNS)
    .eq("business_brain_id", businessBrainId)
    .order("action_type", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as BrainActionPermissionRow[];
  const byType = new Map(
    rows.map((row) => [row.action_type, mapBrainActionPermissionRow(row)]),
  );

  return PERMISSIONED_ACTION_TYPES.map((actionType) => {
    const existing = byType.get(actionType);
    if (existing) {
      return existing;
    }

    const defaults = defaultPermissionForAction(actionType);
    return {
      id: "",
      businessBrainId,
      ...defaults,
      createdAt: "",
      updatedAt: "",
    };
  });
}

export async function findBrainActionPermission(
  businessBrainId: string,
  actionType: PermissionedActionType,
): Promise<BrainActionPermissionRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_action_permissions")
    .select(PERMISSION_COLUMNS)
    .eq("business_brain_id", businessBrainId)
    .eq("action_type", actionType)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapBrainActionPermissionRow(data as BrainActionPermissionRow);
}

export async function findBrainActionPermissionForWorkspace(
  supabase: WhatsappSupabaseClient,
  workspaceId: string,
  actionType: PermissionedActionType,
): Promise<BrainActionPermissionRecord | null> {
  const { data: brain, error: brainError } = await supabase
    .from("business_brains")
    .select("id")
    .eq("organization_id", workspaceId)
    .maybeSingle();

  if (brainError || !brain) {
    return null;
  }

  const { data, error } = await supabase
    .from("brain_action_permissions")
    .select(PERMISSION_COLUMNS)
    .eq("business_brain_id", brain.id)
    .eq("action_type", actionType)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapBrainActionPermissionRow(data as BrainActionPermissionRow);
}

export async function upsertBrainActionPermission(input: {
  businessBrainId: string;
  actionType: PermissionedActionType;
  enabled: boolean;
  requireManualApproval: boolean;
  minimumConfidence: number;
}): Promise<BrainActionPermissionRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_action_permissions")
    .upsert(
      {
        business_brain_id: input.businessBrainId,
        action_type: input.actionType,
        enabled: input.enabled,
        require_manual_approval: input.requireManualApproval,
        minimum_confidence: input.minimumConfidence,
      },
      { onConflict: "business_brain_id,action_type" },
    )
    .select(PERMISSION_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapBrainActionPermissionRow(data as BrainActionPermissionRow);
}

export async function ensureDefaultBrainActionPermissions(
  businessBrainId: string,
): Promise<void> {
  const supabase = await createClient();
  const rows = PERMISSIONED_ACTION_TYPES.map((actionType) => {
    const defaults = DEFAULT_BRAIN_ACTION_PERMISSIONS[actionType];
    return {
      business_brain_id: businessBrainId,
      action_type: actionType,
      enabled: defaults.enabled,
      require_manual_approval: defaults.requireManualApproval,
      minimum_confidence: defaults.minimumConfidence,
    };
  });

  const { error } = await supabase
    .from("brain_action_permissions")
    .upsert(rows, { onConflict: "business_brain_id,action_type", ignoreDuplicates: true });

  if (error) {
    throw new Error(error.message);
  }
}
