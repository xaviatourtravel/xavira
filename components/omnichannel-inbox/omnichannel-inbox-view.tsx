import {
  OmnichannelConversationDetailPanel,
  OmnichannelConversationEmptyState,
} from "@/components/omnichannel-inbox/conversation-detail";
import { OmnichannelConversationList } from "@/components/omnichannel-inbox/conversation-list";
import { OmnichannelInboxFilters } from "@/components/omnichannel-inbox/inbox-filters";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import type {
  OmnichannelConversationListItem,
  OmnichannelInboxFilter,
} from "@/lib/omnichannel-inbox/queries";

type OrgProfile = {
  id: string;
  full_name: string;
};

type OmnichannelInboxViewProps = {
  conversations: OmnichannelConversationListItem[];
  detail: OmnichannelConversationDetail | null;
  activeFilter: OmnichannelInboxFilter;
  selectedConversationId: string | null;
  conversationNotFound?: boolean;
  orgProfiles: OrgProfile[];
  canReassign: boolean;
  canUpdateStatus: boolean;
  canAddNote: boolean;
  canReply: boolean;
  isUnassignedForAgent?: boolean;
  initialError?: string | null;
  initialSuccess?: string | null;
};

function OmnichannelConversationNotFoundState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <p className="text-base font-medium">Conversation not found</p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This conversation may have been removed or you do not have access to it.
      </p>
    </div>
  );
}

export function OmnichannelInboxView({
  conversations,
  detail,
  activeFilter,
  selectedConversationId,
  conversationNotFound = false,
  orgProfiles,
  canReassign,
  canUpdateStatus,
  canAddNote,
  canReply,
  isUnassignedForAgent = false,
  initialError = null,
  initialSuccess = null,
}: OmnichannelInboxViewProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <p className="text-sm text-muted-foreground">
          Instagram DM and Facebook Messenger conversations in one place.
        </p>
      </div>

      {initialError ? (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(initialError)}
        </div>
      ) : null}

      {initialSuccess ? (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {decodeURIComponent(initialSuccess)}
        </div>
      ) : null}

      <div className="grid h-[calc(100vh-12rem)] min-h-[640px] overflow-hidden rounded-xl border bg-background lg:grid-cols-[220px_minmax(280px,360px)_minmax(0,1fr)]">
        <aside className="hidden border-r p-3 lg:block">
          <OmnichannelInboxFilters
            activeFilter={activeFilter}
            selectedConversationId={selectedConversationId}
          />
        </aside>

        <section className="flex min-h-0 flex-col border-r">
          <div className="border-b px-4 py-3 lg:hidden">
            <OmnichannelInboxFilters
              activeFilter={activeFilter}
              selectedConversationId={selectedConversationId}
            />
          </div>
          <div className="border-b px-4 py-3">
            <p className="text-sm font-medium">
              Conversations
              <span className="ml-2 text-muted-foreground">
                ({conversations.length})
              </span>
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <OmnichannelConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              activeFilter={activeFilter}
            />
          </div>
        </section>

        <section className="min-h-0">
          {detail ? (
            <OmnichannelConversationDetailPanel
              conversation={detail}
              orgProfiles={orgProfiles}
              canReassign={canReassign}
              canUpdateStatus={canUpdateStatus}
              canAddNote={canAddNote}
              canReply={canReply}
              isUnassignedForAgent={isUnassignedForAgent}
            />
          ) : conversationNotFound ? (
            <OmnichannelConversationNotFoundState />
          ) : (
            <OmnichannelConversationEmptyState />
          )}
        </section>
      </div>
    </div>
  );
}
