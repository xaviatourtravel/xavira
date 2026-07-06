"use client";

import { Suspense, lazy, useCallback, useEffect, useRef } from "react";

import { InspectorSkeleton } from "@/components/ui/inspector";
import { TabsContent } from "@/components/ui/tabs";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { cn } from "@/lib/utils";
import type { WorkspaceTabId } from "@/modules/inbox/context/workspace-tab-context";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";

const LazyAiCopilotTab = lazy(() =>
  import("@/modules/inbox/components/tabs/ai-copilot-tab").then((module) => ({
    default: module.AiCopilotTab,
  })),
);
const LazyCustomer360Tab = lazy(() =>
  import("@/modules/inbox/components/tabs/customer-360-tab").then((module) => ({
    default: module.Customer360Tab,
  })),
);
const LazyFilesTab = lazy(() =>
  import("@/modules/inbox/components/tabs/files-tab").then((module) => ({
    default: module.FilesTab,
  })),
);
const LazyActivityTab = lazy(() =>
  import("@/modules/inbox/components/tabs/activity-tab").then((module) => ({
    default: module.ActivityTab,
  })),
);

const PANEL_FADE_CLASS = "animate-in fade-in duration-150";

type WorkspaceLazyPanelsProps = {
  conversation: OmnichannelConversationDetail;
  organizationId: string;
  canManageAi: boolean;
};

function WorkspaceLoadingFallback() {
  const { ti } = useInboxTranslation();
  return <InspectorSkeleton ariaLabel={ti("workspaceLoading")} showHero />;
}

export function WorkspaceLazyPanels({
  conversation,
  organizationId,
  canManageAi,
}: WorkspaceLazyPanelsProps) {
  return (
    <Suspense fallback={<WorkspaceLoadingFallback />}>
      <TabsContent value="copilot" className={PANEL_FADE_CLASS}>
        <LazyAiCopilotTab
          conversation={conversation}
          organizationId={organizationId}
          canManageAi={canManageAi}
        />
      </TabsContent>
      <TabsContent value="customer360" className={PANEL_FADE_CLASS}>
        <LazyCustomer360Tab conversation={conversation} />
      </TabsContent>
      <TabsContent value="files" className={PANEL_FADE_CLASS}>
        <LazyFilesTab conversation={conversation} canManageAi={canManageAi} />
      </TabsContent>
      <TabsContent value="activity" className={PANEL_FADE_CLASS}>
        <LazyActivityTab conversation={conversation} />
      </TabsContent>
    </Suspense>
  );
}

export function useWorkspaceScrollPersistence(activeTab: WorkspaceTabId) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPositionsRef = useRef<Partial<Record<WorkspaceTabId, number>>>({});
  const previousTabRef = useRef<WorkspaceTabId>(activeTab);

  const saveScrollPosition = useCallback((tab: WorkspaceTabId) => {
    if (scrollRef.current) {
      scrollPositionsRef.current[tab] = scrollRef.current.scrollTop;
    }
  }, []);

  useEffect(() => {
    const previousTab = previousTabRef.current;
    if (previousTab !== activeTab) {
      saveScrollPosition(previousTab);
      previousTabRef.current = activeTab;
    }

    const frame = window.requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollPositionsRef.current[activeTab] ?? 0;
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeTab, saveScrollPosition]);

  return scrollRef;
}

export function workspacePanelClassName(className?: string) {
  return cn(PANEL_FADE_CLASS, className);
}
