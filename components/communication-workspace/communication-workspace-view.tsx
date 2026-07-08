"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AlertCircle, PanelRightOpen } from "lucide-react";

import { InboxContextSheetPanels } from "@/components/communication-workspace/inbox-context-sheet-panels";
import {
  useWhatsappConversationListRealtime,
  type ConversationListPatch,
} from "@/lib/communication/realtime";
import { InboxGlobalAiChatToggle } from "@/components/omnichannel-inbox/inbox-global-ai-chat-toggle";
import {
  OmnichannelConversationDetailPanel,
  OmnichannelConversationEmptyState,
} from "@/components/omnichannel-inbox/conversation-detail";
import { OmnichannelConversationList } from "@/components/omnichannel-inbox/conversation-list";
import { InboxEmptyState } from "@/components/omnichannel-inbox/inbox-empty-state";
import { InboxConversationSearch } from "@/components/omnichannel-inbox/inbox-conversation-search";
import {
  buildOmnichannelFilterCounts,
  filterConversationsBySearch,
} from "@/components/omnichannel-inbox/inbox-display";
import { OmnichannelInboxFilters } from "@/components/omnichannel-inbox/inbox-filters";
import {
  ContextSheet,
  OverlayLayer,
  WorkspaceContent,
  WorkspaceHeader,
  WorkspaceHeaderAction,
  WorkspaceHeaderKpi,
  WorkspaceShell,
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
  allConversations,
  detail,
  activeFilter,
  selectedConversationId,
  conversationNotFound = false,
  currentUserId,
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
  const { ti, tStrict } = useInboxTranslation();
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

  const filterCounts = buildOmnichannelFilterCounts(allConversations, currentUserId);

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
    <WorkspaceShell
      header={
        <WorkspaceHeader
          title={tStrict("navigation.inbox")}
          kpi={
            <WorkspaceHeaderKpi tone="default" ariaLive="polite">
              {headerKpi}
            </WorkspaceHeaderKpi>
          }
          search={
            showMobileThread ? undefined : (
              <InboxConversationSearch value={searchQuery} onChange={setSearchQuery} />
            )
          }
          actions={
            liveDetail ? (
              <WorkspaceHeaderAction
                label={ti("workspaceTitle")}
                icon={PanelRightOpen}
                onClick={() => openContextSheet("copilot")}
              />
            ) : undefined
          }
          toolbar={
            !liveDetail ? (
              <div className="max-w-md">
                <InboxGlobalAiChatToggle />
              </div>
            ) : undefined
          }
        />
      }
    >
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
        {/* TODO(Aurora PR-003): Replace legacy Conversation List with Aurora Conversation List V2 */}
        <section
          className={cn(
            "flex min-h-0 w-[320px] min-w-[320px] max-w-[320px] shrink-0 flex-col border-r border-border/30 bg-background",
            showMobileThread ? "hidden lg:flex" : "flex",
          )}
        >
          <div className="px-4 pb-3 pt-3">
            <OmnichannelInboxFilters
              activeFilter={activeFilter}
              selectedConversationId={selectedConversationId}
              filterCounts={filterCounts}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <OmnichannelConversationList
              conversations={filteredConversations}
              selectedConversationId={selectedConversationId}
              activeFilter={activeFilter}
              searchQuery={searchQuery}
            />
          </div>
        </section>

        {/* Conversation thread — Aurora reading lane */}
        <WorkspaceContent
          variant="full"
          className={cn(
            "min-w-0 overflow-hidden p-0 md:p-0 [&>div]:h-full [&>div]:min-h-0 [&>div]:flex-1 [&>div]:space-y-0",
            showMobileThread ? "flex flex-col" : "hidden lg:flex lg:flex-col",
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
        </WorkspaceContent>
      </div>

      <InboxContextSheetLayer
        conversation={liveDetail}
        organizationId={organizationId}
        canUpdateStatus={canUpdateStatus}
      />

      {/* TODO(Aurora): Wire ambient AI assistant via OverlayLayer */}
      <OverlayLayer open={false} tier="overlay">
        {null}
      </OverlayLayer>
    </WorkspaceShell>
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
