"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { SearchResultsList } from "@/components/layout/search-results-list";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_RECENT_SEARCHES,
  pushRecentSearch,
  readRecentSearches,
  type RecentSearchEntry,
} from "@/lib/navigation/recent-searches.client";
import {
  buildUniversalSearchResults,
  getDisplayTitle,
  getNextSectionStartIndex,
  type UniversalSearchItem,
} from "@/lib/navigation/universal-search";
import { cn } from "@/lib/utils";

type SearchMode = "dropdown" | "palette" | null;

const DROPDOWN_MAX_WIDTH = 540;

type UniversalSearchContextValue = {
  rootRef: React.RefObject<HTMLDivElement | null>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  openDropdown: () => void;
  openPalette: () => void;
};

const UniversalSearchContext = createContext<UniversalSearchContextValue | null>(null);

function useUniversalSearchContext() {
  const context = useContext(UniversalSearchContext);
  if (!context) {
    throw new Error("UniversalSearch components must be used within UniversalSearchScope");
  }
  return context;
}

export function UniversalSearchScope({ children }: { children: ReactNode }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<SearchMode>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearchEntry[]>(
    DEFAULT_RECENT_SEARCHES,
  );
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 280 });

  const resultsView = useMemo(
    () => buildUniversalSearchResults(query, recentSearches),
    [query, recentSearches],
  );
  const flatResults = resultsView.flatItems;
  const open = mode !== null;

  const close = useCallback(() => {
    setMode(null);
  }, []);

  const navigate = useCallback(
    (item: UniversalSearchItem) => {
      pushRecentSearch({
        id: item.id,
        label: getDisplayTitle(item),
        href: item.href,
      });
      setRecentSearches(readRecentSearches());
      close();
      router.push(item.href);
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
    setRecentSearches(readRecentSearches());
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

      if (event.key === "Tab" && flatResults.length > 0) {
        event.preventDefault();
        setSelectedIndex((index) => getNextSectionStartIndex(resultsView, index));
        return;
      }

      if (flatResults.length === 0) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((index) => (index + 1) % flatResults.length);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((index) => (index - 1 + flatResults.length) % flatResults.length);
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const item = flatResults[selectedIndex];
        if (item) {
          navigate(item);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, flatResults, navigate, open, resultsView, selectedIndex]);

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
        const target = event.target as HTMLElement;
        if (!target.closest('[data-universal-search-panel="true"]')) {
          close();
        }
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [close, mode]);

  const panelProps = {
    listRef,
    view: resultsView,
    selectedIndex,
    query,
    onSelect: setSelectedIndex,
    onNavigate: navigate,
  };

  const dropdownPanel =
    mode === "dropdown" && mounted ? (
      <div
        data-universal-search-panel="true"
        className="fixed z-[60] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/70"
        style={{
          top: dropdownStyle.top,
          left: dropdownStyle.left,
          width: dropdownStyle.width,
        }}
      >
        <div className="border-b border-slate-100 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari customer, halaman, atau perintah..."
              className="h-9 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 lg:text-sm"
            />
          </div>
        </div>
        <SearchResultsList {...panelProps} compact />
      </div>
    ) : null;

  const palettePanel =
    mode === "palette" && mounted ? (
      <>
        <button
          type="button"
          aria-label="Tutup pencarian"
          className="fixed inset-0 z-[60] bg-black/40 lg:bg-slate-950/[0.05] lg:backdrop-blur-[1px]"
          onClick={close}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          data-universal-search-panel="true"
          className={cn(
            "fixed z-[70] flex flex-col overflow-hidden bg-white shadow-2xl",
            "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl pb-[env(safe-area-inset-bottom)]",
            "lg:inset-auto lg:bottom-auto lg:max-h-[min(520px,calc(100vh-6rem))] lg:w-[min(680px,calc(100vw-17.5rem-2rem))] lg:rounded-2xl lg:pb-0 lg:ring-1 lg:ring-slate-200/70",
            "lg:top-[5.5rem] lg:left-[calc(17.5rem+max(1rem,(100vw-17.5rem-min(680px,100vw-17.5rem-2rem))/2))]",
          )}
        >
          <div className="border-b border-slate-100 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari customer, chat, invoice, halaman, atau /perintah..."
                className="h-11 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 lg:text-[15px]"
              />
            </div>
          </div>

          <SearchResultsList {...panelProps} />

          <div className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400 lg:flex lg:items-center lg:justify-between">
            <span className="hidden lg:inline">
              ↑↓ navigasi · Tab kategori · Enter buka · Esc tutup
            </span>
            <span className="lg:ml-auto rounded-md bg-slate-50 px-1.5 py-0.5 font-medium text-slate-500">
              Ctrl K
            </span>
          </div>
        </div>
      </>
    ) : null;

  const contextValue = useMemo(
    () => ({
      rootRef,
      triggerRef,
      openDropdown,
      openPalette,
    }),
    [openDropdown, openPalette],
  );

  return (
    <UniversalSearchContext.Provider value={contextValue}>
      {children}
      {dropdownPanel ? createPortal(dropdownPanel, document.body) : null}
      {palettePanel ? createPortal(palettePanel, document.body) : null}
    </UniversalSearchContext.Provider>
  );
}

export function UniversalSearchBar({ className }: { className?: string }) {
  const { rootRef, triggerRef, openDropdown } = useUniversalSearchContext();

  return (
    <div ref={rootRef} className={cn("relative min-w-0 w-full max-w-[340px]", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={openDropdown}
        className="flex h-9 w-full min-w-[220px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 transition-colors hover:bg-slate-100"
      >
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="flex-1 text-left">Cari...</span>
        <kbd className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          Ctrl K
        </kbd>
      </button>
    </div>
  );
}

export function UniversalSearchIconButton({ className }: { className?: string }) {
  const { openPalette } = useUniversalSearchContext();

  return (
    <button
      type="button"
      aria-label="Buka pencarian"
      onClick={openPalette}
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50",
        className,
      )}
    >
      <Search className="h-4 w-4" />
    </button>
  );
}

/** @deprecated Use UniversalSearchScope + UniversalSearchBar + UniversalSearchIconButton */
export function UniversalSearch() {
  return (
    <UniversalSearchScope>
      <UniversalSearchBar className="hidden lg:flex" />
      <UniversalSearchIconButton className="lg:hidden" />
    </UniversalSearchScope>
  );
}
