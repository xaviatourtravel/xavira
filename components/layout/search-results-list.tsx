"use client";

import type { RefObject } from "react";

import {
  getDisplayTitle,
  type SearchResultsView,
  type UniversalSearchItem,
} from "@/lib/navigation/universal-search";
import { cn } from "@/lib/utils";

type SearchResultsListProps = {
  view: SearchResultsView;
  selectedIndex: number;
  query: string;
  onSelect: (index: number) => void;
  onNavigate: (item: UniversalSearchItem) => void;
  listRef?: RefObject<HTMLDivElement | null>;
  compact?: boolean;
};

function ResultButton({
  item,
  flatIndex,
  isSelected,
  compact,
  onSelect,
  onNavigate,
}: {
  item: UniversalSearchItem;
  flatIndex: number;
  isSelected: boolean;
  compact: boolean;
  onSelect: (index: number) => void;
  onNavigate: (item: UniversalSearchItem) => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      data-selected={isSelected}
      data-flat-index={flatIndex}
      onMouseEnter={() => onSelect(flatIndex)}
      onClick={() => onNavigate(item)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors",
        isSelected
          ? "bg-muted text-foreground"
          : "text-foreground/80 hover:bg-muted/60",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
          isSelected
            ? "bg-background text-foreground/80 shadow-sm"
            : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{getDisplayTitle(item)}</span>
        <span
          className={cn(
            "mt-0.5 block truncate text-xs text-muted-foreground",
            compact && !isSelected && "hidden",
          )}
        >
          {item.subtitle}
        </span>
      </span>
    </button>
  );
}

export function SearchResultsList({
  view,
  selectedIndex,
  query,
  onSelect,
  onNavigate,
  listRef,
  compact = false,
}: SearchResultsListProps) {
  if (!view.isEmptyQuery && view.flatItems.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm font-medium text-foreground/80">
          Tidak ada hasil yang cocok.
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Coba gunakan kata kunci lain.
        </p>
      </div>
    );
  }

  let flatOffset = 0;

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label="Hasil pencarian"
      className={cn("overflow-y-auto px-1.5 py-1.5", compact ? "max-h-[320px]" : "max-h-[380px]")}
    >
      {view.sections.map((section) => {
        const sectionStart = flatOffset;
        flatOffset += section.items.length;

        return (
          <div key={section.id} className="pb-1">
            <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item, index) => {
                const flatIndex = sectionStart + index;
                return (
                  <li key={item.id}>
                    <ResultButton
                      item={item}
                      flatIndex={flatIndex}
                      isSelected={flatIndex === selectedIndex}
                      compact={compact}
                      onSelect={onSelect}
                      onNavigate={onNavigate}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {view.isEmptyQuery && query.trim() === "" ? (
        <p className="px-2.5 pb-2 pt-1 text-center text-[11px] text-muted-foreground">
          Ketik nama customer, halaman, atau perintah seperti /settings
        </p>
      ) : null}
    </div>
  );
}
