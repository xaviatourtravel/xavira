import { redirect } from "next/navigation";

import {
  getOnboardingStateForCurrentUser,
  resolveOnboardingRedirect,
} from "@/lib/onboarding/get-onboarding-state";
import { isProtectedRoute } from "@/lib/auth/routes";

export async function enforceOnboardingForPath(pathname: string) {
  const state = await getOnboardingStateForCurrentUser();

  if (!state) {
    return;
  }

  if (!isProtectedRoute(pathname) && !pathname.startsWith("/onboarding")) {
    return;
  }

  const destination = resolveOnboardingRedirect(pathname, state);

  if (destination && destination !== pathname) {
    redirect(destination);
  }
}

export async function getAuthenticatedAppDestination(): Promise<string> {
  const state = await getOnboardingStateForCurrentUser();

  if (!state) {
    return "/onboarding";
  }

  if (state.shouldCreateWorkspace || state.shouldRunFirstSetup) {
    return "/onboarding";
  }

  return "/today";
}
