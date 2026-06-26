import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Bot,
  Clock3,
  FileText,
  Inbox,
  ListTodo,
  Sparkles,
  StickyNote,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { workspaceMutedPanelClass } from "./styles";
import type { WorkspaceEmptyStatePreset } from "./types";

type WorkspaceEmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  preset?: WorkspaceEmptyStatePreset;
  className?: string;
  compact?: boolean;
};

const PRESET_ICONS: Record<WorkspaceEmptyStatePreset, LucideIcon> = {
  timeline: Clock3,
  tasks: ListTodo,
  ai: Sparkles,
  documents: FileText,
  notes: StickyNote,
  generic: Inbox,
};

const PRESET_ICON_CLASS: Record<WorkspaceEmptyStatePreset, string> = {
  timeline: "bg-slate-50 text-slate-600",
  tasks: "bg-blue-50 text-blue-600",
  ai: "bg-emerald-50 text-emerald-600",
  documents: "bg-amber-50 text-amber-600",
  notes: "bg-violet-50 text-violet-600",
  generic: "bg-muted text-muted-foreground",
};

export function WorkspaceEmptyState({
  title,
  description,
  action,
  icon,
  preset = "generic",
  className,
  compact = false,
}: WorkspaceEmptyStateProps) {
  const Icon = icon ?? PRESET_ICONS[preset];

  return (
    <div
      className={cn(
        workspaceMutedPanelClass,
        "flex flex-col items-center justify-center text-center",
        compact ? "px-4 py-8" : "px-6 py-12",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-2xl",
          PRESET_ICON_CLASS[preset],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className={cn("font-semibold tracking-tight", compact ? "mt-4 text-sm" : "mt-5 text-base")}>
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function WorkspaceDocumentsEmptyState({
  action,
  className,
}: {
  action?: ReactNode;
  className?: string;
}) {
  return (
    <WorkspaceEmptyState
      preset="documents"
      title="No documents uploaded."
      description="Upload passports, invoices, and supporting files when this workspace supports document management."
      action={action}
      className={className}
    />
  );
}

export function WorkspaceNotesEmptyState({
  action,
  className,
}: {
  action?: ReactNode;
  className?: string;
}) {
  return (
    <WorkspaceEmptyState
      preset="notes"
      title="No notes yet."
      description="Capture internal context and handoff notes for your team."
      action={action}
      className={className}
    />
  );
}

export function WorkspaceAiEmptyState({
  action,
  className,
}: {
  action?: ReactNode;
  className?: string;
}) {
  return (
    <WorkspaceEmptyState
      preset="ai"
      icon={Bot}
      title="Generate AI summary."
      description="Use AI to summarize context, detect intent, and recommend the next best action."
      action={action}
      className={className}
    />
  );
}
