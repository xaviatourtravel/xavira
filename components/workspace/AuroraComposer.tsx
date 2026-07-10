"use client";

import { Loader2, Send } from "lucide-react";
import type { ReactNode } from "react";

import { getConversationLaneClassName } from "@/lib/communication-workspace/conversation-lane";
import { cn } from "@/lib/utils";

import {
  AURORA_COMPOSER_AI_PILL,
  AURORA_COMPOSER_AI_PILL_ACTIVE,
  AURORA_COMPOSER_ICON_BUTTON,
  AURORA_COMPOSER_ICON_SIZE,
  AURORA_COMPOSER_INPUT,
  AURORA_COMPOSER_RADIUS,
  AURORA_COMPOSER_SEND_BUTTON,
  AURORA_COMPOSER_SURFACE,
  AURORA_COMPOSER_SURFACE_FOCUS,
  AURORA_MOTION,
} from "./aurora-tokens";

export type AuroraComposerProps = {
  /** Content inside the floating composer bar (leading · input · trailing) */
  children: ReactNode;
  /** Chips, hints, attachments above the bar */
  meta?: ReactNode;
  /**
   * Reserved for AI ghost reply / suggestions.
   * TODO(Aurora PR-008): integrate AI ghost reply / suggestion layer.
   */
  aiSuggestionSlot?: ReactNode;
  disabled?: boolean;
  isSending?: boolean;
  isDragging?: boolean;
  dropLabel?: string;
  /** Align to Aurora reading lane */
  laneAligned?: boolean;
  inspectorOpen?: boolean;
  className?: string;
  surfaceClassName?: string;
  onDragEnter?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
};

/**
 * Aurora Composer — floating reply surface for conversation workspaces.
 * Logic-free shell; pair with module-specific send handlers.
 */
export function AuroraComposer({
  children,
  meta,
  aiSuggestionSlot,
  disabled = false,
  isSending = false,
  isDragging = false,
  dropLabel,
  laneAligned = true,
  inspectorOpen = false,
  className,
  surfaceClassName,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}: AuroraComposerProps) {
  const content = (
    <>
      {aiSuggestionSlot ? (
        <div className="mb-2 min-h-0">{aiSuggestionSlot}</div>
      ) : null}

      {meta ? <div className="mb-2 space-y-2">{meta}</div> : null}

      <AuroraComposerSurface
        disabled={disabled}
        isSending={isSending}
        className={surfaceClassName}
      >
        {children}
      </AuroraComposerSurface>
    </>
  );

  return (
    <div
      className={cn("relative bg-background px-0 pb-3 pt-0", className)}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isDragging && dropLabel ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 inset-y-0 z-20 flex items-center justify-center border-2 border-dashed border-border/25 bg-white dark:bg-background",
            AURORA_COMPOSER_RADIUS,
          )}
        >
          <p className="text-sm text-muted-foreground">{dropLabel}</p>
        </div>
      ) : null}

      {laneAligned ? (
        <div className={getConversationLaneClassName(inspectorOpen, "py-0")}>
          {content}
        </div>
      ) : (
        content
      )}
    </div>
  );
}

export type AuroraComposerSurfaceProps = {
  children: ReactNode;
  disabled?: boolean;
  isSending?: boolean;
  className?: string;
};

export function AuroraComposerSurface({
  children,
  disabled = false,
  isSending = false,
  className,
}: AuroraComposerSurfaceProps) {
  return (
    <div
      className={cn(
        AURORA_COMPOSER_SURFACE,
        AURORA_COMPOSER_SURFACE_FOCUS,
        AURORA_MOTION.hover,
        "transition-[border-color,opacity]",
        AURORA_MOTION.respectMotion,
        (disabled || isSending) && "opacity-60",
        className,
      )}
      aria-busy={isSending}
    >
      {children}
    </div>
  );
}

export type AuroraComposerIconButtonProps = {
  children: ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  "aria-expanded"?: boolean;
};

/** Quiet secondary control — attachment, emoji, etc. */
export function AuroraComposerIconButton({
  children,
  label,
  active = false,
  disabled = false,
  onClick,
  className,
  "aria-expanded": ariaExpanded,
}: AuroraComposerIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-expanded={ariaExpanded}
      className={cn(
        AURORA_COMPOSER_ICON_BUTTON,
        active && "bg-muted/30 text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

export type AuroraComposerAiPillProps = {
  label: string;
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

/** Visual AI entry — no modal or logic in Composer 2.0 */
export function AuroraComposerAiPill({
  label,
  disabled = false,
  active = false,
  onClick,
  className,
}: AuroraComposerAiPillProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        AURORA_COMPOSER_AI_PILL,
        active && AURORA_COMPOSER_AI_PILL_ACTIVE,
        className,
      )}
    >
      <span aria-hidden>✨</span>
      <span>{label}</span>
    </button>
  );
}

export type AuroraComposerSendButtonProps = {
  disabled?: boolean;
  isSending?: boolean;
  onClick?: () => void;
  label: string;
  sendingLabel: string;
  showText?: boolean;
  sendText?: string;
  sendingText?: string;
  className?: string;
};

/** Primary send action — icon-first control on the right */
export function AuroraComposerSendButton({
  disabled = false,
  isSending = false,
  onClick,
  label,
  sendingLabel,
  showText = false,
  sendText,
  sendingText,
  className,
}: AuroraComposerSendButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || isSending}
      onClick={onClick}
      title={isSending ? sendingLabel : label}
      aria-label={isSending ? sendingLabel : label}
      className={cn(
        AURORA_COMPOSER_SEND_BUTTON,
        AURORA_MOTION.hover,
        AURORA_MOTION.respectMotion,
        className,
      )}
    >
      {isSending ? (
        <Loader2 className={cn(AURORA_COMPOSER_ICON_SIZE, "animate-spin")} aria-hidden />
      ) : (
        <Send className={AURORA_COMPOSER_ICON_SIZE} aria-hidden />
      )}
      {showText && (sendText || sendingText) ? (
        <span className="hidden sm:inline">
          {isSending ? sendingText : sendText}
        </span>
      ) : null}
    </button>
  );
}

export type AuroraComposerInputProps = {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  disabled?: boolean;
  title?: string;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
};

/** Writing surface — borderless textarea inside the composer bar */
export function AuroraComposerInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  disabled = false,
  title,
  minHeight = 24,
  maxHeight = 132,
  className,
  inputRef,
}: AuroraComposerInputProps) {
  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 items-center py-1"
      style={{ maxHeight: maxHeight + 8 }}
    >
      <textarea
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder={placeholder}
        disabled={disabled}
        title={title}
        className={cn(AURORA_COMPOSER_INPUT, className)}
        style={{ maxHeight, minHeight }}
      />
    </div>
  );
}

export type AuroraComposerPopoverProps = {
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
};

export function AuroraComposerPopover({
  children,
  align = "left",
  className,
}: AuroraComposerPopoverProps) {
  return (
    <div
      className={cn(
        "absolute bottom-full z-20 mb-2 overflow-hidden rounded-2xl border border-border/20 bg-background py-1 shadow-none",
        align === "left" ? "left-0" : "right-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
