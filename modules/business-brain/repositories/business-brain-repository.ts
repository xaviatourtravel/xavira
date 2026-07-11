import type { Json } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

import type { BrainPublishStatus } from "@/modules/business-brain/types/publish";

export type BusinessBrainRow = {
  id: string;
  organization_id: string;
  status: string;
  published_version_id: string | null;
  published_at: string | null;
  published_by: string | null;
  draft_updated_at: string;
  created_at: string;
  updated_at: string;
};

const BUSINESS_BRAIN_COLUMNS =
  "id, organization_id, status, published_version_id, published_at, published_by, draft_updated_at, created_at, updated_at";

export async function findBusinessBrainByOrganizationId(
  organizationId: string,
): Promise<BusinessBrainRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_brains")
    .select(BUSINESS_BRAIN_COLUMNS)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as BusinessBrainRow | null;
}

import { ensureDefaultBrainActionPermissions } from "@/modules/business-brain/repositories/brain-action-permission-repository";

export async function createBusinessBrain(
  organizationId: string,
): Promise<BusinessBrainRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_brains")
    .insert({
      organization_id: organizationId,
      status: "draft",
      draft_updated_at: new Date().toISOString(),
    })
    .select(BUSINESS_BRAIN_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const brain = data as BusinessBrainRow;
  await ensureDefaultBrainActionPermissions(brain.id);

  return brain;
}

export async function ensureBusinessBrain(
  organizationId: string,
): Promise<BusinessBrainRow> {
  const existing = await findBusinessBrainByOrganizationId(organizationId);
  if (existing) {
    return existing;
  }

  return createBusinessBrain(organizationId);
}

export async function touchBusinessBrainDraftUpdatedAt(
  businessBrainId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("business_brains")
    .update({ draft_updated_at: new Date().toISOString() })
    .eq("id", businessBrainId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function touchBusinessBrainDraftForOrganization(
  organizationId: string,
): Promise<void> {
  const brain = await findBusinessBrainByOrganizationId(organizationId);
  if (brain) {
    await touchBusinessBrainDraftUpdatedAt(brain.id);
  }
}

export async function updateBusinessBrainPublishState(input: {
  businessBrainId: string;
  status: BrainPublishStatus;
  publishedVersionId: string;
  publishedBy: string;
  publishedAt: string;
}): Promise<BusinessBrainRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_brains")
    .update({
      status: input.status,
      published_version_id: input.publishedVersionId,
      published_at: input.publishedAt,
      published_by: input.publishedBy,
      draft_updated_at: input.publishedAt,
    })
    .eq("id", input.businessBrainId)
    .select(BUSINESS_BRAIN_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as BusinessBrainRow;
}

export function coerceBrainPublishStatus(value: string): BrainPublishStatus {
  return value === "published" ? "published" : "draft";
}
