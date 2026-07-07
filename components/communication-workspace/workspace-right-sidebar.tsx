"use client";

import { useEffect } from "react";
import { ChevronRight, PanelRightOpen } from "lucide-react";

import { IntelligencePanel } from "@/components/communication-workspace/primitives";
import {
  useWorkspaceScrollPersistence,
  WorkspaceLazyPanels,
} from "@/components/communication-workspace/workspace-panel-content";
import { WorkspaceTabNav } from "@/components/communication-workspace/workspace-tab-nav";
import { Tabs } from "@/components/ui/tabs";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import {
  useWorkspaceTab,
  WorkspaceTabProvider,
  type WorkspaceTabId,
} from "@/modules/inbox/context/workspace-tab-context";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";

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

function WorkspaceChromeHeader({
  onToggleCollapsed,
}: {
  onToggleCollapsed: () => void;
}) {
  const { ti } = useInboxTranslation();

  return (
    <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-4 py-2.5">
      <p className="text-sm font-medium tracking-tight text-foreground">
        {ti("workspaceTitle")}
      </p>
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        title={ti("collapsePanel")}
        aria-label={ti("collapsePanel")}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function WorkspaceRightSidebarContent({
  conversation,
  organizationId,
  canUpdateStatus,
  collapsed,
  onToggleCollapsed,
}: Omit<
  WorkspaceRightSidebarProps,
  "orgProfiles" | "canReassign" | "canAddNote" | "canConvert" | "canCreateFollowUp"
>) {
  const { ti } = useInboxTranslation();
  const { activeTab, setActiveTab, bindConversation } = useWorkspaceTab();
  const scrollRef = useWorkspaceScrollPersistence(activeTab);

  useEffect(() => {
    bindConversation(conversation?.id ?? null);
  }, [bindConversation, conversation?.id]);

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
      <div className="flex h-full flex-col items-center border-l border-border/40 bg-background py-3">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex flex-col items-center gap-2 rounded-lg px-1.5 py-3 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title={ti("expandPanel")}
          aria-label={ti("expandPanel")}
        >
          <PanelRightOpen className="h-4 w-4" />
          <span className="rotate-180 text-[11px] font-medium tracking-wide [writing-mode:vertical-rl]">
            {ti("workspaceTitle")}
          </span>
        </button>
      </div>
    );
  }

  if (!conversation) {
    return (
      <IntelligencePanel>
        <WorkspaceChromeHeader onToggleCollapsed={onToggleCollapsed} />
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {ti("selectConversation")}
        </div>
      </IntelligencePanel>
    );
  }

  return (
    <IntelligencePanel>
      <WorkspaceChromeHeader onToggleCollapsed={onToggleCollapsed} />
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as WorkspaceTabId)}
        className="min-h-0 flex-1"
      >
        <WorkspaceTabNav />
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          <WorkspaceLazyPanels
            conversation={conversation}
            organizationId={organizationId}
            canManageAi={canUpdateStatus}
          />
        </div>
      </Tabs>
    </IntelligencePanel>
  );
}

export function WorkspaceRightSidebar(props: WorkspaceRightSidebarProps) {
  return (
    <WorkspaceTabProvider>
      <WorkspaceRightSidebarContent {...props} />
    </WorkspaceTabProvider>
  );
}
