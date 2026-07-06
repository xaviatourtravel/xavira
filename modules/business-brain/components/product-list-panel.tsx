"use client";

import { FileText, Plus, Search, Sparkles } from "lucide-react";

import { DsButton } from "@/components/design-system/button";
import { DsCard } from "@/components/design-system/card";
import { DsSearchInput } from "@/components/design-system/form-controls";
import { ClientOnlyRelativeTime } from "@/components/omnichannel-inbox/client-only-relative-time";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
import {
  bbDisplayProductName,
  bbDocsCount,
  bbKnowledgeScoreLabel,
  bbProductStatusLabel,
} from "@/modules/business-brain/lib/bb-ui-labels";
import {
  type BrainProductListItem,
  type BrainProductStatus,
} from "@/modules/business-brain/types/products";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: Array<BrainProductStatus | "all"> = [
  "all",
  "draft",
  "published",
  "archived",
];

type ProductListPanelProps = {
  products: BrainProductListItem[];
  selectedProductId: string | null;
  search: string;
  statusFilter: BrainProductStatus | "all";
  canEdit: boolean;
  isCreating: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: BrainProductStatus | "all") => void;
  onSelectProduct: (productId: string) => void;
  onCreateProduct: () => void;
};

function statusBadgeClass(status: BrainProductStatus) {
  if (status === "published") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300";
  }
  if (status === "archived") {
    return "bg-muted text-muted-foreground";
  }
  return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300";
}

export function ProductListPanel({
  products,
  selectedProductId,
  search,
  statusFilter,
  canEdit,
  isCreating,
  onSearchChange,
  onStatusFilterChange,
  onSelectProduct,
  onCreateProduct,
}: ProductListPanelProps) {
  const { bb } = useBbTranslation();
  const normalizedSearch = search.trim().toLowerCase();

  const filteredProducts = products.filter((product) => {
    const matchesStatus =
      statusFilter === "all" ? true : product.status === statusFilter;
    const matchesSearch =
      !normalizedSearch ||
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.category.toLowerCase().includes(normalizedSearch) ||
      product.destination.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });

  return (
    <DsCard className="p-4 md:p-5">
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">{bb("productList")}</h2>
          {canEdit ? (
            <DsButton
              type="button"
              size="sm"
              onClick={onCreateProduct}
              loading={isCreating}
            >
              <Plus className="h-4 w-4" />
              {bb("newProduct")}
            </DsButton>
          ) : null}
        </div>
        <DsSearchInput
          placeholder={bb("searchProducts")}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
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
              {filter === "all" ? bb("all") : bbProductStatusLabel(bb, filter)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filteredProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            {bb("noProductsMatch")}
          </div>
        ) : (
          filteredProducts.map((product) => {
            const selected = product.id === selectedProductId;

            return (
              <button
                key={product.id}
                type="button"
                onClick={() => onSelectProduct(product.id)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-background hover:border-primary/30 hover:bg-muted/30",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {bbDisplayProductName(bb, product.name)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {[product.category, product.destination]
                        .filter(Boolean)
                        .join(" · ") || bb("noCategory")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      statusBadgeClass(product.status),
                    )}
                  >
                    {bbProductStatusLabel(bb, product.status)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {bb("updated")}{" "}
                    <ClientOnlyRelativeTime
                      date={product.updatedAt}
                      className="inline"
                    />
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    {product.knowledgeScore}% · {bbKnowledgeScoreLabel(bb, product.knowledgeScore)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {bbDocsCount(bb, product.documentCount)}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </DsCard>
  );
}
