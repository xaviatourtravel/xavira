"use server";

import { revalidatePath } from "next/cache";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import {
  applyInstagramContentLink,
  clearInstagramContentLink,
  loadLinkableInstagramContents,
  loadSuggestedContentMatchesForMedia,
  loadSuggestedInstagramMatchesForContent,
  loadUnlinkedInstagramPosts,
} from "@/lib/instagram/linking";
import { createClient } from "@/utils/supabase/server";

type ActionResult = {
  success: boolean;
  message?: string;
};

const REVALIDATE_PATHS = [
  "/content",
  "/content/instagram-analytics",
];

function revalidateInstagramLinkPaths(contentId?: string) {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }

  if (contentId) {
    revalidatePath(`/content/${contentId}`);
  }
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function linkInstagramPostToContent(
  formData: FormData,
): Promise<ActionResult> {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    return {
      success: false,
      message: "Hanya owner atau admin yang dapat menghubungkan post Instagram.",
    };
  }

  const contentId = getString(formData, "content_id");
  const instagramMediaId = getString(formData, "instagram_media_id");

  if (!contentId || !instagramMediaId) {
    return {
      success: false,
      message: "Content dan post Instagram wajib dipilih.",
    };
  }

  try {
    const supabase = await createClient();
    await applyInstagramContentLink(
      supabase,
      profile.organization_id,
      contentId,
      instagramMediaId,
    );
    revalidateInstagramLinkPaths(contentId);
    return { success: true, message: "Post Instagram berhasil dihubungkan." };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal menghubungkan post Instagram.",
    };
  }
}

export async function unlinkInstagramPostFromContent(
  formData: FormData,
): Promise<ActionResult> {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    return {
      success: false,
      message: "Hanya owner atau admin yang dapat memutuskan hubungan.",
    };
  }

  const contentId = getString(formData, "content_id");
  const instagramMediaId = getString(formData, "instagram_media_id");

  if (!contentId && !instagramMediaId) {
    return {
      success: false,
      message: "Content atau post Instagram wajib diisi.",
    };
  }

  try {
    const supabase = await createClient();
    await clearInstagramContentLink(supabase, profile.organization_id, {
      contentId: contentId || undefined,
      instagramMediaId: instagramMediaId || undefined,
    });
    revalidateInstagramLinkPaths(contentId || undefined);
    return { success: true, message: "Hubungan post Instagram telah diputus." };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memutuskan hubungan post Instagram.",
    };
  }
}

export async function fetchSuggestedContentMatchesForMedia(
  instagramMediaId: string,
) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const suggestions = await loadSuggestedContentMatchesForMedia(
    supabase,
    profile.organization_id,
    instagramMediaId,
  );

  return suggestions.map((item) => ({
    contentId: item.content.id,
    title: item.content.title,
    publishDate: item.content.publish_date,
    score: item.score,
    reasons: item.reasons,
  }));
}

export async function fetchSuggestedInstagramMatchesForContent(contentId: string) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const suggestions = await loadSuggestedInstagramMatchesForContent(
    supabase,
    profile.organization_id,
    contentId,
  );

  return suggestions.map((item) => ({
    instagramMediaId: item.media.instagramMediaId,
    caption: item.media.caption,
    permalink: item.media.permalink,
    postedAt: item.media.postedAt,
    score: item.score,
    reasons: item.reasons,
  }));
}

export async function fetchLinkableInstagramContents(excludeMediaId?: string) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  return loadLinkableInstagramContents(
    supabase,
    profile.organization_id,
    excludeMediaId,
  );
}

export async function fetchUnlinkedInstagramPosts() {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  return loadUnlinkedInstagramPosts(supabase, profile.organization_id);
}
