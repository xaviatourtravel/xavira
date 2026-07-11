"use server";

import { revalidatePath } from "next/cache";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import {
  getDraftSummary,
  getPublishStatus,
  getVersions,
  publish,
} from "@/modules/business-brain/services/business-brain-publish-service";

const PUBLISH_PATH = "/business-brain/publish";
const PLAYGROUND_PATH = "/business-brain/playground";

function revalidatePublish() {
  revalidatePath(PUBLISH_PATH);
  revalidatePath(PLAYGROUND_PATH);
  revalidatePath("/business-brain");
}

function requireOrgId(profile: { organization_id: string | null }) {
  if (!profile.organization_id) {
    throw new Error("Organization is required.");
  }
  return profile.organization_id;
}

export async function loadPublishPageAction() {
  const { profile } = await requireProfile();
  const organizationId = requireOrgId(profile);

  const [status, draftSummary, versions] = await Promise.all([
    getPublishStatus(organizationId),
    getDraftSummary(organizationId),
    getVersions(organizationId),
  ]);

  return {
    status,
    draftSummary,
    versions,
    canPublish: isAdminOrOwner(profile),
  };
}

export async function publishBusinessBrainAction() {
  const { profile, user } = await requireProfile();
  if (!isAdminOrOwner(profile)) {
    return { ok: false as const, error: "Permission denied." };
  }

  const organizationId = requireOrgId(profile);

  try {
    const result = await publish(organizationId, user.id);
    revalidatePublish();
    return { ok: true as const, result };
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("belum berhasil diterbitkan")
        ? error.message
        : "Business Brain belum berhasil diterbitkan. Tidak ada perubahan yang diaktifkan. Silakan coba lagi.";

    return {
      ok: false as const,
      error: message,
    };
  }
}
