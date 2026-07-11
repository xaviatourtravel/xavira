"use client";

import { type ReactNode } from "react";

import {
  AURORA_CONVERSATION_HEADER_ICON_ACTIVE,
  AURORA_CONVERSATION_HEADER_ICON_BUTTON,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import { ConversationHeaderTooltip, ConversationHeaderTooltipWrap } from "./conversation-header-tooltip";

type ConversationHeaderActionButtonProps = {
  label: string;
  tooltip?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  ariaExpanded?: boolean;
  buttonRef?: React.Ref<HTMLButtonElement>;
};

export function ConversationHeaderActionButton({
  label,
  tooltip,
  onClick,
  active = false,
  disabled = false,
  children,
  className,
  ariaExpanded,
  buttonRef,
}: ConversationHeaderActionButtonProps) {
  const button = (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-expanded={ariaExpanded}
      aria-disabled={disabled || undefined}
      className={cn(
        AURORA_CONVERSATION_HEADER_ICON_BUTTON,
        active && AURORA_CONVERSATION_HEADER_ICON_ACTIVE,
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-muted-foreground/75",
        className,
      )}
    >
      {children}
    </button>
  );

  const tooltipLabel = tooltip ?? label;

  if (disabled) {
    return (
      <ConversationHeaderTooltipWrap label={tooltipLabel}>
        {button}
      </ConversationHeaderTooltipWrap>
    );
  }

  return (
    <ConversationHeaderTooltip label={tooltipLabel}>
      {button}
    </ConversationHeaderTooltip>
  );
}
