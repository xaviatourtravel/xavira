"use client";

import { type ReactNode } from "react";

import { AURORA_CONVERSATION_ACTION_MENU_SECTION_LABEL } from "@/components/workspace/aurora-tokens";

type ConversationActionMenuSectionProps = {
  label: string;
  children: ReactNode;
};

export function ConversationActionMenuSection({
  label,
  children,
}: ConversationActionMenuSectionProps) {
  return (
    <div className="px-1.5">
      <p className={AURORA_CONVERSATION_ACTION_MENU_SECTION_LABEL}>{label}</p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}
