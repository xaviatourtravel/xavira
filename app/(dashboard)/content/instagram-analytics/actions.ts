"use server";

import { revalidatePath } from "next/cache";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import {
  disconnectInstagramIntegration,
  getInstagramCredentialsFromMetadata,
  saveInstagramConnection,
} from "@/lib/instagram/integration";
import { syncInstagramAnalyticsForOrganization } from "@/lib/instagram/sync";
import { loadInstagramIntegration } from "@/lib/instagram/sync";
import { createClient } from "@/utils/supabase/server";

type ActionResult = {
  success: boolean;
  message?: string;
  syncedCount?: number;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

const REVALIDATE_PATHS = [
  "/content/instagram-analytics",
  "/settings/integrations",
  "/content",
];

function revalidateInstagramPaths() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

/** Manual token fallback for development or recovery. */
export async function configureInstagramConnection(
  formData: FormData,
): Promise<ActionResult> {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    return {
      success: false,
      message: "Hanya owner atau admin yang dapat mengonfigurasi Instagram.",
    };
  }

  const accessToken = getString(formData, "access_token");
  const instagramBusinessAccountId = getString(
    formData,
    "instagram_business_account_id",
  );

  if (!accessToken || !instagramBusinessAccountId) {
    return {
      success: false,
      message: "Access token dan Instagram Business Account ID wajib diisi.",
    };
  }

  try {
    const supabase = await createClient();
    const result = await saveInstagramConnection(
      supabase,
      profile.organization_id,
      {
        pageAccessToken: accessToken,
        instagramBusinessAccountId,
        connectionMethod: "manual",
      },
    );

    revalidateInstagramPaths();
    return {
      success: true,
      message: `Terhubung ke @${result.username}.`,
    };
  } catch (error) {
    console.error("configureInstagramConnection failed", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal memvalidasi kredensial Instagram.",
    };
  }
}

export async function syncInstagramAnalytics(): Promise<ActionResult> {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    return {
      success: false,
      message: "Hanya owner atau admin yang dapat sinkronisasi analytics.",
    };
  }

  const supabase = await createClient();
  const integration = await loadInstagramIntegration(
    supabase,
    profile.organization_id,
  );

  const credentials = getInstagramCredentialsFromMetadata(integration.metadata);

  if (!credentials) {
    return {
      success: false,
      message:
        "Instagram belum terhubung. Gunakan Connect with Meta untuk menghubungkan akun.",
    };
  }

  try {
    const result = await syncInstagramAnalyticsForOrganization(
      supabase,
      profile.organization_id,
      credentials.accessToken,
      credentials.instagramBusinessAccountId,
    );

    revalidateInstagramPaths();

    return {
      success: true,
      message: `Sinkronisasi berhasil. ${result.syncedCount} post diperbarui (@${result.username}).`,
      syncedCount: result.syncedCount,
    };
  } catch (error) {
    console.error("syncInstagramAnalytics failed", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal sinkronisasi data Instagram.",
    };
  }
}

export async function disconnectInstagramAnalytics(): Promise<ActionResult> {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    return {
      success: false,
      message: "Hanya owner atau admin yang dapat memutuskan Instagram.",
    };
  }

  try {
    const supabase = await createClient();
    await disconnectInstagramIntegration(supabase, profile.organization_id);
    revalidateInstagramPaths();
    return { success: true, message: "Instagram telah diputuskan." };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Gagal memutuskan Instagram.",
    };
  }
}
