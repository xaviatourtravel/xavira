"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import {
  FileText,
  ImageIcon,
  Plus,
  Send,
  StickyNote,
  Video,
} from "lucide-react";

import { sendOmnichannelConversationReply } from "@/app/(dashboard)/inbox/omnichannel-actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OmnichannelConversationReplyBoxProps = {
  conversationId: string;
  canReply: boolean;
  isUnassignedForAgent?: boolean;
  onSendingChange?: (isSending: boolean) => void;
  onOptimisticMessage?: (messageText: string | null) => void;
  onOpenDetails?: (focusNote?: boolean) => void;
};

const MAX_TEXTAREA_ROWS = 4;
const LINE_HEIGHT_PX = 24;

type AttachmentMenuItem = {
  id: string;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  hint?: string;
  onSelect?: () => void;
};

const COMPOSER_ACTION_BUTTON =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-0";

function ComposerAttachmentMenu({
  onOpenInternalNote,
}: {
  onOpenInternalNote: () => void;
}) {
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
      label: "Image",
      icon: <ImageIcon className="h-4 w-4" />,
      disabled: true,
      hint: "Coming soon",
    },
    {
      id: "video",
      label: "Video",
      icon: <Video className="h-4 w-4" />,
      disabled: true,
      hint: "Coming soon",
    },
    {
      id: "document",
      label: "Document",
      icon: <FileText className="h-4 w-4" />,
      disabled: true,
      hint: "Coming soon",
    },
    {
      id: "internal-note",
      label: "Internal Note",
      icon: <StickyNote className="h-4 w-4" />,
      onSelect: () => {
        setOpen(false);
        onOpenInternalNote();
      },
    },
  ];

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          COMPOSER_ACTION_BUTTON,
          "text-muted-foreground hover:text-foreground",
        )}
        aria-label="Add attachment or note"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Plus className="h-4 w-4" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-20 mb-2 w-48 overflow-hidden rounded-xl border bg-background py-1 shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              title={item.hint}
              onClick={() => {
                if (item.disabled) {
                  return;
                }
                item.onSelect?.();
              }}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                item.disabled
                  ? "cursor-not-allowed text-muted-foreground/60"
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
  isUnassignedForAgent = false,
  onSendingChange,
  onOptimisticMessage,
  onOpenDetails,
}: OmnichannelConversationReplyBoxProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDisabled = !canReply || isPending;
  const canSend = canReply && messageText.trim().length > 0 && !isPending;

  const sendTitle = !canReply
    ? isUnassignedForAgent
      ? "Assign this conversation to yourself before sending a reply."
      : "You do not have permission to reply."
    : "Manual reply via connected Meta account.";

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    const maxHeight = LINE_HEIGHT_PX * MAX_TEXTAREA_ROWS + 20;
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

  return (
    <div className="border-t bg-background/95 py-3 backdrop-blur">
      {error ? (
        <p className="mx-6 mb-3 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600 sm:mx-8">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3 px-6 sm:px-8">
        <ComposerAttachmentMenu
          onOpenInternalNote={() => onOpenDetails?.(true)}
        />

        <div className="flex min-h-[42px] min-w-0 flex-1 items-center rounded-2xl border bg-muted/30 px-3 py-1.5">
          <textarea
            ref={textareaRef}
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            rows={1}
            placeholder="Message customer…"
            disabled={isDisabled}
            title={sendTitle}
            className="max-h-[116px] w-full resize-none border-0 bg-transparent py-1.5 text-sm leading-6 outline-none placeholder:text-muted-foreground disabled:opacity-60"
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

        <div className="flex shrink-0 items-center px-1.5">
          <button
            type="button"
            disabled={!canSend}
            onClick={handleSend}
            title={sendTitle}
            className={cn(
              buttonVariants({ size: "sm" }),
              COMPOSER_ACTION_BUTTON,
              !canSend && "opacity-50",
            )}
            aria-label={isPending ? "Sending message" : "Send message"}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
