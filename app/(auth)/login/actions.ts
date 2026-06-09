"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { completeOnboardingIfNeeded, signUpWithOnboarding } from "@/actions/auth";
import { createClient } from "@/utils/supabase/server";

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getEmailLocalPart(email: string): string {
  return email.split("@")[0]?.trim() || "User";
}

export async function login(formData: FormData) {
  let errorMessage = "";
  let isSuccess = false;

  try {
    const supabase = await createClient();
    const email = getFormString(formData, "email");
    const password = getFormString(formData, "password");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      errorMessage = "Email atau password salah";
    } else {
      const onboardingError = await completeOnboardingIfNeeded();

      if (onboardingError) {
        errorMessage = onboardingError;
      } else {
        isSuccess = true;
      }
    }
  } catch (err) {
    console.error("LOGIN ACTION CRASH:", err);
    errorMessage = "Sistem sedang bermasalah";
  }

  if (errorMessage) {
    redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
  }

  if (isSuccess) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }
}

export async function signup(formData: FormData) {
  let errorMessage = "";
  let isSuccess = false;

  try {
    const email = getFormString(formData, "email");
    const password = getFormString(formData, "password");
    const fullName = getEmailLocalPart(email);

    const result = await signUpWithOnboarding({
      email,
      password,
      fullName,
    });

    if (!result.ok) {
      errorMessage = result.error;
    } else if (result.emailConfirmationRequired) {
      redirect(
        `/login?message=${encodeURIComponent("Akun berhasil dibuat. Cek email Anda untuk konfirmasi, lalu login.")}`,
      );
    } else {
      isSuccess = true;
    }
  } catch (err) {
    console.error("SIGNUP ACTION CRASH:", err);
    errorMessage = "Sistem sedang bermasalah";
  }

  if (errorMessage) {
    redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
  }

  if (isSuccess) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }
}
