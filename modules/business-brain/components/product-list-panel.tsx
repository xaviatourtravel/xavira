"use client";

import { FileText, Plus, Search, Sparkles } from "lucide-react";

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
  bbDisplayProductName,
  bbDocsCount,
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
  onImportFromText?: () => void;
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
  onImportFromText,
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
    <BusinessBrainCompactSection title={bb("productList")}>
      <div className="mb-3 space-y-2.5">
        {canEdit ? (
          <div className="flex items-center justify-end gap-1.5">
            {onImportFromText ? (
              <DsButton type="button" size="sm" variant="outline" onClick={onImportFromText}>
                <FileText className="h-4 w-4" />
                {bb("importFromText")}
              </DsButton>
            ) : null}
            <DsButton
              type="button"
              size="sm"
              onClick={onCreateProduct}
              loading={isCreating}
            >
              <Plus className="h-4 w-4" />
              {bb("newProduct")}
            </DsButton>
          </div>
        ) : null}
        <DsSearchInput
          placeholder={bb("searchProducts")}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-8 min-h-8 py-1 text-sm"
        />
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
              {filter === "all" ? bb("all") : bbProductStatusLabel(bb, filter)}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-center text-sm text-muted-foreground">
          {bb("noProductsMatch")}
        </div>
      ) : (
        <ExpandableList
          items={filteredProducts}
          itemsClassName="space-y-1.5"
          getItemKey={(product) => product.id}
          renderItem={(product) => {
            const selected = product.id === selectedProductId;

            return (
              <button
                type="button"
                onClick={() => onSelectProduct(product.id)}
                className={cn(
                  "w-full rounded-lg border p-2.5 text-left transition-colors",
                  selected ? BB_COMPACT_LIST_SELECTED_CLASS : BB_COMPACT_LIST_IDLE_CLASS,
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {bbDisplayProductName(bb, product.name)}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
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
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span>
                    {bb("updated")}{" "}
                    <ClientOnlyRelativeTime
                      date={product.updatedAt}
                      className="inline"
                    />
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {product.knowledgeScore}%
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {bbDocsCount(bb, product.documentCount)}
                  </span>
                </div>
              </button>
            );
          }}
        />
      )}
    </BusinessBrainCompactSection>
  );
}
