"use client";

import type { ReactNode } from "react";

import { getMessageLaneClassName } from "@/lib/communication-workspace/conversation-lane";
import { cn } from "@/lib/utils";

type ConversationMessageLaneProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Aurora Message Lane — centered reading column for conversation messages only.
 */
export function ConversationMessageLane({
  children,
  className,
}: ConversationMessageLaneProps) {
  return (
    <div className={cn(getMessageLaneClassName(), className)}>{children}</div>
  );
}
