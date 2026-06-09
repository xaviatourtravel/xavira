import { redirect } from "next/navigation";

import { completeOnboardingIfNeeded } from "@/actions/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireProfile } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const onboardingError = await completeOnboardingIfNeeded();

  if (onboardingError) {
    redirect(`/login?error=${encodeURIComponent(onboardingError)}`);
  }

  const { profile } = await requireProfile();

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  );
}