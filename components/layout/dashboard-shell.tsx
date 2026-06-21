import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PermissionProvider } from "@/components/auth/permission-provider";
import { getProfilePermissions } from "@/lib/auth/permissions";
import type { Profile } from "@/types/app-types";

export function DashboardShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: Profile;
}) {
  const permissions = getProfilePermissions(profile);

  return (
    <PermissionProvider permissions={permissions}>
      <div className="flex min-h-screen overflow-x-hidden">
        <AppSidebar permissions={permissions} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col pb-[4.5rem] md:pb-0">
          <AppHeader profile={profile} />
          <main className="flex-1 overflow-x-hidden p-3 md:p-6">{children}</main>
        </div>
        <MobileNav permissions={permissions} />
      </div>
    </PermissionProvider>
  );
}
