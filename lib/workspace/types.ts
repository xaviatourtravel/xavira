/**
 * Workspace descriptor for switcher and future multi-workspace support.
 * Not tied to a single product brand — populated from organization records.
 */
export type WorkspaceDescriptor = {
  id: string;
  slug: string;
  name: string;
  description: string;
  brandColor: string;
  logoUrl: string | null;
  timezone: string;
  currency: string;
  modulesEnabled: string[];
  aiPersonality: string | null;
  /** When false, selecting shows multi-workspace coming-soon notice */
  canSwitch: boolean;
};

export type WorkspaceSwitcherContext = {
  activeWorkspaceId: string;
  activeWorkspace: WorkspaceDescriptor;
  /** All workspaces shown under "Pindah Workspace" */
  directory: WorkspaceDescriptor[];
};

export type RecentWorkspaceEntry = {
  id: string;
  visitedAt: string;
};
