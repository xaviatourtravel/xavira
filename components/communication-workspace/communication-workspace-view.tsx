"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AlertCircle } from "lucide-react";

import {
  useWhatsappConversationListRealtime,
  type ConversationListPatch,
} from "@/lib/communication/realtime";
import { WorkspaceRightSidebar } from "@/components/communication-workspace/workspace-right-sidebar";
import { InboxComposerProvider } from "@/modules/inbox/context/inbox-composer-context";
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
  WORKSPACE_SIDEBAR_WIDTH,
} from "@/lib/communication-workspace/types";
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
};

const SIDEBAR_COLLAPSED_KEY = "desklabs:workspace:detail-collapsed";

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

export function CommunicationWorkspaceView({
  conversations,
  allConversations,
  detail,
  activeFilter,
  selectedConversationId,
  conversationNotFound = false,
  currentUserId,
  organizationId,
  orgProfiles,
  canReply,
  canSuggestReply,
  canReassign,
  canUpdateStatus,
  canAddNote,
  canConvert,
  canCreateFollowUp,
  readOnly = false,
  isUnassignedForAgent = false,
  initialError = null,
  initialSuccess = null,
}: CommunicationWorkspaceViewProps) {
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  // Panel detail diciutkan secara default agar area chat lebih lebar.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { ti } = useInboxTranslation();

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "false") {
      setSidebarCollapsed(false);
    } else if (stored === "true") {
      setSidebarCollapsed(true);
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);
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

  // Daftar percakapan hidup: di-seed dari data server lalu di-patch realtime.
  const [liveConversations, setLiveConversations] =
    useState<OmnichannelConversationListItem[]>(conversations);

  // Seed ulang hanya saat keanggotaan daftar berubah (navigasi/filter), bukan
  // pada setiap render induk, agar patch realtime tidak terhapus.
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

  useEffect(() => {
    if (selectedConversationId) {
      setMobilePanelOpen(true);
    }
  }, [selectedConversationId]);

  const listHref = useMemo(() => {
    const params = new URLSearchParams();
    if (activeFilter !== "all") {
      params.set("filter", activeFilter);
    }
    const query = params.toString();
    return query ? `/inbox?${query}` : "/inbox";
  }, [activeFilter]);

  const showMobileThread = Boolean(selectedConversationId);

  if (initialError) {
    logInboxError("initialError", decodeURIComponent(initialError));
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
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
        <div className="shrink-0 rounded-lg border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          {decodeURIComponent(initialSuccess)}
        </div>
      ) : null}

      <InboxComposerProvider>
      <div
        className="grid min-h-0 flex-1 overflow-hidden bg-background lg:grid-cols-[320px_minmax(0,1fr)_var(--workspace-sidebar-width)]"
        style={{
          ["--workspace-sidebar-width" as string]: sidebarCollapsed
            ? "48px"
            : WORKSPACE_SIDEBAR_WIDTH,
        }}
      >
        {/* Left — conversation list */}
        <section
          className={cn(
            "flex min-h-0 w-[320px] min-w-[320px] max-w-[320px] shrink-0 flex-col border-r border-border/40 bg-background",
            showMobileThread ? "hidden lg:flex" : "flex",
          )}
        >
          <div className="px-4 pb-2 pt-3">
            <InboxConversationSearch value={searchQuery} onChange={setSearchQuery} />
          </div>

          <div className="px-4 pb-2">
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

        {/* Center — active thread */}
        <section
          className={cn(
            "relative flex min-h-0 min-w-0 flex-col overflow-hidden bg-background",
            showMobileThread ? "flex flex-col" : "hidden lg:flex lg:flex-col",
          )}
        >
          {liveDetail ? (
            <>
              <OmnichannelConversationDetailPanel
                conversation={liveDetail}
                canReply={canReply}
                canSuggestReply={canSuggestReply}
                canManageAi={canUpdateStatus}
                isUnassignedForAgent={isUnassignedForAgent}
                readOnly={readOnly}
                channel={liveDetail.channel}
                mobilePanelOpen={mobilePanelOpen}
                onToggleMobilePanel={() => setMobilePanelOpen((open) => !open)}
                backHref={listHref}
                showBackButton
              />
              {mobilePanelOpen ? (
                <>
                  <button
                    type="button"
                    aria-label={ti("closeCustomerIntelligence")}
                    className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] lg:hidden"
                    onClick={() => setMobilePanelOpen(false)}
                  />
                  <aside className="fixed inset-x-0 bottom-0 z-40 flex max-h-[90vh] flex-col rounded-t-2xl border-t border-border/40 bg-background shadow-lg lg:hidden">
                    <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <WorkspaceRightSidebar
                        conversation={liveDetail}
                        organizationId={organizationId}
                        orgProfiles={orgProfiles}
                        canReassign={canReassign}
                        canUpdateStatus={canUpdateStatus}
                        canAddNote={canAddNote}
                        canConvert={canConvert}
                        canCreateFollowUp={canCreateFollowUp}
                        collapsed={false}
                        onToggleCollapsed={() => setMobilePanelOpen(false)}
                      />
                    </div>
                  </aside>
                </>
              ) : null}
            </>
          ) : conversationNotFound ? (
            <ConversationNotFoundState />
          ) : (
            <OmnichannelConversationEmptyState />
          )}
        </section>

        {/* Right — customer intelligence (always visible on desktop) */}
        <section className="hidden h-full min-h-0 min-w-0 shrink-0 overflow-hidden border-l border-border/40 lg:block">
          <WorkspaceRightSidebar
            conversation={liveDetail}
            organizationId={organizationId}
            orgProfiles={orgProfiles}
            canReassign={canReassign}
            canUpdateStatus={canUpdateStatus}
            canAddNote={canAddNote}
            canConvert={canConvert}
            canCreateFollowUp={canCreateFollowUp}
            collapsed={sidebarCollapsed}
            onToggleCollapsed={toggleSidebar}
          />
        </section>
      </div>
      </InboxComposerProvider>
    </div>
  );
}
