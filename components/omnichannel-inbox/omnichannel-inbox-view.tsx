"use client";

import { useMemo, useState } from "react";

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
import { InboxLeadPanel } from "@/components/omnichannel-inbox/inbox-lead-panel";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import type {
  OmnichannelConversationListItem,
  OmnichannelInboxFilter,
} from "@/lib/omnichannel-inbox/queries";
import { cn } from "@/lib/utils";

const LEAD_PANEL_WIDTH = "280px";

type OrgProfile = {
  id: string;
  full_name: string;
};

type OmnichannelInboxViewProps = {
  conversations: OmnichannelConversationListItem[];
  allConversations: OmnichannelConversationListItem[];
  detail: OmnichannelConversationDetail | null;
  activeFilter: OmnichannelInboxFilter;
  selectedConversationId: string | null;
  conversationNotFound?: boolean;
  currentUserId: string;
  orgProfiles: OrgProfile[];
  canReassign: boolean;
  canUpdateStatus: boolean;
  canAddNote: boolean;
  canReply: boolean;
  canSuggestReply: boolean;
  canConvert: boolean;
  canCreateFollowUp: boolean;
  readOnly?: boolean;
  isUnassignedForAgent?: boolean;
  initialError?: string | null;
  initialSuccess?: string | null;
};

function OmnichannelConversationNotFoundState() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#f4f6f8] px-8 text-center dark:bg-muted/10">
      <p className="text-base font-semibold text-foreground">Conversation not found</p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This conversation may have been removed or is not available to your account.
      </p>
    </div>
  );
}

export function OmnichannelInboxView({
  conversations,
  allConversations,
  detail,
  activeFilter,
  selectedConversationId,
  conversationNotFound = false,
  currentUserId,
  orgProfiles,
  canReassign,
  canUpdateStatus,
  canAddNote,
  canReply,
  canSuggestReply,
  canConvert,
  canCreateFollowUp,
  readOnly = false,
  isUnassignedForAgent = false,
  initialError = null,
  initialSuccess = null,
}: OmnichannelInboxViewProps) {
  const [leadPanelOpen, setLeadPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const filterCounts = buildOmnichannelFilterCounts(allConversations, currentUserId);
  const filteredConversations = useMemo(
    () => filterConversationsBySearch(conversations, searchQuery),
    [conversations, searchQuery],
  );

  const inboxListHref = useMemo(() => {
    const params = new URLSearchParams();
    if (activeFilter !== "all") {
      params.set("filter", activeFilter);
    }
    const query = params.toString();
    return query ? `/inbox?${query}` : "/inbox";
  }, [activeFilter]);

  const showMobileChat = Boolean(selectedConversationId);

  function toggleLeadPanel() {
    setLeadPanelOpen((open) => !open);
  }

  return (
    <div className="flex h-[calc(100dvh-6.5rem)] min-h-[420px] flex-col gap-2 lg:h-[calc(100vh-3.75rem)] lg:min-h-[760px]">
      {initialError ? (
        <div className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {decodeURIComponent(initialError)}
        </div>
      ) : null}

      {initialSuccess ? (
        <div className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {decodeURIComponent(initialSuccess)}
        </div>
      ) : null}

      <div
        className={cn(
          "grid min-h-0 flex-1 overflow-hidden rounded-2xl border bg-card shadow-sm",
          leadPanelOpen
            ? "lg:grid-cols-[320px_minmax(0,1fr)_var(--inbox-lead-panel-width)]"
            : "lg:grid-cols-[320px_minmax(0,1fr)]",
        )}
        style={{ ["--inbox-lead-panel-width" as string]: LEAD_PANEL_WIDTH }}
      >
        <section
          className={cn(
            "flex min-h-0 flex-col border-r bg-background",
            showMobileChat ? "hidden lg:flex" : "flex",
          )}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Conversations</p>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {filteredConversations.length}
            </span>
          </div>

          <div className="mt-4 px-4">
            <InboxConversationSearch value={searchQuery} onChange={setSearchQuery} />
          </div>

          <div className="mt-3 px-4">
            <OmnichannelInboxFilters
              activeFilter={activeFilter}
              selectedConversationId={selectedConversationId}
              filterCounts={filterCounts}
            />
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto border-t border-border/50">
            <OmnichannelConversationList
              conversations={filteredConversations}
              selectedConversationId={selectedConversationId}
              activeFilter={activeFilter}
              searchQuery={searchQuery}
            />
          </div>
        </section>

        <section
          className={cn(
            "relative min-h-0 bg-background",
            showMobileChat ? "flex flex-col" : "hidden lg:block",
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
                leadPanelOpen={leadPanelOpen}
                onToggleLeadPanel={toggleLeadPanel}
                showDetailsToggle={!readOnly}
                backHref={inboxListHref}
                showBackButton
              />
              {!readOnly && leadPanelOpen ? (
                <>
                  <button
                    type="button"
                    aria-label="Close lead details"
                    className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                    onClick={() => setLeadPanelOpen(false)}
                  />
                  <aside className="fixed inset-x-0 bottom-0 z-40 flex max-h-[85vh] flex-col rounded-t-2xl border-t bg-background shadow-2xl lg:hidden">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                      <p className="text-sm font-semibold">Lead details</p>
                      <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-muted"
                        onClick={() => setLeadPanelOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <InboxLeadPanel
                        conversation={detail}
                        orgProfiles={orgProfiles}
                        canConvert={canConvert}
                        canCreateFollowUp={canCreateFollowUp}
                        canReassign={canReassign}
                        canUpdateStatus={canUpdateStatus}
                        canAddNote={canAddNote}
                      />
                    </div>
                  </aside>
                </>
              ) : null}
            </>
          ) : conversationNotFound ? (
            <OmnichannelConversationNotFoundState />
          ) : (
            <OmnichannelConversationEmptyState />
          )}
        </section>

        {leadPanelOpen ? (
          <section className="hidden min-h-0 border-l bg-background lg:block">
            <InboxLeadPanel
              conversation={detail}
              orgProfiles={orgProfiles}
              canConvert={canConvert}
              canCreateFollowUp={canCreateFollowUp}
              canReassign={canReassign}
              canUpdateStatus={canUpdateStatus}
              canAddNote={canAddNote}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}
