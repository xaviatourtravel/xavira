import {
  OmnichannelConversationDetailPanel,
  OmnichannelConversationEmptyState,
} from "@/components/omnichannel-inbox/conversation-detail";
import { OmnichannelConversationList } from "@/components/omnichannel-inbox/conversation-list";
import { buildOmnichannelFilterCounts } from "@/components/omnichannel-inbox/inbox-display";
import { OmnichannelInboxFilters } from "@/components/omnichannel-inbox/inbox-filters";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import type {
  OmnichannelConversationListItem,
  OmnichannelInboxFilter,
} from "@/lib/omnichannel-inbox/queries";
import { CheckCircle2, MessageCircle, Send } from "lucide-react";

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
  isUnassignedForAgent?: boolean;
  initialError?: string | null;
  initialSuccess?: string | null;
};

function InboxStatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "info" | "neutral";
}) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
    neutral: "border-amber-200 bg-amber-50 text-amber-900",
  } as const;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${styles[tone]}`}
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function OmnichannelConversationNotFoundState() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-muted/10 px-8 text-center">
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
  isUnassignedForAgent = false,
  initialError = null,
  initialSuccess = null,
}: OmnichannelInboxViewProps) {
  const filterCounts = buildOmnichannelFilterCounts(allConversations, currentUserId);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Omnichannel Inbox
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Manage Instagram and Facebook customer conversations from one dashboard.
          </p>
          <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
            This inbox receives messages through Meta webhooks and replies are sent
            manually by authorized team members.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <InboxStatusBadge label="Instagram Connected" tone="success" />
          <InboxStatusBadge label="Facebook Messenger Ready" tone="info" />
          <InboxStatusBadge label="Manual Reply Mode" tone="neutral" />
        </div>
      </div>

      {initialError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(initialError)}
        </div>
      ) : null}

      {initialSuccess ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {decodeURIComponent(initialSuccess)}
        </div>
      ) : null}

      <div className="grid h-[calc(100vh-11rem)] min-h-[680px] overflow-hidden rounded-2xl border bg-card shadow-sm lg:grid-cols-[248px_minmax(300px,360px)_minmax(0,1fr)]">
        <aside className="hidden min-h-0 border-r bg-muted/20 p-4 lg:block">
          <OmnichannelInboxFilters
            activeFilter={activeFilter}
            selectedConversationId={selectedConversationId}
            filterCounts={filterCounts}
          />
        </aside>

        <section className="flex min-h-0 flex-col border-r bg-background">
          <div className="border-b bg-muted/10 px-4 py-3 lg:hidden">
            <OmnichannelInboxFilters
              activeFilter={activeFilter}
              selectedConversationId={selectedConversationId}
              filterCounts={filterCounts}
            />
          </div>
          <div className="flex items-center justify-between border-b px-4 py-3.5">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Conversations</p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {conversations.length}
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <OmnichannelConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              activeFilter={activeFilter}
            />
          </div>
        </section>

        <section className="h-full min-h-0 bg-background">
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

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Send className="h-3.5 w-3.5" />
        <span>
          Customer support workflow for Instagram and Facebook Messenger — receive,
          review, assign, and reply from Desklabs.
        </span>
      </div>
    </div>
  );
}
