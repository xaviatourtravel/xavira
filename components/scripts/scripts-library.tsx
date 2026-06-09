"use client";

import { useMemo, useState } from "react";

import { ScriptCopyButton } from "@/components/scripts/script-copy-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  SCRIPT_CATEGORIES,
  SCRIPT_CATEGORY_LABELS,
  type SalesScript,
  type ScriptCategory,
} from "@/lib/scripts/default-scripts";
import { cn } from "@/lib/utils";

const CATEGORY_BADGE_CLASS: Record<ScriptCategory, string> = {
  opening: "bg-blue-100 text-blue-800",
  follow_up: "bg-amber-100 text-amber-900",
  proposal: "bg-violet-100 text-violet-800",
  negotiation: "bg-orange-100 text-orange-900",
  closing: "bg-green-100 text-green-800",
  lost_lead: "bg-slate-100 text-slate-800",
};

type ScriptsLibraryProps = {
  scripts: SalesScript[];
};

function matchesSearch(script: SalesScript, query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return (
    script.title.toLowerCase().includes(normalized) ||
    script.content.toLowerCase().includes(normalized) ||
    SCRIPT_CATEGORY_LABELS[script.category].toLowerCase().includes(normalized)
  );
}

export function ScriptsLibrary({ scripts }: ScriptsLibraryProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<ScriptCategory | "all">(
    "all",
  );

  const filteredScripts = useMemo(() => {
    return scripts.filter((script) => {
      const categoryMatch =
        activeCategory === "all" || script.category === activeCategory;

      return categoryMatch && matchesSearch(script, search);
    });
  }, [activeCategory, scripts, search]);

  return (
    <div className="space-y-4">
      <Input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Cari script berdasarkan judul atau isi..."
        aria-label="Cari script"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={cn(
            "rounded-md border px-3 py-2 text-sm transition-colors",
            activeCategory === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          Semua
        </button>

        {SCRIPT_CATEGORIES.map((category) => {
          const isActive = activeCategory === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "rounded-md border px-3 py-2 text-sm transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {SCRIPT_CATEGORY_LABELS[category]}
            </button>
          );
        })}
      </div>

      {filteredScripts.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm font-medium">Script tidak ditemukan</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Coba kata kunci lain atau pilih kategori berbeda.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredScripts.map((script) => (
            <Card key={script.id} className="flex flex-col">
              <CardHeader className="space-y-3 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{script.title}</CardTitle>
                  <span
                    className={cn(
                      "inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-medium",
                      CATEGORY_BADGE_CLASS[script.category],
                    )}
                  >
                    {SCRIPT_CATEGORY_LABELS[script.category]}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-4 pt-0">
                <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {script.content}
                </p>

                <ScriptCopyButton text={script.content} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
