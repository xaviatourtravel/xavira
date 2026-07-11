"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  AURORA_INTERNAL_NOTES_SHEET_WIDTH,
  AURORA_INTERNAL_NOTES_TEXTAREA,
} from "@/components/workspace/aurora-tokens";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import { cn } from "@/lib/utils";

type AddInternalNoteSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (content: string) => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function AddInternalNoteSheet({
  open,
  onOpenChange,
  onSave,
  returnFocusRef,
}: AddInternalNoteSheetProps) {
  const { ti } = useInboxTranslation();
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");

  const close = useCallback(() => {
    onOpenChange(false);
    setDraft("");
    requestAnimationFrame(() => {
      returnFocusRef?.current?.focus();
    });
  }, [onOpenChange, returnFocusRef]);

  const handleSave = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    onSave(trimmed);
    onOpenChange(false);
    setDraft("");
    requestAnimationFrame(() => {
      returnFocusRef?.current?.focus();
    });
  }, [draft, onOpenChange, onSave, returnFocusRef]);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) {
      return;
    }

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, [open]);

  useEffect(() => {
    if (!open || !panelRef.current) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const panel = panelRef.current;
      if (!panel) {
        return;
      }

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, [draft, open]);

  function handleTextareaKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleSave();
    }
  }

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <>
      <button
        type="button"
        aria-label={ti("internalNotesCancel")}
        className="fixed inset-0 z-[60] bg-black/40 animate-in fade-in duration-100 motion-reduce:animate-none"
        onClick={close}
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "fixed z-[61] flex flex-col overflow-hidden bg-background shadow-xl outline-none",
          "inset-x-0 bottom-0 max-h-[90dvh] border-t border-border/20",
          "md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:border-l md:border-t-0",
          AURORA_INTERNAL_NOTES_SHEET_WIDTH,
          "animate-in slide-in-from-bottom duration-200 md:slide-in-from-right motion-reduce:animate-none",
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/15 px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold text-foreground">
            {ti("internalNotesAddSheetTitle")}
          </h2>
          <button
            type="button"
            aria-label={ti("internalNotesCancel")}
            onClick={close}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder={ti("internalNotesPlaceholder")}
            aria-label={ti("internalNotesPlaceholder")}
            rows={4}
            className={AURORA_INTERNAL_NOTES_TEXTAREA}
          />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/15 px-5 py-4">
          <button
            type="button"
            onClick={close}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-9 rounded-full px-4 text-sm shadow-none",
            )}
          >
            {ti("internalNotesCancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!draft.trim()}
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-9 rounded-full px-4 text-sm shadow-none",
            )}
          >
            {ti("internalNotesSave")}
          </button>
        </div>
      </aside>
    </>,
    document.body,
  );
}
