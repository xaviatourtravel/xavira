"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  UNIVERSAL_SEARCH_CATEGORY_LABELS,
  filterUniversalSearchItems,
} from "@/lib/navigation/universal-search";
import { cn } from "@/lib/utils";

export function UniversalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const results = useMemo(() => filterUniversalSearchItems(query), [query]);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (results.length === 0) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((index) => (index + 1) % results.length);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((index) => (index - 1 + results.length) % results.length);
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const item = results[selectedIndex];
        if (item) {
          navigate(item.href);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, navigate, open, results, selectedIndex]);

  useEffect(() => {
    if (!open || !listRef.current) {
      return;
    }

    const selected = listRef.current.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ block: "nearest" });
  }, [open, selectedIndex]);

  const palette =
    open && mounted ? (
      <>
        <button
          type="button"
          aria-label="Close search"
          className="fixed inset-0 z-40 bg-slate-950/10 md:bg-slate-950/[0.04]"
          onClick={close}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-label="Universal search"
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden bg-white shadow-2xl",
            "inset-0 pt-[env(safe-area-inset-top)]",
            "md:inset-auto md:top-[72px] md:max-h-[min(480px,calc(100vh-88px))] md:w-[min(640px,calc(100vw-17.5rem-2rem))] md:rounded-xl md:ring-1 md:ring-slate-200/80",
            "md:left-[calc(17.5rem+max(1rem,(100vw-17.5rem-min(640px,100vw-17.5rem-2rem))/2))]",
          )}
        >
          <div className="border-b border-slate-100 px-4 py-3 md:px-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari customer, booking, task, chat, knowledge…"
                className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Navigasi cepat workspace. AI dan Knowledge tersedia sebagai layer
              kontekstual, bukan menu utama.
            </p>
          </div>

          <ul ref={listRef} className="flex-1 overflow-y-auto p-2 md:max-h-[360px]">
            {results.length === 0 ? (
              <li className="px-3 py-10 text-center text-sm text-slate-500">
                Tidak ada hasil untuk &ldquo;{query}&rdquo;
              </li>
            ) : (
              results.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === selectedIndex;

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      data-selected={isSelected}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => navigate(item.href)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                        isSelected
                          ? "bg-slate-100 text-slate-950"
                          : "text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSelected ? "text-slate-700" : "text-slate-400",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {item.subtitle}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-md bg-slate-200/70 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {UNIVERSAL_SEARCH_CATEGORY_LABELS[item.category]}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <div className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400 md:flex md:items-center md:justify-between">
            <span className="hidden md:inline">↑↓ navigasi · Enter buka · Esc tutup</span>
            <span className="md:ml-auto">Ctrl K</span>
          </div>
        </div>
      </>
    ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-9 min-w-[220px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-sm text-slate-500 transition-colors hover:bg-slate-100 md:flex lg:min-w-[280px]"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Cari…</span>
        <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          Ctrl K
        </kbd>
      </button>

      <button
        type="button"
        aria-label="Open search"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 md:hidden"
      >
        <Search className="h-4 w-4" />
      </button>

      {palette ? createPortal(palette, document.body) : null}
    </>
  );
}
