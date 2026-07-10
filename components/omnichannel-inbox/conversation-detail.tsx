"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  CalendarPlus,
  ChevronLeft,
  Download,
  Info,
  MailOpen,
  MessageSquareText,
  MoreVertical,
  PanelRightOpen,
  RefreshCw,
  Search,
  UserCog,
  UserRoundPlus,
  X,
} from "lucide-react";

import {
  convertOmnichannelConversationToLead,
  markOmnichannelConversationAsRead,
} from "@/app/(dashboard)/inbox/omnichannel-actions";
import {
  convertWhatsappConversationToLead,
  markWhatsappConversationAsRead,
  retryWhatsappConversationReplyAction,
} from "@/app/(dashboard)/inbox/whatsapp-actions";
import { buildRuleBasedIntelligence } from "@/lib/communication/intelligence/rule-based-intelligence";
import { getFirstUnreadMessageId } from "@/lib/communication/message-thread";
import { ConversationAiModeToggle } from "@/components/omnichannel-inbox/conversation-ai-mode-toggle";
import { CustomerAvatar } from "@/components/omnichannel-inbox/customer-avatar";
import { ClientOnlyActiveLabel } from "@/components/omnichannel-inbox/client-only-relative-time";
import { OmnichannelConversationReplyBox } from "@/components/omnichannel-inbox/conversation-reply-box";
import {
  formatInboxMessageTime,
  getConversationDisplayName,
} from "@/components/omnichannel-inbox/inbox-display";
import { formatTranslation } from "@/lib/i18n/dictionary";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { isQualificationHandoffReason } from "@/modules/ai/types/lead-qualification";
import {
  isWhatsappAiAutoReplyEnabled,
  resolveWhatsappAiState,
} from "@/lib/whatsapp-inbox/ai/constants";
import { ConversationMessageLane } from "@/components/omnichannel-inbox/conversation-message-lane";
import { ConversationMessageThread } from "@/components/omnichannel-inbox/conversation-message-thread";
import { InboxEmptyState } from "@/components/omnichannel-inbox/inbox-empty-state";
import { buttonVariants } from "@/components/ui/button";
import { useWhatsappConversationMessages } from "@/lib/communication/realtime";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import type { OmnichannelChannel } from "@/types/omnichannel-inbox";
import type { MessageRow } from "@/types/omnichannel-inbox";
import { cn } from "@/lib/utils";
import {
  AURORA_CONVERSATION_HEADER_CHANNEL,
  AURORA_CONVERSATION_HEADER_HEIGHT,
  AURORA_CONVERSATION_HEADER_NAME,
  AURORA_CONVERSATION_HEADER_SECONDARY_META,
} from "@/components/workspace/aurora-tokens";
import { getConversationLaneClassName } from "@/lib/communication-workspace/conversation-lane";
import { useInboxWorkspaceLayout } from "@/modules/inbox/context/inbox-workspace-layout-context";
import { logInboxError } from "@/modules/inbox/lib/resolve-inbox-error";

type OmnichannelConversationDetailPanelProps = {
  conversation: OmnichannelConversationDetail;
  canReply: boolean;
  canSuggestReply?: boolean;
  canManageAi?: boolean;
  isUnassignedForAgent?: boolean;
  readOnly?: boolean;
  channel?: OmnichannelChannel;
  backHref?: string;
  showBackButton?: boolean;
};

const NEAR_BOTTOM_THRESHOLD_PX = 140;

function ConversationHeaderIconButton({
  label,
  onClick,
  active = false,
  children,
  className,
  ariaExpanded,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
  className?: string;
  ariaExpanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-expanded={ariaExpanded}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground/75 transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
        active && "bg-muted/35 text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

function ConversationHeaderMeta({
  channelLabel,
  statusLabel,
  lastMessageAt,
}: {
  channelLabel: string;
  statusLabel: string | null;
  lastMessageAt: string | null;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className={AURORA_CONVERSATION_HEADER_CHANNEL}>{channelLabel}</p>
      <p className={AURORA_CONVERSATION_HEADER_SECONDARY_META}>
        {statusLabel ? (
          statusLabel
        ) : (
          <ClientOnlyActiveLabel
            date={lastMessageAt}
            className="inline min-w-0 tabular-nums"
          />
        )}
      </p>
    </div>
  );
}

function ConversationMenuItem({
  icon,
  label,
  onClick,
  disabled = false,
  destructive = false,
  className,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-muted/60 disabled:opacity-50",
        destructive ? "text-red-600" : "text-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center",
          destructive ? "text-red-500" : "text-muted-foreground",
        )}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}

export function OmnichannelConversationDetailPanel({
  conversation,
  canReply,
  canSuggestReply = false,
  canManageAi: canManageAi = false,
  isUnassignedForAgent = false,
  readOnly = false,
  channel,
  backHref = "/inbox",
  showBackButton = false,
}: OmnichannelConversationDetailPanelProps) {
  const { ti } = useInboxTranslation();
  const { inspectorOpen, openContextSheet } = useInboxWorkspaceLayout();
  const isWhatsapp = (channel ?? conversation.channel) === "whatsapp";
  const showComposer = !readOnly || isWhatsapp;

  // Pesan WhatsApp dikelola realtime (lihat hook). Kanal lain memakai pesan dari
  // server + satu pesan optimistik sederhana.
  const {
    messages: liveMessages,
    addOptimisticMessage,
    removeOptimisticMessage,
  } = useWhatsappConversationMessages({
    conversationId: conversation.id,
    enabled: isWhatsapp,
    initialMessages: conversation.messages,
  });

  const [optimisticMessageText, setOptimisticMessageText] = useState<
    string | null
  >(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const markedReadRef = useRef<string | null>(null);
  const initialUnreadRef = useRef<{
    conversationId: string;
    firstUnreadMessageId: string | null;
  }>({
    conversationId: "",
    firstUnreadMessageId: null,
  });
  const prevCountRef = useRef(0);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const displayMessages: MessageRow[] = useMemo(() => {
    if (isWhatsapp) {
      return liveMessages;
    }

    if (optimisticMessageText) {
      return [
        ...conversation.messages,
        {
          id: "optimistic-outgoing",
          conversation_id: conversation.id,
          direction: "outgoing" as const,
          external_message_id: null,
          message_text: optimisticMessageText,
          attachments_json: [],
          sent_by_user_id: null,
          created_at: new Date().toISOString(),
          deliveryStatus: "pending" as const,
        },
      ];
    }

    return conversation.messages;
  }, [
    isWhatsapp,
    liveMessages,
    optimisticMessageText,
    conversation.messages,
    conversation.id,
  ]);

  const displayName = getConversationDisplayName(conversation);
  const headerStatusLabel =
    conversation.leadContext?.statusLabel ?? conversation.statusLabel ?? null;
  const isWhatsappChannel = (channel ?? conversation.channel) === "whatsapp";
  const showQualificationHandoffStatus =
    isWhatsappChannel &&
    resolveWhatsappAiState(conversation.aiState) === "READY_FOR_HUMAN" &&
    isQualificationHandoffReason(conversation.aiHandoffReason) &&
    Boolean(conversation.leadQualification);

  if (initialUnreadRef.current.conversationId !== conversation.id) {
    initialUnreadRef.current = {
      conversationId: conversation.id,
      firstUnreadMessageId: getFirstUnreadMessageId(
        conversation.messages,
        conversation.unreadCount,
      ),
    };
  }

  const firstUnreadMessageId = initialUnreadRef.current.firstUnreadMessageId;

  const showAiThinking = useMemo(() => {
    if (
      !isWhatsapp ||
      !isWhatsappAiAutoReplyEnabled(resolveWhatsappAiState(conversation.aiState))
    ) {
      return false;
    }

    const lastMessage = displayMessages[displayMessages.length - 1];
    if (!lastMessage || lastMessage.direction !== "incoming") {
      return false;
    }

    return !displayMessages.some(
      (message) =>
        message.direction === "outgoing" &&
        (message.deliveryStatus === "pending" ||
          message.id === "optimistic-outgoing" ||
          message.id.startsWith("temp-")),
    );
  }, [conversation.aiState, displayMessages, isWhatsapp]);

  const lastCustomerMessage = useMemo(() => {
    for (let index = displayMessages.length - 1; index >= 0; index -= 1) {
      const message = displayMessages[index];
      if (message.direction === "incoming" && message.message_text?.trim()) {
        return message.message_text.trim();
      }
    }
    return null;
  }, [displayMessages]);

  const router = useRouter();
  const [isActionPending, startActionTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setMessageSearch("");
  }, [conversation.id]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timeout = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  // Intelijen percakapan berbasis aturan dari riwayat pesan nyata (real-time).
  const intelligence = useMemo(
    () =>
      buildRuleBasedIntelligence(
        {
          displayName,
          channelLabel: conversation.channelLabel,
          statusLabel: conversation.statusLabel,
          unreadCount: conversation.unreadCount,
          leadId: conversation.leadId,
        },
        displayMessages,
      ),
    [
      displayMessages,
      displayName,
      conversation.channelLabel,
      conversation.statusLabel,
      conversation.unreadCount,
      conversation.leadId,
    ],
  );

  const aiSummary = intelligence.summary;
  const suggestedReply = intelligence.suggestedReply;

  // Pencarian dalam percakapan (inline, seperti WhatsApp Desktop).
  const normalizedSearch = messageSearch.trim().toLowerCase();
  const visibleMessages = useMemo(() => {
    if (!searchOpen || !normalizedSearch) {
      return displayMessages;
    }
    return displayMessages.filter((message) =>
      message.message_text?.toLowerCase().includes(normalizedSearch),
    );
  }, [searchOpen, normalizedSearch, displayMessages]);

  function handleConvertToLead() {
    setMenuOpen(false);
    startActionTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", conversation.id);
      const result = isWhatsapp
        ? await convertWhatsappConversationToLead(
            (() => {
              formData.set("full_name", displayName);
              formData.set(
                "whatsapp_number",
                conversation.externalUserId ?? "",
              );
              return formData;
            })(),
          )
        : await convertOmnichannelConversationToLead(formData);
      setNotice(
        result.success
          ? ti("convertToLeadSuccess")
          : ti("convertToLeadFailed"),
      );
      if (!result.success) {
        logInboxError("convertToLead", result.message);
      }
      if (result.success) {
        router.refresh();
      }
    });
  }

  function handleExportChat() {
    setMenuOpen(false);
    const lines = displayMessages.map((message) => {
      const who = message.direction === "incoming" ? displayName : ti("agentLabel");
      const time = formatInboxMessageTime(message.created_at);
      return `[${time}] ${who}: ${message.message_text ?? ""}`;
    });
    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `chat-${displayName}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(ti("exportChatSuccess"));
  }

  function handleMarkUnread() {
    setMenuOpen(false);
    setNotice(ti("markUnreadSoon"));
  }

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior });
    });
    setNewMessageCount(0);
  }, []);

  // Saat berganti percakapan, lompat ke bawah tanpa animasi.
  useEffect(() => {
    prevCountRef.current = displayMessages.length;
    setNewMessageCount(0);
    const container = scrollContainerRef.current;
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTo({ top: container.scrollHeight });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  // Auto scroll cerdas: ikuti jika sudah di dekat bawah atau pesan kita sendiri,
  // selain itu tampilkan lencana "pesan baru".
  useEffect(() => {
    const previous = prevCountRef.current;
    prevCountRef.current = displayMessages.length;

    if (displayMessages.length <= previous) {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom < NEAR_BOTTOM_THRESHOLD_PX;
    const last = displayMessages[displayMessages.length - 1];
    const isOwnOutgoing = Boolean(last && last.direction === "outgoing");

    if (nearBottom || isOwnOutgoing) {
      scrollToBottom("smooth");
    } else {
      setNewMessageCount((count) => count + (displayMessages.length - previous));
    }
  }, [displayMessages, scrollToBottom]);

  function handleScroll() {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < NEAR_BOTTOM_THRESHOLD_PX && newMessageCount > 0) {
      setNewMessageCount(0);
    }
  }

  useEffect(() => {
    if (conversation.unreadCount <= 0) {
      return;
    }

    if (markedReadRef.current === conversation.id) {
      return;
    }

    markedReadRef.current = conversation.id;
    if (readOnly || conversation.channel === "whatsapp") {
      void markWhatsappConversationAsRead(conversation.id);
      return;
    }

    void markOmnichannelConversationAsRead(conversation.id);
  }, [conversation.channel, conversation.id, conversation.unreadCount, readOnly]);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border/15 bg-background">
        <div
          className={getConversationLaneClassName(
            inspectorOpen,
            cn("flex items-center gap-3", AURORA_CONVERSATION_HEADER_HEIGHT),
          )}
        >
          {showBackButton ? (
            <Link
              href={backHref}
              aria-label={ti("backToConversations")}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-8 w-8 shrink-0 rounded-full p-0 lg:hidden",
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          ) : null}

          <CustomerAvatar
            displayName={displayName}
            avatarUrl={conversation.customerAvatar}
            size="sm"
            className="h-10 w-10 shrink-0"
            channel={
              conversation.channel === "whatsapp"
                ? "whatsapp"
                : conversation.channel === "instagram"
                  ? "instagram"
                  : conversation.channel === "facebook"
                    ? "facebook"
                    : "default"
            }
          />

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <h2
              className={AURORA_CONVERSATION_HEADER_NAME}
              title={displayName}
            >
              {displayName}
            </h2>
            <ConversationHeaderMeta
              channelLabel={conversation.channelLabel}
              statusLabel={headerStatusLabel}
              lastMessageAt={conversation.lastMessageAt}
            />
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {isWhatsappChannel ? (
              <ConversationAiModeToggle
                conversationId={conversation.id}
                aiState={conversation.aiState}
                canManage={canManageAi}
              />
            ) : null}

            <ConversationHeaderIconButton
              label={ti("expandPanel")}
              onClick={() => openContextSheet("copilot")}
              className="lg:hidden"
            >
              <PanelRightOpen className="h-4 w-4" />
            </ConversationHeaderIconButton>

            <ConversationHeaderIconButton
              label={ti("searchInConversation")}
              active={searchOpen}
              onClick={() => {
                setSearchOpen((value) => !value);
                setMenuOpen(false);
              }}
            >
              <Search className="h-4 w-4" />
            </ConversationHeaderIconButton>

            <div ref={menuRef} className="relative shrink-0">
              <ConversationHeaderIconButton
                label={ti("conversationMenu")}
                active={menuOpen}
                ariaExpanded={menuOpen}
                onClick={() => setMenuOpen((value) => !value)}
              >
                <MoreVertical className="h-4 w-4" />
              </ConversationHeaderIconButton>
              {menuOpen ? (
                <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-56 overflow-hidden rounded-xl border border-border/30 bg-background py-1">
                  <ConversationMenuItem
                    icon={<RefreshCw className="h-4 w-4" />}
                    label={ti("reloadConversation")}
                    onClick={() => {
                      setMenuOpen(false);
                      router.refresh();
                    }}
                  />
                  <ConversationMenuItem
                    icon={<MailOpen className="h-4 w-4" />}
                    label={ti("markUnread")}
                    onClick={handleMarkUnread}
                  />
                  <ConversationMenuItem
                    icon={<Download className="h-4 w-4" />}
                    label={ti("exportChat")}
                    onClick={handleExportChat}
                  />
                  <div className="my-1 h-px bg-border/40" />
                  <ConversationMenuItem
                    icon={<UserRoundPlus className="h-4 w-4" />}
                    label={ti("convertToLead")}
                    onClick={handleConvertToLead}
                    disabled={isActionPending}
                  />
                  <ConversationMenuItem
                    icon={<CalendarPlus className="h-4 w-4" />}
                    label={ti("createBooking")}
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/bookings/new");
                    }}
                  />
                  <ConversationMenuItem
                    icon={<UserCog className="h-4 w-4" />}
                    label={ti("assignConversation")}
                    onClick={() => {
                      setMenuOpen(false);
                      openContextSheet("customer360");
                      setNotice(ti("assignConversationHint"));
                    }}
                  />
                  <ConversationMenuItem
                    icon={<Info className="h-4 w-4" />}
                    label={ti("viewDetails")}
                    onClick={() => {
                      setMenuOpen(false);
                      openContextSheet("copilot");
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {showQualificationHandoffStatus ? (
        <p
          className={getConversationLaneClassName(
            inspectorOpen,
            "shrink-0 pb-1.5 text-[10px] text-muted-foreground/70",
          )}
        >
          {ti("chatHandoffStatusLine")}
        </p>
      ) : null}

      {searchOpen ? (
        <div
          className={getConversationLaneClassName(
            inspectorOpen,
            "flex h-9 shrink-0 items-center gap-2 border-b border-border/20 bg-background",
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={messageSearch}
            onChange={(event) => setMessageSearch(event.target.value)}
            placeholder={ti("searchInConversationPlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {normalizedSearch ? (
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {formatTranslation(ti("searchResultsCount"), {
                count: String(visibleMessages.length),
              })}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setSearchOpen(false);
              setMessageSearch("");
            }}
            aria-label={ti("closeSearch")}
            className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {notice ? (
        <div className="pointer-events-none absolute left-1/2 top-16 z-30 -translate-x-1/2">
          <div className="pointer-events-auto rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-lg animate-in fade-in slide-in-from-top-1">
            {notice}
          </div>
        </div>
      ) : null}

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto bg-background"
      >
        <div className="py-5 pt-4 pb-5">
          <ConversationMessageLane>
          {displayMessages.length === 0 ? (
            <InboxEmptyState
              icon={MessageSquareText}
              title={ti("noMessagesYet")}
              description={
                isWhatsapp ? ti("noMessagesWhatsappDesc") : ti("noMessagesChannelDesc")
              }
              hint={ti("emptyThreadHint")}
              variant="inline"
            />
          ) : searchOpen && normalizedSearch && visibleMessages.length === 0 ? (
            <InboxEmptyState
              icon={Search}
              title={ti("noSearchResults")}
              description={ti("noSearchResultsDesc")}
              variant="inline"
            />
          ) : (
            <ConversationMessageThread
              messages={visibleMessages}
              customerDisplayName={displayName}
              customerAvatarUrl={conversation.customerAvatar}
              firstUnreadMessageId={firstUnreadMessageId}
              showAiThinking={showAiThinking}
              onRetryMessage={
                isWhatsapp
                  ? async (messageId) => {
                      const formData = new FormData();
                      formData.set("message_id", messageId);
                      await retryWhatsappConversationReplyAction(formData);
                    }
                  : undefined
              }
            />
          )}
          </ConversationMessageLane>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {newMessageCount > 0 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center">
          <button
            type="button"
            onClick={() => scrollToBottom("smooth")}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-lg animate-in fade-in slide-in-from-bottom-2"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            {newMessageCount === 1
              ? ti("newMessageOne")
              : formatTranslation(ti("newMessagesMany"), {
                  count: String(newMessageCount),
                })}
          </button>
        </div>
      ) : null}

      {showComposer ? (
        <div className="shrink-0">
          <OmnichannelConversationReplyBox
            conversationId={conversation.id}
            channel={conversation.channel}
            canReply={canReply}
            canSuggestReply={canSuggestReply && !isWhatsapp}
            isUnassignedForAgent={isUnassignedForAgent}
            lastCustomerMessage={lastCustomerMessage}
            suggestedReply={suggestedReply}
            aiSummary={aiSummary}
            onOptimisticMessage={setOptimisticMessageText}
            onAddOptimistic={addOptimisticMessage}
            onRemoveOptimistic={removeOptimisticMessage}
          />
        </div>
      ) : null}
    </div>
  );
}

export function OmnichannelConversationEmptyState() {
  const { ti } = useInboxTranslation();

  return (
    <InboxEmptyState
      icon={MessageSquareText}
      title={ti("selectConversationEmpty")}
      description={ti("selectConversationEmptyDesc")}
      hint={ti("selectConversationEmptyHint")}
      variant="workspace"
      className="h-full min-h-[320px] bg-background"
    />
  );
}
