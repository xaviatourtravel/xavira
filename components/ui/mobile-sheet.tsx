"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import { cn } from "@/lib/utils";

type MobileSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** bottom sheet on mobile; fullscreen for command palette style */
  variant?: "bottom" | "fullscreen";
  className?: string;
  contentClassName?: string;
  ariaLabel?: string;
};

export function MobileSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  variant = "bottom",
  className,
  contentClassName,
  ariaLabel,
}: MobileSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

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
        aria-label="Tutup"
        className="fixed inset-0 z-[60] bg-black/40 lg:hidden"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        tabIndex={-1}
        className={cn(
          "fixed z-[60] flex flex-col overflow-hidden bg-white shadow-2xl outline-none lg:hidden",
          variant === "fullscreen"
            ? "inset-0 pt-[env(safe-area-inset-top)]"
            : "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl pb-[env(safe-area-inset-bottom)]",
          className,
        )}
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-950">{title}</p>
            {subtitle ? (
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Tutup panel"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain",
            contentClassName,
          )}
        >
          {children}
        </div>

        {footer ? (
          <div className="sticky bottom-0 shrink-0 border-t border-slate-100 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        ) : null}
      </div>
    </>,
    document.body,
  );
}
