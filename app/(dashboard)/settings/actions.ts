"use server";

import { revalidatePath } from "next/cache";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { auditFromProfile } from "@/lib/audit";
import {
  mergeOrganizationWorkspaceSettings,
  type AiTone,
  type OrganizationWorkspaceSettings,
} from "@/lib/settings/organization-settings";
import { createClient } from "@/utils/supabase/server";

type SettingsActionResult = {
  success: boolean;
  message?: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function revalidateSettingsPaths() {
  revalidatePath("/settings");
  revalidatePath("/settings/integrations");
  revalidatePath("/settings/team");
  revalidatePath("/settings/organization");
}

async function loadOrganizationSettingsRow() {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    return {
      error: "Only owners and admins can update workspace settings.",
    } as const;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, settings")
    .eq("id", profile.organization_id)
    .maybeSingle();

  if (error || !data) {
    return {
      error: error?.message ?? "Organization not found.",
    } as const;
  }

  return {
    profile,
    supabase,
    organizationId: profile.organization_id,
    settings: data.settings,
  } as const;
}

export async function saveGeneralSettings(
  formData: FormData,
): Promise<SettingsActionResult> {
  const organizationRow = await loadOrganizationSettingsRow();

  if ("error" in organizationRow) {
    return { success: false, message: organizationRow.error };
  }

  const { supabase, organizationId, settings } = organizationRow;
  const nextWorkspaceSettings = mergeOrganizationWorkspaceSettings(settings, {
    businessEmail: getString(formData, "businessEmail"),
    website: getString(formData, "website"),
    currency: getString(formData, "currency") || "IDR",
  });

  const { error } = await supabase
    .from("organizations")
    .update({
      name: getString(formData, "companyName"),
      phone: getString(formData, "businessPhone") || null,
      timezone: getString(formData, "timezone") || "Asia/Jakarta",
      settings: nextWorkspaceSettings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", organizationId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidateSettingsPaths();
  return { success: true, message: "General settings saved." };
}

export async function saveAiSettings(
  formData: FormData,
): Promise<SettingsActionResult> {
  const organizationRow = await loadOrganizationSettingsRow();

  if ("error" in organizationRow) {
    return { success: false, message: organizationRow.error };
  }

  const responseMode = getString(formData, "responseMode");
  const tone = getString(formData, "tone");

  const aiPatch: OrganizationWorkspaceSettings["ai"] = {
    autoReplyEnabled: getBoolean(formData, "autoReplyEnabled"),
    responseMode:
      responseMode === "suggested_reply" || responseMode === "auto_reply"
        ? responseMode
        : "manual_assist",
    tone:
      tone === "friendly" || tone === "luxury" ? tone : ("professional" as AiTone),
    knowledgeBaseEnabled: getBoolean(formData, "knowledgeBaseEnabled"),
  };

  const nextWorkspaceSettings = mergeOrganizationWorkspaceSettings(
    organizationRow.settings,
    { ai: aiPatch },
  );

  const { error } = await organizationRow.supabase
    .from("organizations")
    .update({
      settings: nextWorkspaceSettings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", organizationRow.organizationId);

  if (error) {
    return { success: false, message: error.message };
  }

  await auditFromProfile(organizationRow.supabase, organizationRow.profile, {
    action: "ai_settings_updated",
    entityType: "settings",
    entityId: organizationRow.organizationId,
    entityLabel: "AI Settings",
    metadata: {
      response_mode: aiPatch.responseMode,
      tone: aiPatch.tone,
      auto_reply_enabled: aiPatch.autoReplyEnabled,
      knowledge_base_enabled: aiPatch.knowledgeBaseEnabled,
    },
  });

  revalidateSettingsPaths();
  return { success: true, message: "AI settings saved." };
}

export async function saveInboxSettings(
  formData: FormData,
): Promise<SettingsActionResult> {
  const organizationRow = await loadOrganizationSettingsRow();

  if ("error" in organizationRow) {
    return { success: false, message: organizationRow.error };
  }

  const inboxPatch: OrganizationWorkspaceSettings["inbox"] = {
    businessHoursStart: getString(formData, "businessHoursStart") || "09:00",
    businessHoursEnd: getString(formData, "businessHoursEnd") || "18:00",
    autoAssignmentEnabled: getBoolean(formData, "autoAssignmentEnabled"),
    defaultAssigneeId: getString(formData, "defaultAssigneeId"),
    roundRobinEnabled: getBoolean(formData, "roundRobinEnabled"),
    outsideHoursAutoReply: getString(formData, "outsideHoursAutoReply"),
  };

  const nextWorkspaceSettings = mergeOrganizationWorkspaceSettings(
    organizationRow.settings,
    { inbox: inboxPatch },
  );

  const { error } = await organizationRow.supabase
    .from("organizations")
    .update({
      settings: nextWorkspaceSettings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", organizationRow.organizationId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidateSettingsPaths();
  return { success: true, message: "Inbox settings saved." };
}

export async function saveNotificationSettings(
  formData: FormData,
): Promise<SettingsActionResult> {
  const organizationRow = await loadOrganizationSettingsRow();

  if ("error" in organizationRow) {
    return { success: false, message: organizationRow.error };
  }

  const notificationsPatch: OrganizationWorkspaceSettings["notifications"] = {
    newLead: getBoolean(formData, "newLead"),
    newConversation: getBoolean(formData, "newConversation"),
    newBooking: getBoolean(formData, "newBooking"),
    overdueFollowUp: getBoolean(formData, "overdueFollowUp"),
  };

  const nextWorkspaceSettings = mergeOrganizationWorkspaceSettings(
    organizationRow.settings,
    { notifications: notificationsPatch },
  );

  const { error } = await organizationRow.supabase
    .from("organizations")
    .update({
      settings: nextWorkspaceSettings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", organizationRow.organizationId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidateSettingsPaths();
  return { success: true, message: "Notification settings saved." };
}
