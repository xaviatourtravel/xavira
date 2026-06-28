"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { completeOnboardingIfNeeded } from "@/actions/auth";
import { getPostAuthRedirectPath } from "@/lib/auth/post-auth-redirect";
import { createClient } from "@/utils/supabase/server";

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
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
    redirect(await getPostAuthRedirectPath());
  }
}
