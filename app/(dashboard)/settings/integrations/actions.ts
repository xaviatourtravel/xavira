"use server";

import { revalidatePath } from "next/cache";

import { canManageIntegrations } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { auditFromProfile } from "@/lib/audit";
import {
  isIntegrationProvider,
  isIntegrationStatus,
  type IntegrationStatus,
} from "@/lib/integrations/constants";
import { INSTAGRAM_INTEGRATION_PROVIDER } from "@/lib/instagram/constants";
import { disconnectInstagramIntegration } from "@/lib/instagram/integration";
import { createClient } from "@/utils/supabase/server";

type IntegrationActionResult = {
  success: boolean;
  message?: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function setIntegrationStatus(
  formData: FormData,
  nextStatus: IntegrationStatus,
): Promise<IntegrationActionResult> {
  const { profile } = await requireProfile();

  if (!canManageIntegrations(profile)) {
    return {
      success: false,
      message: "You do not have permission to manage integrations.",
    };
  }

  const provider = getString(formData, "provider");

  if (!isIntegrationProvider(provider)) {
    return {
      success: false,
      message: "Provider tidak valid.",
    };
  }

  if (!isIntegrationStatus(nextStatus)) {
    return {
      success: false,
      message: "Status tidak valid.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("integrations")
    .upsert(
      {
        organization_id: profile.organization_id,
        provider,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,provider" },
    );

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  const auditAction =
    nextStatus === "connected"
      ? "integration_connected"
      : nextStatus === "not_connected"
        ? "integration_disconnected"
        : null;

  if (auditAction) {
    await auditFromProfile(supabase, profile, {
      action: auditAction,
      entityType: "integration",
      entityId: provider,
      entityLabel: provider,
      metadata: {
        status: nextStatus,
      },
    });
  }

  revalidatePath("/settings");
  revalidatePath("/settings/integrations");

  return { success: true };
}

export async function connectIntegration(formData: FormData) {
  const provider = getString(formData, "provider");

  if (provider === INSTAGRAM_INTEGRATION_PROVIDER) {
    return {
      success: false,
      message: "Gunakan tombol Connect untuk membuka alur OAuth Meta.",
    };
  }

  return setIntegrationStatus(formData, "connected");
}

export async function markIntegrationPendingSetup(formData: FormData) {
  return setIntegrationStatus(formData, "pending_setup");
}

export async function disconnectIntegration(formData: FormData) {
  const { profile } = await requireProfile();

  if (!canManageIntegrations(profile)) {
    return {
      success: false,
      message: "You do not have permission to manage integrations.",
    };
  }

  const provider = getString(formData, "provider");

  if (!isIntegrationProvider(provider)) {
    return {
      success: false,
      message: "Provider tidak valid.",
    };
  }

  if (provider === INSTAGRAM_INTEGRATION_PROVIDER) {
    try {
      const supabase = await createClient();
      await disconnectInstagramIntegration(supabase, profile.organization_id);

      await auditFromProfile(supabase, profile, {
        action: "integration_disconnected",
        entityType: "integration",
        entityId: provider,
        entityLabel: provider,
      });

      revalidatePath("/settings");
  revalidatePath("/settings/integrations");
      revalidatePath("/content/instagram-analytics");
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal memutuskan Instagram.",
      };
    }
  }

  return setIntegrationStatus(formData, "not_connected");
}
