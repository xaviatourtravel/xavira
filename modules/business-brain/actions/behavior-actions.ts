"use server";

import { revalidatePath } from "next/cache";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import {
  createBehaviorSchema,
  qualificationRuleSchema,
  replyStyleSchema,
} from "@/modules/business-brain/schemas/behaviors";
import {
  create,
  deleteBehavior,
  disable,
  enable,
  getBehaviors,
  getBehaviorsByType,
  update,
  updateQualificationRules,
  updateReplyStyle,
} from "@/modules/business-brain/services/business-brain-behavior-service";
import type { BrainBehaviorType } from "@/modules/business-brain/types/behaviors";

const BEHAVIORS_PATH = "/business-brain/behaviors";

function revalidateBehaviors() {
  revalidatePath(BEHAVIORS_PATH);
}

function requireOrgId(profile: { organization_id: string | null }) {
  if (!profile.organization_id) {
    throw new Error("Organization is required.");
  }
  return profile.organization_id;
}

export async function loadBrainBehaviorsAction() {
  const { profile } = await requireProfile();
  const organizationId = requireOrgId(profile);
  const behaviors = await getBehaviors(organizationId);

  return {
    behaviors,
    canEdit: isAdminOrOwner(profile),
  };
}

export async function loadBrainBehaviorsByTypeAction(type: BrainBehaviorType) {
  const { profile } = await requireProfile();
  const organizationId = requireOrgId(profile);
  const behaviors = await getBehaviorsByType(organizationId, type);
  return { behaviors, canEdit: isAdminOrOwner(profile) };
}

export async function createBrainBehaviorAction(input: unknown) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  const parsed = createBehaviorSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid behavior data.",
    };
  }

  try {
    const organizationId = requireOrgId(profile);
    const behavior = await create(organizationId, parsed.data);
    revalidateBehaviors();
    return { ok: true as const, behavior };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to create behavior.",
    };
  }
}

export async function updateBrainBehaviorAction(behaviorId: string, input: unknown) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  try {
    const organizationId = requireOrgId(profile);
    const behavior = await update(organizationId, behaviorId, input);
    revalidateBehaviors();
    return { ok: true as const, behavior };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to update behavior.",
    };
  }
}

export async function updateReplyStyleAction(behaviorId: string, input: unknown) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  const parsed = replyStyleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid reply style.",
    };
  }

  try {
    const organizationId = requireOrgId(profile);
    const behavior = await updateReplyStyle(organizationId, behaviorId, parsed.data);
    revalidateBehaviors();
    return { ok: true as const, behavior };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to update reply style.",
    };
  }
}

export async function updateQualificationRulesAction(behaviorId: string, input: unknown) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  const parsed = qualificationRuleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid qualification rules.",
    };
  }

  try {
    const organizationId = requireOrgId(profile);
    const behavior = await updateQualificationRules(organizationId, behaviorId, parsed.data);
    revalidateBehaviors();
    return { ok: true as const, behavior };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to update qualification rules.",
    };
  }
}

export async function deleteBrainBehaviorAction(behaviorId: string) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  try {
    const organizationId = requireOrgId(profile);
    await deleteBehavior(organizationId, behaviorId);
    revalidateBehaviors();
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to delete behavior.",
    };
  }
}

export async function enableBrainBehaviorAction(behaviorId: string) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  try {
    const organizationId = requireOrgId(profile);
    const behavior = await enable(organizationId, behaviorId);
    revalidateBehaviors();
    return { ok: true as const, behavior };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to enable behavior.",
    };
  }
}

export async function disableBrainBehaviorAction(behaviorId: string) {
  const { profile } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  try {
    const organizationId = requireOrgId(profile);
    const behavior = await disable(organizationId, behaviorId);
    revalidateBehaviors();
    return { ok: true as const, behavior };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to disable behavior.",
    };
  }
}
