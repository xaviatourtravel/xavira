"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  KNOWLEDGE_CATEGORY_OPTIONS,
  type KnowledgeCategory,
} from "@/lib/knowledge/constants";

type KnowledgeFiltersBarProps = {
  category: KnowledgeCategory | null;
  query: string | null;
  tag: string | null;
  tagCloud: string[];
};

export function KnowledgeFiltersBar({
  category,
  query,
  tag,
  tagCloud,
}: KnowledgeFiltersBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(query ?? "");

  function pushWith(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    const queryString = params.toString();
    router.push(queryString ? `/knowledge?${queryString}` : "/knowledge");
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pushWith({ q: searchValue.trim() || null });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Cari knowledge berdasarkan judul, isi, atau tag..."
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <Button type="submit">Cari</Button>
        {query ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearchValue("");
              pushWith({ q: null });
            }}
          >
            Reset
          </Button>
        ) : null}
      </form>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => pushWith({ category: null })}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm transition-colors",
            category === null
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent",
          )}
        >
          Semua
        </button>
        {KNOWLEDGE_CATEGORY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => pushWith({ category: option.value })}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              category === option.value
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {tagCloud.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Tags:</span>
          {tag ? (
            <button
              type="button"
              onClick={() => pushWith({ tag: null })}
              className="rounded-full bg-primary px-2.5 py-0.5 text-xs text-primary-foreground"
            >
              #{tag} &times;
            </button>
          ) : null}
          {tagCloud
            .filter((item) => item !== tag)
            .map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => pushWith({ tag: item })}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent"
              >
                #{item}
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}
