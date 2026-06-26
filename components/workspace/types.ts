import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export const DEFAULT_WORKSPACE_TAB_IDS = [
  "overview",
  "timeline",
  "tasks",
  "documents",
  "notes",
  "ai",
] as const;

export type DefaultWorkspaceTabId = (typeof DEFAULT_WORKSPACE_TAB_IDS)[number];

export type WorkspaceMetadataItem = {
  id?: string;
  label: string;
  value: ReactNode;
};

export type WorkspaceTabDefinition = {
  id: string;
  label: string;
  icon?: LucideIcon;
  href?: string;
  hidden?: boolean;
  badge?: ReactNode;
};

export type WorkspaceTimelineEvent = {
  id: string;
  title: string;
  description?: string | null;
  timestamp: string;
  badge?: {
    label: string;
    tone?: "default" | "success" | "warning" | "danger" | "info";
  };
  icon?: LucideIcon;
  meta?: ReactNode;
};

export type WorkspaceTaskActionPreset = "reply" | "open" | "complete" | "skip";

export type WorkspaceTaskItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  priority?: string | null;
  dueDate?: string | null;
  status?: string | null;
  statusTone?: "default" | "success" | "warning" | "danger" | "info";
  actions?: ReactNode;
};

export type WorkspaceQuickAction = {
  id: string;
  label: string;
  icon?: LucideIcon;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost";
  hidden?: boolean;
};

export type WorkspaceQuickActionGroup = {
  id: string;
  label: string;
  icon?: LucideIcon;
  actions: WorkspaceQuickAction[];
};

export type WorkspaceAISection = {
  id: string;
  title: string;
  description?: string;
  content?: ReactNode;
  placeholder?: string;
  action?: ReactNode;
};

export type WorkspaceFactItem = {
  id?: string;
  label: string;
  value: ReactNode;
};

export type WorkspaceStatItem = {
  id?: string;
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
};

export type WorkspaceEmptyStatePreset =
  | "timeline"
  | "tasks"
  | "ai"
  | "documents"
  | "notes"
  | "generic";

export type WorkspaceStatusTone =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info";
