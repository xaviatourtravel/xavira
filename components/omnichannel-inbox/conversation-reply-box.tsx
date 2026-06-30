"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type RefObject,
} from "react";
import {
  ChevronLeft,
  FileText,
  Paperclip,
  Plus,
  Send,
  Smile,
  Sparkles,
  X,
} from "lucide-react";

import { sendOmnichannelConversationReply } from "@/app/(dashboard)/inbox/omnichannel-actions";
import { suggestOmnichannelReply } from "@/app/(dashboard)/inbox/omnichannel-ai-actions";
import { buttonVariants } from "@/components/ui/button";
import { DsToast } from "@/components/design-system/toast";
import { QUICK_REPLY_TEMPLATES, suggestReply } from "@/lib/communication/assist";
import {
  getComposerPlaceholder,
  isPersistedFailureCode,
  resolveSendErrorToast,
} from "@/lib/communication/composer";
import { useConversationDraft } from "@/lib/communication/drafts";
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

const MAX_TEXTAREA_ROWS = 4;
const LINE_HEIGHT_PX = 24;

type ComposerToast = {
  variant: "success" | "error" | "info";
  title: string;
  description?: string;
};

type ActionsView = "root" | "emoji" | "template" | "ai";

type OmnichannelConversationReplyBoxProps = {
  conversationId: string;
  channel?: OmnichannelChannel;
  canReply: boolean;
  canSuggestReply?: boolean;
  isUnassignedForAgent?: boolean;
  // Pesan masuk terakhir dari pelanggan, untuk saran AI berbasis aturan.
  lastCustomerMessage?: string | null;
  onSendingChange?: (isSending: boolean) => void;
  // Kanal non-WhatsApp: satu pesan optimistik sederhana.
  onOptimisticMessage?: (messageText: string | null) => void;
  // WhatsApp realtime: tambah pesan optimistik (mengembalikan id sementara) dan
  // hapus bila gagal sebelum tersimpan di basis data.
  onAddOptimistic?: (text: string) => string;
  onRemoveOptimistic?: (tempId: string) => void;
};

// Menutup menu saat klik di luar atau menekan Escape.
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

function ActionRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-muted/60"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
        {icon}
      </span>
      {label}
    </button>
  );
}

function SubmenuHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
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
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </span>
    </div>
  );
}

export function OmnichannelConversationReplyBox({
  conversationId,
  channel = "instagram",
  canReply,
  canSuggestReply = false,
  isUnassignedForAgent = false,
  lastCustomerMessage = null,
  onSendingChange,
  onOptimisticMessage,
  onAddOptimistic,
  onRemoveOptimistic,
}: OmnichannelConversationReplyBoxProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const { draft: messageText, setDraft: setMessageText, clearDraft } =
    useConversationDraft(conversationId);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [toast, setToast] = useState<ComposerToast | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [actionsView, setActionsView] = useState<ActionsView>("root");
  const [isPending, startTransition] = useTransition();
  const [isGenerating, startGenerateTransition] = useTransition();

  useOutsideClose(actionsOpen, actionsRef, () => setActionsOpen(false));

  useEffect(() => {
    if (!actionsOpen) {
      setActionsView("root");
    }
  }, [actionsOpen]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const isWhatsapp = channel === "whatsapp";

  const isDisabled = !canReply || isPending || isGenerating;
  const canSend =
    canReply && messageText.trim().length > 0 && !isPending && !isGenerating;
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

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    const maxHeight = LINE_HEIGHT_PX * MAX_TEXTAREA_ROWS + 16;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, [messageText]);

  // Menyisipkan teks pada posisi kursor (untuk emoji).
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

  // Menyisipkan balasan template/AI. Tidak menimpa teks kecuali composer kosong.
  function insertReply(text: string) {
    if (!messageText.trim()) {
      setMessageText(text);
    } else {
      const separator = /\s$/.test(messageText) ? "" : " ";
      setMessageText(`${messageText}${separator}${text}`);
    }
    setActionsOpen(false);
    textareaRef.current?.focus();
  }

  function handleSend() {
    const trimmed = messageText.trim();
    if (!trimmed || !canReply) {
      return;
    }

    setAttachmentName(null);

    if (isWhatsapp) {
      // Pesan langsung muncul (optimistik). Status dan baris akhir
      // direkonsiliasi oleh realtime - tanpa refresh halaman.
      const tempId = onAddOptimistic?.(trimmed);
      clearDraft();

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

          if (response.ok && payload.ok) {
            // Realtime akan mengganti pesan optimistik dan memperbarui status.
            return;
          }

          const code = payload.code ?? "unknown";

          if (isPersistedFailureCode(code)) {
            // Pesan tersimpan sebagai "failed" di basis data; realtime akan
            // mengganti pesan optimistik dan menandainya gagal (dengan tombol
            // coba lagi). Biarkan pesan optimistik agar tidak berkedip.
          } else if (tempId) {
            // Tidak pernah mencapai adapter - hapus pesan optimistik dan
            // kembalikan teks ke composer.
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
          // Koneksi ke server kita sendiri terputus - tidak ada yang terkirim.
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

  function handleSuggestReply() {
    if (!canUseAi) {
      return;
    }

    setAiError(null);
    setActionsOpen(false);

    startGenerateTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", conversationId);

      const result = await suggestOmnichannelReply(formData);

      if (!result.success || !result.suggestion) {
        setAiError(result.message ?? "Saran AI gagal. Silakan coba lagi.");
        return;
      }

      setMessageText(result.suggestion);
      textareaRef.current?.focus();
    });
  }

  function handleAiAction() {
    if (isWhatsapp) {
      setActionsView("ai");
      return;
    }
    handleSuggestReply();
  }

  const showAiAction = isWhatsapp || canUseAi;
  const aiSuggestion = suggestReply(lastCustomerMessage);

  return (
    <div className="relative bg-background px-3 py-2 sm:px-4">
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

      {aiError ? (
        <p className="mb-2 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600">
          {aiError}
        </p>
      ) : null}

      {attachmentName ? (
        <div className="mb-2 flex w-fit max-w-full items-center gap-2 rounded-lg border bg-muted/30 px-2.5 py-1.5 text-xs">
          <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate" title={attachmentName}>
            {attachmentName}
          </span>
          <button
            type="button"
            onClick={() => setAttachmentName(null)}
            aria-label="Hapus lampiran"
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            setAttachmentName(file.name);
          }
          event.target.value = "";
        }}
      />

      <div className="flex items-end gap-1.5">
        {/* Satu menu aksi sekunder agar composer tetap ringkas. */}
        <div ref={actionsRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setActionsOpen((value) => !value)}
            disabled={isDisabled}
            title="Aksi"
            aria-label="Aksi"
            aria-expanded={actionsOpen}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-11 shrink-0 gap-1 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground md:h-9",
              actionsOpen && "bg-muted text-foreground",
            )}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Aksi</span>
          </button>

          {actionsOpen ? (
            <div className="absolute bottom-full left-0 z-20 mb-2 w-72 overflow-hidden rounded-xl border bg-background py-1 shadow-lg">
              {actionsView === "root" ? (
                <>
                  <ActionRow
                    icon={<Paperclip className="h-4 w-4" />}
                    label="Lampirkan file"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setActionsOpen(false);
                    }}
                  />
                  <ActionRow
                    icon={<Smile className="h-4 w-4" />}
                    label="Emoji"
                    onClick={() => setActionsView("emoji")}
                  />
                  <ActionRow
                    icon={<FileText className="h-4 w-4" />}
                    label="Template balasan"
                    onClick={() => setActionsView("template")}
                  />
                  {showAiAction ? (
                    <ActionRow
                      icon={<Sparkles className="h-4 w-4" />}
                      label="Saran AI"
                      onClick={handleAiAction}
                    />
                  ) : null}
                </>
              ) : actionsView === "emoji" ? (
                <>
                  <SubmenuHeader
                    title="Emoji"
                    onBack={() => setActionsView("root")}
                  />
                  <div className="grid grid-cols-6 gap-1 p-2">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="rounded-md px-2 py-1 text-lg hover:bg-muted/60"
                        onClick={() => insertAtCursor(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </>
              ) : actionsView === "template" ? (
                <>
                  <SubmenuHeader
                    title="Template cepat"
                    onBack={() => setActionsView("root")}
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
              ) : (
                <>
                  <SubmenuHeader
                    title={`Saran AI · ${aiSuggestion.label}`}
                    onBack={() => setActionsView("root")}
                  />
                  <div className="p-2.5">
                    <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs leading-relaxed text-foreground">
                      {aiSuggestion.text}
                    </p>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => insertReply(aiSuggestion.text)}
                        className={cn(
                          buttonVariants({ size: "sm" }),
                          "h-8 gap-1.5 rounded-lg px-3 text-xs",
                        )}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Gunakan
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>

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

        <button
          type="button"
          disabled={!canSend}
          onClick={handleSend}
          title={sendTitle}
          className={cn(
            buttonVariants({ size: "sm" }),
            "h-11 shrink-0 gap-1.5 rounded-full px-3.5 md:h-9",
            !canSend && "opacity-50",
          )}
          aria-label={isPending ? "Mengirim pesan" : "Kirim pesan"}
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isPending ? "Mengirim..." : "Kirim"}
          </span>
        </button>
      </div>
    </div>
  );
}
