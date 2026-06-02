import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import type { Profile } from "@/types/database";

export function DashboardShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: Profile;
}) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex min-h-screen flex-1 flex-col pb-16 md:pb-0">
        <AppHeader profile={profile} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
