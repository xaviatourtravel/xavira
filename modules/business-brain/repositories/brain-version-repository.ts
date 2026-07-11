import type { Json } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

import type { BrainVersionStatus } from "@/modules/business-brain/types/publish";

export type BrainVersionRow = {
  id: string;
  business_brain_id: string;
  version_number: number;
  snapshot: Json;
  status: string;
  published_at: string;
  published_by: string | null;
  created_at: string;
};

export async function listBrainVersions(
  businessBrainId: string,
): Promise<BrainVersionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_versions")
    .select("*")
    .eq("business_brain_id", businessBrainId)
    .order("version_number", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function findBrainVersionById(
  versionId: string,
): Promise<BrainVersionRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_versions")
    .select("*")
    .eq("id", versionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getMaxVersionNumber(businessBrainId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_versions")
    .select("version_number")
    .eq("business_brain_id", businessBrainId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.version_number ?? 0;
}

export async function insertBrainVersion(input: {
  businessBrainId: string;
  versionNumber: number;
  snapshot: Json;
  publishedBy: string;
}): Promise<BrainVersionRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_versions")
    .insert({
      business_brain_id: input.businessBrainId,
      version_number: input.versionNumber,
      snapshot: input.snapshot,
      status: "published",
      published_at: new Date().toISOString(),
      published_by: input.publishedBy,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function supersedePublishedVersions(
  businessBrainId: string,
  exceptVersionId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("brain_versions")
    .update({ status: "superseded" satisfies BrainVersionStatus })
    .eq("business_brain_id", businessBrainId)
    .eq("status", "published")
    .neq("id", exceptVersionId);

  if (error) {
    throw new Error(error.message);
  }
}

export type AtomicPublishResult = {
  versionId: string;
  versionNumber: number;
  publishedAt: string;
};

export async function publishBusinessBrainAtomic(input: {
  businessBrainId: string;
  snapshot: Json;
  publishedBy: string;
}): Promise<AtomicPublishResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("publish_business_brain_atomic", {
    p_business_brain_id: input.businessBrainId,
    p_snapshot: input.snapshot,
    p_published_by: input.publishedBy,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Atomic publish returned an invalid response.");
  }

  const record = data as Record<string, unknown>;
  const versionId = typeof record.version_id === "string" ? record.version_id : null;
  const versionNumber =
    typeof record.version_number === "number" ? record.version_number : null;
  const publishedAt = typeof record.published_at === "string" ? record.published_at : null;

  if (!versionId || versionNumber === null || !publishedAt) {
    throw new Error("Atomic publish returned incomplete version data.");
  }

  return {
    versionId,
    versionNumber,
    publishedAt,
  };
}

export async function findBrainVersionRowById(
  versionId: string,
): Promise<BrainVersionRow | null> {
  return findBrainVersionById(versionId);
}
