"use client";

import { useEffect } from "react";

import { InboxEmptyState } from "@/components/omnichannel-inbox/inbox-empty-state";
import {
  useWorkspaceScrollPersistence,
  WorkspaceLazyPanels,
} from "@/components/communication-workspace/workspace-panel-content";
import { WorkspaceTabNav } from "@/components/communication-workspace/workspace-tab-nav";
import { Tabs } from "@/components/ui/tabs";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import {
  useWorkspaceTab,
  type WorkspaceTabId,
} from "@/modules/inbox/context/workspace-tab-context";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { PanelRightOpen } from "lucide-react";

type InboxContextSheetPanelsProps = {
  conversation: OmnichannelConversationDetail | null;
  organizationId: string;
  canUpdateStatus: boolean;
};

/**
 * Aurora Context Sheet body — existing workspace tabs (Copilot, Customer 360, Resources, History).
 */
export function InboxContextSheetPanels({
  conversation,
  organizationId,
  canUpdateStatus,
}: Pick<
  InboxContextSheetPanelsProps,
  "conversation" | "organizationId" | "canUpdateStatus"
>) {
  const { ti } = useInboxTranslation();
  const { activeTab, setActiveTab, bindConversation } = useWorkspaceTab();
  const scrollRef = useWorkspaceScrollPersistence(activeTab);

  useEffect(() => {
    bindConversation(conversation?.id ?? null);
  }, [bindConversation, conversation?.id]);

  if (!conversation) {
    return (
      <InboxEmptyState
        icon={PanelRightOpen}
        title={ti("selectConversationWorkspaceTitle")}
        description={ti("selectConversationWorkspaceDesc")}
        className="h-full min-h-[240px]"
        size="compact"
      />
    );
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as WorkspaceTabId)}
      className="flex min-h-0 flex-1 flex-col"
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
  );
}
