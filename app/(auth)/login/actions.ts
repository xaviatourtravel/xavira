'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { completeOnboardingIfNeeded } from '@/actions/auth'

export async function login(formData: FormData) {
  let errorMessage = "";
  let isSuccess = false;

  try {
    const supabase = await createClient();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      errorMessage = "Email atau password salah";
    } else {
      const onboardingError = await completeOnboardingIfNeeded();

      console.log("LOGIN ONBOARDING ERROR:", onboardingError);

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
  let errorMessage = ''
  let isSuccess = false

  try {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      errorMessage = error.message // Menampilkan pesan asli Supabase
    } else {
      isSuccess = true
    }
  } catch (err) {
    errorMessage = 'Sistem sedang bermasalah'
  }

  // Lakukan redirect di LUAR try-catch
  if (errorMessage) {
    redirect(`/login?error=${errorMessage}`)
  }

  if (isSuccess) {
    revalidatePath('/', 'layout')
    redirect('/dashboard') // Langsung arahkan ke dashboard karena konfirmasi email sudah kita matikan
  }
}