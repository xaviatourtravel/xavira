"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { auditFromProfile } from "@/lib/audit";
import { saveInstagramConnection } from "@/lib/instagram/integration";
import {
  formatNoInstagramBusinessAccountError,
  INSTAGRAM_OAUTH_PENDING_COOKIE,
  parseSignedCookieValue,
  type InstagramOAuthPendingPayload,
} from "@/lib/instagram/oauth";
import { createClient } from "@/utils/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getSafeReturnTo(value: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/settings/integrations";
  }
  return value;
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

export async function finalizeInstagramPageSelection(formData: FormData) {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect(
      "/settings/integrations?error=Hanya admin atau owner yang dapat menghubungkan Instagram.",
    );
  }

  const pageId = getString(formData, "page_id");
  const returnTo = getSafeReturnTo(getString(formData, "return_to"));

  const cookieStore = await cookies();
  const pendingCookie = cookieStore.get(INSTAGRAM_OAUTH_PENDING_COOKIE)?.value;
  const pending = parseSignedCookieValue<InstagramOAuthPendingPayload>(
    pendingCookie,
  );

  cookieStore.delete(INSTAGRAM_OAUTH_PENDING_COOKIE);

  if (
    !pending ||
    pending.organizationId !== profile.organization_id ||
    pending.userId !== profile.id
  ) {
    redirect(
      `${returnTo}?error=${encodeURIComponent("Sesi pemilihan halaman kedaluwarsa. Coba hubungkan lagi.")}`,
    );
  }

  const selectedPage = pending.pages.find((page) => page.pageId === pageId);
  if (!selectedPage) {
    redirect(
      `${returnTo}?error=${encodeURIComponent("Facebook Page tidak valid.")}`,
    );
  }

  if (
    !selectedPage.hasInstagramConnected ||
    !selectedPage.instagramBusinessAccountId
  ) {
    redirect(
      `${returnTo}?error=${encodeURIComponent(formatNoInstagramBusinessAccountError(selectedPage.pageName))}`,
    );
  }

  const supabase = await createClient();

  let result;
  try {
    result = await saveInstagramConnection(
      supabase,
      profile.organization_id,
      {
        pageId: selectedPage.pageId,
        pageName: selectedPage.pageName,
        pageAccessToken: selectedPage.pageAccessToken,
        instagramBusinessAccountId: selectedPage.instagramBusinessAccountId,
        instagramUsername: selectedPage.instagramUsername,
        connectionMethod: "oauth",
      },
    );
  } catch (error) {
    console.error("finalizeInstagramPageSelection failed", error);
    redirect(
      `${returnTo}?error=${encodeURIComponent(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan koneksi Instagram.",
      )}`,
    );
  }

  await auditFromProfile(supabase, profile, {
    action: "integration_connected",
    entityType: "integration",
    entityId: "instagram_business",
    entityLabel: result.username ? `@${result.username}` : "Instagram",
    metadata: {
      connection_method: "oauth",
    },
  });

  revalidateInstagramPaths();
  redirect(
    `${returnTo}?instagram=connected&message=${encodeURIComponent(`Instagram terhubung ke @${result.username}.`)}`,
  );
}
