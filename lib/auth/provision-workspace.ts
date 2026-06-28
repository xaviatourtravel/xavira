import { createInitialOrganizationSettings } from "@/lib/onboarding/settings";
import type { SolutionIndustry } from "@/lib/onboarding/types";
import { slugifyOrganizationName } from "@/lib/auth/utils";
import { createAdminClient } from "@/utils/supabase/admin";
import type { Database, TablesInsert } from "@/types/database";

type OrganizationInsert = TablesInsert<"organizations">;
type SubscriptionInsert = TablesInsert<"subscriptions">;
type BusinessType = Database["public"]["Enums"]["business_type"];

function mapIndustryToBusinessType(): BusinessType {
  return "both";
}

function isMissingOnboardingColumnError(message: string | undefined): boolean {
  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();
  return (
    normalized.includes("onboarding_completed") ||
    normalized.includes("onboarding_completed_at") ||
    normalized.includes("could not find the column")
  );
}

export type ProvisionWorkspaceInput = {
  userId: string;
  workspaceName: string;
  industry: SolutionIndustry;
};

export type ProvisionWorkspaceResult =
  | { ok: true; organizationId: string }
  | { ok: false; error: string };

export async function provisionWorkspaceForOwner(
  input: ProvisionWorkspaceInput,
): Promise<ProvisionWorkspaceResult> {
  const admin = createAdminClient();
  const slug = slugifyOrganizationName(input.workspaceName);
  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 14);
  const completedAt = new Date().toISOString();

  const initialSettings = createInitialOrganizationSettings(
    input.industry,
    input.workspaceName,
    input.userId,
  );

  const baseOrganizationPayload = {
    name: input.workspaceName,
    slug,
    business_type: mapIndustryToBusinessType(),
    industry: input.industry,
    settings: initialSettings,
  };

  const organizationPayload: OrganizationInsert = {
    ...baseOrganizationPayload,
    onboarding_completed: true,
    onboarding_completed_at: completedAt,
  };

  let organizationId: string;

  const fullInsert = await admin
    .from("organizations")
    .insert(organizationPayload)
    .select("id")
    .single();

  if (fullInsert.error || !fullInsert.data) {
    if (!isMissingOnboardingColumnError(fullInsert.error?.message)) {
      return {
        ok: false,
        error: fullInsert.error?.message ?? "Gagal membuat workspace.",
      };
    }

    const fallbackInsert = await admin
      .from("organizations")
      .insert(baseOrganizationPayload)
      .select("id")
      .single();

    if (fallbackInsert.error || !fallbackInsert.data) {
      return {
        ok: false,
        error: fallbackInsert.error?.message ?? "Gagal membuat workspace.",
      };
    }

    organizationId = fallbackInsert.data.id;
  } else {
    organizationId = fullInsert.data.id;
  }

  const { data: updatedProfile, error: profileError } = await admin
    .from("profiles")
    .update({
      organization_id: organizationId,
      role: "owner",
    })
    .eq("id", input.userId)
    .select("id, organization_id, role")
    .single();

  if (profileError || !updatedProfile?.organization_id) {
    return {
      ok: false,
      error: profileError?.message ?? "Gagal menautkan workspace ke profil.",
    };
  }

  const verifiedOrganizationId = updatedProfile.organization_id;

  const subscriptionPayload: SubscriptionInsert = {
    organization_id: verifiedOrganizationId,
    plan: "starter",
    status: "trialing",
    price_idr: 500000,
    current_period_start: new Date().toISOString(),
    current_period_end: trialEnds.toISOString(),
  };

  const { error: subscriptionError } = await admin
    .from("subscriptions")
    .insert(subscriptionPayload);

  if (subscriptionError) {
    console.warn(
      "[provision-workspace] subscription insert failed:",
      subscriptionError.message,
    );
  }

  const { data: organizationRow } = await admin
    .from("organizations")
    .select("id, onboarding_completed, settings")
    .eq("id", verifiedOrganizationId)
    .maybeSingle();

  if (!organizationRow) {
    return {
      ok: false,
      error: "Workspace dibuat tetapi verifikasi gagal. Silakan refresh halaman.",
    };
  }

  return { ok: true, organizationId: verifiedOrganizationId };
}
