"use server";

import { redirect } from "next/navigation";

import {
  getBetaJoinConfigError,
  isBetaJoinModeActive,
  logBetaJoinOnboarding,
  resolveBetaJoinState,
} from "@/lib/auth/beta-onboarding";
import type { AuthFormState } from "@/lib/auth/types";
import { getAuthRedirectUrl, slugifyOrganizationName } from "@/lib/auth/utils";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import {
  betaRegisterSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import type { Database, TablesInsert } from "@/types/database";
import {
  acceptOrganizationInvite,
  getOrganizationInviteByToken,
  getInviteValidationError,
} from "@/lib/team/invites";

type OrganizationInsert = TablesInsert<"organizations">;
type ProfileInsert = TablesInsert<"profiles">;
type SubscriptionInsert = TablesInsert<"subscriptions">;
type BusinessType = Database["public"]["Enums"]["business_type"];

type AdminClient = ReturnType<typeof createAdminClient>;

type EnsureProfileInput = {
  userId: string;
  fullName: string;
  email: string;
  organizationName: string;
  businessType: BusinessType;
  inviteToken?: string;
};

export type SignUpWithOnboardingResult =
  | { ok: true; emailConfirmationRequired: true }
  | { ok: true; emailConfirmationRequired: false }
  | { ok: false; error: string };

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getEmailLocalPart(email: string): string {
  return email.split("@")[0]?.trim() || "User";
}

export async function login(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: getFormString(formData, "email"),
    password: getFormString(formData, "password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Data tidak valid" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: "Email atau password salah" };
  }

  const onboardingError = await completeOnboardingIfNeeded();
  if (onboardingError) {
    return { success: false, error: onboardingError };
  }

  const redirectTo = getFormString(formData, "redirectTo") || "/dashboard";
  redirect(redirectTo);
}

export async function register(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const inviteToken = getFormString(formData, "inviteToken");

  if (inviteToken) {
    const parsed = betaRegisterSchema.safeParse({
      fullName: getFormString(formData, "fullName"),
      email: getFormString(formData, "email"),
      password: getFormString(formData, "password"),
      confirmPassword: getFormString(formData, "confirmPassword"),
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message ?? "Data tidak valid",
      };
    }

    const invite = await getOrganizationInviteByToken(inviteToken);
    const inviteValidationError = getInviteValidationError(
      invite,
      parsed.data.email,
    );

    if (inviteValidationError) {
      return { success: false, error: inviteValidationError };
    }

    const signUpResult = await signUpWithOnboarding({
      email: parsed.data.email,
      password: parsed.data.password,
      fullName: parsed.data.fullName,
      inviteToken,
    });

    if (!signUpResult.ok) {
      return { success: false, error: signUpResult.error };
    }

    if (signUpResult.emailConfirmationRequired) {
      return {
        success: true,
        message:
          "Akun berhasil dibuat. Cek email Anda untuk konfirmasi, lalu login untuk bergabung ke tim.",
      };
    }

    redirect("/dashboard");
  }

  const betaJoinMode = isBetaJoinModeActive();

  if (betaJoinMode) {
    const parsed = betaRegisterSchema.safeParse({
      fullName: getFormString(formData, "fullName"),
      email: getFormString(formData, "email"),
      password: getFormString(formData, "password"),
      confirmPassword: getFormString(formData, "confirmPassword"),
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Data tidak valid" };
    }

    const signUpResult = await signUpWithOnboarding({
      email: parsed.data.email,
      password: parsed.data.password,
      fullName: parsed.data.fullName,
    });

    if (!signUpResult.ok) {
      return { success: false, error: signUpResult.error };
    }

    if (signUpResult.emailConfirmationRequired) {
      return {
        success: true,
        message:
          "Akun berhasil dibuat. Cek email Anda untuk konfirmasi, lalu login untuk menyelesaikan setup.",
      };
    }

    redirect("/dashboard");
  }

  const parsed = registerSchema.safeParse({
    fullName: getFormString(formData, "fullName"),
    email: getFormString(formData, "email"),
    password: getFormString(formData, "password"),
    confirmPassword: getFormString(formData, "confirmPassword"),
    organizationName: getFormString(formData, "organizationName"),
    businessType: getFormString(formData, "businessType") || "both",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Data tidak valid" };
  }

  const signUpResult = await signUpWithOnboarding({
    email: parsed.data.email,
    password: parsed.data.password,
    fullName: parsed.data.fullName,
    organizationName: parsed.data.organizationName,
    businessType: parsed.data.businessType,
  });

  if (!signUpResult.ok) {
    return { success: false, error: signUpResult.error };
  }

  if (signUpResult.emailConfirmationRequired) {
    return {
      success: true,
      message:
        "Akun berhasil dibuat. Cek email Anda untuk konfirmasi, lalu login untuk menyelesaikan setup.",
    };
  }

  redirect("/dashboard");
}

export async function signUpWithOnboarding(input: {
  email: string;
  password: string;
  fullName: string;
  organizationName?: string;
  businessType?: BusinessType;
  inviteToken?: string;
}): Promise<SignUpWithOnboardingResult> {
  const betaJoinMode = isBetaJoinModeActive() && !input.inviteToken;
  logBetaJoinOnboarding("signUpWithOnboarding");
  const organizationName =
    input.organizationName ?? `${input.fullName} Travel`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        ...(input.inviteToken
          ? { invite_token: input.inviteToken }
          : betaJoinMode
            ? {}
            : { organization_name: organizationName }),
      },
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data.user) {
    return { ok: false, error: "Registrasi gagal. Silakan coba lagi." };
  }

  if (!data.session) {
    return { ok: true, emailConfirmationRequired: true };
  }

  const admin = createAdminClient();
  const onboardingError = await ensureUserProfile(admin, {
    userId: data.user.id,
    fullName: input.fullName,
    email: input.email,
    organizationName,
    businessType: input.businessType ?? "both",
    inviteToken: input.inviteToken,
  });

  if (onboardingError) {
    return { ok: false, error: onboardingError };
  }

  return { ok: true, emailConfirmationRequired: false };
}

async function joinBetaOrganization(
  supabase: AdminClient,
  input: { userId: string; fullName: string },
  organizationId: string,
): Promise<string | null> {
  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", organizationId)
    .maybeSingle();

  if (organizationError) {
    return organizationError.message;
  }

  if (!organization) {
    return "Organisasi beta tidak ditemukan. Hubungi admin.";
  }

  const profilePayload: ProfileInsert = {
    id: input.userId,
    organization_id: organizationId,
    full_name: input.fullName,
    role: "agent",
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .insert(profilePayload);

  if (profileError) {
    if (profileError.code === "23505") {
      return null;
    }

    return profileError.message;
  }

  return null;
}

async function createNewOrganizationForUser(
  supabase: AdminClient,
  input: EnsureProfileInput,
): Promise<string | null> {
  const slug = slugifyOrganizationName(input.organizationName);
  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 14);

  const organizationPayload: OrganizationInsert = {
    name: input.organizationName,
    slug,
    business_type: input.businessType,
  };

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .insert(organizationPayload)
    .select("id")
    .single();

  if (organizationError || !organization) {
    return organizationError?.message ?? "Gagal membuat organisasi";
  }

  const profilePayload: ProfileInsert = {
    id: input.userId,
    organization_id: organization.id,
    full_name: input.fullName,
    role: "owner",
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .insert(profilePayload);

  if (profileError) {
    if (profileError.code === "23505") {
      return null;
    }

    return profileError.message;
  }

  const subscriptionPayload: SubscriptionInsert = {
    organization_id: organization.id,
    plan: "starter",
    status: "trialing",
    price_idr: 500000,
    current_period_start: new Date().toISOString(),
    current_period_end: trialEnds.toISOString(),
  };

  const { error: subscriptionError } = await supabase
    .from("subscriptions")
    .insert(subscriptionPayload);

  if (subscriptionError) {
    return subscriptionError.message;
  }

  return null;
}

async function ensureUserProfile(
  supabase: AdminClient,
  input: EnsureProfileInput,
): Promise<string | null> {
  logBetaJoinOnboarding("ensureUserProfile");

  const betaConfigError = getBetaJoinConfigError();
  if (betaConfigError) {
    return betaConfigError;
  }

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", input.userId)
    .maybeSingle();

  if (existingProfileError) {
    return existingProfileError.message;
  }

  if (existingProfile) {
    return null;
  }

  if (input.inviteToken) {
    return acceptOrganizationInvite({
      userId: input.userId,
      fullName: input.fullName,
      email: input.email,
      inviteToken: input.inviteToken,
    });
  }

  const betaState = resolveBetaJoinState();

  if (betaState.mode === "active") {
    return joinBetaOrganization(
      supabase,
      {
        userId: input.userId,
        fullName: input.fullName,
      },
      betaState.organizationId,
    );
  }

  return createNewOrganizationForUser(supabase, input);
}

export async function forgotPassword(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: getFormString(formData, "email"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Data tidak valid" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getAuthRedirectUrl()}?next=/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    message: "Link reset password telah dikirim ke email Anda.",
  };
}

export async function resetPassword(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: getFormString(formData, "password"),
    confirmPassword: getFormString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Data tidak valid" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Sesi reset password tidak valid. Minta link baru.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function completeOnboardingIfNeeded(): Promise<string | null> {
  logBetaJoinOnboarding("completeOnboardingIfNeeded");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile) {
    return null;
  }

  const metadata = user.user_metadata as {
    full_name?: string;
    organization_name?: string;
    invite_token?: string;
  };

  const fullName = metadata.full_name ?? getEmailLocalPart(user.email ?? "User");
  const organizationName = metadata.organization_name ?? `${fullName} Travel`;
  const inviteToken = metadata.invite_token?.trim() || undefined;

  const admin = createAdminClient();

  return ensureUserProfile(admin, {
    userId: user.id,
    fullName,
    email: user.email ?? "",
    organizationName,
    businessType: "both",
    inviteToken,
  });
}
