"use client";

import { useEffect, useMemo, useState } from "react";

import { WorkspaceRightSidebar } from "@/components/communication-workspace/workspace-right-sidebar";
import {
  OmnichannelConversationDetailPanel,
  OmnichannelConversationEmptyState,
} from "@/components/omnichannel-inbox/conversation-detail";
import { OmnichannelConversationList } from "@/components/omnichannel-inbox/conversation-list";
import { InboxConversationSearch } from "@/components/omnichannel-inbox/inbox-conversation-search";
import {
  buildOmnichannelFilterCounts,
  filterConversationsBySearch,
} from "@/components/omnichannel-inbox/inbox-display";
import { OmnichannelInboxFilters } from "@/components/omnichannel-inbox/inbox-filters";
import {
  WORKSPACE_LIST_WIDTH,
  WORKSPACE_SIDEBAR_WIDTH,
} from "@/lib/communication-workspace/types";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import type {
  OmnichannelConversationListItem,
  OmnichannelInboxFilter,
} from "@/lib/omnichannel-inbox/queries";
import { cn } from "@/lib/utils";

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

function ConversationNotFoundState() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-neutral-50/50 px-8 text-center dark:bg-neutral-950/20">
      <p className="text-sm font-medium text-foreground">Conversation not found</p>
      <p className="mt-2 max-w-sm text-xs text-muted-foreground">
        This thread may have been removed or is not available to your account.
      </p>
    </div>
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const filterCounts = buildOmnichannelFilterCounts(allConversations, currentUserId);
  const filteredConversations = useMemo(
    () => filterConversationsBySearch(conversations, searchQuery),
    [conversations, searchQuery],
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

  return (
    <div className="flex h-[calc(100dvh-6.5rem)] min-h-[420px] flex-col gap-2 lg:h-[calc(100vh-3.75rem)] lg:min-h-[760px]">
      {initialError ? (
        <div className="shrink-0 rounded-lg border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-600">
          {decodeURIComponent(initialError)}
        </div>
      ) : null}

      {initialSuccess ? (
        <div className="shrink-0 rounded-lg border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {decodeURIComponent(initialSuccess)}
        </div>
      ) : null}

      <div
        className="grid min-h-0 flex-1 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:grid-cols-[var(--workspace-list-width)_minmax(0,1fr)_var(--workspace-sidebar-width)] dark:border-neutral-800 dark:bg-neutral-950"
        style={{
          ["--workspace-list-width" as string]: WORKSPACE_LIST_WIDTH,
          ["--workspace-sidebar-width" as string]: sidebarCollapsed
            ? "48px"
            : WORKSPACE_SIDEBAR_WIDTH,
        }}
      >
        {/* Left — conversation list */}
        <section
          className={cn(
            "flex min-h-0 flex-col border-r border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-950",
            showMobileThread ? "hidden lg:flex" : "flex",
          )}
        >
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-semibold tracking-tight text-foreground">
                Conversations
              </p>
              <p className="text-[11px] text-muted-foreground">
                All channels · one workspace
              </p>
            </div>
            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
              {filteredConversations.length}
            </span>
          </div>

          <div className="px-4">
            <InboxConversationSearch value={searchQuery} onChange={setSearchQuery} />
          </div>

          <div className="mt-3 px-4">
            <OmnichannelInboxFilters
              activeFilter={activeFilter}
              selectedConversationId={selectedConversationId}
              filterCounts={filterCounts}
            />
          </div>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto border-t border-neutral-100 dark:border-neutral-800">
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
            "relative min-h-0 bg-white dark:bg-neutral-950",
            showMobileThread ? "flex flex-col" : "hidden lg:flex lg:flex-col",
          )}
        >
          {detail ? (
            <>
              <OmnichannelConversationDetailPanel
                conversation={detail}
                canReply={canReply}
                canSuggestReply={canSuggestReply}
                isUnassignedForAgent={isUnassignedForAgent}
                readOnly={readOnly}
                channel={detail.channel}
                mobilePanelOpen={mobilePanelOpen}
                onToggleMobilePanel={() => setMobilePanelOpen((open) => !open)}
                backHref={listHref}
                showBackButton
              />
              {mobilePanelOpen ? (
                <>
                  <button
                    type="button"
                    aria-label="Close customer intelligence"
                    className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] lg:hidden"
                    onClick={() => setMobilePanelOpen(false)}
                  />
                  <aside className="fixed inset-x-0 bottom-0 z-40 flex max-h-[90vh] flex-col rounded-t-2xl border-t border-neutral-200/80 bg-white shadow-2xl lg:hidden dark:border-neutral-800 dark:bg-neutral-950">
                    <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-neutral-200" />
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <WorkspaceRightSidebar
                        conversation={detail}
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
        <section className="hidden min-h-0 border-l border-neutral-200/80 lg:block dark:border-neutral-800">
          <WorkspaceRightSidebar
            conversation={detail}
            organizationId={organizationId}
            orgProfiles={orgProfiles}
            canReassign={canReassign}
            canUpdateStatus={canUpdateStatus}
            canAddNote={canAddNote}
            canConvert={canConvert}
            canCreateFollowUp={canCreateFollowUp}
            collapsed={sidebarCollapsed}
            onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
          />
        </section>
      </div>
    </div>
  );
}
