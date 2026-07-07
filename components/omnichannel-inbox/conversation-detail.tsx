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
  Pin,
  RefreshCw,
  Search,
  Trash2,
  UserCog,
  UserRoundPlus,
  VolumeX,
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
import { CustomerAvatar } from "@/components/omnichannel-inbox/customer-avatar";
import { OmnichannelChannelBadge } from "@/components/omnichannel-inbox/channel-badge";
import { WhatsappAiStateControl } from "@/components/omnichannel-inbox/whatsapp-ai-state-control";
import { WhatsappLeadProgressBadge } from "@/components/omnichannel-inbox/whatsapp-lead-progress-badge";
import { WhatsappQualificationHandoffPanel } from "@/components/omnichannel-inbox/whatsapp-qualification-handoff-panel";
import { OmnichannelConversationReplyBox } from "@/components/omnichannel-inbox/conversation-reply-box";
import { ClientOnlyActiveLabel } from "@/components/omnichannel-inbox/client-only-relative-time";
import {
  formatInboxMessageTime,
  getConversationDisplayName,
} from "@/components/omnichannel-inbox/inbox-display";
import { formatTranslation } from "@/lib/i18n/dictionary";
import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { WhatsappMessageBubble } from "@/components/omnichannel-inbox/whatsapp-message-bubble";
import { buttonVariants } from "@/components/ui/button";
import {
  isOptimisticId,
  useWhatsappConversationMessages,
} from "@/lib/communication/realtime";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import type { OmnichannelChannel } from "@/types/omnichannel-inbox";
import type { MessageRow } from "@/types/omnichannel-inbox";
import { cn } from "@/lib/utils";

type OmnichannelConversationDetailPanelProps = {
  conversation: OmnichannelConversationDetail;
  canReply: boolean;
  canSuggestReply?: boolean;
  canManageAi?: boolean;
  isUnassignedForAgent?: boolean;
  mobilePanelOpen?: boolean;
  onToggleMobilePanel?: () => void;
  readOnly?: boolean;
  channel?: OmnichannelChannel;
  backHref?: string;
  showBackButton?: boolean;
};

const NEAR_BOTTOM_THRESHOLD_PX = 140;

function getAttachmentLabel(
  message: MessageRow,
  ti: (key: InboxKey) => string,
) {
  const attachments = Array.isArray(message.attachments_json)
    ? message.attachments_json
    : [];

  if (attachments.length === 0) {
    return null;
  }

  return attachments.length === 1
    ? ti("attachmentCountOne")
    : formatTranslation(ti("attachmentCountMany"), {
        count: String(attachments.length),
      });
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
  canManageAi = false,
  isUnassignedForAgent = false,
  onToggleMobilePanel,
  readOnly = false,
  channel,
  backHref = "/inbox",
  showBackButton = false,
}: OmnichannelConversationDetailPanelProps) {
  const { ti } = useInboxTranslation();
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
  const prevCountRef = useRef(0);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const displayName = getConversationDisplayName(conversation);
  const phoneLabel =
    conversation.channel === "whatsapp"
      ? conversation.customerUsername?.trim() ||
        conversation.externalUserId?.trim() ||
        null
      : conversation.customerUsername?.trim()
        ? `@${conversation.customerUsername.trim().replace(/^@/, "")}`
        : null;

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
          : result.message ?? ti("convertToLeadFailed"),
      );
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
      <header className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b border-border/40 bg-background/95 px-3 py-2 backdrop-blur sm:px-4">
        {showBackButton ? (
          <Link
            href={backHref}
            aria-label={ti("backToConversations")}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-11 w-11 shrink-0 rounded-full p-0 lg:hidden",
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        ) : null}

        <CustomerAvatar
          displayName={displayName}
          avatarUrl={conversation.customerAvatar}
          size="sm"
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

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2
              className="truncate text-sm font-medium text-foreground"
              title={displayName}
            >
              {displayName}
            </h2>
            <OmnichannelChannelBadge channel={conversation.channel} />
            {isWhatsapp ? (
              <WhatsappAiStateControl
                conversationId={conversation.id}
                aiState={conversation.aiState}
                aiHandoffReason={conversation.aiHandoffReason}
                canManage={canManageAi}
              />
            ) : null}
            {isWhatsapp ? (
              <WhatsappLeadProgressBadge qualification={conversation.leadQualification} />
            ) : null}
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            {phoneLabel ? `${phoneLabel} · ` : ""}
            <ClientOnlyActiveLabel date={conversation.lastMessageAt} />
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSearchOpen((value) => !value);
            setMenuOpen(false);
          }}
          aria-label={ti("searchInConversation")}
          title={ti("searchInConversation")}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
            searchOpen && "bg-muted text-foreground",
          )}
        >
          <Search className="h-[18px] w-[18px]" />
        </button>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={ti("conversationMenu")}
            title={ti("conversationMenu")}
            aria-expanded={menuOpen}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
              menuOpen && "bg-muted text-foreground",
            )}
          >
            <MoreVertical className="h-[18px] w-[18px]" />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-full z-30 mt-2 w-60 overflow-hidden rounded-lg border border-border/40 bg-background py-1 shadow-md">
              <ConversationMenuItem
                icon={<RefreshCw className="h-4 w-4" />}
                label={ti("reloadConversation")}
                onClick={() => {
                  setMenuOpen(false);
                  router.refresh();
                }}
              />
              <ConversationMenuItem
                icon={<Search className="h-4 w-4" />}
                label={ti("searchInConversation")}
                onClick={() => {
                  setMenuOpen(false);
                  setSearchOpen(true);
                }}
              />
              <ConversationMenuItem
                icon={<MailOpen className="h-4 w-4" />}
                label={ti("markUnread")}
                onClick={handleMarkUnread}
              />
              <ConversationMenuItem
                icon={<Pin className="h-4 w-4" />}
                label={ti("pinConversation")}
                onClick={() => {
                  setMenuOpen(false);
                  setNotice(ti("pinConversationSoon"));
                }}
              />
              <ConversationMenuItem
                icon={<VolumeX className="h-4 w-4" />}
                label={ti("muteConversation")}
                onClick={() => {
                  setMenuOpen(false);
                  setNotice(ti("muteConversationSoon"));
                }}
              />
              <ConversationMenuItem
                icon={<Download className="h-4 w-4" />}
                label={ti("exportChat")}
                onClick={handleExportChat}
              />
              <div className="my-1 h-px bg-border/60" />
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
                  onToggleMobilePanel?.();
                  setNotice(ti("assignConversationHint"));
                }}
              />
              {onToggleMobilePanel ? (
                <ConversationMenuItem
                  icon={<Info className="h-4 w-4" />}
                  label={ti("viewDetails")}
                  className="lg:hidden"
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleMobilePanel();
                  }}
                />
              ) : null}
              <div className="my-1 h-px bg-border/60" />
              <ConversationMenuItem
                icon={<Trash2 className="h-4 w-4" />}
                label={ti("deleteConversation")}
                destructive
                onClick={() => {
                  setMenuOpen(false);
                  setNotice(ti("deleteConversationSoon"));
                }}
              />
            </div>
          ) : null}
        </div>

      </header>

      {isWhatsapp ? (
        <WhatsappQualificationHandoffPanel
          conversationId={conversation.id}
          aiState={conversation.aiState}
          aiHandoffReason={conversation.aiHandoffReason}
          qualification={conversation.leadQualification}
          canManage={canManageAi}
        />
      ) : null}

      {searchOpen ? (
        <div className="flex shrink-0 items-center gap-2 border-b border-border/40 bg-background px-3 py-2 sm:px-4">
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
        className="min-h-0 flex-1 overflow-y-auto bg-muted/10 dark:bg-muted/5"
      >
        <div
          className={cn(
            "mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-4",
          )}
        >
          {displayMessages.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <MessageSquareText className="h-6 w-6 text-muted-foreground/50" />
              <p className="mt-2 text-sm font-medium text-foreground">
                {ti("noMessagesYet")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isWhatsapp ? ti("noMessagesWhatsappDesc") : ti("noMessagesChannelDesc")}
              </p>
            </div>
          ) : searchOpen && normalizedSearch && visibleMessages.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Search className="h-6 w-6 text-muted-foreground/50" />
              <p className="mt-2 text-sm font-medium text-foreground">
                {ti("noSearchResults")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {ti("noSearchResultsDesc")}
              </p>
            </div>
          ) : isWhatsapp ? (
            visibleMessages.map((message) => (
              <WhatsappMessageBubble
                key={message.id}
                message={message}
                onRetry={
                  message.deliveryStatus === "failed" &&
                  !isOptimisticId(message.id)
                    ? async () => {
                        const formData = new FormData();
                        formData.set("message_id", message.id);
                        await retryWhatsappConversationReplyAction(formData);
                      }
                    : undefined
                }
              />
            ))
          ) : (
            visibleMessages.map((message) => {
              const isIncoming = message.direction === "incoming";
              const isOptimistic = message.id === "optimistic-outgoing";
              const attachmentLabel = getAttachmentLabel(message, ti);

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full",
                    isIncoming ? "justify-start pr-4 sm:pr-6" : "justify-end pl-4 sm:pl-6",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[68%] px-3 py-2",
                      isIncoming
                        ? "rounded-2xl rounded-tl-sm bg-muted/35 text-foreground dark:bg-muted/25"
                        : "rounded-2xl rounded-tr-sm bg-foreground/90 text-background dark:bg-foreground/85",
                      isOptimistic && "opacity-75",
                    )}
                  >
                    {message.message_text ? (
                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
                        {message.message_text}
                      </p>
                    ) : null}
                    {attachmentLabel ? (
                      <p
                        className={cn(
                          "mt-1 text-[11px]",
                          isIncoming ? "text-muted-foreground" : "text-background/70",
                        )}
                      >
                        {attachmentLabel}
                      </p>
                    ) : null}
                    <p
                      className={cn(
                        "mt-1 text-right text-[10px] tabular-nums",
                        isIncoming ? "text-muted-foreground/80" : "text-background/60",
                      )}
                    >
                      {isOptimistic
                        ? ti("sendingMessage")
                        : formatInboxMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
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
        <div className="sticky bottom-0 z-10 shrink-0 border-t border-border/40 bg-background">
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
    <div className="flex h-full flex-col items-center justify-center bg-muted/10 px-8 text-center dark:bg-muted/5">
      <MessageSquareText className="h-10 w-10 text-muted-foreground/40" />
      <p className="mt-4 text-base font-semibold text-foreground">
        {ti("selectConversationEmpty")}
      </p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {ti("selectConversationEmptyDesc")}
      </p>
    </div>
  );
}
