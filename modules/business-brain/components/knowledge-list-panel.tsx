"use client";

import { Plus } from "lucide-react";

import { DsButton } from "@/components/design-system/button";
import { DsSearchInput } from "@/components/design-system/form-controls";
import { ClientOnlyRelativeTime } from "@/components/omnichannel-inbox/client-only-relative-time";
import { BusinessBrainCompactSection } from "@/modules/business-brain/components/business-brain-content-shell";
import { ExpandableList } from "@/modules/business-brain/components/expandable-list";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
import {
  BB_COMPACT_LIST_IDLE_CLASS,
  BB_COMPACT_LIST_SELECTED_CLASS,
} from "@/modules/business-brain/lib/business-brain-compact-styles";
import {
  bbArticleCategoryLabel,
  bbArticleStatusLabel,
  bbDisplayArticleTitle,
} from "@/modules/business-brain/lib/bb-ui-labels";
import {
  BRAIN_ARTICLE_CATEGORIES,
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
  const { bb } = useBbTranslation();
  const normalizedSearch = search.trim().toLowerCase();

  const filteredArticles = articles.filter((article) => {
    const matchesCategory =
      categoryFilter === "all" ? true : article.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" ? true : article.status === statusFilter;
    const matchesSearch =
      !normalizedSearch ||
      article.title.toLowerCase().includes(normalizedSearch) ||
      bbArticleCategoryLabel(bb, article.category)
        .toLowerCase()
        .includes(normalizedSearch);

    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <BusinessBrainCompactSection title={bb("knowledgeList")}>
      <div className="mb-3 space-y-2.5">
        {canEdit ? (
          <div className="flex justify-end">
            <DsButton
              type="button"
              size="sm"
              onClick={onCreateArticle}
              loading={isCreating}
            >
              <Plus className="h-4 w-4" />
              {bb("newArticle")}
            </DsButton>
          </div>
        ) : null}
        <DsSearchInput
          placeholder={bb("searchKnowledge")}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-8 min-h-8 py-1 text-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onCategoryFilterChange("all")}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
              categoryFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {bb("allCategories")}
          </button>
          {BRAIN_ARTICLE_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryFilterChange(category)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                categoryFilter === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {bbArticleCategoryLabel(bb, category)}
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
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                statusFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {filter === "all" ? bb("allStatus") : bbArticleStatusLabel(bb, filter)}
            </button>
          ))}
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-center text-sm text-muted-foreground">
          {bb("noArticlesMatch")}
        </div>
      ) : (
        <ExpandableList
          items={filteredArticles}
          itemsClassName="space-y-1.5"
          getItemKey={(article) => article.id}
          renderItem={(article) => {
            const selected = article.id === selectedArticleId;

            return (
              <button
                type="button"
                onClick={() => onSelectArticle(article.id)}
                className={cn(
                  "w-full rounded-lg border p-2.5 text-left transition-colors",
                  selected ? BB_COMPACT_LIST_SELECTED_CLASS : BB_COMPACT_LIST_IDLE_CLASS,
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {bbDisplayArticleTitle(bb, article.title)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {bbArticleCategoryLabel(bb, article.category)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      statusBadgeClass(article.status),
                    )}
                  >
                    {bbArticleStatusLabel(bb, article.status)}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {bb("updated")}{" "}
                  <ClientOnlyRelativeTime date={article.updatedAt} className="inline" />
                </p>
              </button>
            );
          }}
        />
      )}
    </BusinessBrainCompactSection>
  );
}
