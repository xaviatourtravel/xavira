import { requireProfile } from "@/lib/auth/session";
import { isAdminOrOwner, canManageWorkspaceSettings } from "@/lib/auth/permissions";
import { WorkspaceBrandingForm } from "@/modules/organization/branding/components/workspace-branding-form";
import { WorkspaceBrandingBreadcrumb } from "@/modules/organization/branding/components/workspace-branding-breadcrumb";
import { getWorkspaceBranding } from "@/modules/organization/branding/services/branding-service";

export default async function WorkspaceBrandingPage() {
  const { profile } = await requireProfile();
  const branding = await getWorkspaceBranding(profile);
  const canManage =
    isAdminOrOwner(profile) && canManageWorkspaceSettings(profile);

  return (
    <div className="space-y-4 p-6">
      <WorkspaceBrandingBreadcrumb />
      <WorkspaceBrandingForm initial={branding} canManage={canManage} />
    </div>
  );
}
