"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

import { AURORA_MOTION } from "./aurora-tokens";

export type OverlayLayerProps = {
  /** When true, renders children in a fixed overlay stack */
  open: boolean;
  children: ReactNode;
  /** z-index tier — default sits above context sheets */
  tier?: "overlay" | "command";
  /** Click backdrop to dismiss */
  onDismiss?: () => void;
  className?: string;
  backdropClassName?: string;
};

const TIER_Z = {
  overlay: 70,
  command: 80,
} as const;

/**
 * Aurora Overlay Layer — reusable surface for AI Assistant, Command Palette, and future overlays.
 */
export function OverlayLayer({
  open,
  children,
  tier = "overlay",
  onDismiss,
  className,
  backdropClassName,
}: OverlayLayerProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && onDismiss) {
        event.preventDefault();
        onDismiss();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDismiss, open]);

  useEffect(() => {
    if (open && contentRef.current) {
      contentRef.current.focus();
    }
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const zIndex = TIER_Z[tier];

  return createPortal(
    <div
      className={cn("fixed inset-0", className)}
      style={{ zIndex }}
      role="presentation"
    >
      {onDismiss ? (
        <button
          type="button"
          aria-label="Dismiss overlay"
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity",
            AURORA_MOTION.sheet,
            AURORA_MOTION.spring,
            AURORA_MOTION.respectMotion,
            backdropClassName,
          )}
          onClick={onDismiss}
        />
      ) : null}

      <div
        ref={contentRef}
        tabIndex={-1}
        className="relative flex h-full w-full items-start justify-center outline-none md:items-center md:p-6"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
