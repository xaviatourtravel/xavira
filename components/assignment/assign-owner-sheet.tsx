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
import { Search, X } from "lucide-react";

import {
  AURORA_ASSIGNMENT_SHEET_SEARCH,
  AURORA_ASSIGNMENT_SHEET_WIDTH,
} from "@/components/workspace/aurora-tokens";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import { cn } from "@/lib/utils";

import { TeamMemberRow } from "./team-member-row";
import type { AssignmentLabels, Owner } from "./types";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

type AssignOwnerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Owner[];
  currentOwnerId: string | null;
  onSelect: (member: Owner) => void;
  labels: AssignmentLabels;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
};

export function AssignOwnerSheet({
  open,
  onOpenChange,
  team,
  currentOwnerId,
  onSelect,
  labels,
  returnFocusRef,
}: AssignOwnerSheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [query, setQuery] = useState("");

  const filteredTeam = team.filter((member) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return true;
    }

    return (
      member.name.toLowerCase().includes(normalized) ||
      member.role.toLowerCase().includes(normalized)
    );
  });

  const close = useCallback(() => {
    onOpenChange(false);
    setQuery("");
    requestAnimationFrame(() => {
      returnFocusRef?.current?.focus();
    });
  }, [onOpenChange, returnFocusRef]);

  const handleSelect = useCallback(
    (member: Owner) => {
      onSelect(member);
      close();
    },
    [close, onSelect],
  );

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) {
      return;
    }

    requestAnimationFrame(() => {
      searchRef.current?.focus();
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

  const handleListKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    const currentIndex = items.findIndex((item) => item === document.activeElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      items[next]?.focus();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const previous = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
      items[previous]?.focus();
      return;
    }

    if (event.key === "Enter" && currentIndex >= 0) {
      event.preventDefault();
      const member = filteredTeam[currentIndex];
      if (member) {
        handleSelect(member);
      }
    }
  };

  if (!open || typeof document === "undefined") {
    return null;
  }

  itemRefs.current = [];

  return createPortal(
    <>
      <button
        type="button"
        aria-label={labels.closeAriaLabel}
        className="fixed inset-0 z-[60] bg-black/40 animate-in fade-in duration-100 motion-reduce:animate-none"
        onClick={close}
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={cn(
          "fixed z-[61] flex flex-col overflow-hidden bg-background shadow-xl outline-none",
          "inset-x-0 bottom-0 max-h-[90dvh] border-t border-border/20",
          "md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:border-l md:border-t-0",
          AURORA_ASSIGNMENT_SHEET_WIDTH,
          "animate-in slide-in-from-bottom duration-200 md:slide-in-from-right motion-reduce:animate-none",
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/15 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-foreground">
              {labels.sheetTitle}
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">
              {labels.sheetSubtext}
            </p>
          </div>
          <button
            type="button"
            aria-label={labels.closeAriaLabel}
            onClick={close}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50"
              aria-hidden
            />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={labels.searchPlaceholder}
              aria-label={labels.searchPlaceholder}
              className={AURORA_ASSIGNMENT_SHEET_SEARCH}
            />
          </div>

          <div
            role="listbox"
            aria-label={labels.sheetTitle}
            className="mt-3 flex flex-col gap-0.5"
            onKeyDown={handleListKeyDown}
          >
            {filteredTeam.map((member, index) => (
              <TeamMemberRow
                key={member.id}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                member={member}
                labels={labels}
                isCurrentOwner={member.id === currentOwnerId}
                onSelect={() => handleSelect(member)}
              />
            ))}
          </div>
        </div>
      </aside>
    </>,
    document.body,
  );
}
