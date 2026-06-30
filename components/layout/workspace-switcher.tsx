"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Settings, SlidersHorizontal } from "lucide-react";

import { WorkspaceAvatar } from "@/components/layout/workspace-avatar";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import {
  getRecentWorkspaceIds,
  recordWorkspaceVisit,
} from "@/lib/workspace/recent-workspaces.client";
import type { WorkspaceDescriptor, WorkspaceSwitcherContext } from "@/lib/workspace/types";
import { cn } from "@/lib/utils";

type WorkspaceSwitcherProps = {
  context: WorkspaceSwitcherContext;
  variant?: "desktop" | "mobile";
};

function WorkspaceRow({
  workspace,
  isActive,
  onSelect,
}: {
  workspace: WorkspaceDescriptor;
  isActive: boolean;
  onSelect: (workspace: WorkspaceDescriptor) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(workspace)}
      className={cn(
        "flex min-h-[44px] w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
        isActive
          ? "bg-emerald-50 ring-1 ring-emerald-200/80 dark:bg-emerald-500/10 dark:ring-emerald-500/30"
          : "hover:bg-muted/60",
      )}
    >
      <WorkspaceAvatar workspace={workspace} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {workspace.name}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {workspace.description}
        </span>
      </span>
      {isActive ? (
        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-700">
          <Check className="h-3.5 w-3.5" />
          Aktif
        </span>
      ) : null}
    </button>
  );
}

function WorkspaceSwitcherPanel({
  context,
  notice,
  onSelect,
  onClose,
}: {
  context: WorkspaceSwitcherContext;
  notice: string | null;
  onSelect: (workspace: WorkspaceDescriptor) => void;
  onClose: () => void;
}) {
  const { activeWorkspace, activeWorkspaceId, directory } = context;
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const recentWorkspaces = useMemo(() => {
    return recentIds
      .map((id) => directory.find((workspace) => workspace.id === id))
      .filter((workspace): workspace is WorkspaceDescriptor => workspace != null)
      .filter((workspace) => workspace.id !== activeWorkspaceId)
      .slice(0, 3);
  }, [activeWorkspaceId, directory, recentIds]);

  useEffect(() => {
    recordWorkspaceVisit(activeWorkspaceId);
    setRecentIds(getRecentWorkspaceIds());
  }, [activeWorkspaceId]);

  return (
    <>
      {notice ? (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          {notice}
        </div>
      ) : null}

      <div className="border-b border-border px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Workspace Aktif
        </p>
        <div className="mt-2 flex items-center gap-3 rounded-lg bg-emerald-50/80 px-2.5 py-2 ring-1 ring-emerald-200/70 dark:bg-emerald-500/10 dark:ring-emerald-500/30">
          <WorkspaceAvatar workspace={activeWorkspace} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-foreground">
              {activeWorkspace.name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {activeWorkspace.description}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-700">
            <Check className="h-3.5 w-3.5" />
            Aktif
          </span>
        </div>
      </div>

      <div className="border-b border-border px-3 py-3">
        <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Pindah Workspace
        </p>
        <ul className="max-h-56 space-y-0.5 overflow-y-auto">
          {directory.map((workspace) => (
            <li key={workspace.id}>
              <WorkspaceRow
                workspace={workspace}
                isActive={workspace.id === activeWorkspaceId}
                onSelect={onSelect}
              />
            </li>
          ))}
        </ul>
      </div>

      {recentWorkspaces.length > 0 ? (
        <div className="border-b border-border px-3 py-3">
          <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Workspace Terbaru
          </p>
          <ul className="space-y-0.5">
            {recentWorkspaces.map((workspace) => (
              <li key={`recent-${workspace.id}`}>
                <WorkspaceRow
                  workspace={workspace}
                  isActive={workspace.id === activeWorkspaceId}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="p-2">
        <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Aksi
        </p>
        <ul className="space-y-0.5">
          <li>
            <Link
              href="/settings/workspaces/new"
              onClick={onClose}
              className="flex min-h-[44px] items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted/60"
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
              Buat Workspace
            </Link>
          </li>
          <li>
            <Link
              href="/settings/organization"
              onClick={onClose}
              className="flex min-h-[44px] items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted/60"
            >
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              Kelola Workspace
            </Link>
          </li>
          <li>
            <Link
              href="/settings"
              onClick={onClose}
              className="flex min-h-[44px] items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted/60"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              Pengaturan Workspace
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}

export function WorkspaceSwitcher({
  context,
  variant = "desktop",
}: WorkspaceSwitcherProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { activeWorkspace, activeWorkspaceId } = context;
  const useSheet = variant === "mobile" || isMobile;

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open || useSheet) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [close, open, useSheet]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        triggerRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function handleSelect(workspace: WorkspaceDescriptor) {
    if (workspace.id === activeWorkspaceId) {
      close();
      return;
    }

    recordWorkspaceVisit(workspace.id);
    setNotice("Fitur multi-workspace segera hadir.");
  }

  if (variant === "desktop" && isMobile) {
    return null;
  }

  const panel = (
    <WorkspaceSwitcherPanel
      context={context}
      notice={notice}
      onSelect={handleSelect}
      onClose={close}
    />
  );

  return (
    <div ref={rootRef} className={cn("relative", variant === "mobile" && "w-full")}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-border text-sm text-foreground/80 transition-colors hover:bg-muted/60",
          variant === "mobile"
            ? "h-11 min-w-0 max-w-full px-2 py-1.5"
            : "h-9 max-w-[168px] px-2 py-1.5",
          open && "bg-muted/60",
        )}
      >
        <WorkspaceAvatar workspace={activeWorkspace} size="sm" />
        <span className="min-w-0 truncate font-medium">{activeWorkspace.name}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && useSheet ? (
        <MobileSheet
          open={open}
          onClose={close}
          title="Workspace"
          subtitle={activeWorkspace.name}
          ariaLabel="Pengelola workspace"
        >
          {panel}
        </MobileSheet>
      ) : null}

      {open && !useSheet ? (
        <div
          role="menu"
          aria-label="Pengelola workspace"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(380px,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
        >
          {panel}
        </div>
      ) : null}
    </div>
  );
}
