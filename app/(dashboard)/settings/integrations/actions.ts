"use server";

import { revalidatePath } from "next/cache";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import {
  isIntegrationProvider,
  isIntegrationStatus,
  type IntegrationStatus,
} from "@/lib/integrations/constants";
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

  if (!isAdminOrOwner(profile)) {
    return {
      success: false,
      message: "Hanya owner atau admin yang dapat mengubah integrasi.",
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

  revalidatePath("/settings/integrations");

  return { success: true };
}

export async function connectIntegration(formData: FormData) {
  return setIntegrationStatus(formData, "connected");
}

export async function markIntegrationPendingSetup(formData: FormData) {
  return setIntegrationStatus(formData, "pending_setup");
}

export async function disconnectIntegration(formData: FormData) {
  return setIntegrationStatus(formData, "not_connected");
}
