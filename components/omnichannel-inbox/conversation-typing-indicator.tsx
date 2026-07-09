"use client";

import {
  AURORA_MESSAGE_AVATAR_SIZE,
  AURORA_STATE_FADE,
  AURORA_STATE_TYPING_BUBBLE,
  AURORA_STATE_TYPING_LABEL,
} from "@/components/workspace/aurora-tokens";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { cn } from "@/lib/utils";

type ConversationTypingIndicatorProps = {
  variant: "customer" | "ai";
  showAvatarSpacer?: boolean;
  className?: string;
};

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-0.5" aria-hidden>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/45"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

export function ConversationTypingIndicator({
  variant,
  showAvatarSpacer = true,
  className,
}: ConversationTypingIndicatorProps) {
  const { ti } = useInboxTranslation();
  const label =
    variant === "ai" ? ti("aiIsTyping") : ti("customerIsTyping");

  return (
    <div
      className={cn(
        "flex w-full items-end gap-2",
        AURORA_STATE_FADE,
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {showAvatarSpacer ? (
        <div className={cn(AURORA_MESSAGE_AVATAR_SIZE, "shrink-0")} aria-hidden />
      ) : null}

      <div className="min-w-0">
        <p className={AURORA_STATE_TYPING_LABEL}>{label}</p>
        <div className={AURORA_STATE_TYPING_BUBBLE}>
          <TypingDots />
        </div>
      </div>
    </div>
  );
}
