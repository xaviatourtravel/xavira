import { NextResponse } from "next/server";

import { completeOnboardingIfNeeded } from "@/actions/auth";
import {
  getOnboardingState,
  getPostAuthDestination,
} from "@/lib/onboarding/get-onboarding-state";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const onboardingError = await completeOnboardingIfNeeded();

      if (onboardingError) {
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(onboardingError)}`, origin),
        );
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const state = user ? await getOnboardingState(user.id) : null;
      const destination = state ? getPostAuthDestination(state) : "/onboarding";

      return NextResponse.redirect(new URL(destination, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_callback_error", origin));
}
