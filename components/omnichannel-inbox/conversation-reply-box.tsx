"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { sendOmnichannelConversationReply } from "@/app/(dashboard)/inbox/omnichannel-actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OmnichannelConversationReplyBoxProps = {
  conversationId: string;
  canReply: boolean;
  isUnassignedForAgent?: boolean;
  onSendingChange?: (isSending: boolean) => void;
  onOptimisticMessage?: (messageText: string | null) => void;
};

export function OmnichannelConversationReplyBox({
  conversationId,
  canReply,
  isUnassignedForAgent = false,
  onSendingChange,
  onOptimisticMessage,
}: OmnichannelConversationReplyBoxProps) {
  const router = useRouter();
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDisabled = !canReply || isPending;
  const canSend = canReply && messageText.trim().length > 0 && !isPending;

  const helperText = useMemo(() => {
    if (!canReply) {
      if (isUnassignedForAgent) {
        return "Assign this conversation to yourself before you can reply.";
      }
      return "You do not have permission to reply to this conversation.";
    }

    return "Replies are sent manually through Meta. AI auto-reply is not enabled.";
  }, [canReply, isUnassignedForAgent]);

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
      setError(result.message ?? "Failed to send reply.");
    });
  }

  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-sm font-medium">Reply</p>
      <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>

      {error ? (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <textarea
        value={messageText}
        onChange={(event) => setMessageText(event.target.value)}
        rows={3}
        placeholder="Type a reply…"
        disabled={isDisabled}
        className="mt-3 w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-60"
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (canSend) {
              handleSend();
            }
          }
        }}
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          Press Enter to send, Shift+Enter for new line.
        </p>
        <button
          type="button"
          disabled={!canSend}
          onClick={handleSend}
          className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
        >
          {isPending ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}
