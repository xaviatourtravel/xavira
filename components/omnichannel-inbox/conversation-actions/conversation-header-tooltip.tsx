"use client";

import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";

import { AURORA_CONVERSATION_HEADER_TOOLTIP } from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

const TOOLTIP_DELAY_MS = 200;

type ConversationHeaderTooltipProps = {
  label: string;
  children: ReactElement;
  side?: "top" | "bottom";
  className?: string;
};

export function ConversationHeaderTooltip({
  label,
  children,
  side = "bottom",
  className,
}: ConversationHeaderTooltipProps) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  function clearDelay() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function show() {
    clearDelay();
    timeoutRef.current = window.setTimeout(() => setOpen(true), TOOLTIP_DELAY_MS);
  }

  function hide() {
    clearDelay();
    setOpen(false);
  }

  useEffect(() => () => clearDelay(), []);

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {open ? (
        <span
          role="tooltip"
          className={cn(
            AURORA_CONVERSATION_HEADER_TOOLTIP,
            side === "bottom"
              ? "left-1/2 top-[calc(100%+6px)] -translate-x-1/2"
              : "bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2",
          )}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}

export function ConversationHeaderTooltipWrap({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <ConversationHeaderTooltip label={label}>
      <span className="inline-flex">{children}</span>
    </ConversationHeaderTooltip>
  );
}
