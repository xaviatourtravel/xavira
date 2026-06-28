"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { SearchResultsList } from "@/components/layout/search-results-list";
import { Input } from "@/components/ui/input";
import { filterUniversalSearchItems } from "@/lib/navigation/universal-search";
import { cn } from "@/lib/utils";

type SearchMode = "dropdown" | "palette" | null;

const DROPDOWN_MAX_WIDTH = 520;

export function UniversalSearch() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [mode, setMode] = useState<SearchMode>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 280 });

  const results = useMemo(() => filterUniversalSearchItems(query), [query]);
  const open = mode !== null;

  const close = useCallback(() => {
    setMode(null);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  const openDropdown = useCallback(() => {
    setMode("dropdown");
  }, []);

  const openPalette = useCallback(() => {
    setMode("palette");
  }, []);

  const togglePalette = useCallback(() => {
    setMode((current) => (current === "palette" ? null : "palette"));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, mode]);

  useEffect(() => {
    if (mode !== "dropdown" || !triggerRef.current) {
      return;
    }

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const width = Math.min(
        DROPDOWN_MAX_WIDTH,
        Math.max(rect.width, 280),
        window.innerWidth - 16,
      );

      setDropdownStyle({
        top: rect.bottom + 6,
        left: Math.min(rect.left, window.innerWidth - width - 8),
        width,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [mode]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, mode]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        togglePalette();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePalette]);

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

  useEffect(() => {
    if (mode !== "dropdown") {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [close, mode]);

  const dropdownPanel =
    mode === "dropdown" && mounted ? (
      <div
        role="listbox"
        aria-label="Hasil pencarian"
        className="fixed z-50 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-lg ring-1 ring-slate-200/60"
        style={{
          top: dropdownStyle.top,
          left: dropdownStyle.left,
          width: dropdownStyle.width,
        }}
      >
        <div className="border-b border-slate-100 px-3 py-2">
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari apa saja..."
            className="h-9 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          />
        </div>
        <SearchResultsList
          listRef={listRef}
          results={results}
          selectedIndex={selectedIndex}
          query={query}
          onSelect={setSelectedIndex}
          onNavigate={navigate}
          compact
        />
      </div>
    ) : null;

  const palettePanel =
    mode === "palette" && mounted ? (
      <>
        <button
          type="button"
          aria-label="Tutup pencarian"
          className="fixed inset-0 z-40 bg-slate-950/[0.06] md:bg-slate-950/[0.04]"
          onClick={close}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden bg-white shadow-2xl",
            "inset-0 pt-[env(safe-area-inset-top)]",
            "md:inset-auto md:top-24 md:max-h-[min(480px,calc(100vh-104px))] md:w-[min(640px,calc(100vw-17.5rem-2rem))] md:rounded-xl md:ring-1 md:ring-slate-200/80",
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
                placeholder="Cari customer, booking, task, chat, knowledge..."
                className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Navigasi cepat workspace. AI dan Knowledge tersedia sebagai layer
              kontekstual, bukan menu utama.
            </p>
          </div>

          <SearchResultsList
            listRef={listRef}
            results={results}
            selectedIndex={selectedIndex}
            query={query}
            onSelect={setSelectedIndex}
            onNavigate={navigate}
          />

          <div className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400 md:flex md:items-center md:justify-between">
            <span className="hidden md:inline">↑↓ navigasi · Enter buka · Esc tutup</span>
            <span className="md:ml-auto">Ctrl K</span>
          </div>
        </div>
      </>
    ) : null;

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1 md:max-w-[280px] lg:max-w-[320px]">
      <button
        ref={triggerRef}
        type="button"
        onClick={openDropdown}
        className="hidden h-9 w-full min-w-[220px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-sm text-slate-500 transition-colors hover:bg-slate-100 md:flex"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Cari...</span>
        <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          Ctrl K
        </kbd>
      </button>

      <button
        type="button"
        aria-label="Buka pencarian"
        onClick={openPalette}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 md:hidden"
      >
        <Search className="h-4 w-4" />
      </button>

      {dropdownPanel ? createPortal(dropdownPanel, document.body) : null}
      {palettePanel ? createPortal(palettePanel, document.body) : null}
    </div>
  );
}
