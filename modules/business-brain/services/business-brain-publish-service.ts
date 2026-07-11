import type { Json } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

import {
  buildBrainSnapshot,
  parseBrainSnapshot,
  summarizeDraftChanges,
} from "@/modules/business-brain/lib/brain-snapshot";
import { listBrainBehaviors } from "@/modules/business-brain/repositories/brain-behavior-repository";
import { listBrainArticles } from "@/modules/business-brain/repositories/brain-article-repository";
import { listBrainDocuments } from "@/modules/business-brain/repositories/brain-document-repository";
import { listBrainProducts } from "@/modules/business-brain/repositories/brain-product-repository";
import {
  findBrainVersionById,
  listBrainVersions,
  publishBusinessBrainAtomic,
} from "@/modules/business-brain/repositories/brain-version-repository";
import {
  coerceBrainPublishStatus,
  ensureBusinessBrain,
  findBusinessBrainByOrganizationId,
} from "@/modules/business-brain/repositories/business-brain-repository";
import { findCompanyDnaByBusinessBrainId } from "@/modules/business-brain/repositories/company-dna-repository";
import type {
  BrainDraftSummary,
  BrainPublishResult,
  BrainPublishStatusView,
  BrainPublishUserRef,
  BrainVersionListItem,
} from "@/modules/business-brain/types/publish";

const PUBLISH_FAILED_MESSAGE =
  "Business Brain belum berhasil diterbitkan. Tidak ada perubahan yang diaktifkan. Silakan coba lagi.";

async function loadCurrentSnapshot(businessBrainId: string) {
  const [companyDna, products, knowledge, documents, behaviors] = await Promise.all([
    findCompanyDnaByBusinessBrainId(businessBrainId),
    listBrainProducts(businessBrainId),
    listBrainArticles(businessBrainId),
    listBrainDocuments(businessBrainId),
    listBrainBehaviors(businessBrainId),
  ]);

  return buildBrainSnapshot({
    companyDna,
    products,
    knowledge,
    documents,
    behaviors,
  });
}

async function loadPublishedSnapshot(
  businessBrainId: string,
  publishedVersionId: string | null,
) {
  if (!publishedVersionId) {
    return null;
  }

  const version = await findBrainVersionById(publishedVersionId);
  if (!version || version.business_brain_id !== businessBrainId) {
    return null;
  }

  return parseBrainSnapshot(version.snapshot);
}

async function resolvePublishUsers(userIds: string[]): Promise<Map<string, BrainPublishUserRef>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", uniqueIds);

  if (error) {
    throw new Error(error.message);
  }

  const map = new Map<string, BrainPublishUserRef>();
  for (const profile of data ?? []) {
    map.set(profile.id, {
      id: profile.id,
      name: profile.full_name?.trim() || "Unknown user",
    });
  }

  return map;
}

function mapVersionRow(
  row: Awaited<ReturnType<typeof listBrainVersions>>[number],
  users: Map<string, BrainPublishUserRef>,
): BrainVersionListItem {
  return {
    id: row.id,
    versionNumber: row.version_number,
    status: row.status === "published" ? "published" : "superseded",
    publishedAt: row.published_at,
    publishedBy: row.published_by ? users.get(row.published_by) ?? null : null,
  };
}

async function buildPublishStatusView(
  brain: Awaited<ReturnType<typeof ensureBusinessBrain>>,
  draftSummary: BrainDraftSummary,
): Promise<BrainPublishStatusView> {
  const users = await resolvePublishUsers(
    brain.published_by ? [brain.published_by] : [],
  );

  const versions = brain.published_version_id
    ? await listBrainVersions(brain.id)
    : [];
  const activeVersion = versions.find((version) => version.id === brain.published_version_id);

  return {
    status: coerceBrainPublishStatus(brain.status),
    lastPublishedAt: brain.published_at,
    lastPublishedBy: brain.published_by ? users.get(brain.published_by) ?? null : null,
    draftChangesCount: draftSummary.totalChanges,
    draftUpdatedAt: brain.draft_updated_at,
    currentVersionNumber: activeVersion?.version_number ?? null,
    currentVersionId: brain.published_version_id,
  };
}

export async function getPublishStatus(
  organizationId: string,
): Promise<BrainPublishStatusView> {
  const brain = await findBusinessBrainByOrganizationId(organizationId);
  if (!brain) {
    return {
      status: "draft",
      lastPublishedAt: null,
      lastPublishedBy: null,
      draftChangesCount: 0,
      draftUpdatedAt: null,
      currentVersionNumber: null,
      currentVersionId: null,
    };
  }

  const [currentSnapshot, publishedSnapshot] = await Promise.all([
    loadCurrentSnapshot(brain.id),
    loadPublishedSnapshot(brain.id, brain.published_version_id),
  ]);

  const draftSummary = summarizeDraftChanges(currentSnapshot, publishedSnapshot);
  return buildPublishStatusView(brain, draftSummary);
}

export async function getDraftSummary(organizationId: string): Promise<BrainDraftSummary> {
  const brain = await findBusinessBrainByOrganizationId(organizationId);
  if (!brain) {
    return {
      sections: [],
      totalChanges: 0,
      hasUnpublishedChanges: false,
    };
  }

  const [currentSnapshot, publishedSnapshot] = await Promise.all([
    loadCurrentSnapshot(brain.id),
    loadPublishedSnapshot(brain.id, brain.published_version_id),
  ]);

  return summarizeDraftChanges(currentSnapshot, publishedSnapshot);
}

export async function publish(
  organizationId: string,
  publishedByUserId: string,
): Promise<BrainPublishResult> {
  const brain = await ensureBusinessBrain(organizationId);
  const currentSnapshot = await loadCurrentSnapshot(brain.id);
  const publishedSnapshot = await loadPublishedSnapshot(brain.id, brain.published_version_id);
  const draftSummary = summarizeDraftChanges(currentSnapshot, publishedSnapshot);

  if (brain.status === "published" && !draftSummary.hasUnpublishedChanges) {
    throw new Error("No unpublished changes to publish.");
  }

  let atomicResult;
  try {
    atomicResult = await publishBusinessBrainAtomic({
      businessBrainId: brain.id,
      snapshot: currentSnapshot as unknown as Json,
      publishedBy: publishedByUserId,
    });
  } catch (error) {
    console.error("[BusinessBrain] publish_failed", {
      organizationId,
      businessBrainId: brain.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(PUBLISH_FAILED_MESSAGE);
  }

  const updatedBrain = await findBusinessBrainByOrganizationId(organizationId);
  if (!updatedBrain || updatedBrain.published_version_id !== atomicResult.versionId) {
    console.error("[BusinessBrain] publish_pointer_mismatch", {
      organizationId,
      businessBrainId: brain.id,
      expectedVersionId: atomicResult.versionId,
      actualVersionId: updatedBrain?.published_version_id ?? null,
    });
    throw new Error(PUBLISH_FAILED_MESSAGE);
  }

  const publishedSnapshotAfterPublish = await loadPublishedSnapshot(
    brain.id,
    atomicResult.versionId,
  );
  const refreshedSummary = summarizeDraftChanges(
    currentSnapshot,
    publishedSnapshotAfterPublish,
  );

  const versionRow = await findBrainVersionById(atomicResult.versionId);
  if (!versionRow) {
    throw new Error(PUBLISH_FAILED_MESSAGE);
  }

  const versions = await listBrainVersions(brain.id);
  const users = await resolvePublishUsers(
    versions
      .map((version) => version.published_by)
      .filter((id): id is string => !!id),
  );

  return {
    version: mapVersionRow(versionRow, users),
    status: await buildPublishStatusView(updatedBrain, refreshedSummary),
    draftSummary: refreshedSummary,
    versions: versions.map((version) => mapVersionRow(version, users)),
  };
}

export async function getVersions(organizationId: string): Promise<BrainVersionListItem[]> {
  const brain = await findBusinessBrainByOrganizationId(organizationId);
  if (!brain) {
    return [];
  }

  const versions = await listBrainVersions(brain.id);
  const users = await resolvePublishUsers(
    versions.map((version) => version.published_by).filter((id): id is string => !!id),
  );

  return versions.map((version) => mapVersionRow(version, users));
}
