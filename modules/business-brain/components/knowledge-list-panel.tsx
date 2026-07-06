"use client";

import { Plus } from "lucide-react";

import { DsButton } from "@/components/design-system/button";
import { DsCard } from "@/components/design-system/card";
import { DsSearchInput } from "@/components/design-system/form-controls";
import { ClientOnlyRelativeTime } from "@/components/omnichannel-inbox/client-only-relative-time";
import {
  BRAIN_ARTICLE_CATEGORIES,
  BRAIN_ARTICLE_CATEGORY_LABELS,
  BRAIN_ARTICLE_STATUS_LABELS,
  type BrainArticleCategory,
  type BrainArticleListItem,
  type BrainArticleStatus,
} from "@/modules/business-brain/types/knowledge";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: Array<BrainArticleStatus | "all"> = ["all", "draft", "published"];

type KnowledgeListPanelProps = {
  articles: BrainArticleListItem[];
  selectedArticleId: string | null;
  search: string;
  categoryFilter: BrainArticleCategory | "all";
  statusFilter: BrainArticleStatus | "all";
  canEdit: boolean;
  isCreating: boolean;
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: BrainArticleCategory | "all") => void;
  onStatusFilterChange: (value: BrainArticleStatus | "all") => void;
  onSelectArticle: (articleId: string) => void;
  onCreateArticle: () => void;
};

function statusBadgeClass(status: BrainArticleStatus) {
  if (status === "published") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300";
  }
  return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300";
}

export function KnowledgeListPanel({
  articles,
  selectedArticleId,
  search,
  categoryFilter,
  statusFilter,
  canEdit,
  isCreating,
  onSearchChange,
  onCategoryFilterChange,
  onStatusFilterChange,
  onSelectArticle,
  onCreateArticle,
}: KnowledgeListPanelProps) {
  const normalizedSearch = search.trim().toLowerCase();

  const filteredArticles = articles.filter((article) => {
    const matchesCategory =
      categoryFilter === "all" ? true : article.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" ? true : article.status === statusFilter;
    const matchesSearch =
      !normalizedSearch ||
      article.title.toLowerCase().includes(normalizedSearch) ||
      BRAIN_ARTICLE_CATEGORY_LABELS[article.category]
        .toLowerCase()
        .includes(normalizedSearch);

    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <DsCard className="p-4 md:p-5">
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">Knowledge List</h2>
          {canEdit ? (
            <DsButton
              type="button"
              size="sm"
              onClick={onCreateArticle}
              loading={isCreating}
            >
              <Plus className="h-4 w-4" />
              New Article
            </DsButton>
          ) : null}
        </div>
        <DsSearchInput
          placeholder="Search knowledge..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onCategoryFilterChange("all")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              categoryFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            All Categories
          </button>
          {BRAIN_ARTICLE_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryFilterChange(category)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                categoryFilter === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {BRAIN_ARTICLE_CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onStatusFilterChange(filter)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {filter === "all" ? "All Status" : BRAIN_ARTICLE_STATUS_LABELS[filter]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filteredArticles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No articles match your filters.
          </div>
        ) : (
          filteredArticles.map((article) => {
            const selected = article.id === selectedArticleId;

            return (
              <button
                key={article.id}
                type="button"
                onClick={() => onSelectArticle(article.id)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-background hover:border-primary/30 hover:bg-muted/30",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{article.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {BRAIN_ARTICLE_CATEGORY_LABELS[article.category]}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      statusBadgeClass(article.status),
                    )}
                  >
                    {BRAIN_ARTICLE_STATUS_LABELS[article.status]}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Updated{" "}
                  <ClientOnlyRelativeTime date={article.updatedAt} className="inline" />
                </p>
              </button>
            );
          })
        )}
      </div>
    </DsCard>
  );
}
