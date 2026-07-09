"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  QUICK_CREATE_ITEMS,
  type QuickCreateItem,
} from "@/lib/navigation/quick-create-items";
import { cn } from "@/lib/utils";

export function QuickCreateMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const navigate = useCallback(
    (item: QuickCreateItem) => {
      close();
      router.push(item.href);
    },
    [close, router],
  );

  useEffect(() => {
    if (!open) {
      setSelectedIndex(0);
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [close, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        triggerRef.current?.focus();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((index) => (index + 1) % QUICK_CREATE_ITEMS.length);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex(
          (index) => (index - 1 + QUICK_CREATE_ITEMS.length) % QUICK_CREATE_ITEMS.length,
        );
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const item = QUICK_CREATE_ITEMS[selectedIndex];
        if (item) {
          navigate(item);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, navigate, open, selectedIndex]);

  useEffect(() => {
    if (!open || !listRef.current) {
      return;
    }

    const selected = listRef.current.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ block: "nearest" });
  }, [open, selectedIndex]);

  return (
    <div ref={rootRef} className="relative">
      <Button
        ref={triggerRef}
        type="button"
        size="sm"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Buat cepat"
        className="hidden h-10 gap-1.5 rounded-xl bg-emerald-600 px-2.5 text-sm font-medium hover:bg-emerald-700 md:inline-flex"
        onClick={() => setOpen((value) => !value)}
      >
        <Plus className="h-[18px] w-[18px]" strokeWidth={1.75} />
        <span className="hidden sm:inline">Buat</span>
      </Button>

      {open ? (
        <div
          role="menu"
          aria-label="Buat Cepat"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Buat Cepat</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Aksi global untuk memulai pekerjaan baru.
            </p>
          </div>

          <ul ref={listRef} className="max-h-80 overflow-y-auto p-1.5">
            {QUICK_CREATE_ITEMS.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              const isComingSoon = item.status === "coming_soon";

              return (
                <li key={item.id} role="none">
                  <Link
                    role="menuitem"
                    href={item.href}
                    data-selected={isSelected}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={close}
                    className={cn(
                      "flex min-h-[44px] items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
                      isSelected ? "bg-muted" : "hover:bg-muted/60",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        isComingSoon
                          ? "bg-muted text-muted-foreground"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {item.label}
                        </span>
                        {isComingSoon ? (
                          <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                            Segera
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
