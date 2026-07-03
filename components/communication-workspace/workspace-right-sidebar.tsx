"use client";

import { useEffect } from "react";
import { ChevronRight, PanelRightOpen } from "lucide-react";

import { IntelligencePanel } from "@/components/communication-workspace/primitives";
import { AiCommandCenter } from "@/modules/inbox/components/ai-command-center";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";

type WorkspaceRightSidebarProps = {
  conversation: OmnichannelConversationDetail | null;
  organizationId: string;
  orgProfiles: Array<{ id: string; full_name: string }>;
  canReassign: boolean;
  canUpdateStatus: boolean;
  canAddNote: boolean;
  canConvert: boolean;
  canCreateFollowUp: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

export function WorkspaceRightSidebar({
  conversation,
  organizationId,
  canUpdateStatus,
  collapsed,
  onToggleCollapsed,
}: WorkspaceRightSidebarProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === ".") {
        event.preventDefault();
        onToggleCollapsed();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggleCollapsed]);

  if (collapsed) {
    return (
      <div className="flex h-full flex-col items-center border-l border-soft bg-sidebar py-3">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex flex-col items-center gap-2 rounded-lg px-1.5 py-3 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          title="Buka AI Command Center (Ctrl+.)"
          aria-label="Buka AI Command Center"
        >
          <PanelRightOpen className="h-4 w-4" />
          <span className="rotate-180 text-[11px] font-medium tracking-wide [writing-mode:vertical-rl]">
            AI Center
          </span>
        </button>
      </div>
    );
  }

  if (!conversation) {
    return (
      <IntelligencePanel>
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold tracking-tight text-foreground">
            AI Command Center
          </p>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60"
            title="Ciutkan panel (Ctrl+.)"
            aria-label="Ciutkan panel"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
          Select a conversation to open the AI Command Center.
        </div>
      </IntelligencePanel>
    );
  }

  return (
    <IntelligencePanel>
      <div className="flex shrink-0 items-center justify-between border-b border-border/70 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-foreground">
            AI Command Center
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            Status, qualification, and takeover readiness
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60"
          title="Ciutkan panel (Ctrl+.)"
          aria-label="Ciutkan panel"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <AiCommandCenter
        conversation={conversation}
        organizationId={organizationId}
        canManageAi={canUpdateStatus}
      />
    </IntelligencePanel>
  );
}
