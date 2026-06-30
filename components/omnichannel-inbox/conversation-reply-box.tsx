"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import {
  File,
  FileText,
  ImageIcon,
  Paperclip,
  Plus,
  Send,
  Smile,
  Sparkles,
} from "lucide-react";

import { sendOmnichannelConversationReply } from "@/app/(dashboard)/inbox/omnichannel-actions";
import { suggestOmnichannelReply } from "@/app/(dashboard)/inbox/omnichannel-ai-actions";
import { buttonVariants } from "@/components/ui/button";
import { DsToast } from "@/components/design-system/toast";
import {
  getComposerPlaceholder,
  isPersistedFailureCode,
  resolveSendErrorToast,
} from "@/lib/communication/composer";
import { useConversationDraft } from "@/lib/communication/drafts";
import type { OmnichannelChannel } from "@/types/omnichannel-inbox";
import { cn } from "@/lib/utils";

const EMOJIS = ["😊", "👍", "🙏", "✅", "📎", "🎉", "❤️", "😂"];

type ComposerToast = {
  variant: "success" | "error" | "info";
  title: string;
  description?: string;
};

type OmnichannelConversationReplyBoxProps = {
  conversationId: string;
  channel?: OmnichannelChannel;
  canReply: boolean;
  canSuggestReply?: boolean;
  isUnassignedForAgent?: boolean;
  onSendingChange?: (isSending: boolean) => void;
  onOptimisticMessage?: (messageText: string | null) => void;
};

const MAX_TEXTAREA_ROWS = 4;
const LINE_HEIGHT_PX = 24;

type AttachmentMenuItem = {
  id: string;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  hint?: string;
};

const COMPOSER_ICON_BUTTON =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full p-0 md:h-9 md:w-9";

// Tombol "segera tersedia" untuk fitur composer WhatsApp yang belum aktif.
function ComingSoonIconButton({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled
      title="Segera tersedia"
      aria-label={`${label} (segera tersedia)`}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        COMPOSER_ICON_BUTTON,
        "cursor-not-allowed text-muted-foreground/60",
      )}
    >
      {children}
    </button>
  );
}

function ComingSoonPillButton({
  label,
  icon,
}: {
  label: string;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled
      title="Segera tersedia"
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "h-7 cursor-not-allowed gap-1.5 rounded-lg px-2.5 text-xs text-muted-foreground/70",
      )}
    >
      {icon}
      <span>{label}</span>
      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
        Segera
      </span>
    </button>
  );
}

function ComposerAttachmentMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const items: AttachmentMenuItem[] = [
    {
      id: "image",
      label: "Unggah gambar",
      icon: <ImageIcon className="h-4 w-4" />,
      disabled: true,
      hint: "Segera",
    },
    {
      id: "document",
      label: "Unggah dokumen",
      icon: <FileText className="h-4 w-4" />,
      disabled: true,
      hint: "Segera",
    },
    {
      id: "file",
      label: "Unggah berkas",
      icon: <File className="h-4 w-4" />,
      disabled: true,
      hint: "Segera",
    },
  ];

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          COMPOSER_ICON_BUTTON,
          open && "bg-muted text-foreground",
          "text-muted-foreground hover:text-foreground",
        )}
        aria-label="Tambah lampiran"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Plus className={cn("h-4 w-4 transition-transform", open && "rotate-45")} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-20 mb-2 w-52 overflow-hidden rounded-xl border bg-background py-1 shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              title="Segera tersedia"
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                item.disabled
                  ? "cursor-not-allowed text-muted-foreground/70"
                  : "text-foreground hover:bg-muted/60",
              )}
            >
              <span className="text-muted-foreground">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.hint ? (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {item.hint}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ComposerEmojiPicker({
  onPick,
  disabled,
}: {
  onPick: (emoji: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          COMPOSER_ICON_BUTTON,
          "text-muted-foreground hover:text-foreground",
        )}
        aria-label="Sisipkan emoji"
      >
        😊
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 z-20 mb-2 grid grid-cols-4 gap-1 rounded-xl border bg-background p-2 shadow-lg">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="rounded-md px-2 py-1 text-lg hover:bg-muted/60"
              onClick={() => {
                onPick(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function OmnichannelConversationReplyBox({
  conversationId,
  channel = "instagram",
  canReply,
  canSuggestReply = false,
  isUnassignedForAgent = false,
  onSendingChange,
  onOptimisticMessage,
}: OmnichannelConversationReplyBoxProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { draft: messageText, setDraft: setMessageText, clearDraft } =
    useConversationDraft(conversationId);
  const [aiError, setAiError] = useState<string | null>(null);
  const [toast, setToast] = useState<ComposerToast | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isGenerating, startGenerateTransition] = useTransition();

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const isWhatsapp = channel === "whatsapp";

  const isDisabled = !canReply || isPending || isGenerating;
  const canSend = canReply && messageText.trim().length > 0 && !isPending && !isGenerating;
  const canUseAi = canSuggestReply && canReply && !isPending && !isGenerating;

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

  const aiTitle = !canSuggestReply
    ? "You do not have permission to use AI suggestions."
    : !canReply
      ? sendTitle
      : "Generate a suggested reply. Review and edit before sending.";

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    const maxHeight = LINE_HEIGHT_PX * MAX_TEXTAREA_ROWS + 16;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, [messageText]);

  function handleSend() {
    const trimmed = messageText.trim();
    if (!trimmed || !canReply) {
      return;
    }

    onOptimisticMessage?.(trimmed);
    onSendingChange?.(true);
    clearDraft();

    if (isWhatsapp) {
      startTransition(async () => {
        try {
          const response = await fetch("/api/communication/messages/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channel,
              conversationId,
              text: trimmed,
            }),
          });

          const payload = (await response
            .json()
            .catch(() => ({}))) as {
            ok?: boolean;
            code?: string;
            message?: string;
          };

          onSendingChange?.(false);
          onOptimisticMessage?.(null);

          if (response.ok && payload.ok) {
            router.refresh();
            return;
          }

          const code = payload.code ?? "unknown";

          if (isPersistedFailureCode(code)) {
            // Pesan tersimpan sebagai "failed" - refresh agar bubble + tombol
            // coba lagi muncul di timeline.
            router.refresh();
          } else {
            // Tidak pernah mencapai adapter - kembalikan teks ke composer.
            setMessageText(trimmed);
          }

          const copy = resolveSendErrorToast(code, payload.message);
          setToast({
            variant: "error",
            title: copy.title,
            description: copy.description,
          });
        } catch {
          // Koneksi ke server kita sendiri terputus - tidak ada yang terkirim.
          onSendingChange?.(false);
          onOptimisticMessage?.(null);
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

  function handleSuggestReply() {
    if (!canUseAi) {
      return;
    }

    setAiError(null);

    startGenerateTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", conversationId);

      const result = await suggestOmnichannelReply(formData);

      if (!result.success || !result.suggestion) {
        setAiError(result.message ?? "AI suggestion failed. Please try again.");
        return;
      }

      setMessageText(result.suggestion);
      textareaRef.current?.focus();
    });
  }

  return (
    <div className="relative bg-background px-3 py-2.5 sm:px-4">
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

      {isWhatsapp ? (
        <div className="mb-2 flex justify-end gap-1.5">
          <ComingSoonPillButton
            label="Template"
            icon={<FileText className="h-3.5 w-3.5" />}
          />
          <ComingSoonPillButton
            label="AI"
            icon={<Sparkles className="h-3.5 w-3.5" />}
          />
        </div>
      ) : canUseAi ? (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            disabled={!canUseAi || isGenerating}
            onClick={handleSuggestReply}
            title={aiTitle}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-7 gap-1.5 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground",
              isGenerating && "opacity-70",
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isGenerating ? "Generating..." : "AI Reply"}
          </button>
        </div>
      ) : null}

      {aiError ? (
        <p className="mb-2 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600">
          {aiError}
        </p>
      ) : null}

      <div className="flex items-end gap-2">
        {isWhatsapp ? (
          <>
            <ComingSoonIconButton label="Lampiran">
              <Paperclip className="h-4 w-4" />
            </ComingSoonIconButton>
            <ComingSoonIconButton label="Emoji">
              <Smile className="h-4 w-4" />
            </ComingSoonIconButton>
          </>
        ) : (
          <>
            <ComposerAttachmentMenu />
            <ComposerEmojiPicker
              disabled={isDisabled}
              onPick={(emoji) => setMessageText(`${messageText}${emoji}`)}
            />
          </>
        )}

        <div className="flex min-h-[40px] min-w-0 flex-1 items-center rounded-xl border bg-muted/20 px-3 py-1">
          <textarea
            ref={textareaRef}
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            rows={1}
            placeholder={getComposerPlaceholder(channel)}
            disabled={isDisabled}
            title={sendTitle}
            className="max-h-[112px] w-full resize-none border-0 bg-transparent py-1.5 text-sm leading-6 outline-none placeholder:text-muted-foreground disabled:opacity-60"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (canSend) {
                  handleSend();
                }
              }
            }}
          />
        </div>

        {isWhatsapp ? (
          <button
            type="button"
            disabled={!canSend}
            onClick={handleSend}
            title={sendTitle}
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-11 shrink-0 gap-1.5 rounded-full px-4 md:h-9",
              !canSend && "opacity-50",
            )}
          >
            <Send className="h-4 w-4" />
            <span>{isPending ? "Mengirim..." : "Kirim"}</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={!canSend}
            onClick={handleSend}
            title={sendTitle}
            className={cn(
              buttonVariants({ size: "sm" }),
              COMPOSER_ICON_BUTTON,
              !canSend && "opacity-50",
            )}
            aria-label={isPending ? "Sending message" : "Send message"}
          >
            <Send className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
