"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import {
  File,
  FileText,
  ImageIcon,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";

import { sendOmnichannelConversationReply } from "@/app/(dashboard)/inbox/omnichannel-actions";
import { suggestOmnichannelReply } from "@/app/(dashboard)/inbox/omnichannel-ai-actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OmnichannelConversationReplyBoxProps = {
  conversationId: string;
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
      label: "Upload image",
      icon: <ImageIcon className="h-4 w-4" />,
      disabled: true,
      hint: "Soon",
    },
    {
      id: "document",
      label: "Upload document",
      icon: <FileText className="h-4 w-4" />,
      disabled: true,
      hint: "Soon",
    },
    {
      id: "file",
      label: "Upload file",
      icon: <File className="h-4 w-4" />,
      disabled: true,
      hint: "Soon",
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
        aria-label="Add attachment"
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
              title={item.hint ? `${item.label} — coming soon` : item.label}
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

export function OmnichannelConversationReplyBox({
  conversationId,
  canReply,
  canSuggestReply = false,
  isUnassignedForAgent = false,
  onSendingChange,
  onOptimisticMessage,
}: OmnichannelConversationReplyBoxProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isGenerating, startGenerateTransition] = useTransition();

  const isDisabled = !canReply || isPending || isGenerating;
  const canSend = canReply && messageText.trim().length > 0 && !isPending && !isGenerating;
  const canUseAi = canSuggestReply && canReply && !isPending && !isGenerating;

  const sendTitle = !canReply
    ? isUnassignedForAgent
      ? "Assign this conversation to yourself before sending a reply."
      : "You do not have permission to reply."
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

    setError(null);
    onOptimisticMessage?.(trimmed);
    onSendingChange?.(true);
    setMessageText("");

    startTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", conversationId);
      formData.set("message_text", trimmed);

      const result = await sendOmnichannelConversationReply(formData);
      onSendingChange?.(false);

      if (result.success) {
        onOptimisticMessage?.(null);
        router.refresh();
        return;
      }

      onOptimisticMessage?.(null);
      setMessageText(trimmed);
      setError(result.message ?? "Unable to send reply. Please try again.");
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
    <div className="bg-background px-3 py-2.5 sm:px-4">
      {canUseAi ? (
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
            {isGenerating ? "Generating..." : "✨ Suggest Reply"}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mb-2 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : null}

      {aiError ? (
        <p className="mb-2 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600">
          {aiError}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <ComposerAttachmentMenu />

        <div className="flex min-h-[40px] min-w-0 flex-1 items-center rounded-xl border bg-muted/20 px-3 py-1">
          <textarea
            ref={textareaRef}
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            rows={1}
            placeholder="Message customer…"
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
            COMPOSER_ICON_BUTTON,
            !canSend && "opacity-50",
          )}
          aria-label={isPending ? "Sending message" : "Send message"}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
