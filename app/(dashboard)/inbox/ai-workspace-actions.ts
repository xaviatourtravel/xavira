"use server";

import { revalidatePath } from "next/cache";

import { hasPermission, isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { auditFromProfile } from "@/lib/audit";
import { formatActionError } from "@/lib/errors";
import {
  mergeOrganizationWorkspaceSettings,
  parseOrganizationWorkspaceSettings,
} from "@/lib/settings/organization-settings";
import { createClient } from "@/utils/supabase/server";

type InboxAiWorkspaceActionResult = {
  success: boolean;
  message?: string;
};

function canManageGlobalAiChat(profile: Awaited<ReturnType<typeof requireProfile>>["profile"]) {
  return isAdminOrOwner(profile) || hasPermission(profile, "ai_settings.manage");
}

export async function toggleWorkspaceAiChatAction(
  enabled: boolean,
): Promise<InboxAiWorkspaceActionResult> {
  const { profile } = await requireProfile();

  if (!canManageGlobalAiChat(profile)) {
    return {
      success: false,
      message: "You do not have permission to change workspace AI Chat settings.",
    };
  }

  const supabase = await createClient();
  const { data: organization, error: loadError } = await supabase
    .from("organizations")
    .select("id, settings")
    .eq("id", profile.organization_id)
    .maybeSingle();

  if (loadError || !organization) {
    return {
      success: false,
      message: formatActionError(loadError, "loadOrganizationSettings"),
    };
  }

  const currentSettings = parseOrganizationWorkspaceSettings(organization.settings);
  const nextWorkspaceSettings = mergeOrganizationWorkspaceSettings(
    organization.settings,
    {
      ai: {
        ...currentSettings.ai,
        autoReplyEnabled: enabled,
      },
    },
  );

  const { error: updateError } = await supabase
    .from("organizations")
    .update({
      settings: nextWorkspaceSettings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.organization_id);

  if (updateError) {
    return {
      success: false,
      message: formatActionError(updateError, "updateOrganizationSettings"),
    };
  }

  await auditFromProfile(supabase, profile, {
    action: "ai_settings_updated",
    entityType: "settings",
    entityId: profile.organization_id,
    entityLabel: "AI Chat",
    metadata: {
      auto_reply_enabled: enabled,
      source: "inbox_global_toggle",
    },
  });

  revalidatePath("/inbox");
  revalidatePath("/settings");

  return { success: true };
}
