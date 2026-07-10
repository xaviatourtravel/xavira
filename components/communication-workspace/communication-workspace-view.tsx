"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AlertCircle, PanelRightOpen } from "lucide-react";

import { InboxContextPanel } from "@/components/communication-workspace/inbox-context-panel";
import { InboxContextSheetPanels } from "@/components/communication-workspace/inbox-context-sheet-panels";
import { InboxFlowPanel } from "@/components/communication-workspace/inbox-flow-panel";
import {
  useWhatsappConversationListRealtime,
  type ConversationListPatch,
} from "@/lib/communication/realtime";
import {
  OmnichannelConversationDetailPanel,
  OmnichannelConversationEmptyState,
} from "@/components/omnichannel-inbox/conversation-detail";
import { OmnichannelConversationList } from "@/components/omnichannel-inbox/conversation-list";
import { InboxEmptyState } from "@/components/omnichannel-inbox/inbox-empty-state";
import { InboxConversationSearch } from "@/components/omnichannel-inbox/inbox-conversation-search";
import { filterConversationsBySearch } from "@/components/omnichannel-inbox/inbox-display";
import {
  AURORA_QUEUE_WIDTH,
  AURORA_SHELL_CLASS,
  AURORA_WORKSPACE_COLUMN_HEADER,
  AURORA_WORKSPACE_HEADER_KPI,
  AURORA_WORKSPACE_HEADER_TITLE,
} from "@/components/workspace/aurora-tokens";
import {
  ContextSheet,
  WorkspaceHeaderAction,
  WorkspaceHeaderKpi,
} from "@/components/workspace";
import { formatTranslation } from "@/lib/i18n/dictionary";
import { InboxAiWorkspaceProvider } from "@/modules/inbox/context/inbox-ai-workspace-context";
import { InboxComposerProvider } from "@/modules/inbox/context/inbox-composer-context";
import {
  InboxWorkspaceLayoutProvider,
  useInboxWorkspaceLayout,
} from "@/modules/inbox/context/inbox-workspace-layout-context";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import type {
  OmnichannelConversationListItem,
  OmnichannelInboxFilter,
} from "@/lib/omnichannel-inbox/queries";
import {
  useWhatsappProfilePictureSync,
  patchConversationAvatar,
  patchConversationDetailAvatar,
} from "@/lib/whatsapp-inbox/use-whatsapp-profile-picture-sync";
import { cn } from "@/lib/utils";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { logInboxError } from "@/modules/inbox/lib/resolve-inbox-error";

type CommunicationWorkspaceViewProps = {
  conversations: OmnichannelConversationListItem[];
  allConversations: OmnichannelConversationListItem[];
  detail: OmnichannelConversationDetail | null;
  activeFilter: OmnichannelInboxFilter;
  selectedConversationId: string | null;
  conversationNotFound?: boolean;
  currentUserId: string;
  organizationId: string;
  orgProfiles: Array<{ id: string; full_name: string }>;
  canReply: boolean;
  canSuggestReply: boolean;
  canReassign: boolean;
  canUpdateStatus: boolean;
  canAddNote: boolean;
  canConvert: boolean;
  canCreateFollowUp: boolean;
  readOnly?: boolean;
  isUnassignedForAgent?: boolean;
  initialError?: string | null;
  initialSuccess?: string | null;
  aiChatEnabled?: boolean;
  canManageGlobalAi?: boolean;
};

function sortByLastMessageAtDesc(
  a: OmnichannelConversationListItem,
  b: OmnichannelConversationListItem,
) {
  const aAt = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0;
  const bAt = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0;
  return bAt - aAt;
}

function ConversationNotFoundState() {
  const { ti } = useInboxTranslation();

  return (
    <InboxEmptyState
      icon={AlertCircle}
      title={ti("conversationNotFound")}
      description={ti("conversationNotFoundDesc")}
      className="h-full bg-background"
    />
  );
}

function InboxContextSheetLayer({
  conversation,
  organizationId,
  canUpdateStatus,
}: {
  conversation: OmnichannelConversationDetail | null;
  organizationId: string;
  canUpdateStatus: boolean;
}) {
  const { ti } = useInboxTranslation();
  const { contextSheetOpen, closeContextSheet } = useInboxWorkspaceLayout();

  return (
    <ContextSheet
      open={contextSheetOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeContextSheet();
        }
      }}
      title={ti("workspaceTitle")}
      subtitle={ti("workspaceSubtitle")}
      width="lg"
      contentClassName="flex min-h-0 flex-col p-0 md:p-0"
    >
      <InboxContextSheetPanels
        conversation={conversation}
        organizationId={organizationId}
        canUpdateStatus={canUpdateStatus}
      />
    </ContextSheet>
  );
}

function CommunicationWorkspaceBody({
  conversations,
  allConversations: _allConversations,
  detail,
  activeFilter,
  selectedConversationId,
  conversationNotFound = false,
  currentUserId: _currentUserId,
  organizationId,
  canReply,
  canSuggestReply,
  canUpdateStatus,
  readOnly = false,
  isUnassignedForAgent = false,
  initialError = null,
  initialSuccess = null,
}: Pick<
  CommunicationWorkspaceViewProps,
  | "conversations"
  | "allConversations"
  | "detail"
  | "activeFilter"
  | "selectedConversationId"
  | "conversationNotFound"
  | "currentUserId"
  | "organizationId"
  | "canReply"
  | "canSuggestReply"
  | "canUpdateStatus"
  | "readOnly"
  | "isUnassignedForAgent"
  | "initialError"
  | "initialSuccess"
>) {
  const [searchQuery, setSearchQuery] = useState("");
  const { ti } = useInboxTranslation();
  const { openContextSheet } = useInboxWorkspaceLayout();

  const [liveDetail, setLiveDetail] =
    useState<OmnichannelConversationDetail | null>(detail);

  useEffect(() => {
    setLiveDetail(detail);
  }, [detail]);

  const handleAvatarUpdated = useCallback(
    (conversationId: string, profilePictureUrl: string | null) => {
      setLiveConversations((prev) =>
        patchConversationAvatar(prev, conversationId, profilePictureUrl),
      );
      setLiveDetail((prev) =>
        patchConversationDetailAvatar(prev, conversationId, profilePictureUrl),
      );
    },
    [],
  );

  useWhatsappProfilePictureSync({
    conversation: liveDetail,
    onAvatarUpdated: handleAvatarUpdated,
  });

  const [liveConversations, setLiveConversations] =
    useState<OmnichannelConversationListItem[]>(conversations);

  const conversationsKey = useMemo(
    () => conversations.map((item) => item.id).sort().join("|"),
    [conversations],
  );

  useEffect(() => {
    setLiveConversations(conversations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationsKey]);

  const handleConversationPatch = useCallback((patch: ConversationListPatch) => {
    setLiveConversations((prev) => {
      const index = prev.findIndex((item) => item.id === patch.id);
      if (index < 0) {
        return prev;
      }

      const current = prev[index];
      const updated: OmnichannelConversationListItem = {
        ...current,
        lastMessagePreview: patch.lastMessage ?? current.lastMessagePreview,
        lastMessageAt: patch.lastMessageAt ?? current.lastMessageAt,
        unreadCount: patch.unreadCount ?? current.unreadCount,
        customerAvatar:
          patch.customerAvatar !== undefined
            ? patch.customerAvatar
            : current.customerAvatar,
      };

      const rest = prev.filter((_, itemIndex) => itemIndex !== index);
      return [updated, ...rest].sort(sortByLastMessageAtDesc);
    });
  }, []);

  useWhatsappConversationListRealtime({
    organizationId,
    onConversationChange: handleConversationPatch,
  });

  const filteredConversations = useMemo(
    () => filterConversationsBySearch(liveConversations, searchQuery),
    [liveConversations, searchQuery],
  );

  const headerKpi = useMemo(() => {
    const count = filteredConversations.length;
    const unread = filteredConversations.reduce(
      (sum, conversation) => sum + conversation.unreadCount,
      0,
    );

    if (unread > 0) {
      return formatTranslation(ti("headerKpiCountUnread"), {
        count: String(count),
        unread: String(unread),
      });
    }

    return formatTranslation(ti("headerKpiCount"), {
      count: String(count),
    });
  }, [filteredConversations, ti]);

  const listHref = useMemo(() => {
    const params = new URLSearchParams();
    if (activeFilter !== "all") {
      params.set("filter", activeFilter);
    }
    const query = params.toString();
    return query ? `/inbox?${query}` : "/inbox";
  }, [activeFilter]);

  const showMobileThread = Boolean(selectedConversationId);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === ".") {
        if (window.matchMedia("(min-width: 1024px)").matches) {
          return;
        }
        event.preventDefault();
        openContextSheet("copilot");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openContextSheet]);

  if (initialError) {
    logInboxError("initialError", decodeURIComponent(initialError));
  }

  return (
    <div className={cn(AURORA_SHELL_CLASS, "h-full overflow-hidden")}>
      {initialError ? (
        <div className="shrink-0 border-b border-red-200/60 bg-red-50 px-4 py-2.5 dark:border-red-900/40 dark:bg-red-950/30">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            {ti("errorGenericTitle")}
          </p>
          <p className="mt-0.5 text-xs text-red-600/90 dark:text-red-300/80">
            {ti("errorGenericDesc")}
          </p>
        </div>
      ) : null}

      {initialSuccess ? (
        <div className="shrink-0 border-b border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          {decodeURIComponent(initialSuccess)}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <InboxFlowPanel queueCount={filteredConversations.length} />

        <section
          className={cn(
            AURORA_QUEUE_WIDTH,
            "flex min-h-0 shrink-0 flex-col overflow-hidden border-r border-border/25 bg-background",
            showMobileThread ? "hidden lg:flex" : "flex",
          )}
        >
          <header className={cn(AURORA_WORKSPACE_COLUMN_HEADER, "px-3 py-2")}>
            <div className="flex w-full items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className={AURORA_WORKSPACE_HEADER_TITLE}>{ti("conversationListTitle")}</h2>
                <WorkspaceHeaderKpi
                  tone="default"
                  ariaLive="polite"
                  className={AURORA_WORKSPACE_HEADER_KPI}
                >
                  {headerKpi}
                </WorkspaceHeaderKpi>
              </div>

              <WorkspaceHeaderAction
                label={ti("workspaceTitle")}
                icon={PanelRightOpen}
                onClick={() => openContextSheet("copilot")}
                className="lg:hidden"
              />
            </div>
          </header>

          <div className="shrink-0 border-b border-border/25 px-3 py-2">
            <InboxConversationSearch value={searchQuery} onChange={setSearchQuery} />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <OmnichannelConversationList
              conversations={filteredConversations}
              selectedConversationId={selectedConversationId}
              activeFilter={activeFilter}
              searchQuery={searchQuery}
            />
          </div>
        </section>

        <main
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background",
            showMobileThread ? "flex" : "hidden lg:flex",
          )}
        >
          {liveDetail ? (
            <OmnichannelConversationDetailPanel
              conversation={liveDetail}
              canReply={canReply}
              canSuggestReply={canSuggestReply}
              canManageAi={canUpdateStatus}
              isUnassignedForAgent={isUnassignedForAgent}
              readOnly={readOnly}
              channel={liveDetail.channel}
              backHref={listHref}
              showBackButton
            />
          ) : conversationNotFound ? (
            <ConversationNotFoundState />
          ) : (
            <OmnichannelConversationEmptyState />
          )}
        </main>

        <InboxContextPanel conversation={liveDetail} />
      </div>

      <InboxContextSheetLayer
        conversation={liveDetail}
        organizationId={organizationId}
        canUpdateStatus={canUpdateStatus}
      />
    </div>
  );
}

export function CommunicationWorkspaceView(props: CommunicationWorkspaceViewProps) {
  const { aiChatEnabled = true, canManageGlobalAi = false, ...bodyProps } = props;

  return (
    <InboxAiWorkspaceProvider
      aiChatEnabled={aiChatEnabled}
      canManageGlobalAi={canManageGlobalAi}
    >
      <InboxComposerProvider>
        <InboxWorkspaceLayoutProvider>
          <CommunicationWorkspaceBody {...bodyProps} />
        </InboxWorkspaceLayoutProvider>
      </InboxComposerProvider>
    </InboxAiWorkspaceProvider>
  );
}
