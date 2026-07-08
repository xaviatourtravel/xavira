// Aurora Workspace Shell (PR-001)
export { WorkspaceShell } from "./WorkspaceShell";
export type { WorkspaceShellProps } from "./WorkspaceShell";
export { WorkspaceHeader } from "./WorkspaceHeader";
export type { WorkspaceHeaderProps } from "./WorkspaceHeader";
export { WorkspaceHeaderKpi } from "./WorkspaceHeaderKpi";
export type { WorkspaceHeaderKpiProps, WorkspaceHeaderKpiTone } from "./WorkspaceHeaderKpi";
export { WorkspaceHeaderSearch } from "./WorkspaceHeaderSearch";
export type { WorkspaceHeaderSearchProps } from "./WorkspaceHeaderSearch";
export { WorkspaceHeaderCreate } from "./WorkspaceHeaderCreate";
export type { WorkspaceHeaderCreateProps } from "./WorkspaceHeaderCreate";
export { WorkspaceHeaderAction } from "./WorkspaceHeaderAction";
export type { WorkspaceHeaderActionProps } from "./WorkspaceHeaderAction";
export { WorkspaceHeaderActions } from "./WorkspaceHeaderActions";
export type { WorkspaceHeaderActionsProps } from "./WorkspaceHeaderActions";
export { WorkspaceContent } from "./WorkspaceContent";
export type { WorkspaceContentProps } from "./WorkspaceContent";
export { ContextSheet } from "./ContextSheet";
export type { ContextSheetProps } from "./ContextSheet";
export { OverlayLayer } from "./OverlayLayer";
export type { OverlayLayerProps } from "./OverlayLayer";
export * from "./aurora-tokens";

// Entity detail workspace (legacy pattern)
export {
  WorkspaceHeader as EntityWorkspaceHeader,
  WorkspaceHeaderSection as EntityWorkspaceHeaderSection,
} from "./entity-workspace-header";

export { WorkspaceLayout } from "./workspace-layout";
export { WorkspaceTabs, buildDefaultWorkspaceTabs } from "./workspace-tabs";
export { WorkspaceMainPanel } from "./workspace-main-panel";
export { WorkspaceSidebar, WorkspaceSidebarSection } from "./workspace-sidebar";
export { WorkspaceTimeline } from "./workspace-timeline";
export {
  WorkspaceTaskPanel,
  WorkspaceTaskActionButton,
  WorkspaceTaskActions,
} from "./workspace-task-panel";
export { WorkspaceAIPanel, DEFAULT_AI_SECTIONS } from "./workspace-ai-panel";
export { WorkspaceQuickActions } from "./workspace-quick-actions";
export { WorkspaceFactsCard } from "./workspace-facts-card";
export { WorkspaceStatCard } from "./workspace-stat-card";
export {
  WorkspaceEmptyState,
  WorkspaceDocumentsEmptyState,
  WorkspaceNotesEmptyState,
  WorkspaceAiEmptyState,
} from "./workspace-empty-state";
export {
  WorkspaceLoadingSkeleton,
  WorkspacePanelLoadingSkeleton,
  WorkspaceSidebarLoadingSkeleton,
} from "./workspace-loading-skeleton";

export * from "./types";
export * from "./styles";
