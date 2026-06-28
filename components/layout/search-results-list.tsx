"use client";

import type { RefObject } from "react";

import {
  UNIVERSAL_SEARCH_CATEGORY_LABELS,
  type UniversalSearchItem,
} from "@/lib/navigation/universal-search";
import { cn } from "@/lib/utils";

type SearchResultsListProps = {
  results: UniversalSearchItem[];
  selectedIndex: number;
  query: string;
  onSelect: (index: number) => void;
  onNavigate: (href: string) => void;
  listRef?: RefObject<HTMLUListElement | null>;
  compact?: boolean;
};

export function SearchResultsList({
  results,
  selectedIndex,
  query,
  onSelect,
  onNavigate,
  listRef,
  compact = false,
}: SearchResultsListProps) {
  if (results.length === 0) {
    return (
      <div className="px-3 py-8 text-center text-sm text-slate-500">
        Tidak ada hasil untuk &ldquo;{query}&rdquo;
      </div>
    );
  }

  return (
    <ul
      ref={listRef}
      className={cn("overflow-y-auto p-1.5", compact ? "max-h-[280px]" : "max-h-[360px]")}
    >
      {results.map((item, index) => {
        const Icon = item.icon;
        const isSelected = index === selectedIndex;

        return (
          <li key={item.id}>
            <button
              type="button"
              data-selected={isSelected}
              onMouseEnter={() => onSelect(index)}
              onClick={() => onNavigate(item.href)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                isSelected ? "bg-slate-100 text-slate-950" : "text-slate-700 hover:bg-slate-50",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isSelected ? "text-slate-700" : "text-slate-400",
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.title}</span>
                {!compact ? (
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {item.subtitle}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                {UNIVERSAL_SEARCH_CATEGORY_LABELS[item.category]}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
