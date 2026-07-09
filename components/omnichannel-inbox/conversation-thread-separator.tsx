"use client";

import {
  AURORA_MESSAGE_DATE_SEPARATOR,
  AURORA_MESSAGE_DATE_SEPARATOR_LABEL,
  AURORA_STATE_FADE,
  AURORA_STATE_UNREAD_SEPARATOR,
  AURORA_STATE_UNREAD_SEPARATOR_LABEL,
  AURORA_STATE_UNREAD_SEPARATOR_LINE,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

type ConversationDateSeparatorProps = {
  label: string;
  className?: string;
};

export function ConversationDateSeparator({
  label,
  className,
}: ConversationDateSeparatorProps) {
  return (
    <div
      className={cn(AURORA_MESSAGE_DATE_SEPARATOR, AURORA_STATE_FADE, className)}
      role="separator"
      aria-label={label}
    >
      <span className={AURORA_MESSAGE_DATE_SEPARATOR_LABEL}>{label}</span>
    </div>
  );
}

type ConversationUnreadSeparatorProps = {
  label: string;
  className?: string;
};

export function ConversationUnreadSeparator({
  label,
  className,
}: ConversationUnreadSeparatorProps) {
  return (
    <div
      className={cn(AURORA_STATE_UNREAD_SEPARATOR, AURORA_STATE_FADE, className)}
      role="separator"
      aria-label={label}
    >
      <span className={AURORA_STATE_UNREAD_SEPARATOR_LINE} aria-hidden />
      <span className={AURORA_STATE_UNREAD_SEPARATOR_LABEL}>{label}</span>
      <span className={AURORA_STATE_UNREAD_SEPARATOR_LINE} aria-hidden />
    </div>
  );
}
