import { mergeWorkspaceDirectory } from "@/lib/workspace/directory-seeds";
import { buildWorkspaceFromOrganization } from "@/lib/workspace/parse-organization-workspace";
import type { WorkspaceSwitcherContext } from "@/lib/workspace/types";

type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  settings: unknown;
};

export function buildWorkspaceSwitcherContext(
  organization: OrganizationRow,
): WorkspaceSwitcherContext {
  const activeWorkspace = buildWorkspaceFromOrganization(organization);

  return {
    activeWorkspaceId: activeWorkspace.id,
    activeWorkspace,
    directory: mergeWorkspaceDirectory(activeWorkspace),
  };
}
