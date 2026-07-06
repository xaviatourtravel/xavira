"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import {
  createBrainArticleAction,
  loadBrainArticleAction,
} from "@/modules/business-brain/actions/knowledge-actions";
import { KnowledgeEditor } from "@/modules/business-brain/components/knowledge-editor";
import { KnowledgeListPanel } from "@/modules/business-brain/components/knowledge-list-panel";
import { BusinessBrainSectionHeader } from "@/modules/business-brain/components/business-brain-workspace";
import type {
  BrainArticleCategory,
  BrainArticleDetail,
  BrainArticleListItem,
  BrainArticleStatus,
} from "@/modules/business-brain/types/knowledge";
import {
  translateBusinessBrainSectionDescription,
  translateBusinessBrainSectionTitle,
} from "@/lib/i18n/business-brain-labels";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
import { cn } from "@/lib/utils";

type ProductOption = {
  id: string;
  name: string;
};

type KnowledgePageClientProps = {
  initialArticles: BrainArticleListItem[];
  productOptions: ProductOption[];
  canEdit: boolean;
};

export function KnowledgePageClient({
  initialArticles,
  productOptions,
  canEdit,
}: KnowledgePageClientProps) {
  const { t } = useTranslation();
  const { bb } = useBbTranslation();
  const [articles, setArticles] = useState(initialArticles);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    initialArticles[0]?.id ?? null,
  );
  const [selectedArticle, setSelectedArticle] = useState<BrainArticleDetail | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<BrainArticleCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<BrainArticleStatus | "all">("all");
  const [mobileShowEditor, setMobileShowEditor] = useState(false);
  const [isCreating, startCreateTransition] = useTransition();
  const [isLoadingArticle, startLoadTransition] = useTransition();

  const refreshListItem = useCallback((article: BrainArticleDetail) => {
    setArticles((current) => {
      const nextItem: BrainArticleListItem = {
        id: article.id,
        title: article.title || "Untitled Article",
        category: article.category,
        status: article.status,
        visibility: article.visibility,
        updatedAt: article.updatedAt,
      };

      const exists = current.some((item) => item.id === article.id);
      if (!exists) {
        return [nextItem, ...current];
      }

      return current.map((item) => (item.id === article.id ? nextItem : item));
    });
  }, []);

  const loadArticle = useCallback((articleId: string) => {
    startLoadTransition(async () => {
      const result = await loadBrainArticleAction(articleId);
      if (result.article) {
        setSelectedArticle(result.article);
        refreshListItem(result.article);
      }
    });
  }, [refreshListItem]);

  const handleSelectArticle = (articleId: string) => {
    setSelectedArticleId(articleId);
    setMobileShowEditor(true);
    loadArticle(articleId);
  };

  const handleCreateArticle = () => {
    startCreateTransition(async () => {
      const result = await createBrainArticleAction();
      if (!result.ok || !result.article) {
        return;
      }
      refreshListItem(result.article);
      setSelectedArticleId(result.article.id);
      setSelectedArticle(result.article);
      setMobileShowEditor(true);
    });
  };

  const handleArticleUpdated = (article: BrainArticleDetail) => {
    setSelectedArticle(article);
    refreshListItem(article);
  };

  const handleArticleDeleted = (articleId: string) => {
    setArticles((current) => current.filter((item) => item.id !== articleId));
    setSelectedArticle(null);
    setSelectedArticleId(null);
    setMobileShowEditor(false);
  };

  useEffect(() => {
    if (selectedArticleId && !selectedArticle) {
      loadArticle(selectedArticleId);
    }
  }, [loadArticle, selectedArticle, selectedArticleId]);

  return (
    <div className="space-y-6">
      <BusinessBrainSectionHeader
        title={translateBusinessBrainSectionTitle(t, "knowledge")}
        iconSlug="knowledge"
        description={translateBusinessBrainSectionDescription(t, "knowledge")}
      />
      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
        <div className={cn(mobileShowEditor ? "hidden lg:block" : "block")}>
          <KnowledgeListPanel
            articles={articles}
            selectedArticleId={selectedArticleId}
            search={search}
            categoryFilter={categoryFilter}
            statusFilter={statusFilter}
            canEdit={canEdit}
            isCreating={isCreating}
            onSearchChange={setSearch}
            onCategoryFilterChange={setCategoryFilter}
            onStatusFilterChange={setStatusFilter}
            onSelectArticle={handleSelectArticle}
            onCreateArticle={handleCreateArticle}
          />
        </div>

        <div className={cn(!mobileShowEditor ? "hidden lg:block" : "block")}>
          {selectedArticleId && selectedArticle && selectedArticle.id === selectedArticleId ? (
            <KnowledgeEditor
              key={selectedArticle.id}
              article={selectedArticle}
              productOptions={productOptions}
              canEdit={canEdit}
              onBack={() => setMobileShowEditor(false)}
              onArticleUpdated={handleArticleUpdated}
              onArticleDeleted={handleArticleDeleted}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {isLoadingArticle
                  ? bb("loadingArticle")
                  : selectedArticleId
                    ? bb("loadingKnowledgeEditor")
                    : bb("knowledgeEmptyState")}
              </p>
              {selectedArticleId && !isLoadingArticle ? (
                <button
                  type="button"
                  className="mt-3 text-sm text-primary hover:underline"
                  onClick={() => loadArticle(selectedArticleId)}
                >
                  {bb("retryLoading")}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
