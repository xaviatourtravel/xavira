"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ParticipantModalShellProps = {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  ariaLabelledBy?: string;
};

export function ParticipantModalShell({
  title,
  description,
  onClose,
  children,
  footer,
  ariaLabelledBy = "participant-modal-title",
}: ParticipantModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Tutup modal"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        className={cn(
          "relative z-10 flex w-[calc(100vw-24px)] max-w-[600px] flex-col overflow-hidden rounded-lg border bg-background shadow-lg",
          "max-h-[calc(100vh-24px)] sm:max-h-[calc(100vh-48px)]",
        )}
      >
        <div className="shrink-0 border-b px-4 py-3 sm:px-5">
          <h3 id={ariaLabelledBy} className="text-base font-semibold sm:text-lg">
            {title}
          </h3>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              {description}
            </p>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>

        <div className="shrink-0 border-t bg-background px-4 py-3 sm:px-5">
          {footer}
        </div>
      </div>
    </div>
  );
}

export const participantInputClassName =
  "mt-1 min-w-0 w-full rounded-md border px-3 py-2 text-sm";

export const participantUrlInputClassName = cn(
  participantInputClassName,
  "truncate",
);
