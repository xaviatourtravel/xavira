"use server";

import { redirect } from "next/navigation";

import { getPostAuthRedirectPath } from "@/lib/auth/post-auth-redirect";
import type { AuthFormState } from "@/lib/auth/types";
import { getAuthRedirectUrl } from "@/lib/auth/utils";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import {
  accountRegisterSchema,
  betaRegisterSchema,
  forgotPasswordSchema,
  inviteJoinSchema,
  loginSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import {
  acceptOrganizationInvite,
  getOrganizationInviteByToken,
  getInviteValidationError,
} from "@/lib/team/invites";
import type { TablesInsert } from "@/types/database";

type ProfileInsert = TablesInsert<"profiles">;

type AdminClient = ReturnType<typeof createAdminClient>;

type EnsureProfileInput = {
  userId: string;
  fullName: string;
  email: string;
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

async function getPostAuthRedirectPathForLogin(): Promise<string> {
  return getPostAuthRedirectPath();
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

  const redirectTo =
    getFormString(formData, "redirectTo") ||
    (await getPostAuthRedirectPathForLogin());
  redirect(redirectTo);
}

export async function registerWorkspace(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = accountRegisterSchema.safeParse({
    fullName: getFormString(formData, "fullName"),
    email: getFormString(formData, "email"),
    password: getFormString(formData, "password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Data tidak valid",
    };
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
        "Akun berhasil dibuat. Cek email Anda untuk konfirmasi, lalu login untuk melanjutkan setup workspace.",
    };
  }

  redirect("/onboarding");
}

export async function joinWorkspaceViaInvite(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const inviteToken = getFormString(formData, "inviteToken");

  const parsed = inviteJoinSchema.safeParse({
    fullName: getFormString(formData, "fullName"),
    password: getFormString(formData, "password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Data tidak valid",
    };
  }

  if (!inviteToken) {
    return { success: false, error: "Token undangan tidak valid." };
  }

  const invite = await getOrganizationInviteByToken(inviteToken);
  const inviteValidationError = getInviteValidationError(invite);

  if (inviteValidationError || !invite) {
    return { success: false, error: inviteValidationError ?? "Undangan tidak valid." };
  }

  const signUpResult = await signUpWithOnboarding({
    email: invite.email,
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
        "Akun berhasil dibuat. Cek email Anda untuk konfirmasi, lalu login untuk bergabung ke workspace.",
    };
  }

  redirect(await getPostAuthRedirectPathForLogin());
}

/** @deprecated Use registerWorkspace for new workspace signup. */
export async function register(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const inviteToken = getFormString(formData, "inviteToken");

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

  if (inviteToken) {
    const invite = await getOrganizationInviteByToken(inviteToken);
    const inviteValidationError = getInviteValidationError(
      invite,
      parsed.data.email,
    );

    if (inviteValidationError) {
      return { success: false, error: inviteValidationError };
    }
  }

  const signUpResult = await signUpWithOnboarding({
    email: parsed.data.email,
    password: parsed.data.password,
    fullName: parsed.data.fullName,
    inviteToken: inviteToken || undefined,
  });

  if (!signUpResult.ok) {
    return { success: false, error: signUpResult.error };
  }

  if (signUpResult.emailConfirmationRequired) {
    return {
      success: true,
      message: inviteToken
        ? "Akun berhasil dibuat. Cek email Anda untuk konfirmasi, lalu login untuk bergabung ke tim."
        : "Akun berhasil dibuat. Cek email Anda untuk konfirmasi, lalu login untuk melanjutkan setup workspace.",
    };
  }

  redirect(await getPostAuthRedirectPathForLogin());
}

export async function signUpWithOnboarding(input: {
  email: string;
  password: string;
  fullName: string;
  inviteToken?: string;
}): Promise<SignUpWithOnboardingResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        ...(input.inviteToken ? { invite_token: input.inviteToken } : {}),
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
    inviteToken: input.inviteToken,
  });

  if (onboardingError) {
    return { ok: false, error: onboardingError };
  }

  return { ok: true, emailConfirmationRequired: false };
}

async function createPendingProfileForUser(
  supabase: AdminClient,
  input: { userId: string; fullName: string },
): Promise<string | null> {
  const profilePayload: ProfileInsert = {
    id: input.userId,
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

  return null;
}

async function ensureUserProfile(
  supabase: AdminClient,
  input: EnsureProfileInput,
): Promise<string | null> {
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id, organization_id")
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

  return createPendingProfileForUser(supabase, {
    userId: input.userId,
    fullName: input.fullName,
  });
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

  redirect(await getPostAuthRedirectPathForLogin());
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function completeOnboardingIfNeeded(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile) {
    return null;
  }

  const metadata = user.user_metadata as {
    full_name?: string;
    invite_token?: string;
  };

  const fullName = metadata.full_name ?? getEmailLocalPart(user.email ?? "User");
  const inviteToken = metadata.invite_token?.trim() || undefined;

  const admin = createAdminClient();

  return ensureUserProfile(admin, {
    userId: user.id,
    fullName,
    email: user.email ?? "",
    inviteToken,
  });
}
