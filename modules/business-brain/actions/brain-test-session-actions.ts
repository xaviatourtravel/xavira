"use server";

import { requireProfile } from "@/lib/auth/session";
import {
  deleteBrainTestSessionSchema,
  renameBrainTestSessionSchema,
  saveBrainTestSessionSchema,
} from "@/modules/business-brain/schemas/brain-test-session";
import {
  getBrainTestSessions,
  removeBrainTestSession,
  renameBrainTestSession,
  saveBrainTestSession,
} from "@/modules/business-brain/services/brain-test-session-service";

function requireOrgId(profile: { organization_id: string | null }) {
  if (!profile.organization_id) {
    throw new Error("Organization is required.");
  }
  return profile.organization_id;
}

export async function loadBrainTestSessionsAction() {
  const { profile } = await requireProfile();
  const organizationId = requireOrgId(profile);
  const sessions = await getBrainTestSessions(organizationId);
  return { sessions };
}

export async function saveBrainTestSessionAction(input: unknown) {
  const { profile } = await requireProfile();
  const organizationId = requireOrgId(profile);

  try {
    const parsed = saveBrainTestSessionSchema.parse(input);
    const session = await saveBrainTestSession(organizationId, parsed);
    return { ok: true as const, session };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to save test session.",
    };
  }
}

export async function renameBrainTestSessionAction(input: unknown) {
  const { profile } = await requireProfile();
  const organizationId = requireOrgId(profile);

  try {
    const parsed = renameBrainTestSessionSchema.parse(input);
    const session = await renameBrainTestSession(
      organizationId,
      parsed.id,
      parsed.title,
    );
    return { ok: true as const, session };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to rename test session.",
    };
  }
}

export async function deleteBrainTestSessionAction(input: unknown) {
  const { profile } = await requireProfile();
  const organizationId = requireOrgId(profile);

  try {
    const parsed = deleteBrainTestSessionSchema.parse(input);
    await removeBrainTestSession(organizationId, parsed.id);
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to delete test session.",
    };
  }
}
