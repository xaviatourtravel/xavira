"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { mergeOrganizationSettingsForFirstRun } from "@/lib/onboarding/settings";
import { firstRunWizardSchema, parseInviteEmailInput } from "@/lib/onboarding/validate";
import {
  generateInviteToken,
  getInviteExpiryDate,
  normalizeInviteEmail,
} from "@/lib/team/invites";
import { requireProfile } from "@/lib/auth/session";
import { auditFromProfile } from "@/lib/audit";
import { createClient } from "@/utils/supabase/server";

export type CompleteFirstRunState =
  | { success: true }
  | { success: false; error: string };

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function completeFirstRunAction(
  _prev: CompleteFirstRunState | null,
  formData: FormData,
): Promise<CompleteFirstRunState> {
  const { profile } = await requireProfile();

  if (profile.role !== "owner") {
    return {
      success: false,
      error: "Hanya owner workspace yang dapat menyelesaikan setup.",
    };
  }

  const parsed = firstRunWizardSchema.safeParse({
    industry: getString(formData, "industry"),
    companyName: getString(formData, "companyName"),
    workspaceName: getString(formData, "workspaceName"),
    companySize: getString(formData, "companySize"),
    inviteEmails: parseInviteEmailInput(getString(formData, "inviteEmails")),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Data setup tidak valid.",
    };
  }

  const supabase = await createClient();

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id, name, settings")
    .eq("id", profile.organization_id)
    .maybeSingle();

  if (organizationError || !organization) {
    return {
      success: false,
      error: "Workspace tidak ditemukan.",
    };
  }

  const mergedSettings = mergeOrganizationSettingsForFirstRun(
    organization.settings,
    {
      companyName: parsed.data.companyName,
      workspaceName: parsed.data.workspaceName,
      industry: parsed.data.industry,
      companySize: parsed.data.companySize,
      invitedEmails: parsed.data.inviteEmails,
      completedBy: profile.id,
    },
  );

  const { error: updateError } = await supabase
    .from("organizations")
    .update({
      name: parsed.data.companyName,
      settings: mergedSettings,
    })
    .eq("id", organization.id);

  if (updateError) {
    return {
      success: false,
      error: "Gagal menyimpan konfigurasi workspace.",
    };
  }

  for (const email of parsed.data.inviteEmails) {
    const normalizedEmail = normalizeInviteEmail(email);
    const token = generateInviteToken();

    const { error: inviteError } = await supabase
      .from("organization_invites")
      .insert({
        organization_id: organization.id,
        email: normalizedEmail,
        role: "agent",
        token,
        status: "pending",
        expires_at: getInviteExpiryDate(),
        created_by: profile.id,
      });

    if (inviteError && inviteError.code !== "23505") {
      console.warn("[first-run] invite failed:", normalizedEmail, inviteError.message);
    }
  }

  await auditFromProfile(supabase, profile, {
    action: "first_run_completed",
    entityType: "organization",
    entityId: organization.id,
    entityLabel: parsed.data.companyName,
    metadata: {
      industry: parsed.data.industry,
      companySize: parsed.data.companySize,
      inviteCount: parsed.data.inviteEmails.length,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  revalidatePath("/settings/team");

  redirect("/dashboard?welcome=1");
}
