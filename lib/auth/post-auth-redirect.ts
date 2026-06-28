import { getSession } from "@/lib/auth/session";
import {
  getOnboardingState,
  getPostAuthDestination,
} from "@/lib/onboarding/get-onboarding-state";

export async function getPostAuthRedirectPath(): Promise<string> {
  const user = await getSession();

  if (!user) {
    return "/login";
  }

  const state = await getOnboardingState(user.id);

  if (!state) {
    return "/onboarding";
  }

  return getPostAuthDestination(state);
}
