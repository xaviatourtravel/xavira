import type { Json } from "@/types/database";
import {
  ensureBusinessBrain,
  findBusinessBrainByOrganizationId,
  touchBusinessBrainDraftForOrganization,
} from "@/modules/business-brain/repositories/business-brain-repository";
import {
  deleteBrainBehavior,
  findBrainBehaviorById,
  insertBrainBehavior,
  listBrainBehaviors,
  listBrainBehaviorsByType,
  mapBrainBehaviorRow,
  setBrainBehaviorEnabled,
  updateBrainBehavior,
} from "@/modules/business-brain/repositories/brain-behavior-repository";
import {
  createBehaviorSchema,
  qualificationRuleSchema,
  replyStyleSchema,
  updateBehaviorSchema,
  type CreateBehaviorInput,
} from "@/modules/business-brain/schemas/behaviors";
import type {
  BrainBehaviorListItem,
  BrainBehaviorRecord,
  BrainBehaviorType,
  QualificationConfig,
  ReplyStyleConfig,
} from "@/modules/business-brain/types/behaviors";
import {
  DEFAULT_QUALIFICATION_CONFIG,
  DEFAULT_REPLY_STYLE_CONFIG,
} from "@/modules/business-brain/types/behaviors";

async function getBusinessBrainId(organizationId: string) {
  const brain = await ensureBusinessBrain(organizationId);
  return brain.id;
}

async function assertBehaviorInOrg(organizationId: string, behaviorId: string) {
  const businessBrain = await findBusinessBrainByOrganizationId(organizationId);
  if (!businessBrain) {
    throw new Error("Behavior not found.");
  }

  const behavior = await findBrainBehaviorById(behaviorId);
  if (!behavior || behavior.business_brain_id !== businessBrain.id) {
    throw new Error("Behavior not found.");
  }

  return behavior;
}

async function ensureSingletonConfigs(businessBrainId: string) {
  const rows = await listBrainBehaviorsByType(businessBrainId, "REPLY_STYLE");
  if (rows.length === 0) {
    await insertBrainBehavior({
      businessBrainId,
      type: "REPLY_STYLE",
      name: "Reply Style",
      description: "Default reply style for AI.",
      config: DEFAULT_REPLY_STYLE_CONFIG,
      enabled: true,
    });
  }

  const qualificationRows = await listBrainBehaviorsByType(
    businessBrainId,
    "QUALIFICATION_RULE",
  );
  if (qualificationRows.length === 0) {
    await insertBrainBehavior({
      businessBrainId,
      type: "QUALIFICATION_RULE",
      name: "Qualification Rules",
      description: "Required qualification questions.",
      config: DEFAULT_QUALIFICATION_CONFIG,
      enabled: true,
    });
  }
}

function toListItem(row: ReturnType<typeof mapBrainBehaviorRow>): BrainBehaviorListItem {
  return {
    id: row.id,
    type: row.type,
    name: row.name || "Untitled Rule",
    description: row.description,
    enabled: row.enabled,
    updatedAt: row.updatedAt,
  };
}

export async function getBehaviors(organizationId: string): Promise<BrainBehaviorRecord[]> {
  const businessBrain = await findBusinessBrainByOrganizationId(organizationId);
  if (!businessBrain) {
    return [];
  }

  await ensureSingletonConfigs(businessBrain.id);
  const rows = await listBrainBehaviors(businessBrain.id);
  return rows.map(mapBrainBehaviorRow);
}

export async function getBehaviorsByType(
  organizationId: string,
  type: BrainBehaviorType,
): Promise<BrainBehaviorRecord[]> {
  const businessBrain = await findBusinessBrainByOrganizationId(organizationId);
  if (!businessBrain) {
    return [];
  }

  if (type === "REPLY_STYLE" || type === "QUALIFICATION_RULE") {
    await ensureSingletonConfigs(businessBrain.id);
  }

  const rows = await listBrainBehaviorsByType(businessBrain.id, type);
  return rows.map(mapBrainBehaviorRow);
}

export async function create(
  organizationId: string,
  input: CreateBehaviorInput,
): Promise<BrainBehaviorRecord> {
  const parsed = createBehaviorSchema.parse(input);
  const businessBrainId = await getBusinessBrainId(organizationId);

  const row = await insertBrainBehavior({
    businessBrainId,
    type: parsed.type,
    name: parsed.name,
    description: parsed.description ?? "",
    enabled: parsed.enabled ?? true,
    config: parsed.type === "HANDOVER_RULE" ? parsed.config : {},
  });

  await touchBusinessBrainDraftForOrganization(organizationId);
  return mapBrainBehaviorRow(row);
}

export async function update(
  organizationId: string,
  behaviorId: string,
  input: unknown,
): Promise<BrainBehaviorRecord> {
  const behavior = await assertBehaviorInOrg(organizationId, behaviorId);
  const parsed = updateBehaviorSchema.parse(input);

  const row = await updateBrainBehavior(behaviorId, {
    name: parsed.name,
    description: parsed.description,
    enabled: parsed.enabled,
    config: (parsed.config ?? behavior.config) as Json,
  });

  await touchBusinessBrainDraftForOrganization(organizationId);
  return mapBrainBehaviorRow(row);
}

export async function updateReplyStyle(
  organizationId: string,
  behaviorId: string,
  input: { config: ReplyStyleConfig; enabled: boolean },
): Promise<BrainBehaviorRecord> {
  await assertBehaviorInOrg(organizationId, behaviorId);
  const parsed = replyStyleSchema.parse(input);

  const row = await updateBrainBehavior(behaviorId, {
    config: parsed.config,
    enabled: parsed.enabled,
  });

  await touchBusinessBrainDraftForOrganization(organizationId);
  return mapBrainBehaviorRow(row);
}

export async function updateQualificationRules(
  organizationId: string,
  behaviorId: string,
  input: { config: QualificationConfig; enabled: boolean },
): Promise<BrainBehaviorRecord> {
  await assertBehaviorInOrg(organizationId, behaviorId);
  const parsed = qualificationRuleSchema.parse(input);

  const row = await updateBrainBehavior(behaviorId, {
    config: parsed.config,
    enabled: parsed.enabled,
  });

  await touchBusinessBrainDraftForOrganization(organizationId);
  return mapBrainBehaviorRow(row);
}

export async function deleteBehavior(
  organizationId: string,
  behaviorId: string,
): Promise<void> {
  const behavior = await assertBehaviorInOrg(organizationId, behaviorId);
  if (behavior.type === "REPLY_STYLE" || behavior.type === "QUALIFICATION_RULE") {
    throw new Error("Cannot delete system behavior configuration.");
  }
  await deleteBrainBehavior(behaviorId);
  await touchBusinessBrainDraftForOrganization(organizationId);
}

export async function enable(
  organizationId: string,
  behaviorId: string,
): Promise<BrainBehaviorRecord> {
  await assertBehaviorInOrg(organizationId, behaviorId);
  const row = await setBrainBehaviorEnabled(behaviorId, true);
  return mapBrainBehaviorRow(row);
}

export async function disable(
  organizationId: string,
  behaviorId: string,
): Promise<BrainBehaviorRecord> {
  await assertBehaviorInOrg(organizationId, behaviorId);
  const row = await setBrainBehaviorEnabled(behaviorId, false);
  return mapBrainBehaviorRow(row);
}

export { toListItem };
