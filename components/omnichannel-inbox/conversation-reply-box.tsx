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
  Send,
  Smile,
  Sparkles,
  Type,
  X,
} from "lucide-react";

import { sendOmnichannelConversationReply } from "@/app/(dashboard)/inbox/omnichannel-actions";
import { DsToast } from "@/components/design-system/toast";
import { QUICK_REPLY_TEMPLATES } from "@/lib/communication/assist";
import {
  getComposerPlaceholder,
  isPersistedFailureCode,
  resolveSendErrorToast,
} from "@/lib/communication/composer";
import { useConversationDraft } from "@/lib/communication/drafts";
import { useInboxComposer } from "@/modules/inbox/context/inbox-composer-context";
import type { OmnichannelChannel } from "@/types/omnichannel-inbox";
import { cn } from "@/lib/utils";

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

const COMPOSER_MIN_HEIGHT_PX = 44;
const COMPOSER_MAX_HEIGHT_PX = 140;
const COMPOSER_INPUT_PADDING_Y_PX = 14;
const COMPOSER_MAX_TEXTAREA_HEIGHT_PX =
  COMPOSER_MAX_HEIGHT_PX - COMPOSER_INPUT_PADDING_Y_PX * 2;

const GHOST_ICON_BUTTON =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-40";

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
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-muted/60"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground">
        {icon}
      </span>
      {label}
    </button>
  );
}

function SubmenuHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-1 border-b px-2 py-1.5">
      <button
        type="button"
        onClick={onBack}
        aria-label="Kembali"
        className="rounded-md p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
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

  const isDisabled = !canReply || isPending;
  const canSend = canReply && messageText.trim().length > 0 && !isPending;

  const sendTitle = !canReply
    ? isUnassignedForAgent
      ? isWhatsapp
        ? "Assign percakapan ini ke Anda sebelum membalas."
        : "Assign this conversation to yourself before sending a reply."
      : isWhatsapp
        ? "Anda tidak memiliki izin untuk membalas."
        : "You do not have permission to reply."
    : isWhatsapp
      ? "Kirim balasan WhatsApp."
      : "Manual reply via connected Meta account.";

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

          if (isPersistedFailureCode(code)) {
            // Tersimpan sebagai "failed"; realtime akan menandainya.
          } else if (tempId) {
            onRemoveOptimistic?.(tempId);
            setMessageText(trimmed);
          }

          const copy = resolveSendErrorToast(code, payload.message);
          setToast({
            variant: "error",
            title: copy.title,
            description: copy.description,
          });
        } catch {
          if (tempId) {
            onRemoveOptimistic?.(tempId);
          }
          setMessageText(trimmed);
          setToast({
            variant: "error",
            title: "Koneksi terputus",
            description:
              "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.",
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
        return;
      }

      setMessageText(trimmed);
      setToast({
        variant: "error",
        title: "Gagal mengirim balasan",
        description: result.message ?? "Silakan coba lagi.",
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
    <div
      className="relative border-t border-soft/80 bg-background px-3 py-3 sm:px-4"
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
    >
      {isDragging ? (
        <div className="pointer-events-none absolute inset-2 z-20 flex items-center justify-center rounded-[22px] border-2 border-dashed border-[#2563EB]/35 bg-background/95">
          <p className="text-sm text-muted-foreground">
            Lepas file di sini untuk melampirkan
          </p>
        </div>
      ) : null}

      {toast ? (
        <div className="pointer-events-none absolute bottom-full right-3 z-30 mb-2 flex justify-end sm:right-4">
          <div className="pointer-events-auto animate-in fade-in slide-in-from-bottom-1">
            <DsToast
              variant={toast.variant}
              title={toast.title}
              description={toast.description}
            />
          </div>
        </div>
      ) : null}

      {attachmentName ? (
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted/45 px-2.5 py-1 text-xs text-foreground">
            <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate" title={attachmentName}>
              {attachmentName}
            </span>
            <button
              type="button"
              onClick={() => setAttachmentName(null)}
              aria-label="Hapus lampiran"
              className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
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

      <div ref={rowRef} className="flex items-end gap-1.5">
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() =>
              setOpenMenu((value) => (value === "plus" ? null : "plus"))
            }
            disabled={isDisabled}
            title="Lampiran"
            aria-label="Lampiran"
            aria-expanded={openMenu === "plus"}
            className={cn(
              GHOST_ICON_BUTTON,
              openMenu === "plus" && "bg-muted/50 text-foreground",
            )}
          >
            <Plus className="h-5 w-5" />
          </button>
          {openMenu === "plus" ? (
            <div className="absolute bottom-full left-0 z-20 mb-2 w-64 overflow-hidden rounded-xl border bg-background py-1 shadow-lg">
              {plusView === "root" ? (
                <>
                  <MenuItem
                    icon={<FileText className="h-4 w-4" />}
                    label="Dokumen"
                    onClick={() =>
                      openFilePicker(
                        ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv",
                      )
                    }
                  />
                  <MenuItem
                    icon={<ImageIcon className="h-4 w-4" />}
                    label="Gambar"
                    onClick={() => openFilePicker("image/*")}
                  />
                  <MenuItem
                    icon={<Film className="h-4 w-4" />}
                    label="Video"
                    onClick={() => openFilePicker("video/*")}
                  />
                  <MenuItem
                    icon={<Type className="h-4 w-4" />}
                    label="Template"
                    onClick={() => setPlusView("template")}
                  />
                </>
              ) : (
                <>
                  <SubmenuHeader
                    title="Template cepat"
                    onBack={() => setPlusView("root")}
                  />
                  {QUICK_REPLY_TEMPLATES.map((template) => (
                    <button
                      key={template}
                      type="button"
                      onClick={() => insertReply(template)}
                      className="block w-full px-3 py-2 text-left text-xs leading-relaxed text-foreground transition-colors hover:bg-muted/60"
                    >
                      {template}
                    </button>
                  ))}
                </>
              )}
            </div>
          ) : null}
        </div>

        <div
          className="flex min-h-[44px] max-h-[140px] min-w-0 flex-1 items-center rounded-[22px] bg-muted/35 px-4 py-[14px]"
          style={{ minHeight: COMPOSER_MIN_HEIGHT_PX, maxHeight: COMPOSER_MAX_HEIGHT_PX }}
        >
          <textarea
            ref={textareaRef}
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            rows={1}
            placeholder={getComposerPlaceholder(channel)}
            disabled={isDisabled}
            title={sendTitle}
            className="max-h-[112px] w-full resize-none border-0 bg-transparent text-sm leading-[22px] outline-none placeholder:text-muted-foreground disabled:opacity-60"
            onKeyDown={handleComposerKeyDown}
          />
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() =>
              setOpenMenu((value) => (value === "emoji" ? null : "emoji"))
            }
            disabled={isDisabled}
            title="Emoji"
            aria-label="Emoji"
            aria-expanded={openMenu === "emoji"}
            className={cn(
              GHOST_ICON_BUTTON,
              openMenu === "emoji" && "bg-muted/50 text-foreground",
            )}
          >
            <Smile className="h-5 w-5" />
          </button>
          {openMenu === "emoji" ? (
            <div className="absolute bottom-full right-0 z-20 mb-2 grid grid-cols-6 gap-1 rounded-xl border bg-background p-2 shadow-lg">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="rounded-md px-2 py-1 text-lg hover:bg-muted/60"
                  onClick={() => {
                    insertAtCursor(emoji);
                    setOpenMenu(null);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          disabled={isDisabled}
          title="AI Draft (segera hadir)"
          aria-label="AI Draft"
          className={GHOST_ICON_BUTTON}
        >
          <Sparkles className="h-5 w-5" />
        </button>

        <button
          type="button"
          disabled={!canSend}
          onClick={handleSend}
          title={sendTitle}
          className={cn(
            "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-[#2563EB] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:pointer-events-none disabled:opacity-40",
          )}
          aria-label={isPending ? "Mengirim pesan" : "Kirim pesan"}
        >
          <Send className="h-4 w-4" />
          <span>{isPending ? "Mengirim..." : "Kirim"}</span>
        </button>
      </div>
    </div>
  );
}
