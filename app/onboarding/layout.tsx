import { redirect } from "next/navigation";

import { OnboardingLayoutChrome } from "@/components/onboarding/onboarding-layout-chrome";
import { completeOnboardingIfNeeded } from "@/actions/auth";
import { requireProfile } from "@/lib/auth/session";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const onboardingError = await completeOnboardingIfNeeded();

  if (onboardingError) {
    redirect(`/login?error=${encodeURIComponent(onboardingError)}`);
  }

  await requireProfile({ allowPending: true });

  return <OnboardingLayoutChrome>{children}</OnboardingLayoutChrome>;
}
