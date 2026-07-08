"use client";

import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import { cn } from "@/lib/utils";

import {
  AURORA_CONTEXT_SHEET_WIDTH,
  AURORA_MOTION,
  AURORA_SHEET_RADIUS,
  type AuroraContextSheetWidth,
} from "./aurora-tokens";

export type ContextSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: AuroraContextSheetWidth;
  /** Accessible label override */
  ariaLabel?: string;
  className?: string;
  contentClassName?: string;
};

/**
 * Aurora Context Sheet — slide-over context panel replacing permanent right inspectors.
 */
export function ContextSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  footer,
  width = "lg",
  ariaLabel,
  className,
  contentClassName,
}: ContextSheetProps) {
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close context panel"
        className={cn(
          "fixed inset-0 z-[60] bg-black/40 transition-opacity",
          AURORA_MOTION.sheet,
          AURORA_MOTION.spring,
          AURORA_MOTION.respectMotion,
          "animate-in fade-in",
        )}
        onClick={close}
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label={ariaLabel}
        tabIndex={-1}
        className={cn(
          "fixed z-[61] flex flex-col overflow-hidden bg-background shadow-2xl outline-none",
          "inset-x-0 bottom-0 max-h-[90dvh] border-t border-border/60",
          "md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-full md:border-l md:border-t-0",
          AURORA_SHEET_RADIUS,
          "md:rounded-none md:rounded-l-[20px]",
          AURORA_CONTEXT_SHEET_WIDTH[width],
          "animate-in slide-in-from-bottom duration-[260ms] md:slide-in-from-right",
          AURORA_MOTION.spring,
          AURORA_MOTION.respectMotion,
          className,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/40 px-4 py-3 md:px-5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="truncate text-base font-semibold text-foreground">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-5",
            contentClassName,
          )}
        >
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-border/40 px-4 py-3 md:px-5">{footer}</div>
        ) : null}
      </aside>
    </>,
    document.body,
  );
}
