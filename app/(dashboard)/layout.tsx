import { requireProfile } from "@/lib/auth/session";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { completeOnboardingIfNeeded } from "@/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const onboardingError = await completeOnboardingIfNeeded();

  console.log("DASHBOARD ONBOARDING ERROR:", onboardingError);

  const { profile } = await requireProfile();

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  );
}