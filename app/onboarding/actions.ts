"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { provisionWorkspaceForOwner } from "@/lib/auth/provision-workspace";
import { mergeOrganizationSettingsForFirstRun } from "@/lib/onboarding/settings";
import { firstRunWizardSchema, createWorkspaceSchema, parseInviteEmailInput } from "@/lib/onboarding/validate";
import {
  getOnboardingStateAdmin,
} from "@/lib/onboarding/get-onboarding-state";
import {
  generateInviteToken,
  getInviteExpiryDate,
  normalizeInviteEmail,
} from "@/lib/team/invites";
import { requireOrganizationProfile, requireProfile } from "@/lib/auth/session";
import { auditFromProfile } from "@/lib/audit";
import { createClient } from "@/utils/supabase/server";

export type CompleteFirstRunState =
  | { success: true }
  | { success: false; error: string };

export type CreateWorkspaceState =
  | { success: true }
  | { success: false; error: string };

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function finishOnboardingRedirect(userId: string): Promise<never> {
  revalidatePath("/", "layout");
  revalidatePath("/onboarding");
  revalidatePath("/today");
  revalidatePath("/dashboard");

  const state = await getOnboardingStateAdmin(userId);

  if (
    state &&
    (state.shouldCreateWorkspace || state.shouldRunFirstSetup)
  ) {
    redirect("/onboarding");
  }

  redirect("/today");
}

export async function createWorkspaceAction(
  _prev: CreateWorkspaceState | null,
  formData: FormData,
): Promise<CreateWorkspaceState> {
  const { profile, user } = await requireProfile({ allowPending: true });

  const existingState = await getOnboardingStateAdmin(profile.id);

  if (
    existingState?.hasOrganization &&
    existingState.organizationOnboardingCompleted
  ) {
    redirect("/today");
  }

  if (profile.organization_id) {
    return {
      success: false,
      error:
        "Workspace sudah ada. Selesaikan setup yang tersisa atau hubungi dukungan.",
    };
  }

  const parsed = createWorkspaceSchema.safeParse({
    workspaceName: getString(formData, "workspaceName"),
    industry: getString(formData, "industry"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Data workspace tidak valid.",
    };
  }

  if (parsed.data.industry !== "travel") {
    return {
      success: false,
      error: "Industri ini belum tersedia. Pilih Travel untuk melanjutkan.",
    };
  }

  const provisionResult = await provisionWorkspaceForOwner({
    userId: profile.id,
    workspaceName: parsed.data.workspaceName,
    industry: parsed.data.industry,
  });

  if (!provisionResult.ok) {
    return { success: false, error: provisionResult.error };
  }

  const supabase = await createClient();
  await auditFromProfile(
    supabase,
    {
      ...profile,
      organization_id: provisionResult.organizationId,
      role: "owner",
    },
    {
      action: "workspace_created",
      entityType: "organization",
      entityId: provisionResult.organizationId,
      entityLabel: parsed.data.workspaceName,
      metadata: {
        industry: parsed.data.industry,
      },
    },
  );

  return finishOnboardingRedirect(user.id);
}

export async function completeFirstRunAction(
  _prev: CompleteFirstRunState | null,
  formData: FormData,
): Promise<CompleteFirstRunState> {
  const { profile, user } = await requireOrganizationProfile();

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
  const completedAt = new Date().toISOString();

  const updatePayload = {
    name: parsed.data.companyName,
    industry: parsed.data.industry,
    onboarding_completed: true,
    onboarding_completed_at: completedAt,
    settings: mergedSettings,
  };

  let { error: updateError } = await supabase
    .from("organizations")
    .update(updatePayload)
    .eq("id", organization.id);

  if (updateError?.message?.toLowerCase().includes("onboarding_completed")) {
    ({ error: updateError } = await supabase
      .from("organizations")
      .update({
        name: parsed.data.companyName,
        settings: mergedSettings,
      })
      .eq("id", organization.id));
  }

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

  return finishOnboardingRedirect(user.id);
}
