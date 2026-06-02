"use server";

import { redirect } from "next/navigation";

import type { AuthFormState } from "@/lib/auth/types";
import { getAuthRedirectUrl, slugifyOrganizationName } from "@/lib/auth/utils";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import type {
  OrganizationInsert,
  ProfileInsert,
  SubscriptionInsert,
} from "@/types/database";

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        organization_name: parsed.data.organizationName,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: "Registrasi gagal. Silakan coba lagi." };
  }

  if (!data.session) {
    return {
      success: true,
      message:
        "Akun berhasil dibuat. Cek email Anda untuk konfirmasi, lalu login untuk menyelesaikan setup.",
    };
  }

  const admin = createAdminClient();

const onboardingError = await createOrganizationForUser(admin as any, {
    userId: data.user.id,
    fullName: parsed.data.fullName,
    organizationName: parsed.data.organizationName,
    businessType: parsed.data.businessType,
  });

  if (onboardingError) {
    return { success: false, error: onboardingError };
  }

  redirect("/dashboard");
}

async function createOrganizationForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    userId: string;
    fullName: string;
    organizationName: string;
    businessType: "umroh" | "halal_tour" | "both";
  },
): Promise<string | null> {
  // Typed client inference is fixed after running `supabase gen types typescript`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const slug = slugifyOrganizationName(input.organizationName);
  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 14);

  const organizationPayload: OrganizationInsert = {
    name: input.organizationName,
    slug,
    business_type: input.businessType,
  };

  const { data: organization, error: organizationError } = await db
    .from("organizations")
    .insert([organizationPayload])
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

  const { error: profileError } = await db
    .from("profiles")
    .insert([profilePayload]);

  if (profileError) {
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

  const { error: subscriptionError } = await db
    .from("subscriptions")
    .insert([subscriptionPayload]);

  if (subscriptionError) {
    return subscriptionError.message;
  }

  return null;
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
  };

  const fullName = metadata.full_name ?? user.email?.split("@")[0] ?? "Owner";
  const organizationName =
    metadata.organization_name ?? `${fullName} Travel`;

  const admin = createAdminClient();

  return createOrganizationForUser(admin as any, {
    userId: user.id,
    fullName,
    organizationName,
    businessType: "both",
  });
}
