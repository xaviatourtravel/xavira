"use server";

import { revalidatePath } from "next/cache";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import {
  checkPageWebhookSubscription,
  loadInstagramWebhookIntegrationContext,
  subscribePageToWebhook,
  type PageWebhookSubscribeResult,
  type PageWebhookSubscriptionCheckResult,
} from "@/lib/instagram/webhook-subscription";
import { createClient } from "@/utils/supabase/server";

export type InstagramWebhookActionResult =
  | {
      success: true;
      check: PageWebhookSubscriptionCheckResult;
      subscribe?: PageWebhookSubscribeResult;
      message?: string;
    }
  | {
      success: false;
      message: string;
      subscribe?: PageWebhookSubscribeResult;
      check?: PageWebhookSubscriptionCheckResult;
    };

const REVALIDATE_PATH = "/settings/integrations/instagram/webhook";

async function requireInstagramWebhookContext() {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    return {
      error: "Hanya owner atau admin yang dapat mengelola webhook Instagram.",
    } as const;
  }

  const supabase = await createClient();
  const context = await loadInstagramWebhookIntegrationContext(
    supabase,
    profile.organization_id,
  );

  if (!context) {
    return {
      error:
        "Instagram belum terhubung atau metadata Page ID / token tidak lengkap. Hubungkan ulang di Settings → Integrations.",
    } as const;
  }

  return { context } as const;
}

export async function refreshInstagramWebhookSubscription(): Promise<InstagramWebhookActionResult> {
  const resolved = await requireInstagramWebhookContext();
  if ("error" in resolved) {
    return { success: false, message: resolved.error ?? "Akses ditolak." };
  }

  const check = await checkPageWebhookSubscription(
    resolved.context.pageId,
    resolved.context.pageAccessToken,
  );

  revalidatePath(REVALIDATE_PATH);

  if (!check.ok) {
    return {
      success: false,
      message:
        check.error?.message ??
        `Gagal memeriksa subscription webhook (HTTP ${check.httpStatus}).`,
    };
  }

  return { success: true, check };
}

export async function subscribeInstagramPageWebhook(): Promise<InstagramWebhookActionResult> {
  const resolved = await requireInstagramWebhookContext();
  if ("error" in resolved) {
    return { success: false, message: resolved.error ?? "Akses ditolak." };
  }

  const subscribe = await subscribePageToWebhook(
    resolved.context.pageId,
    resolved.context.pageAccessToken,
  );

  if (!subscribe.ok) {
    return {
      success: false,
      message:
        subscribe.error?.message ??
        `Gagal subscribe Page ke webhook (HTTP ${subscribe.httpStatus}).`,
      subscribe,
    };
  }

  const check = await checkPageWebhookSubscription(
    resolved.context.pageId,
    resolved.context.pageAccessToken,
  );

  revalidatePath(REVALIDATE_PATH);

  return {
    success: true,
    check,
    subscribe,
    message: "Facebook Page berhasil di-subscribe ke webhook Desklabs.",
  };
}
