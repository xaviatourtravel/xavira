"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ChevronLeft,
  FileText,
  Film,
  ImageIcon,
  Paperclip,
  Plus,
  Smile,
  Type,
  X,
} from "lucide-react";

import { sendOmnichannelConversationReply } from "@/app/(dashboard)/inbox/omnichannel-actions";
import { DsToast } from "@/components/design-system/toast";
import {
  AuroraComposer,
  AuroraComposerIconButton,
  AuroraComposerInput,
  AuroraComposerPopover,
  AuroraComposerSendButton,
} from "@/components/workspace";
import { QUICK_REPLY_TEMPLATES } from "@/lib/communication/assist";
import { isPersistedFailureCode } from "@/lib/communication/composer";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { useConversationDraft } from "@/lib/communication/drafts";
import { useInboxComposer } from "@/modules/inbox/context/inbox-composer-context";
import {
  logInboxError,
  resolveComposerSendError,
} from "@/modules/inbox/lib/resolve-inbox-error";
import type { OmnichannelChannel } from "@/types/omnichannel-inbox";
import { useInboxWorkspaceLayout } from "@/modules/inbox/context/inbox-workspace-layout-context";

const EMOJIS = [
  "😊",
  "👍",
  "🙏",
  "✅",
  "🎉",
  "❤️",
  "😂",
  "🔥",
  "👌",
  "😍",
  "🤝",
  "📎",
];

const COMPOSER_MAX_TEXTAREA_HEIGHT_PX = 132;

type ComposerToast = {
  variant: "success" | "error" | "info";
  title: string;
  description?: string;
};

type OpenMenu = "plus" | "emoji" | null;

type OmnichannelConversationReplyBoxProps = {
  conversationId: string;
  channel?: OmnichannelChannel;
  canReply: boolean;
  canSuggestReply?: boolean;
  isUnassignedForAgent?: boolean;
  lastCustomerMessage?: string | null;
  suggestedReply?: string | null;
  aiSummary?: string | null;
  onSendingChange?: (isSending: boolean) => void;
  onOptimisticMessage?: (messageText: string | null) => void;
  onAddOptimistic?: (text: string) => string;
  onRemoveOptimistic?: (tempId: string) => void;
};

function useOutsideClose(
  open: boolean,
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, ref, onClose]);
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-muted/50"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground">
        {icon}
      </span>
      {label}
    </button>
  );
}

function SubmenuHeader({
  title,
  onBack,
  backLabel,
}: {
  title: string;
  onBack: () => void;
  backLabel: string;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-border/20 px-2 py-1.5">
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        className="rounded-md p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="truncate text-[11px] font-medium text-muted-foreground">
        {title}
      </span>
    </div>
  );
}

export function OmnichannelConversationReplyBox({
  conversationId,
  channel = "instagram",
  canReply,
  isUnassignedForAgent = false,
  onSendingChange,
  onOptimisticMessage,
  onAddOptimistic,
  onRemoveOptimistic,
}: OmnichannelConversationReplyBoxProps) {
  const router = useRouter();
  const { ti } = useInboxTranslation();
  const { inspectorOpen } = useInboxWorkspaceLayout();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const dragDepthRef = useRef(0);
  const { draft: messageText, setDraft: setMessageText, clearDraft } =
    useConversationDraft(conversationId);
  const { registerInsertHandler } = useInboxComposer();
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [fileAccept, setFileAccept] = useState<string>("");
  const [toast, setToast] = useState<ComposerToast | null>(null);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [plusView, setPlusView] = useState<"root" | "template">("root");
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();

  useOutsideClose(openMenu !== null, rowRef, () => setOpenMenu(null));

  useEffect(() => {
    if (openMenu !== "plus") {
      setPlusView("root");
    }
  }, [openMenu]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const isWhatsapp = channel === "whatsapp";
  const showSlashHint = messageText.trimStart().startsWith("/");

  const isDisabled = !canReply || isPending;
  const canSend = canReply && messageText.trim().length > 0 && !isPending;

  const sendTitle = !canReply
    ? isUnassignedForAgent
      ? isWhatsapp
        ? ti("composerAssignFirstWhatsapp")
        : ti("composerAssignFirst")
      : isWhatsapp
        ? ti("composerNoPermissionWhatsapp")
        : ti("composerNoPermission")
    : isWhatsapp
      ? ti("composerSendWhatsappHint")
      : ti("composerSendMetaHint");

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      COMPOSER_MAX_TEXTAREA_HEIGHT_PX,
    )}px`;
  }, [messageText]);

  function openFilePicker(accept: string) {
    setFileAccept(accept);
    setOpenMenu(null);
    requestAnimationFrame(() => fileInputRef.current?.click());
  }

  function attachFile(file: File) {
    setAttachmentName(file.name);
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      attachFile(file);
    }
    event.target.value = "";
  }

  function insertAtCursor(insert: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessageText(messageText ? `${messageText}${insert}` : insert);
      return;
    }

    const start = textarea.selectionStart ?? messageText.length;
    const end = textarea.selectionEnd ?? messageText.length;
    const next = messageText.slice(0, start) + insert + messageText.slice(end);
    setMessageText(next);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + insert.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  const insertReply = useCallback(
    (text: string) => {
      if (!messageText.trim()) {
        setMessageText(text);
      } else {
        const separator = /\s$/.test(messageText) ? "" : " ";
        setMessageText(`${messageText}${separator}${text}`);
      }
      setOpenMenu(null);
      textareaRef.current?.focus();
    },
    [messageText, setMessageText],
  );

  useEffect(() => {
    registerInsertHandler(insertReply);
    return () => registerInsertHandler(null);
  }, [insertReply, registerInsertHandler]);

  function handleSend() {
    const trimmed = messageText.trim();
    if (!trimmed || !canReply) {
      return;
    }

    setAttachmentName(null);

    if (isWhatsapp) {
      const tempId = onAddOptimistic?.(trimmed);
      clearDraft();

      startTransition(async () => {
        try {
          const response = await fetch("/api/communication/messages/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ channel, conversationId, text: trimmed }),
          });

          const payload = (await response.json().catch(() => ({}))) as {
            ok?: boolean;
            code?: string;
            message?: string;
          };

          if (response.ok && payload.ok) {
            return;
          }

          const code = payload.code ?? "unknown";
          logInboxError("sendMessage", payload.message ?? code);

          if (isPersistedFailureCode(code)) {
            // Tersimpan sebagai "failed"; realtime akan menandainya.
          } else if (tempId) {
            onRemoveOptimistic?.(tempId);
            setMessageText(trimmed);
          }

          const errorCopy = resolveComposerSendError(code);
          setToast({
            variant: "error",
            title: ti(errorCopy.titleKey),
            description: ti(errorCopy.descriptionKey),
          });
        } catch (error) {
          logInboxError("sendMessageNetwork", error);
          if (tempId) {
            onRemoveOptimistic?.(tempId);
          }
          setMessageText(trimmed);
          setToast({
            variant: "error",
            title: ti("errorConnectionLostTitle"),
            description: ti("errorConnectionLostDesc"),
          });
        }
      });
      return;
    }

    onOptimisticMessage?.(trimmed);
    onSendingChange?.(true);
    clearDraft();

    startTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", conversationId);
      formData.set("message_text", trimmed);

      const result = await sendOmnichannelConversationReply(formData);
      onSendingChange?.(false);
      onOptimisticMessage?.(null);

      if (result.success) {
        router.refresh();
        setToast({ variant: "success", title: ti("composerSendSuccess") });
        return;
      }

      logInboxError("sendOmnichannelReply", result.message);
      setMessageText(trimmed);
      setToast({
        variant: "error",
        title: ti("composerSendFailed"),
        description: ti("composerTryAgain"),
      });
    });
  }

  function handleComposerKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key !== "Enter") {
      return;
    }

    const forceSend = event.metaKey || event.ctrlKey;
    const newLine = event.shiftKey && !forceSend;

    if (newLine) {
      return;
    }

    event.preventDefault();
    if (canSend) {
      handleSend();
    }
  }

  return (
    <div className="relative">
      {toast ? (
        <div className="pointer-events-none absolute bottom-full right-3 z-30 mb-2 flex justify-end sm:right-5">
          <div className="pointer-events-auto animate-in fade-in slide-in-from-bottom-1">
            <DsToast
              variant={toast.variant}
              title={toast.title}
              description={toast.description}
            />
          </div>
        </div>
      ) : null}

      <AuroraComposer
        disabled={isDisabled}
        isSending={isPending}
        isDragging={isDragging}
        dropLabel={ti("composerDropFile")}
        inspectorOpen={inspectorOpen}
        onDragEnter={(event) => {
          event.preventDefault();
          dragDepthRef.current += 1;
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
          if (dragDepthRef.current === 0) {
            setIsDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          dragDepthRef.current = 0;
          setIsDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) {
            attachFile(file);
          }
        }}
        meta={
          <>
            {showSlashHint ? (
              <p className="text-[11px] text-muted-foreground/70">
                {ti("composerSlashHint")}
              </p>
            ) : null}
            {attachmentName ? (
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted/35 px-2.5 py-1 text-xs text-foreground">
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate" title={attachmentName}>
                    {attachmentName}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachmentName(null)}
                    aria-label={ti("composerRemoveAttachment")}
                    className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept={fileAccept || undefined}
              className="hidden"
              onChange={handleFileInputChange}
            />
          </>
        }
        aiSuggestionSlot={
          /* TODO(Aurora PR-008): integrate AI ghost reply / suggestion layer */
          null
        }
      >
        <div ref={rowRef} className="flex w-full min-w-0 items-end gap-0.5">
          <div className="relative shrink-0">
            <AuroraComposerIconButton
              label={ti("composerAttachment")}
              active={openMenu === "plus"}
              disabled={isDisabled}
              aria-expanded={openMenu === "plus"}
              onClick={() =>
                setOpenMenu((value) => (value === "plus" ? null : "plus"))
              }
            >
              <Plus className="h-[18px] w-[18px]" />
            </AuroraComposerIconButton>
            {openMenu === "plus" ? (
              <AuroraComposerPopover align="left" className="w-64">
                {plusView === "root" ? (
                  <>
                    <MenuItem
                      icon={<FileText className="h-4 w-4" />}
                      label={ti("composerDocuments")}
                      onClick={() =>
                        openFilePicker(
                          ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv",
                        )
                      }
                    />
                    <MenuItem
                      icon={<ImageIcon className="h-4 w-4" />}
                      label={ti("composerImages")}
                      onClick={() => openFilePicker("image/*")}
                    />
                    <MenuItem
                      icon={<Film className="h-4 w-4" />}
                      label={ti("composerVideo")}
                      onClick={() => openFilePicker("video/*")}
                    />
                    <MenuItem
                      icon={<Type className="h-4 w-4" />}
                      label={ti("composerTemplates")}
                      onClick={() => setPlusView("template")}
                    />
                  </>
                ) : (
                  <>
                    <SubmenuHeader
                      title={ti("composerQuickTemplates")}
                      onBack={() => setPlusView("root")}
                      backLabel={ti("composerBack")}
                    />
                    {QUICK_REPLY_TEMPLATES.map((template) => (
                      <button
                        key={template}
                        type="button"
                        onClick={() => insertReply(template)}
                        className="block w-full px-3 py-2 text-left text-xs leading-relaxed text-foreground transition-colors hover:bg-muted/50"
                      >
                        {template}
                      </button>
                    ))}
                  </>
                )}
              </AuroraComposerPopover>
            ) : null}
          </div>

          <AuroraComposerInput
            inputRef={textareaRef}
            value={messageText}
            onChange={setMessageText}
            onKeyDown={handleComposerKeyDown}
            placeholder={ti("composerPlaceholder")}
            disabled={isDisabled}
            title={sendTitle}
            maxHeight={COMPOSER_MAX_TEXTAREA_HEIGHT_PX}
          />

          <div className="relative shrink-0">
            <AuroraComposerIconButton
              label={ti("composerEmoji")}
              active={openMenu === "emoji"}
              disabled={isDisabled}
              aria-expanded={openMenu === "emoji"}
              onClick={() =>
                setOpenMenu((value) => (value === "emoji" ? null : "emoji"))
              }
            >
              <Smile className="h-[18px] w-[18px]" />
            </AuroraComposerIconButton>
            {openMenu === "emoji" ? (
              <AuroraComposerPopover align="right" className="grid grid-cols-6 gap-0.5 p-2">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="rounded-lg px-2 py-1 text-lg transition-colors hover:bg-muted/50"
                    onClick={() => {
                      insertAtCursor(emoji);
                      setOpenMenu(null);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </AuroraComposerPopover>
            ) : null}
          </div>

          <AuroraComposerSendButton
            disabled={!canSend}
            isSending={isPending}
            onClick={handleSend}
            label={ti("composerSendLabel")}
            sendingLabel={ti("composerSendingLabel")}
            sendText={ti("composerSend")}
            sendingText={ti("composerSending")}
          />
        </div>
      </AuroraComposer>
    </div>
  );
}
